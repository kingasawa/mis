/**
 * CheckController
 *
 * @description :: Server-side logic for managing aboutuses
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const { apiKey, apiSecret } = sails.config.shopify;
import bluebird from 'bluebird';
import sanitizer from 'sanitizer';
import moment from 'moment';
import uuidv4 from 'uuid/v4';

// const apiKey = '06636a56f6226cc663470ee0e58b0623'; //06636a56f6226cc663470ee0e58b0623
// const apiSecret =  'e6648b8d4cf98043e99fd8fde6559c22';

const aftershipKey = '22328965-7073-434b-a7a9-6c727695b399';
const Aftership = require('aftership')(aftershipKey);

module.exports = {
  index: async(req,res) => {
    return res.notFound();
  },

  import: async (req,res)=>{
    return res.view('scp/order/import_csv');
  },

  upload: async (req, res) => {
    // let { id } = req.user;
    let file_data = [];
    let sid = uuidv4();
    let number = 0;
    req.file('files').upload({
      adapter: require('skipper-csv'),
      csvOptions: {delimiter: ',', columns: true},
      rowHandler: function(row, fd){
        // console.log(fd, row);
        number = number+1;
        row.number = number;
        file_data.push(row);
        // sails.sockets.broadcast(session_id,'order/import_done',row);
      }
    }, async (err, files) => {
      if (err) return res.serverError(err);

      let createData = {
        sid,
        file_name: files[0].filename,
        file_size: files[0].size,
        file_data,
      }
      console.log('createData', createData);
      // let createResult = await Promise.resolve(ImportCache.create(createData));
      // console.log('createResult', createResult);


      // _.each(file_data,(order)=>{
      //   let orderData = {
      //     id : order.OrderID,
      //     order_name : order.OrderName,
      //     total_item : order.Qty,
      //     total_price : order.Total,
      //     internal_notes1: order.Notes,
      //     tracking_status: order.Status,
      //     tracking_number: order.Tracking,
      //     picker: order.User
      //   }
      //   Order.create(orderData).then((result)=>{
      //     console.log('done', result.id);
      //   }).catch((err)=>{
      //     console.log('err', err);
      //   })
      // })

        _.each(file_data,(order)=>{
            let updateData = {
              internal_note1: order.Notes,
              tracking_status: order.Status,
              status: order.Status,
              tracking_number: order.Tracking,
              picker: order.User
            }

            Order.update({
              where: {
                id: order.OrderID
              }
            },updateData).then((result)=>{
              console.log('done', order.OrderID);
            }).catch((err)=>{
              console.log('err', err);
            })
      })

      return res.redirect(`/order/import?sid=${sid}`);

    });
  },

  count: async (req, res) => {
    let {shop} = req.allParams()
    let findToken = await Promise.resolve(Shop.findOne({ name: shop }).populate('shopifytoken'));

    let accessToken = findToken.shopifytoken[0].accessToken
    let Shopify = new ShopifyApi({
      shop: shop,
      shopify_api_key: apiKey,
      access_token:accessToken
    });

    Shopify.get(`/admin/orders/count.json`,(err,data)=>{
      console.log('data', data);
    })
  },

  migrate: async (req, res) => {
    let billing_address = {"first_name":"Nathan","address1":"72663 Pine St","phone":null,"city":"Fortuna","zip":"65034-1010","province":"Missouri","country":"United States","last_name":"Doyel","address2":"","company":"","latitude":null,"longitude":null,"name":"Nathan Doyel","country_code":"US","province_code":"MO"}
    let shipping_address = {"first_name":"Nathan","address1":"72663 Pine St","phone":null,"city":"Fortuna","zip":"65034-1010","province":"Missouri","country":"United States","last_name":"Doyel","address2":"","company":"","latitude":null,"longitude":null,"name":"Nathan Doyel","country_code":"US","province_code":"MO"}

    let orders = await Order.find({orderid:null})
    console.log('orders', orders);
    _.each(orders,(order)=>{
      Order.update({id:order.id},{billing_address,shipping_address})
           .then((result)=>{
             console.log('result', result.id);
           })
           .catch((err)=>{
             console.log('err', err);
           })
    })

  },

  migrateUpdate: async (req, res) => {
    // let findOrder = await ImportCache.findOne({id:1})
    //
    // Order.create({id:345}).then((result)=>{
    //   console.log('result', result);
    // })
    // _.each(findOrder.file_data,async(order)=>{
    //
    //   delete order.payout;
    //   delete order.commission;
    //   delete order.tracking_url
    //
    //   if(order.global !== '1'){
    //     delete order.global
    //     console.log('order.orderid', order.orderid);
    //     Order.create(order).then((result)=>{
    //       console.log('done', result.id);
    //     }).catch((err)=>{
    //       console.log('err', err);
    //     })
    //   }
    // })
    // let order = { 'orderid': '738886647919',
    //   'order_name': '#1184',
    //   'note': '',
    //   'email': 'texascoolguy1@gmail.com',
    //   '': '96cae92ebbd75146ab8b9fc5934d3731',
    //   total_price: '107.99',
    //   total_line_items_price: '107.99',
    //   subtotal_price: '107.99',
    //   total_weight: '0',
    //   total_tax: '0',
    //   total_item: '1',
    //   total_discounts: '0',
    //   currency: 'USD',
    //   financial_status: 'paid',
    //   confirmed: 'true',
    //   name: 'AHMAD ASHOUR',
    //   referring_site: '',
    //   customer: '{"id":961895727215,"email":"texascoolguy1@gmail.com","accepts_marketing":true,"created_at":"2018-11-23T20:21:55-08:00","updated_at":"2018-11-23T20:22:28-08:00","first_name":"AHMAD","last_name":"ASHOUR","orders_count":1,"state":"disabled","total_spent":"107.99","last_order_id":738886647919,"note":null,"verified_email":true,"multipass_identifier":null,"tax_exempt":false,"phone":null,"tags":"","last_order_name":"#1184","default_address":{"id":1060950245487,"customer_id":961895727215,"first_name":"AHMAD","last_name":"ASHOUR","company":"","address1":"1301 N 175th St Apt B302","address2":"","city":"Shoreline","province":"Washington","country":"United States","zip":"98133","phone":null,"name":"AHMAD ASHOUR","province_code":"WA","country_code":"US","country_name":"United States","default":true}}',
    //   shop: 'haanmark.myshopify.com',
    //   order_status_url: 'https://haanmark.com/8156512367/orders/96cae92ebbd75146ab8b9fc5934d3731/authenticate?key=664ef7e9e8e61a25f90c8a8a0badecbf',
    //   line_items: '[{"id":1696210714735,"variant_id":18088014381167,"title":"Dr. Infrared Heater DR-968 Portable Space Heater, 1500W","quantity":1,"price":"107.99","sku":"17153162","variant_title":"Other","vendor":"DR. INFRARED HEATER","fulfillment_service":"manual","product_id":1932802097263,"requires_shipping":true,"taxable":true,"gift_card":false,"name":"Dr. Infrared Heater DR-968 Portable Space Heater, 1500W - Other","variant_inventory_management":"shopify","properties":[],"product_exists":true,"fulfillable_quantity":1,"grams":0,"total_discount":"0.00","fulfillment_status":null,"discount_allocations":[],"tax_lines":[],"origin_location":{"id":693374812271,"country_code":"US","province_code":"CA","name":"haanmark","address1":"7 Alpine Village Drive","address2":"","city":"Alpine","zip":"91901"},"global":1,"owner":29,"mpn":"DR-968","merchant":[{"name":"walmart.com","code":"17153162"}],"image":"https://i5.walmartimages.com/asr/a900d965-c759-4fbf-80c9-cef9be0088d0_1.bd5bdb5779afa8a37dc7b25673cc7f99.jpeg?odnHeight=450&odnWidth=450&odnBg=FFFFFF"}]',
    //   billing_address: '{"first_name":"AHMAD","address1":"1301 N 175th St Apt B302","phone":null,"city":"Shoreline","zip":"98133","province":"Washington","country":"United States","last_name":"ASHOUR","address2":"","company":"","latitude":47.7557804,"longitude":-122.3424158,"name":"AHMAD ASHOUR","country_code":"US","province_code":"WA"}',
    //   shipping_address: '{"first_name":"AHMAD","address1":"1301 N 175th St Apt B302","phone":null,"city":"Shoreline","zip":"98133","province":"Washington","country":"United States","last_name":"ASHOUR","address2":"","company":"","latitude":47.7557804,"longitude":-122.3424158,"name":"AHMAD ASHOUR","country_code":"US","province_code":"WA"}',
    //   internal_notes1: '',
    //   internal_notes2: '',
    //   internal_notes3: '',
    //   tag: '',
    //   status: 'New',
    //   tracking_number: '',
    //   label: 'no-label',
    //   picker: '',
    //   owner: '[29]',
    //   global: '1',
    //   id: '4485',
    //   createdAt: '2018-11-24 04:22:29+00',
    //   updatedAt: '2018-11-24 04:22:39+00',
    //   tracking_url: '',
    //   commission: 0,
    //   payout: 0,
    //   tracking_status: '',
    //   number: 4469 }

    let {id,shop,status} = req.allParams()
    // let {shop} = req.allParams()
    let findToken = await Promise.resolve(Shop.findOne({ name: shop }).populate('shopifytoken'));

    let accessToken = findToken.shopifytoken[0].accessToken
    let Shopify = new ShopifyApi({
      shop: shop,
      shopify_api_key: apiKey,
      access_token:accessToken
    });

    // let shopifyUrl = `/admin/orders.json?since_id=${id}&limit=250&status=${status}`
    let shopifyUrl = `/admin/orders.json?ids=${id}&status=${status}`
    // let shopifyUrl = `/admin/orders.json?limit=250`
    Shopify.get(shopifyUrl,(err,data)=>{
      console.log('count', data.orders.length);

      console.log('data.orders', data.orders);
      _.each(data.orders,(order)=>{
        order.orderid = order.id
        delete order.id
        order.order_name = order.name
        order.shop = shop
        // order.tracking_status = 'New'
        // let quantity = 0
        // _.each(order.line_items,(item)=>{
        //   quantity += item.quantity
        // })
        // order.total_item = quantity
        let number = parseInt(order.name.split('#')[1])
          Order.update({where: {
              order_name:order.name,
              orderid:null,
              total_price:parseFloat(order.total_price)
            }},order).then((result)=>{
            console.log('done', result.orderid);
          }).catch((err)=>{
            console.log('err', err);
          })
      })
    })
    res.json('ok')
  },

  migrateCreate: async (req, res) => {

    // let {id,shop} = req.allParams()
    let {id,shop} = req.allParams()
    let findToken = await Promise.resolve(Shop.findOne({ name: shop }).populate('shopifytoken'));

    let accessToken = findToken.shopifytoken[0].accessToken
    let Shopify = new ShopifyApi({
      shop: shop,
      shopify_api_key: apiKey,
      access_token:accessToken
    });

    let shopifyUrl = `/admin/orders.json?since_id=${id}&limit=250`
    // let shopifyUrl = `/admin/orders.json?limit=250`
    Shopify.get(shopifyUrl,(err,data)=>{
      console.log('count', data.orders.length);

      console.log('data.orders', data.orders);
      _.each(data.orders,(order)=>{
        order.orderid = order.id
        delete order.id
        order.order_name = order.name
        order.shop = shop
        order.tracking_status = 'New'
        let quantity = 0
        _.each(order.line_items,(item)=>{
          quantity += item.quantity
        })
        order.total_item = quantity

        Order.create(order).then((result)=>{
          console.log('result', result.id);
        }).catch((err)=>{
          console.log('err', err);
        })
      })
    })
    return res.json('ok')
  },

  export: async (req, res) => {
      // let { selectedOrders } = req.allParams();
    let selectedOrders = [1000,1002,1003,1004]
      // Selected Pickup Order <array>:string.split(',')
      // let orders = [2261, 2264, 2266, 2268];

      // sails.log.debug("selectedOrders", selectedOrders);

      // let pickupOrders = await Order.find().where({ id: selectedOrders })
      let pickupOrders = await Order.find().sort('id ASC');

      let filename = `export-order-items`;

      let orderItems = [];

      _.each(pickupOrders, (order) => {
        // sails.log.debug("order", order);

        let { line_items } = order;
        let products = []
        _.each(line_items, (item) => {
          const { title,  quantity, sku} = item
          sails.log.debug("line_item", item);
          let product = `${title} - SKU: ${sku}`
          if(quantity>1){
            product = `${quantity}x ${product}`
          }
          products.push(product)
        })
        products = products.join(' | ')

        let address = order.shipping_address
        let shippingAddress = `${address.name} | ${address.address1} | ${address.address2} | ${address.city} | ${address.zip} | ${address.province} | ${address.country}`

        let csvLineItem = {
          OrderId: order.id,
          OrderName: order.order_name,
          Date: order.createdAt,
          Qty: order.total_item,
          Total: order.total_price,
          Product: products,
          ShippingInformation: shippingAddress,
          Notes: order.internal_notes1,
          Status: order.tracking_status,
          Tracking: order.tracking_number,
          User: order.picker
        };

        orderItems.push(csvLineItem);
      })

      // sails.log.debug("orderItems", orderItems);

      let fields = Object.keys(_.get(orderItems, '[0]',{}));

      // res.json({
      //   filename,
      //   data: orderItems,
      //   fields
      // });
      res.csv({
        filename,
        data: orderItems,
        fields
      });
  },

  backup: async (req, res) => {

    let orders = await Order.find().sort('id ASC');

    let filename = `backup-orders`;

    let fields = Object.keys(_.get(orders, '[0]',{}));

    res.csv({
      filename,
      data: orders,
      fields
    });
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

    Shopify.get('/admin/locations.json',(err,data)=>{
      let locationId = _.get(data,'locations[0].id','')
      const postData = {
        "fulfillment": {
          "location_id": locationId,
          "tracking_number": trackingNumber,
          "tracking_company": trackingCompany,
          "line_items": items
        }
      };
      console.log('locationId', locationId);

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

            return res.json({result:'successfull'});
          }
        });
    })

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

