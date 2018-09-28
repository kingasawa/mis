/**
 * CheckController
 *
 * @description :: Server-side logic for managing aboutuses
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const { apiKey, apiSecret } = sails.config.shopify;
import bluebird from 'bluebird';
import sanitizer from 'sanitizer';
import moment from 'moment'

// const apiKey = '06636a56f6226cc663470ee0e58b0623'; //06636a56f6226cc663470ee0e58b0623
// const apiSecret =  'e6648b8d4cf98043e99fd8fde6559c22';

const aftershipKey = '22328965-7073-434b-a7a9-6c727695b399';
const Aftership = require('aftership')(aftershipKey);

module.exports = {
  index: async(req,res) => {
    return res.notFound();
  },

  get_chart: async(req,res) => {
    let userid = req.user.id;
    let {position} = req.allParams();
    console.log('position', position);
    bluebird.promisifyAll(Order);

    let query = `SELECT count(id),sum(total_price) as totalPrice ,sum(total_item) as totalQuantity,to_char("createdAt" AT TIME ZONE 'America/Los_Angeles', 'MM/DD/YYYY') as date
                  FROM public.order o 
                  GROUP BY to_char("createdAt" AT TIME ZONE 'America/Los_Angeles', 'MM/DD/YYYY')
                  ORDER BY date LIMIT 30`;

    if(req.user.group == 3 || position == 'scp'){
      query = `select count(id),sum(quantity) as totalquantity, sum(price) as totalprice, date 
            from 
                (SELECT j.id,quantity,price, j.owner, to_char("createdAt" AT TIME ZONE 'America/Los_Angeles', 'MM/DD/YYYY') as date
                FROM public.order as o, json_to_recordset(line_items) as j(quantity int, price float, owner int, id float)  
                WHERE status = 'Shipped') as orderItem
            where owner = '${userid}'
            group by orderItem.owner,date
            order by date
            limit 30`;
    }
    console.log('query', query);
    await Order.queryAsync(query).then((result)=>{
      let dataDate = [];
      let dataCount = [];
      let dataProduct = [];
      let dataPrice = [];
      result.rows.map((row)=>{

        dataDate.push(row.date);
        dataCount.push(row.count);
        dataProduct.push(row.totalquantity);
        dataPrice.push(row.totalprice)
        // console.log('row.date', row.date);
      })
      let data = {
        dataDate,dataCount,dataProduct,dataPrice
      }

      // console.log('data', data);

      return res.json(data)
    }).catch((err)=>{
      console.log('err', err);
      return res.json(err)
    });
  },

  update: async(req,res) => {
    let {order,name,value,product,variant,shop} = req.allParams();

    if(name=='tag'){
      let result = await Promise.resolve(Order.update({id:order},{tag:value}));
      return res.json(result)
    }

    if(name == 'internal-notes1'){
      let result = await Promise.resolve(Order.update({id:order},{internal_notes1:value}));
      return res.json(result)
    }

    if(name =='internal-notes2'){
      let result = await Promise.resolve(Order.update({id:order},{internal_notes2:value}));
      return res.json(result)
    }

    if(name =='internal-notes3'){
      let result = await Promise.resolve(Order.update({id:order},{internal_notes3:value}));
      return res.json(result)
    }

    if(name=='product-stock'){
      Post.update({productid:product},{stock:value}).then(async(result)=>{
        let findToken = await Promise.resolve(Shop.findOne({ name: shop }).populate('shopifytoken'));
        let Shopify = new ShopifyApi({
          shop: shop,
          shopify_api_key: apiKey,
          access_token: findToken.shopifytoken[0].accessToken,
        });

        let putData = {
          "variant": {
            "id": variant,
            "inventory_quantity": value,
            // "old_inventory_quantity": 10
          }
        }
        Shopify.put(`/admin/variants/${variant}.json`,putData,(err,data)=>{
          return res.json(result)
        })
      });

    }
  },

  update_status: async(req,res) => {
    let {id,status} = req.allParams();
    console.log('params', {id,status});
    Order.update({id},{status}).then((result)=>{
      return res.json(result)
    }).catch((err)=>{
      return res.json(err)
    })

  },

  update_picker: async(req,res) => {
    let {id,picker} = req.allParams();
    console.log('params', {id,picker});
    Order.update({id},{picker}).then((result)=>{
      return res.json(result)
    }).catch((err)=>{
      return res.json(err)
    })

  },

  update_note: async(req,res) => {
    let {orderid,updateNote} = req.allParams();
    console.log('params', {orderid,updateNote});
    Order.update({id:orderid},{internal_notes1:updateNote}).then((result)=>{
      return res.json(result)
    }).catch((err)=>{
      return res.json(err)
    })

  },

  mark_shipped: async(req,res) => {
    let {orderid,trackingNumber,trackingCompany,items,products} = req.allParams();
    console.log('params', {orderid,trackingNumber,trackingCompany});
    let findShop = await Order.findOne({orderid});

    let shop = findShop.shop;
    let findToken = await Promise.resolve(Shop.findOne({ name: shop }).populate('shopifytoken'));
    let accessToken = 'no shop';
    if(findToken){
      accessToken = findToken.shopifytoken[0].accessToken
    }
    let Shopify = new ShopifyApi({
      shop: shop,
      shopify_api_key: apiKey,
      access_token:accessToken
    });

    let postData;
    Shopify.get('/admin/locations.json',(err,data)=>{
      let locationId = _.get(data,'locations[0].id','')
      postData = {
        "fulfillment": {
          "location_id": locationId,
          "tracking_number": trackingNumber,
          "tracking_company": trackingCompany,
          "line_items": items
        }
      };
      console.log('locationId', locationId);
    })


    let postTracking = {
      "tracking": {
        "slug": trackingCompany,
        "tracking_number": trackingNumber,
        "title": `order-${orderid}`,
      }
    }

    Shopify.post(`/admin/orders/${orderid}/fulfillments.json`,postData,
      async(error, data) => {
        if (error) {
          // let error = err.error.base
          // console.log('err', err.error.base[0]);
          console.log('error ne', error);
          if(error.code == 403 && error.error == 'Contact support'){
            // console.log('vào đây');
            postData.fulfillment.id = orderid+trackingNumber;
            postData.fulfillment.order_id = orderid
            Fulfillment.create(postData.fulfillment).exec(async(err, result) => {
              if (err) console.log('err', err);
              console.log('fulfillment', result)
                Order.update({orderid}, {status:'Shipped',tracking_number:postData.fulfillment.tracking_number }).then((updateOrder)=>{
                  res.json({result:'successfull'});
                })
            });
            // update tracking to aftership
            Aftership.POST('/trackings' ,{body:postTracking}, (err, result)=> {
              if(err) console.log('err', err);
              // console.log('aftership', result.data);
              // Order.update({orderid},{tracking_status:result.data.tracking.tag}).then(console.log(Aftership.rate_limit))

            });
          } else {
            return res.json({error:'cannot update tracking'});
          }

        }
        else {
          // await Promise.resolve(Tracking.update({shop_order_id:params.orderId},{status:'shipped'}));
          await Promise.resolve(Order.update({orderid},
            { status: 'Shipped',tracking_number:data.fulfillment.tracking_number }));
          delete data.fulfillment.created_at;
          delete data.fulfillment.updated_at;
          Fulfillment.create(data.fulfillment).exec((err, result) => {
            if (err) console.log('err', err);
            console.log('fulfillment', result)
          });

          // update tracking to aftership
          Aftership.POST('/trackings' ,{body:postTracking}, (err, result)=> {
            if(err) console.log('err', err);
            console.log(Aftership.rate_limit);
          });
          // end

          // //update stock to db
          // products.map(async(item)=>{
          //   let findPost = await Post.findOne({productid:item.id});
          //   if(findPost){
          //     item.quantity = parseInt(item.quantity);
          //     let stock = findPost.stock-item.quantity;
          //     Post.update({productid:item.product_id},{stock}).then((updateQuantity)=>{
          //       if(err) console.log('err', err);
          //     })
          //   }
          // })
          // //end

          // console.log('data fulfill',data.fulfillment);
          // sails.sockets.broadcast(session_id, 'order/shipped', { data: params.orderId });
          return res.json({result:'successfull'});
        }
      });


  },

  update_tracking: async(req,res) => {
    let {orderid,trackingNumber,trackingCompany,id} = req.allParams();
    console.log('params', {orderid,trackingNumber,trackingCompany});
    let findShop = await Order.findOne({orderid});

    let shop = findShop.shop;
    let findToken = await Promise.resolve(Shop.findOne({ name: shop }).populate('shopifytoken'));
    let Shopify = new ShopifyApi({
      shop: shop,
      shopify_api_key: apiKey,
      access_token: findToken.shopifytoken[0].accessToken,
    });

    let putData = {
      "fulfillment": {
        "tracking_number": trackingNumber,
        "tracking_company": trackingCompany,
        "id": id
      }
    }

    Shopify.put(`/admin/orders/${orderid}/fulfillments/${id}.json`,putData,
      async(error, data) => {
        if (error) {
          // let error = err.error.base
          // console.log('err', err.error.base[0]);
          return res.json(error);
        }
        else {
          // await Promise.resolve(Tracking.update({shop_order_id:params.orderId},{status:'shipped'}));
          await Promise.resolve(Order.update({orderid},
            { tracking_number:data.fulfillment.tracking_number,tracking_url:data.fulfillment.tracking_urls }));
          delete data.fulfillment.created_at;
          delete data.fulfillment.updated_at;
          Fulfillment.update({id},data.fulfillment).exec((err, result) => {
            if (err) console.log('err', err);
            console.log('fulfillment', result)
          });

          return res.send(200);
        }
      });


  },

  mark_cancelled: async(req,res) => {
    let {orderid} = req.allParams();
    let findShop = await Order.findOne({orderid});

    // console.log('shop', findShop.shop);
    let shop = findShop.shop;
    let findToken = await Promise.resolve(Shop.findOne({ name: shop }).populate('shopifytoken'));
    let Shopify = new ShopifyApi({
      shop: shop,
      shopify_api_key: apiKey,
      access_token: findToken.shopifytoken[0].accessToken,
    });

    Shopify.post(`/admin/orders/${orderid}/cancel.json`,{"reason":"inventory"},(err,data)=>{
      if(err){
        if(err.code == 403 && err.error == 'Contact support'){
          Order.update({orderid},{status:'Cancelled'}).then((result)=>{
            console.log('update order when store die');
          })
        }
        console.log('err', err);
      } else {
        return res.json(data)
      }
    })
  },

  pickup: async(req,res) => {
    bluebird.promisifyAll(Order);
    let {selectedOrders,picker} = req.allParams();
    let selectedId = sanitizer.escape(selectedOrders);
    console.log('selectedId', selectedId);
    let findPicker = await User.findOne({username:picker})

    let query = `UPDATE public.order SET "commission" = '${findPicker.commission}', "tag" = 'picked', "picker" = '${picker}'
                 WHERE id in(${selectedId})`;
    await Order.queryAsync(query).then((result)=>{
      return res.json(result)
    }).catch((err)=>{
      console.log('err', err);
      return res.json(err)
    });
  },

  unpick: async(req,res) => {
    bluebird.promisifyAll(Order);
    let {selectedOrders} = req.allParams();
    let selectedId = sanitizer.escape(selectedOrders);
    console.log('selectedId', selectedId);

    let query = `UPDATE public.order SET "tag" = '', "picker" = ''
                 WHERE id in(${selectedId})`;
    await Order.queryAsync(query).then((result)=>{
      return res.json(result)
    }).catch((err)=>{
      console.log('err', err);
      return res.json(err)
    });
  },

  change_status: async(req,res) => {
    bluebird.promisifyAll(Order);
    let {selectedOrders,status} = req.allParams();
    // console.log('params', {selectedOrders,status});
    let selectedId = sanitizer.escape(selectedOrders);
    console.log('selectedId', selectedId);

    let query = `UPDATE public.order SET "status" = '${status}'
                 WHERE id in(${selectedId})`;
    await Order.queryAsync(query).then((result)=>{
      return res.json(result)
    }).catch((err)=>{
      console.log('err', err);
      return res.json(err)
    });
  },

  change_user: async(req,res) => {
    bluebird.promisifyAll(Order);
    let {selectedOrders,picker} = req.allParams();
    let selectedId = sanitizer.escape(selectedOrders);
    console.log('selectedId', selectedId);

    let query = `UPDATE public.order SET "picker" = '${picker}', "tag" = 'picked'
                 WHERE id in(${selectedId})`;
    await Order.queryAsync(query).then((result)=>{
      return res.json(result)
    }).catch((err)=>{
      console.log('err', err);
      return res.json(err)
    });
  },

  refund: async(req,res) => {
    let {id} = req.allParams();
    let findOrder = await Order.findOne({id});

    let {shop,orderid,line_items} = findOrder

    line_items.map((item)=>{
      item.line_item_id = item.id
    })

    let findToken = await Promise.resolve(Shop.findOne({ name: shop }).populate('shopifytoken'));
    let Shopify = new ShopifyApi({
      shop: shop,
      shopify_api_key: apiKey,
      access_token: findToken.shopifytoken[0].accessToken,
    });




    let createTransaction = {
      "transaction": {
        "kind": "refund"
      }
    }

    Shopify.post(`/admin/orders/${orderid}/transactions.json`,createTransaction,(err,refund)=>{
      if(err){
        console.log('err', err);
      } else {
        Shopify.post(`/admin/orders/${orderid}/cancel.json`,{},(err,data)=>{
          if(err){
            return res.json(err)
          }
          return res.json(data)
        })
      }
    })



  },

};

