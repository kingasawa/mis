/**
 * AcpController
 *
 * @description :: Server-side logic for managing acps
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
// var apiKey = 'ae22432ff4d89ca146649cc782f385f1';
const { apiKey, apiSecret } = sails.config.shopify;

import QueryBuilder from 'node-datatable';
import bluebird from 'bluebird';
import replace from 'lodash.replace';
import uuidv4 from 'uuid/v4';
import keyby from 'lodash.keyby';
import sumby from 'lodash.sumby';
import sanitizer from 'sanitizer';
import concat from 'lodash.concat';
import fill from 'lodash.fill';
import moment from 'moment';
import lzma from 'lzma';

const knex = require('knex')({client: 'pg'});

// const { easypostapi } = sails.config.easypost;
// const easypostapi = '0qSy6pqLZyeXoXajMpcwBg';

// const EasyPost = require('node-easypost');
// const api = new EasyPost(easypostapi);


module.exports = {
  index: async(req,res) => {
    let countUser;
    let countProduct = await Post.count();
    let countOrder = await Order.count();
    if(req.user.group == 2){
      countUser = await User.count({group:[2,3]});
    } else {
      countUser = await User.count();
    }
    let countStore = await Shop.count();

    const reportOrder = await Report.reportOrder()

    const orderPaid = await Report.sumOrderByPaid()
    let sumOrderPaid = orderPaid[0].sum
    sumOrderPaid = sumOrderPaid.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    const orderRefunded = await Report.sumOrderByRefunded()
    let sumOrderRefunded = orderRefunded[0].sum
    sumOrderRefunded = sumOrderRefunded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    let data = {
      countProduct,countOrder,countUser,countStore, reportOrder, sumOrderPaid, sumOrderRefunded
    }

    res.view('acp/index',data);

  },
  store: async(req,res) => {
    if(req.user.group == 2){
      return res.forbidden()
    }
    bluebird.promisifyAll(Shop);
    let params = req.allParams();
    if (!params.name && !params.action) {
      let query = `SELECT s.id,s.name, s.owner,u.email,u.username
      FROM public.shop s
      LEFT JOIN public.order o on s.name = o.shop
      LEFT JOIN public.user u on s.owner = u.id  
      
      GROUP BY s.name,s.owner,u.email,u.username,s.id`;
      let queryReuslt = await Shop.queryAsync(query);
      let foundShop = queryReuslt.rows;


      return res.view('acp/store',{foundShop})

    }
  },

  unsyncProductApi: async (req, res) => {
    const {store} = req.allParams()
    await Post.update({store},{store: ''}).then((updatedUsers)=>{
      res.send({
        msg: `${store} - Unsync ${updatedUsers.length} products successful `
      })
    })

  },

  order: async(req,res) => {
    let { id,list } = req.allParams();
    let findStore;
    // let session_id = req.signedCookies['sails.sid'];

    if (id) {
      let foundOrder = await Order.findOne({id});

      await Promise.all(
        foundOrder.line_items.map((item)=>{
          Post.findOne({productid:item.product_id}).then((result)=>{
            item.stock = result.stock;
            if(!result){
              item.stock = 0
            }
          }).catch((err)=>{
            console.log('err', err);
          })
        })
      )


      let {name,address1,address2,city,zip,province,country} = foundOrder.shipping_address;
      foundOrder.addressFormat = `${name}|${address1}|${address2}|${city}|${zip}|${province}|${country}`;

      // let foundToken = await Shop.findOne({name: foundOrder.shop}).populate('shopifytoken');
      let foundFulfill = await Fulfillment.find({order_id:foundOrder.orderid});

      console.log('foundOrder.line_items', foundOrder.line_items);

      return res.view('acp/order/view',{foundOrder,foundFulfill});


    } else if(list=='picked') {
      let orderReturnCount = 0
      let orderCsCount = 0;
      let foundUser = await User.find()
      let foundOrder = await Order.find({tag:'picked'});
      if(req.user.group === 1){
        findStore = await Shop.find();
      }

      foundOrder.map((order)=>{
        if(order.status=='Return'){
          orderReturnCount += 1
        }
        if(order.status=='CS'){
          orderCsCount += 1
        }

        let items = []
        order.line_items.map((item)=>{
          items.push(`• ${item.title}`)
        })
        order.products = items.join('\n')
        let {name,address1,address2,city,zip,province,country} = order.shipping_address;
        order.addressFormat = `${name} |${address1} |${address2} |${city} |${zip} |${province} |${country}`;
      })

      return res.view('acp/order',{foundOrder,findStore,foundUser,orderReturnCount,orderCsCount});

    } else if(list=='unpick') {
      let orderReturnCount = 0
      let orderCsCount = 0;
      let foundUser = await User.find()
      let foundOrder = await Order.find({
        or : [
          { tag: { '!': 'picked' } },
          { tag: null }
        ],
        status:'New'
      });

      if(req.user.group === 1){
        findStore = await Shop.find();
      }

      foundOrder.map((order)=>{
        if(order.status=='Return'){
          orderReturnCount += 1
        }

        if(order.status=='CS'){
          orderCsCount += 1
        }

        let items = []
        order.line_items.map((item)=>{
          items.push(`• ${item.title}`)
        })
        order.products = items.join('\n')
        let {name,address1,address2,city,zip,province,country} = order.shipping_address;
        order.addressFormat = `${name} |${address1} |${address2} |${city} |${zip} |${province} |${country}`;
      })

      return res.view('acp/order',{foundOrder,findStore,foundUser,orderReturnCount,orderCsCount});

    } else {
      let orderReturnCount = 0
      let orderCsCount = 0;
      // Order.find({sync:1},{sort:'id DESC'}).exec(function(err,foundOrder){
      //   return res.view('acp/order',{foundOrder})
      // });
      let foundUser = await User.find()
      let foundOrder = await Order.find();
      console.log('foundOrder', foundOrder);
      if(req.user.group === 1){
        findStore = await Shop.find();
      }

      foundOrder.map((order)=>{
        if(order.status=='Return'){
          orderReturnCount += 1
        }

        if(order.status=='CS'){
          orderCsCount += 1
        }

        let items = []
        order.line_items.map((item)=>{
          items.push(`• ${item.title}`)
        })
        order.products = items.join('\n')
        let {name,address1,address2,city,zip,province,country} = order.shipping_address;
        order.addressFormat = `${name} |${address1} |${address2} |${city} |${zip} |${province} |${country}`;
      })

      return res.view('acp/order',{foundOrder,findStore,foundUser,orderReturnCount,orderCsCount});
    }
  },

  order_stats: async (req, res) => {
    bluebird.promisifyAll(Order);
    let { from, to, shop, owner } = req.allParams();

    let addQuery = {}

    if(shop){
      addQuery.shop = shop
    }
    if(owner){
      addQuery.owner = owner
    }

    let data = {}
    let query = knex('order').select(knex.raw(`
          count(id) as "all-order",
      		sum((tracking='pending')::int) as "pending-order",
      		sum((tracking='Back-Order')::int) as "back-order",
            sum((tracking='Awaiting-Fulfillment')::int) as "awaiting-fulfillment-order",
			    sum((tracking='In-Production')::int) as "in-production-order",
            sum((tracking='Fulfilled')::int) as "fulfilled-order",
            sum((tracking='Cancelled')::int) as "cancelled-order"
`))
                             .where('sync', 1)
                             .where({...addQuery})



    console.log('stats query', query.toString());

    if(from && to){
      query.whereRaw(`"createdAt" between '${from}' and date '${to}' + interval '1 day' - interval '1 second'`)
    }


    data = await (Order.queryAsync(query.toString())).then(e=>e.rows[0]) // {sync:1, ...addQuery}

    console.log('stats data', data);
    res.json(data)
  },


  order_shop_filter: async (req, res) => {
    let { shop, q, user } = req.allParams();
    console.log('param', req.allParams());

    let data = {}

    let query = {}

    if(q){
      query.name = { 'like': `%${q}%` }
    }
    if(user){
      query.owner = user;
    }

    data = await Shop.find(query);

    res.json(data)
  },

  order_user_filter: async (req, res) => {
    bluebird.promisifyAll(Order);

    let { q } = req.allParams();

    let data = {}
    let owner = '1=1';

    q = sanitizer.escape(q)

    if(q){
      owner = `u.username ILIKE '%${q}%'`
      // query.owner = { 'like': `%${q}%` }
    }

    let query = `SELECT distinct(o.owner), u.username, u.id FROM public.order o 
      left join public.user u on o.owner = u.id 
      where o.sync=1
      and ${owner}`


    console.log('query', query);
    data = await Order.queryAsync(query)
    data = data.rows
    res.json(data)
  },



  order_datatable: async(req, res) => {
    bluebird.promisifyAll(Order);
    var queryParams = req.allParams();

    let { from, to, export_csv } = queryParams

    let fromToQuery = ''

    if(from && to){
      fromToQuery = `AND to_char(o.createdAt::timestamp AT TIME ZONE '-8', 'YYYY/MM/DD')::timestamp between '${from}' and date '${to}' + interval '1 day' - interval '1 second'`
    }
    /*
     SELECT u.username, o.id, shop, o."createdAt", to_char(o."createdAt"::timestamp AT TIME ZONE '-8', 'YYYY/MM/DD') , o.name, tracking, total_item_price, order_name, orderid FROM public.order o left join public.user u on o.owner = u.id WHERE (sync=1 AND to_char(o."createdAt"::timestamp AT TIME ZONE '-8', 'YYYY/MM/DD')::timestamp between '05/19/2017' and date '05/19/2017' + interval '1 day' - interval '1 second')  ORDER BY id desc OFFSET 0 LIMIT 25
     */

    var tableDefinition = {
      dbType: 'postgres',
      sSelectSql: `tag,u.username, o.id, shop, to_char(o.createdAt::timestamp AT TIME ZONE '-8', 'YYYY/MM/DD') as "created_at", o.name, tracking, total_item_basecost, shipping_fee, total_item_price, order_name, orderid`,
      sTableName: 'public.order o left join public.user u on o.owner = u.id',
      sWhereAndSql: `sync=1 ${fromToQuery}`,
      aSearchColumns: ['tag','u.username','o.id', 'shop', 'o.name','tracking', 'order_name', 'orderid']
    };


    var queryBuilder = new QueryBuilder(tableDefinition);
    var queries = queryBuilder.buildQuery(queryParams);

    /** fix "createdAt" search issue **/
    let newQueries = {};
    // _.each(queries, (value, key) => {newQueries[key] = replace(value, /\\/g,'');})
    _.each(queries, (value, key) => {newQueries[key] = value.replace( /([a-z]{1,})([A-Z][a-z]{1,})\b/g, '"$1$2"' );})
    queries = newQueries;
    /** fix "createdAt" search issue **/

    console.log("ACP:Order:Datatables", queries);
    var recordsFiltered;
    if (queries.recordsFiltered) {
      recordsFiltered = await (Order.queryAsync(queries.recordsFiltered));
      recordsFiltered = recordsFiltered.rows;
    }

    let recordsTotal = await (Order.queryAsync(queries.recordsTotal));
    recordsTotal = recordsTotal.rows;

    let select = await (Order.queryAsync(queries.select));
    select = select.rows;

    let results = {
      recordsTotal,
      select
    };
    if (recordsFiltered) {
      results.recordsFiltered = recordsFiltered;
    }

    if(export_csv){
      console.log('export_csv', export_csv);
      let result = queryBuilder.parseResponse(results);

      // Auto generate field name from data key
      let fields = Object.keys(_.get(result, 'data[0]',{}));

      return res.csv({
        prefix: 'orders-',
        filename: `${moment(from).format('YYYYMMDD')}_${moment(to).format('YYYYMMDD')}`,
        data: result['data'],
        fields
      });
    }

    res.json(queryBuilder.parseResponse(results));
  },

  user_order: async(req,res) => {
      let { id } = req.allParams();
      let foundUser = await User.findOne({id});
      res.view('acp/user/view_report',{foundUser})
  },
  export_user_order: async(req,res) => {
    bluebird.promisifyAll(Order);
      let {user, fromDate, toDate} = req.allParams();

      let query = `
        SELECT  to_char(o."createdAt"::timestamp AT TIME ZONE '-8', 'MM/DD/YYYY') as "created_at", 
        o.id as productionId,
        order_name as orderId, shop, 
        o.name as customer, 
        tracking as order_status, 
        total_item_basecost as total_basecost, shipping_fee, 
        total_item_price as total_cost
        FROM public.order o 
        WHERE (o.owner=${user} AND sync=1 AND o."createdAt" between '${fromDate}' and date '${toDate}' + interval '1 day' - interval '1 second')  
        ORDER BY id desc`;

    let result = await Order.queryAsync(query);
    let exportOrder = result.rows;
    // res.json(reportOrder);

    let fields = Object.keys(_.get(exportOrder, '[0]',{}));

    res.csv({
      filename: 'user_orders',
      data: exportOrder,
      fields
    });
  },

  pickup:async(req,res)=>{
    // bluebird.promisifyAll(Order);
    let { selectedOrders } = req.allParams();
    // Selected Pickup Order <array>:string.split(',')
    // let orders = [2261, 2264, 2266, 2268];

    sails.log.debug("selectedOrders", selectedOrders);

    let pickupOrders = await Order.find({ select: ['line_items', 'id'] }).where({ id: selectedOrders })

    let filename = `pickup-order-items`;

    let orderItems = [];

    _.each(pickupOrders, (order) => {

      sails.log.debug("order", order);

      let { line_items } = order;
      _.each(line_items, (line_item) => {
        const { variant_title,  brand, quantity, sku} = line_item
        sails.log.debug("line_item", line_item);
        let color = variant_title.split(' / ')[1];
        let size = variant_title.split(' / ')[2];
        let design = sku.split('-')[1];
        let csvLineItem = {
          id: order.id,
          brand,
          color,
          size,
          design,
          quantity
        };

        // Each line item from order
        orderItems.push(csvLineItem);
      })

    })

    sails.log.debug("orderItems", orderItems);

    let fields = Object.keys(_.get(orderItems, '[0]',{}));

    res.csv({
      filename,
      data: orderItems,
      fields
    });
  },

  product: async(req,res) => {
    let owner = req.user.id;
    let findStore;
    let countOutOfStock = 0

    if(req.user.group === 1){
      findStore = await Shop.find();
    }

    let findProduct = await Post.find().populate('owner');
    findProduct.map((product)=>{
      if(product.stock < 1 && product.status === 'Disabled'){
        countOutOfStock += 1
      }
    })
    return res.view('acp/product',{findProduct,findStore,countOutOfStock});
  },

  edit_product: async(req,res) => {
    let {id} = req.allParams();

    bluebird.promisifyAll(Cat);
    let query = `WITH RECURSIVE category_tree(id, name, depth) AS (
                  SELECT id, name, ARRAY[name]
                  FROM cat
                  WHERE parentid IS NULL
                UNION ALL
                  SELECT cat.id, cat.name, depth || cat.name
                  FROM category_tree
                  JOIN cat ON cat.parentid=category_tree.id
                  WHERE NOT cat.name = ANY(depth)
                )
                SELECT * FROM category_tree ORDER BY depth`;
    let resultQuery = await Cat.queryAsync(query);
    let result = resultQuery.rows;
    // res.json(result)
    let categories = [];

    result.map((cat)=>{
      categories.push({
        title: cat.depth.join(' > '),
        id: cat.id,
        name: cat.name
      })
    })

    let findBrand = await Brand.find();
    let findMerchant = await Merchant.find();
    let post = await Post.findOne({id});

    console.log('post', post);
    return res.view('product/edit',{post,findBrand,findMerchant,categories})
  },

  user: async(req,res) => {

    // let foundUser;
    // if(req.user.group == 2){
    //   foundUser = await User.find({group:[2,3]})
    // } else {
    //   foundUser = await User.find()
    // }

    let foundUser = await Report.commission(req.user.group)
    // console.log('foundUser', foundUser);
    let result = await Report.user();
    let userTotal = sumby(result,(r) => parseInt(r.count));
    let userStatusIndex = ['Active', 'Inactive'];
    let userStatus = keyby(result, 'status');
    console.log('result', result);



    res.view('acp/user',{
      userTotal, userStatusIndex, userStatus,foundUser
    });
  },
  tracking: (req,res) => {
    Tracking.find({status:'picked'}).populate('owner').exec((err,foundTracking) => {
      if(err) return res.negotiate(err);
      res.view('acp/tracking',{foundTracking});
    });

  },
  manager: (req,res) => {
    User.find({group:sails.config.globals.group.ADMIN}).exec(function(err,foundManager){
      res.view('acp/manager',{foundManager})
    })
  },

  shipment: (req,res) => {
    Fulfillment.find().exec((err,fulfillment)=>{
      // res.view('scp/shipment',{fulfillment});
      res.json(fulfillment)
    })
  },




  mark_as_paid: async(req,res)=>{
    bluebird.promisifyAll(Order);
    let { id } = req.allParams();
    let foundTransaction = await Transaction.findOne({id});
    // console.log('foundTransaction',foundTransaction);
    let orders = foundTransaction.order.join();
    console.log('order', orders);
    let updateQuery = `UPDATE public.order as o 
                        SET "payment_status" = 'Paid' 
                        WHERE o.id in (${orders})`;
    let updateResult = await Order.queryAsync(updateQuery);

    Transaction.update({id},{status:'Paid'}).then((updateTransaction)=>{
      res.json(updateTransaction);
    }).catch(err => err)
  },


  sortby: (req,res) => {
    let params = req.allParams();
    console.log(params);
    Material.update({id:params.id},{orderid:params.orderid}).exec(function(err){
      if(!err) return res.redirect('/acp/mockup?p=sample')
    })
  },

  picklist:async(req,res)=>{
    console.log('params', req.allParams());
    bluebird.promisifyAll(Order);
    let filename = `picklist`;
    let { by, paramsCompressed } = req.allParams();
    paramsCompressed = paramsCompressed.split(',')
    let selectedOrders = lzma.decompress(paramsCompressed);
    console.log('selectedOrders', selectedOrders);
    // return res.ok();
    let selectedId = sanitizer.escape(selectedOrders);
    let query;
    switch (by){
      case 'item':
        query = `SELECT productid,concat_ws(' / ',brand, color, size) as productName,sku,quantity from (SELECT substring(j.sku FROM '^([0-9]+)-') as productid, sum(quantity) as quantity
    FROM "order" as o, json_to_recordset(line_items) as j(id varchar,variant_title text,sku text, quantity int) 
    WHERE o.id in (${selectedId})
    GROUP BY productId) as productitem
    LEFT JOIN product p on (productid::int) = p.id
    LEFT JOIN material m on material = m.id`;
        break;
      case 'order':
        query = `SELECT o.id,j.brand,
    substring(j.variant_title FROM '\/ ([A-z0-9 ]+) \/') as color,
    substring(j.variant_title FROM '(([A-Z0-9])+)$') as size,
    substring(j.sku FROM '(([0-9])+)$') as side,
    j.quantity,total_item as total_quantity,
    substring(j.sku FROM '-([0-9]+)-') as designid
    FROM "order" as o, json_to_recordset(line_items) as j(id varchar,brand text,variant_title text,sku text, quantity int,design varchar) 
    WHERE o.id in (${selectedId})
    ORDER BY o.id asc`;
        break;
      default:
        query = `SELECT 
          designid::int,
          concat_ws(' / ',brand, color, size) as productName,
          quantity
          from 
            (SELECT
            substring(j.sku FROM '^([0-9]+)-') as productid,
            substring(j.sku FROM '-([0-9]+)-') as designid,
            sum(quantity) as quantity 
            FROM "order" as o, json_to_recordset(line_items) as j(id varchar,variant_title text,sku text, quantity int) 
            WHERE o.id in (${selectedId})
            GROUP BY productId, designid,quantity
            ) as productitem
          LEFT JOIN product p on (productid::int) = p.id
          LEFT JOIN material m on material = m.id
          GROUP BY designid
          , m.brand, p.color, p.size
          ,quantity
          ORDER BY designid, productname
          
`
    }

    let resultQuery = await Order.queryAsync(query);
    let result = resultQuery.rows;

    if(by == 'order'){
      let itemArr = [];
      _.each(result,function(item,index,array){
        let side = '';
        if (item.side == 1){
          side = 'F'
        }
        if (item.side == 0) {
          side = 'B'
        }
        item.side = side;
        if(item.quantity > 1){
          console.log(item,index);
          for(let i=1; i<=item.quantity; i++){
            let product = {
              id: item.id,
              brand: item.brand,
              color: item.color,
              size: item.size,
              side: item.side,
              quantity: 1,
              total_quantity: item.total_quantity,
              designid: item.designid,
            };
            itemArr.push(product);
          };
        }
      });

      result = concat(result, itemArr);

      let getItem = [];
      _.each(result,function(item,index,array){
        if(item.quantity == 1){
          console.log(item,index);
          getItem.push(index);
        }
      });

      result = _.pullAt(result, getItem);
      result = _.sortBy(result, 'id');

      _.each(result,function(item){
        delete item.quantity;
      })
    }


    let totalProduct = sumby(result,'quantity');
    let fields = Object.keys(_.get(result, '[0]',{}));


    // res.json({query});
    res.csv({
      filename,
      data: result,
      fields
    });

  },
  export_order_csv: async(req,res) => {
    console.log('params', req.allParams());
    bluebird.promisifyAll(Order);
    let filename = `export_csv`;
    let { paramsCompressed } = req.allParams();
    paramsCompressed = paramsCompressed.split(',')
    let selectedOrders = lzma.decompress(paramsCompressed);
    console.log('selectedOrders', selectedOrders);
    // return res.ok();
    let selectedId = sanitizer.escape(selectedOrders);
    let query = `SELECT order_number,order_created,order_status,f.service_rate as shipping_service,shipping_fee,first_name, last_name, phone, address1,address2,city,province,country,zip,company,buyer_email,concat_ws(' / ',brand, color, size) as productName,sku,item_price,quantity 
                  FROM (
                    SELECT o.id as order_number,to_char(o."createdAt"::timestamp AT TIME ZONE '-8', 'MM/DD/YYYY') as "order_created",o.tracking as order_status,orderid,shipping_fee,j.basecost as item_price,email as buyer_email,b.first_name,b.last_name,b.phone,b.address1,b.address2,b.city,b.province,b.country,b.zip,b.company,substring(j.sku FROM '^([0-9]+)-') as productid, sum(quantity) as quantity
                        FROM "order" as o, json_to_recordset(line_items) as j(id varchar,variant_title text,sku text, basecost float, quantity int),json_to_record(billing_address) as b(first_name text, last_name text, phone text, address1 text, address2 text, city text, province text, country text, zip text, company text)  
                        WHERE o.id in (${selectedId})
                        GROUP BY productid,o.id, j.basecost, b.first_name, b.last_name, b.phone, b.address1,b.address2,b.city,b.province,b.country,b.zip,b.company	    
                        ORDER BY order_number
                     ) as productitem
                        LEFT JOIN product p on (productid::int) = p.id
                        LEFT JOIN material m on material = m.id
                        LEFT JOIN fulfillment f on order_id = productitem.orderid`;
    let resultQuery = await Order.queryAsync(query);
    let result = resultQuery.rows;
    console.log('result', result);
    let fields = Object.keys(_.get(result, '[0]',{}));


    // res.json({query});
    res.csv({
      filename,
      data: result,
      fields
    });
  },

  mark_as_production: async(req,res) => {
    let params = req.allParams();
    console.log('selectedOrders',params);
    // console.log('byStatus', byStatus);
    bluebird.promisifyAll(Order);
    let selectId = Object.values(params).join();
    let selectedId = sanitizer.escape(selectId);

    let query = `UPDATE public.order SET "tracking" = 'In-Production', 
                  "payment_status" = 'pending', "tag" = 'no-pick' 
                WHERE id in (${selectedId}) AND "tracking" = 'pending'`;
    let resultQuery = await Order.queryAsync(query);
    let result = resultQuery.rows;
    res.send(200);
  },

  change_status: async(req,res) => {
    bluebird.promisifyAll(Order);
    let { status, id } = req.allParams();
    console.log('params', req.allParams());
    let currentStatus = await Order.findOne({id});
    // console.log('currentStatus', currentStatus.tracking);
    let query;
    if(status == 'Back-Order'){
      query = `update public.order set "tracking" = 'Back-Order' where id = '${id}'`;
    } else if (status == 'In-Production'){
      if(currentStatus.tracking == 'In-Production'){
        res.json({msg:'error',content:'This current status is In-Production'});
        return false;
      }
      query = `UPDATE public.order SET "tracking" = 'In-Production', 
                  "payment_status" = 'pending', "tag" = 'no-pick' 
                  WHERE id = '${id}'`;
    }
    await Order.queryAsync(query);
    res.json({msg:'success'});
  },

  mark_status: async(req,res)=>{

    let {selectedOrders,byStatus} = req.allParams();
    console.log('selectedOrders',selectedOrders);
    console.log('byStatus', byStatus);
    bluebird.promisifyAll(Order);
    let selectId = Object.values(selectedOrders).join();
    let selectedId = sanitizer.escape(selectId);

    let query = `update public.order set "tracking" = '${byStatus}' where id in(${selectedId})`;

    await Order.queryAsync(query);
    return res.json({update:'success'});
  },

  mark_as_pickup: async(req,res) => {
    bluebird.promisifyAll(Order);
    let params = req.allParams();
    console.log('params', params);
    let selectId = Object.values(params).join();
    let selectedId = sanitizer.escape(selectId);
    console.log('selectId', selectId);

    let query = `update public.order set "tag" = 'picked' where id in(${selectedId})`;
    await Order.queryAsync(query);
    res.send(200)
  },

  remove_tag: async(req,res) => {
    bluebird.promisifyAll(Order);
    let params = req.allParams();
    console.log('params', params);
    let selectId = Object.values(params).join();
    let selectedId = sanitizer.escape(selectId);
    console.log('selectId', selectId);

    let query = `update public.order set "tag" = '' where id in(${selectedId})`;
    await Order.queryAsync(query);
    res.send(200)
  },

  mark_as_print: async(req,res) => {
    bluebird.promisifyAll(Order);
    let params = req.allParams();
    console.log('params', params);
    let selectId = Object.values(params).join();
    let selectedId = sanitizer.escape(selectId);
    console.log('selectId', selectId);

    let query = `update public.order set "tag" = 'print' where id in(${selectedId})`;
    await Order.queryAsync(query);
    res.send(200)
  },

  mark_as_cs: async(req,res) => {
    bluebird.promisifyAll(Order);
    let params = req.allParams();
    let selectId = Object.values(params).join();
    let selectedId = sanitizer.escape(selectId);


    let query = `update public.order set "tag" = 'cs-order' where id in(${selectedId})`;
    await Order.queryAsync(query);
    res.send(200)
  },


  label: async(req,res) => {
    let params = req.allParams();
    let {action,first_name,last_name,address1,address2,city,country_code,province,zip,rateid,
      phone,length,width,height,weight,order,company,quantity,shippingWeight,basecost,shipmentid} = params;

    if(action == 'create_shipment'){
      console.log('params', params);
      // let print_custom_1 = `#${order}`;
      // const customsInfo = new api.CustomsInfo({
      //   customs_signer: 'Ton Le',
      //   contents_type: 'gift',
      //   contents_explanation : 'gift',
      //   customs_items: [
      //     new api.CustomsItem({
      //       'description': 'T-shirt',
      //       'quantity': quantity,
      //       'code': 'GM',
      //       'weight': shippingWeight,
      //       'value': basecost,
      //       'hs_tariff_number': '610910'
      //     })
      //   ],
      // });

      let from_address = {
        street1: '6182 Winslow Dr',
        city: 'Huntington Beach',
        state: 'CA',
        zip: '92647',
        country: 'US',
        phone: '310-808-5243',
        company: company,
      }

      let to_address = {
        street1: address1,
        street2: address2,
        city: city,
        state: province,
        zip: zip,
        country: country_code,
        phone: phone
      }

      const fromAddress = new api.Address(from_address);
      const toAddress = new api.Address(to_address);


      const parcel = new api.Parcel({
        length: parseFloat(length),
        width: parseFloat(width),
        height: parseFloat(height),
        weight: parseFloat(weight)
        // predefined_package: 'FlatRateEnvelope'
      });

      const shipment = new api.Shipment({
        to_address: toAddress,
        from_address: fromAddress,
        // customs_info: customsInfo,
        parcel,
        options: {
          endorsement: 'RETURN_SERVICE_REQUESTED',
          invoice_number: `#${order}`,
          // print_custom_1
        }
      });

      shipment.save().then((result) => {
        console.log('result', result);
        return res.json(result)
      }).catch((err)=>{
        console.log('err',err );
      });
    } else if(action == 'buy_label') {
      api.Shipment.retrieve(shipmentid).then(s => {
        s.buy(rateid).then((data)=>{
          console.log('data', data);
          return res.json(data);
        }).catch((err)=>{
          console.log('err', err);
          return res.json(err)
        });
      });
    } else {
      return res.view('acp/create_label')
    }

  },

  category: async(req,res) => {
    // if(req.user.group == 2){
    //   return res.forbidden()
    // }
    bluebird.promisifyAll(Cat);
    let {action,id,name,parent} = req.allParams();
    console.log('params',{action,id,name,parent} );

    if(!action){
      let query = `WITH RECURSIVE category_tree(id, name, depth) AS (
                  SELECT id, name, ARRAY[name]
                  FROM cat
                  WHERE parentid IS NULL
                UNION ALL
                  SELECT cat.id, cat.name, depth || cat.name
                  FROM category_tree
                  JOIN cat ON cat.parentid=category_tree.id
                  WHERE NOT cat.name = ANY(depth)
                )
                SELECT * FROM category_tree ORDER BY depth`;
      let resultQuery = await Cat.queryAsync(query);
      let result = resultQuery.rows;
      // res.json(result)
      let categories = [];

      result.map((cat)=>{
        categories.push({
          title: cat.depth.join(' > '),
          id: cat.id,
          name: cat.name
        })
      })
      console.log('categories', categories);
      return res.view('acp/category',{categories})
    } else {

      let searchCat = `select * from cat where "name" = '${name}'`;
      let searchParent = `select * from cat where "name" = '${parent}'`;
      let foundCat = await Cat.queryAsync(searchCat);
      let foundParent = await Cat.queryAsync(searchParent);
      let findCat = foundCat.rows;
      let findParent = foundParent.rows;
      if(findCat.length > 0){
        return res.json({error:'Category exist',id:findCat[0].id})
      }
      if(parent && findParent.length < 1){
        return res.json({error:'parent doest not exist'})
      }

      let query;

      if(action == 'add'){
        if(!parent){
          query = `INSERT INTO cat (name) VALUES ('${name}')`;
        } else {
          query = `INSERT INTO cat (name,parentid) VALUES ('${name}','${findParent[0].id}');`;
        }
        let result = await Cat.queryAsync(query)
                              .then((success)=>{
                                  res.json(success)})
                              .catch((error)=>{
                                  res.json(error)});
      }

      if(action == 'edit'){
        query = `UPDATE cat SET name = '${name}' WHERE id = '${id}'`;
        let result = await Cat.queryAsync(query)
                              .then((success)=>{
                                res.json(success)})
                              .catch((error)=>{
                                res.json(error)});
      }

      if(action == 'delete'){
        // console.log('id', id);
        let jquery = `select * from cat where "parentid" = '${id}'`;
        let isParent = await Cat.queryAsync(jquery);
        let resultSearch = isParent.rows;
        console.log('resultSearch', resultSearch);
        if(resultSearch.length>0){
          return res.json({error:'Can not delete a parent category',id:resultSearch[0].id})
        }
        query = `DELETE FROM cat WHERE id = '${id}'`;
        let result = await Cat.queryAsync(query)
                              .then((success)=>{
                                res.json(success)})
                              .catch((error)=>{
                                res.json(error)});
      }
    }




  },

  brand: async(req,res) => {

    let {action,id,name} = req.allParams();

    if(!action){
      let findBrand = await Brand.find();
      return res.view('acp/brand',{findBrand})
    }

    if(action == 'add'){
      let findBrand = await Brand.findOne({name});
      if(findBrand){
        return res.json({error:'brand name exist',id:findBrand.id})
      }
      Brand.create({name})
           .then(success => res.json(success))
           .catch(error => res.json(error))
    }

    if(action == 'edit'){
      let findBrand = await Brand.findOne({name});
      if(findBrand){
        return res.json({error:'brand name exist',id:findBrand.id})
      }
      Brand.update({id},{name})
           .then(success => res.json(success))
           .catch(error => res.json(error))
    }

    if(action == 'delete'){
      Brand.destroy({id})
           .then(success => res.json(success))
           .catch(error => res.json(error))
    }

  },

  merchant: async(req,res) => {
    // if(req.user.group == 2){
    //   return res.forbidden()
    // }
    let {action,id,name} = req.allParams();

    if(!action){
      let findMerchant = await Merchant.find();
      return res.view('acp/merchant',{findMerchant})
    }

    if(action == 'add'){
      let findMerchant = await Merchant.findOne({name});
      if(findMerchant){
        return res.json({error:'Merchant name exist',id:findMerchant.id})
      }
      Merchant.create({name})
           .then(success => res.json(success))
           .catch(error => res.json(error))
    }

    if(action == 'edit'){
      let findMerchant = await Merchant.findOne({name});
      if(findMerchant){
        return res.json({error:'brand name exist',id:findMerchant.id})
      }
      Merchant.update({id},{name})
           .then(success => res.json(success))
           .catch(error => res.json(error))
    }

    if(action == 'delete'){
      Merchant.destroy({id})
           .then(success => res.json(success))
           .catch(error => res.json(error))
    }
  },

  setting: async(req,res) => {
    res.view('acp/setting')
  },

  sync: (req,res) => {
    if(req.user.group == 2){
      return res.forbidden()
    }

    return res.view('acp/sync-store')
  },

  discount: async(req,res) => {
    let {id} = req.allParams();
    if(id){

    }

    let findCategory = await Cat.find()
    let findDiscount = await Discount.find();
    return res.view('acp/discount',{findDiscount,findCategory})
  },

};
