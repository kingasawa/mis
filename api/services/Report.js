import keyBy from 'lodash.keyby';

var forEach = require('async-foreach').forEach;
import bluebird from 'bluebird';
import moment from 'moment';
import groupBy from 'lodash.groupby';
// import keyBy from 'lodash.keyby';

module.exports = {
  orderDashboard: async({ from = '', to = '', owner = null }) => {
    bluebird.promisifyAll(Order);

    let result = {
      'pending': 0,
      'Cancelled': 0,
      'In-Production': 0,
      'Fulfilled': 0,
    };

    if (from === '' && to === '') {
      from = moment().startOf('month').format("MM/DD/YYYY");
      to = moment().endOf('month').format("MM/DD/YYYY");
    } else if (from.match(/\d{2}\/\d{2}\/\d{4}/) ===
               null ||
               to.match(/\d{2}\/\d{2}\/\d{4}/) ===
               null) {
      // result.error = 'invalid date range';
      sails.log.debug("invalid date range");
      return result;
    }

    let whereOwner = '';
    if (!_.isNull(owner)) {
      whereOwner = `owner=${owner} AND`;
    }

    let orderData = await Order.queryAsync(`
      SELECT count(id), tracking from public.order where
      1=1 AND
      "createdAt" between '${from}' AND '${to}' AND
      ${whereOwner}
      sync=1
      group by tracking
    `);

    let keyByData = {}
    _.map(orderData.rows, (value) => {
      keyByData[value.tracking] = value.count | 0;
    })
    // const keyByData = keyBy(orderData.rows, 'tracking');
    // console.log('orderData', keyByData);
    // console.log('orderData', orderData.rows);
    let orderStats = {
      ...result, ...keyByData
    };

    let totalOrder = 0;
    _.map(orderStats, (value, key) => {
      totalOrder += value;
    })
    orderStats.total = totalOrder;

    //console.log('orderStats', orderStats);

    return orderStats;
  },

  /* Report only, dont update line item here */
  Order: async({
    user_id, query = null, reportBy = null, orderid = null, export_report = true, REVALIDATE
  }) => {
    // const { id } = req.user;
    const { DEFAULT_SHIPPING_FEE, DEFAULT_BASE_COST } = sails.config.report;
    // const REVALIDATE = false; // Dont change unless u know @tamdu

    bluebird.promisifyAll(Order);

    let stats = {};
    let userQuery = '';

    if (user_id) {
      userQuery = `owner=${user_id} AND`;
    }

    let selectReportBy = '';
    let whereReportFilter = '';
    let whereReportBy = '';
    let whereOrderId = '';

    if (reportBy) {
      selectReportBy = `date_trunc('${reportBy}', "createdAt"),`;
      whereReportBy =
        `AND date_part('${reportBy}', "createdAt") = date_part('${reportBy}', CURRENT_DATE)`;
      whereReportFilter = ` tracking='Fulfilled' AND sync=1 `;
    } else {
      if (orderid) {
        whereOrderId = `orderid='${orderid}'`;
      } else {
        whereOrderId = '1=1'
      }
    }

    // DEBUG
    // console.log(`SELECT
    //     id, orderid, total_item_basecost, total_item_price, total_item, profit, report_analyzed, total_discounts,
    //     shipping_fee, revenue,
    //     ${selectReportBy}
    //     line_items
    //    FROM public.order WHERE
    //    ${userQuery}
    //    ${whereOrderId}
    //    ${whereReportFilter}
    //    ${whereReportBy}
    //   `);return;

    let orderData = await Order.queryAsync(`SELECT 
        id, orderid, total_item_basecost, total_item_price, total_price, total_item, profit, report_analyzed, total_discounts,
        shipping_fee, revenue, hight_price, hight_extra,
        ${selectReportBy}
        line_items
	      FROM public.order WHERE 
	      ${userQuery}
	      ${whereOrderId}
	      ${whereReportFilter} 
	      ${whereReportBy}
      `);

    // let orderDataCount = _.get(orderData, 'rowCount', 0);
    let orderDataRows = _.get(orderData, 'rows', []);
    let totalAnalyzed = 0;

    // sails.log.debug("Report:Order orderDataRows", orderDataRows);

    forEach(orderDataRows, (order, index, arr) => {
      let {
        id, orderid, line_items, total_item_basecost, report_analyzed, hight_price, hight_extra, total_price, total_item_price, total_item, profit, shipping_fee, shipping_address, revenue
      } = order;
      // sails.log.debug("Report:Order order", order);
      // @todo happen 1 time only or we can analyze when webhook create/update
      if (report_analyzed !== true || REVALIDATE) {
        // sails.log.debug("Report:Order start analyze");
        totalAnalyzed++;
        // sails.log.debug('validating');

        profit = 0;
        // starting to analyze
        report_analyzed = 1;
        hight_price = 0;
        hight_extra = 0;
        total_item_price = 0;
        total_item_basecost = 0;
        total_item = 0;
        shipping_fee = 0;
        // total_item = _.size(line_items); // sai logic
        total_item_basecost = parseFloat(total_item_basecost) || 0;
        total_price = parseFloat(total_price);
        total_item_price = parseFloat(total_item_price) || 0;
        // total_item_price = 0;

        // sails.log.debug("Report:Order line_items", line_items);
        _.each(line_items, (line_item) => {
          // sails.log.debug("Report:Order go each line_item", line_item);
          let { price, basecost, quantity, item_fee, extra_fee } = line_item;

          basecost = parseFloat(basecost) || DEFAULT_BASE_COST;
          quantity = parseInt(quantity);
          price = parseFloat(price);
          price *= quantity;
          // x quantity

          shipping_fee += extra_fee*quantity;
          basecost *= quantity;
          total_item_basecost += basecost;
          // total_item_price+= price;
          total_item += quantity;

          if (item_fee > hight_price) {
            hight_price = item_fee;
            hight_extra = extra_fee;
          }

        });

        if (total_item_basecost > 0) {
          shipping_fee += (hight_price - hight_extra);
        }

        total_item_price = (shipping_fee + total_item_basecost); // tong tien seller phai tra cho gearment
        profit = total_price - total_item_price; // tien loi cua seller
        revenue = total_price; // doanh thu cua seller
        let updateData = {
          report_analyzed,
          profit,
          total_item,
          total_item_basecost,
          total_item_price,
          revenue,
          shipping_fee,
          hight_price,
          hight_extra
        };
        sails.log.debug("Report.Order updateData", updateData);

        Promise.resolve(Order.update({ id }, updateData));
      } else {
        // sails.log.debug("Report:Order skip analyze");
      }
    })

    if (!export_report) {
      return { totalAnalyzed };
    }

    let profitReportData = await Order.queryAsync(`SELECT 
        sum(profit) AS sum_profit, 
        sum(revenue) AS sum_revenue, 
        sum(total_item) AS sum_item, 
        sum(shipping_fee) AS sum_shipping_fee
	      FROM public.order WHERE 
	      ${userQuery} 
	      ${whereOrderId} 
	      ${whereReportFilter}
	      ${whereReportBy}
      `);

    let totalOrderReportData = await Order.queryAsync(`SELECT 
        count(id) AS total_order
        FROM public.order WHERE
         ${userQuery} 
         ${whereOrderId} 
        ${whereReportFilter}
        ${whereReportBy}
      `);

    let {
      sum_profit = 0, sum_shipping_fee = 0, sum_item = 0, sum_revenue = 0
    } = _.get(profitReportData, 'rows[0]', {});
    let { total_order = 0 } = _.get(totalOrderReportData, 'rows[0]', {});

    stats = {
      sum_profit,
      sum_shipping_fee,
      sum_revenue,
      sum_item,
      total_order: parseInt(total_order, 10)
    }
    let result = {};
    _.each(stats, (value, key) => {
      value = stats[key] || 0;
      if (!['sum_item', 'total_order'].includes(key)) {
        value = parseFloat(value).toFixed(2);
      }
      result[key] = value;
    });
    sails.log.debug(`Report:Order:stats:${reportBy}:user_id:${user_id}`, result);
    return result;
  }, //@TODO doing chart
  OrderChart: async({ user_id, query = null, reportBy = null }) => {
    // const { id } = req.user;
    const { DEFAULT_SHIPPING_FEE, DEFAULT_BASE_COST } = sails.config.report;
    const REVALIDATE = false; // Dont change unless u know @tamdu

    bluebird.promisifyAll(Order);

    let stats = {};
    let userQuery = '';

    if (user_id) {
      userQuery = `owner=${user_id} AND`;
    }

    let groupbyMapping = {
      month: 'day',
      year: 'month',
      day: 'hour',
    }

    // let selectReportBy = '';
    let whereReportBy = '';

    if (reportBy) {
      // selectReportBy = `date_trunc('${reportBy}', "createdAt"),`;
      whereReportBy =
        `AND date_part('${reportBy}', "createdAt") = date_part('${reportBy}', CURRENT_DATE)`;
    }

    let profitReportData = await Order.queryAsync(`SELECT 
        sum(profit) AS sum_profit,
        date_trunc('${groupbyMapping[reportBy]}', "createdAt")
	      FROM public.order WHERE ${userQuery} sync=1 
	      ${whereReportBy}
	      GROUP BY 2
      `);

    let totalOrderReportData = await Order.queryAsync(`select * from  
      (SELECT 
        count(id) AS total_order,
        date_trunc('${groupbyMapping[reportBy]}', "createdAt") as months
	      FROM public.order WHERE ${userQuery} sync=1 
	      ${whereReportBy}
	      GROUP BY 2 
	      ) a right join (
          select date_trunc('month', days) as months
          from (
            select generate_series(0,365) + date'2017-01-01'  as days
          ) dates
          group by 1
          order by 1
        ) b on a.months = b.months
      `);

    profitReportData = _.get(profitReportData, 'rows', {});
    totalOrderReportData = _.get(totalOrderReportData, 'rows', {});

    stats = {
      profitReportData,
      totalOrderReportData
    }
    return stats;
  },
  /**
   *
   * @param sku
   * @returns {skuType, campaignId, variantColor, variantSize, variantNameType}
   */
  getGearmentSKU: (sku, vendor) => {
    let result = {
      // Define SKU type: old, new
      skuType: '',
      campaignId: '',
      variantNameType: '', //old SKU attr
      variantColor: '',
      variantSize: '',
      materialId: '',
      designId: '',
      sizeId: '',
      frontSide: '',
      productId: '',
      designId: '',
    };
    let isGearmentSku = (vendor && vendor === 'Gearment') ? true : false;

    if (!sku) {
      return false;
    }

    if (isGearmentSku) {
      let isGearmentVendorSKU = sku.match(/^(\d{1,})-(\d{1,})-([0123]{1})$/);
      if (isGearmentVendorSKU) {
        return result = {
          ...result,
          skuType: 'new',
          productId: isGearmentVendorSKU[1],
          designId: isGearmentVendorSKU[2],
          frontSide: isGearmentVendorSKU[3],
        }
      }
    }

    // Support can not move sku for frontside
    if (isGearmentSku) {
      let isGearmentVendorSKU = sku.match(/^([0123]{1})-(\d{1,})-(\d{1,})$/);
      if (isGearmentVendorSKU) {
        return result = {
          ...result,
          skuType: 'new',
          frontSide: isGearmentVendorSKU[1],
          productId: isGearmentVendorSKU[2],
          designId: isGearmentVendorSKU[3],
        }
      }
    }
    // Support can not move sku for frontside
    // if(isGearmentSku){
    //   let isGearmentVendorSKU = sku.match(/^(\d{1,})-([1]{1})-(\d{1,})$/);
    //   if (isGearmentVendorSKU) {
    //     return result = {
    //       ...result,
    //       skuType: 'newError',
    //       frontSide: isGearmentVendorSKU[1],
    //       productId: isGearmentVendorSKU[2],
    //       designId: isGearmentVendorSKU[3],
    //     }
    //   }
    // }

    let isNewSKU = sku.match(/^(unit)-(\d{1,})-(\d{1,})-(\d{1,})-(\d{1,})-(\d{1,})-(\d{1,})$/);
    if (isNewSKU) {
      return result = {
        ...result,
        skuType: 'current',
        campaignId: isNewSKU[2],
        frontSide: isNewSKU[3],
        materialId: isNewSKU[4],
        corlorId: isNewSKU[5],
        sizeId: isNewSKU[6],
        designId: isNewSKU[7],
      }
    }

    let isOldOrderSku = sku.match(
      /^(unit)-(\d{1,})-([a-zA-Z0-9_]{1,})-([a-zA-Z0-9_]{1,})-([a-zA-Z0-9_]{1,})$/);
    if (isOldOrderSku) {
      return result = {
        ...result,
        skuType: 'old',
        campaignId: isOldOrderSku[2],
        variantNameType: isOldOrderSku[3],
        variantColor: isOldOrderSku[4],
        variantSize: isOldOrderSku[5]
      }
    }
    let isUnexpectedOrderSku = sku.match(/^(unit)/);
    if (isUnexpectedOrderSku) {
      return result = {
        ...result,
        skuType: 'unexpected',
        data: sku,
      }
    }

    // let isHistoryOrderSku = sku.match(/^(unit)-(\d{1,})-([a-zA-Z]{1,})-([a-zA-Z]{1,})$/);
    // if (isHistoryOrderSku) {
    //   return result = {
    //     ...result,
    //     skuType: 'veryOld',
    //     campaignId: isHistoryOrderSku[2],
    //     variantColor: isHistoryOrderSku[3],
    //     variantSize: isHistoryOrderSku[4]
    //   }
    // }

    return isGearmentSku;
  },

  Transaction: async(by,id) => {

    let ownerQuery = '1=1';
    if(id) {
      ownerQuery = `"owner"='${id}'`
    }

    console.log('T: by', by);
    bluebird.promisifyAll(Transaction);

    let ALLOWED_BY = ['today', 'yesterday', 'month', 'lastmonth']

    let DATE_DEFAULT_KEY = (ALLOWED_BY.includes(by)) ? by : ''
    let DATE_TRUNC = {
      today: 'day',
      yesterday: 'day',
      month: 'month',
      lastmonth: 'month'
    }[DATE_DEFAULT_KEY]

    let DATETIME_QUERY = {
      today: 'today',
      yesterday: 'yesterday',
      month: 'today',
      lastmonth: 'today'
    }[DATE_DEFAULT_KEY]

    let DATETIME_INTERVAL = {
      today: '',
      yesterday: '',
      month: '',
      lastmonth: `- interval '1 month'`,
    }[DATE_DEFAULT_KEY]

    let whereReportBy = DATE_DEFAULT_KEY &&
                        `date_trunc('${DATE_TRUNC}', "createdAt") = date_trunc('${DATE_TRUNC}', TIMESTAMP '${DATETIME_QUERY}' ${DATETIME_INTERVAL}) AND`;

    let query = `SELECT 
        sum(amount) as amount, status, count(status)
	      FROM public.transaction 
	      WHERE ${whereReportBy} ${ownerQuery}
	      GROUP BY status
      `;

    console.log('REPORT:query', query);
    let transactionData = await Transaction.queryAsync(query);

    let transactionDataRows = _.get(transactionData, 'rows', []);

    console.log('transactionDataRows', transactionDataRows);
    return transactionDataRows;

  },

  user: async(req,res) => {
    bluebird.promisifyAll(User);
      let query = `SELECT status,count(*) 
                   FROM public.user 
                   WHERE "group" <> '1' 
                   GROUP BY status`;
      let userData = await User.queryAsync(query);
    let userDataRows = _.get(userData, 'rows', []);
    console.log('userDataRows', userDataRows);
    return userDataRows;
  },

  reportOrder: async (req, res) => {
    bluebird.promisifyAll(Order);
    const orderData = await Order.queryAsync(`
    SELECT picker AS user, status AS order, count(id) AS total , sum(total_price) AS money 
    FROM "order"
    WHERE "picker" is not null
    AND "picker" <> ''
    GROUP BY picker,status
    ORDER BY picker
      `);
    //
    // const orderMoney = await Order.queryAsync(`
    // select picker, status, sum(total_price) from "order"
    // GROUP BY picker,status
    // ORDER BY status
    //   `);

    // const orderGroup = groupBy(orderData.rows,'picker')
    // const reportMoney = groupBy(orderMoney.rows,'status')
    // const userList = Object.keys(orderGroup)
    // const reportData = {orderGroup,userList}

    // console.log('orderData', orderData);
    return orderData.rows
    // res.json(reportData)
  },

  commission: async (group) => {
    console.log('group', group);
    let allUser
    if(group == 2){
      allUser = await User.find({group:[2,3]})
    } else {
      allUser = await User.find()
    }
    // _.each(allUser,async(user)=>{
    //   user.order = await Order.find({picker:user.username})
    // })
    console.log('allUser', allUser);
    return allUser
  },

};
