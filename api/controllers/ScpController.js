/**
 * ScpController
 *
 * @description :: Server-side logic for managing scps
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const { apiKey, apiSecret } = sails.config.shopify;
// var apiKey = 'ae22432ff4d89ca146649cc782f385f1';
// var apiSecret =  '3573364f9e3da3faa1ee8cb02d1ee017';

import QueryBuilder from 'node-datatable';
import bluebird from 'bluebird';
import replace from 'lodash.replace';
import uuidv4 from 'uuid/v4';
import keyby from 'lodash.keyby';
// import include from 'lodash.includes'
const knex = require('knex')({client: 'pg'});


import sumby from 'lodash.sumby';
import sanitizer from 'sanitizer';
import concat from 'lodash.concat';
import fill from 'lodash.fill';
import moment from 'moment';



const CACHE_KEY = 7;
module.exports = {

	index: async (req,res) => {
    let owner = req.user.id;
    let countProduct = await Product.count({owner});
    // let countOrder = await Order.count({owner});
    let data = {
      countProduct
    }
    bluebird.promisifyAll(Order);
    let query = `SELECT sum(quantity) as quantity, sum(price) as total_price 
                 FROM 
                    (SELECT quantity,price, j.owner
                    FROM public.order as o, json_to_recordset(line_items) as j(quantity int, price float, owner int)  
                    WHERE status = 'Shipped') as orderItem
	               LEFT JOIN public.user u on owner = u.id
                 WHERE owner = '${owner}'
                 GROUP BY orderItem.owner, u.username;`
    let queryReuslt = await Order.queryAsync(query);
    let result = queryReuslt.rows;
    let totalSale = {};

    if(result.length === 0){
      totalSale.quantity = 0;
      totalSale.total_price = 0;
    } else {
      totalSale.quantity = result[0].quantity;
      totalSale.total_price = result[0].total_price
    }
    // console.log('data', data);
    res.view('scp/index',{data,totalSale});
  },
  /*when change the analyze logic*/
	resetOrderAnalyzed: async (req,res) => {
	  let user_id = req.user.id;
	  await Order.update({}, {report_analyzed: false});
	  // sails.log.debug("updatedOrders", updatedOrders);
    res.json({msg: 'reset report_analyzed=false on all order'});
  },

  store: async (req,res) => {
    bluebird.promisifyAll(Shop);
    let params = req.allParams();
	  let {id} = req.user;
	  if (!params.name && !params.action) {
      let query = `SELECT s.name ,COALESCE(sum(total_item_price), 0) total
      FROM public.shop s
      LEFT JOIN public.order o on s.name = o.shop 
      WHERE s."owner" = '${id}' 
      AND ("tracking" <> 'Cancelled' OR "tracking" is null)
      GROUP BY s.name`;
      let queryReuslt = await Shop.queryAsync(query);
      let foundShop = queryReuslt.rows;
      let getSum = sumby(foundShop,'total');

      // let getSum = sumResult.rows[0].sum;

      console.log('foundShop', foundShop);
      console.log('getSum', getSum);
      // return res.ok();
      return res.view('scp/store',{foundShop,getSum})

    }

  },

  order_datatable: async(req, res) => {
    const { id } = req.user; // get ID from passport sesion -> req, not raw session
    bluebird.promisifyAll(Order);
    let queryParams = req.allParams();
    let { from, to, export_csv } = queryParams

    console.log('queryParams', queryParams);
    let fromToQuery = ''

    if(from && to){
      fromToQuery = `AND to_char(createdAt::timestamp AT TIME ZONE '-8', 'MM/DD/YYYY')::timestamp between '${from}' and date '${to}' + interval '1 day' - interval '1 second'`
    }



    var tableDefinition = {
      dbType: 'postgres',
      sSelectSql: `to_char(createdAt::timestamp AT TIME ZONE '-8', 'MM/DD/YYYY') as "created_at", 
                    id as productionid, 
                    order_name as order_id, 
                    shop,name as customer,
                    tracking as order_status, 
                    total_item_basecost, 
                    shipping_fee, 
                    total_item_price as total_cost`,
      sTableName: 'public.order',
      sWhereAndSql: `owner=${id} AND sync=1 ${fromToQuery}`,
      aSearchColumns: ['id', 'shop','createdAt', 'name','tracking','total_item_basecost','shipping_fee', 'order_name']
    };


    var queryBuilder = new QueryBuilder(tableDefinition);
    var queries = queryBuilder.buildQuery(queryParams);


    /** fix "createdAt" search issue **/
    let newQueries = {};
    // _.each(queries, (value, key) => {newQueries[key] = replace(value, /\\/g,'');})
    // console.log('queries 1', queries);
    _.each(queries, (value, key) => {newQueries[key] = value.replace( /([a-z]{1,})([A-Z][a-z]{1,})\b/g, '"$1$2"' );})
    queries = newQueries;
    // console.log('queries 2', queries);
    /** fix "createdAt" search issue **/

    console.log('queries', queries);
    // sails.log.debug("SCP:Order:Datatables", queries);
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
  order: async (req,res) => {
	  let {id,list} = req.allParams();
    let owner = req.user.id;
    let data = {};

    if (id) {
      let foundOrder = await Order.findOne({id});

      await Promise.all(
        foundOrder.line_items.map((item)=>{
          Post.findOne({productid:item.product_id}).then((result)=>{
            console.log('result', result);
            if(result.stock) item.stock = result.stock
            // item.stock = result.stock
          })
        })
      )
      // console.log('foundOrder.line_items', foundOrder);

      let {name,address1,address2,city,zip,province,country} = foundOrder.shipping_address;
      foundOrder.addressFormat = `${name}|${address1}|${address2}|${city}|${zip}|${province}|${country}`;

      let foundFulfill = await Fulfillment.find({order_id:foundOrder.orderid});
      console.log('foundOrder', foundOrder);
      res.view('scp/order/view',{foundOrder,foundFulfill});

    } if(list=='picked') {
      let orderReturnCount = 0;
      let foundOrder = await Order.find({picker:req.user.username});
      let orderArr = []
      await Promise.all(
        foundOrder.map((order)=>{
          if(order.status=='Return'){
            orderReturnCount += 1
          }
          let items = []
          order.line_items.map((item)=>{
            items.push(`• ${item.title}`)
          })
          order.products = items.join('\n')
          let {name,address1,address2,city,zip,province,country} = order.shipping_address;
          order.addressFormat = `${name} |${address1} |${address2} |${city} |${zip} |${province} |${country}`;
          // if((_.includes(order.owner,owner) || order.global == 1)){
          //   orderArr.push(order);
          // }
          orderArr.push(order);
        })
      )
      return res.view('scp/order', {orderArr,orderReturnCount});

    } else if(list=='unpick') {
      console.log('list', list);
      let orderReturnCount = 0;
      let foundOrder = await Order.find({
        // or : [
        //   { tag: { '!': 'picked' } },
        //   { tag: null }
        // ],
        // picker:null,
        status:'New'
      });
      console.log('foundOrder length', foundOrder.length);
      console.log('foundOrder', foundOrder);
      let orderArr = []
      await Promise.all(
        foundOrder.map((order)=>{
          if(order.status=='Return'){
            orderReturnCount += 1
          }
          let items = []
          order.line_items.map((item)=>{
            items.push(`• ${item.title}`)
          })
          order.products = items.join('\n')
          let {name,address1,address2,city,zip,province,country} = order.shipping_address;
          order.addressFormat = `${name} |${address1} |${address2} |${city} |${zip} |${province} |${country}`;
          orderArr.push(order);
        })
      )
      console.log('orderArr', orderArr);
      console.log('orderReturnCount', orderReturnCount);
      return res.view('scp/order', {orderArr,orderReturnCount});

    } else {
      return res.forbidden()
    }


  },


  scp_order_stats: async (req, res) => {
    bluebird.promisifyAll(Order);
    const { id } = req.user;
    let { from, to, shop } = req.allParams();
    console.log('params sss', req.allParams());

    let addQuery = {}

    if(shop){
      console.log('co shop', shop);
      addQuery.shop = shop
    }
    addQuery.owner = id;


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

    if(from && to){
      query.whereRaw(`"createdAt" between '${from}' and date '${to}' + interval '1 day' - interval '1 second'`)
    }


    data = await (Order.queryAsync(query.toString())).then(e=>e.rows[0]) // {sync:1, ...addQuery}

    console.log('stats query', query.toString());
    console.log('stats data', data);
    res.json(data)
  },


  order_shop_filter: async (req, res) => {
    let query = {}
    query.owner = req.user.id;
    let data = await Shop.find(query);

    res.json(data)
  },

  // Order stats
  order_stats: async (req, res) => {
	  const { id } = req.user;
    bluebird.promisifyAll(Order);
    let stats = {};
	  let result = await Order.queryAsync(`SELECT count(orderid) AS number_order, date_trunc('week', "createdAt")
	   FROM public.order WHERE owner=${id} AND "createdAt" > now() - INTERVAL '1 months' GROUP BY date_trunc('week', "createdAt")`); // cai nay no in ra ket qua la gi array[] hả

    stats = {
      ...stats, //may cai ... la sao
      ..._.get(result, 'rows') // cai cuc shit nay la sao
    };


    let categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let series = [{
      name: 'Shopify',
      data: [7.0, 6.9, 9.5, 14.5, 18.4, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6]
    }, {
      name: 'Alibama',
      data: [3.9, 4.2, 5.7, 8.5, 11.9, 15.2, 17.0, 16.6, 14.2, 10.3, 6.6, 4.8]
    }];

    console.log(result); // result = { rows:   [  {   } ]  }
	  res.view('scp/dashboard', { stats, series, categories });
  },


  editQuantity: async(req,res)=>{
    let { orderid, id, lineItem } = req.allParams();
    let foundOrder = await Order.findOne({id});
    _.each(foundOrder.line_items,(item)=>{
      _.each(lineItem,(newItem)=>{
        if(item.sku == newItem.sku){
          item.quantity = newItem.quantity
        }
      })
    });
    // console.log('updte to',foundOrder.line_items);
    Order.update({id},{line_items:foundOrder.line_items}).then((result)=>{
      let createData = {
        orderid:id,
        type: 'change_quantity',
        data: {line_items:lineItem,msg:'Product quantity updated'},
        owner: req.user.id
      }
      OrderAction.create(createData).then((result)=>{
        Report.Order({orderid,export_report: false,REVALIDATE:true});
        res.json({msg:'ok'})
      })
    }).catch((err)=>{
      console.log(err)
    })
  },


  // sync: (req,res) => {
  //   return res.view('scp/sync-store')
  // },

  success: (req,res) => {
    let params = req.allParams();
    if(params.t && params.do == 'sync') {
      var data = {
        msg:'Success',
        content: params.t,
        url:'/scp/store'
      }
    }
    return res.view('scp/notice',data)
  },

  remove: (req,res) => {
	  let params = req.allParams();
	  console.log(params);
	  if (params.item == 'design') {
	    Design.destroy({id:params.id}).exec(function(err,result){
	      console.log('delete design',result)
      })
    }
  },

  profile: async(req, res) => {
    res.view('scp/profile');
  },


  order_dashboard: async (req, res) => {
    let params = req.allParams();
    let { from, to } = params;
    let user_id = req.user.id;

    let dashboard = await Report.orderDashboard({from, to, owner: user_id});
    res.json(dashboard);
  },

  product: async(req,res) => {
	  let owner = req.user.id;
	  let countOutOfStock = 0
	  let findPost = await Post.find({
      or : [
        { owner },
        { global: 1 }
      ]
    })

    findPost.map((product)=>{
      if(product.stock < 3){
        countOutOfStock += 1
      }
    })
    return res.view('scp/product',{findPost,countOutOfStock});
  },

  // delete_product: async(req,res) => {
  //   let {id} = req.allParams();
  //   console.log('delete post id', id);
  //   Post.destroy({id})
  //       .then(success => res.json({success}))
  //       .catch(error => res.json({error}) )
  // },

  setting: async(req,res) => {
    res.view('scp/setting')
  },

};
