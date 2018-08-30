/**
 * TrackingController
 *
 * @description :: Server-side logic for managing aboutuses
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const _ = require('lodash');
import minby from 'lodash.minby';
import reject from 'lodash.reject';

const { apiKey, apiSecret } = sails.config.shopify;
const { easypostapi } = sails.config.easypost;
// var apiKey = 'ae22432ff4d89ca146649cc782f385f1';
// var apiSecret =  '3573364f9e3da3faa1ee8cb02d1ee017';

// test api 0qSy6pqLZyeXoXajMpcwBg
// live api VOlV03Gkzwt03ENcMBnbDQ

const EasyPost = require('node-easypost');

// const easypostapi = 'VOlV03Gkzwt03ENcMBnbDQ';
// const easypostapi = '0qSy6pqLZyeXoXajMpcwBg';
const api = new EasyPost(easypostapi);

module.exports = {

  index: async(req,res) => {
    return res.notFound()
  },

  view: async(req, res) => {
    let params = req.allParams();

    let foundTracking = await Promise.resolve(Tracking.findOne(params));
    res.view('acp/tracking/view', { foundTracking })
  },

  pickup: async(req, res) => {
    let params = req.allParams();
    let session_id = req.signedCookies['sails.sid'];
    console.log(params);
    for (let value of params.order) {
      //update order tracking to pick
      let findOrder = await Promise.resolve(Order.findOne({ id: value.id }));
      if (findOrder.tracking !== 'void') {
        await Promise.resolve(Order.update({ id: value.id }, { tracking: 'picked' }));
      }

    }
    sails.sockets.broadcast(session_id, 'order/pickup')
  },

  fulfill: async(req, res) => {
    let params = req.allParams();
    let session_id = req.signedCookies['sails.sid'];
    console.log('params', params);
    let shop = params.shop;
    let findToken = await Promise.resolve(Shop.findOne({ name: shop }).populate('shopifytoken'));
    var Shopify = new ShopifyApi({
      shop: shop,
      shopify_api_key: apiKey,
      access_token: findToken.shopifytoken[0].accessToken,
    });

    var postData = {
      "fulfillment": {
        "tracking_number": params.trackingId,
        "tracking_company": params.company,
        "line_items": params.items
      }
    };

    Shopify.post(`/admin/orders/${params.orderId}/fulfillments.json`,
      postData,
      async(err, data) => {
        if (err) return res.negotiate(err); else {
          // await Promise.resolve(Tracking.update({shop_order_id:params.orderId},{status:'shipped'}));
          await Promise.resolve(Order.update({ orderid: params.orderId },
            { tracking: 'Fulfilled' }));
          delete data.fulfillment.created_at;
          delete data.fulfillment.updated_at;
          Fulfillment.create(data.fulfillment).exec((err, result) => {
            if (err) console.log('err', err);
            return console.log('fulfillment', result)
          });

          // console.log('data fulfill',data.fulfillment);
          sails.sockets.broadcast(session_id, 'order/shipped', { data: params.orderId });
          return res.send(200);
        }
      })
  },

  edit_tracking: async(req, res) => {
    let params = req.allParams();
    console.log(params);
    let session_id = req.signedCookies['sails.sid'];
    let findToken = await Promise.resolve(Shop.findOne({ name: params.shop })
                                              .populate('shopifytoken'));
    let Shopify = new ShopifyApi({
      shop: params.shop,
      shopify_api_key: apiKey,
      access_token: findToken.shopifytoken[0].accessToken,
    });
    let postData = {
      "fulfillment": {
        "tracking_number": params.trackingNumber,
        "tracking_company": params.trackingCompany,
        "id": params.fulfillmentId
      }
    };
    Shopify.put('/admin/orders/' +
                params.orderId +
                '/fulfillments/' +
                params.fulfillmentId +
                '.json', postData, function(err, data) {
      if (err) return res.negotiate(err); else {
        delete data.fulfillment.created_at;
        delete data.fulfillment.updated_at;
        Fulfillment.update({ order_id: params.orderId }, data.fulfillment).exec((err, result) => {
          if (err) console.log('err', err);
          return console.log('fulfillment', result)
        });
        sails.sockets.broadcast(session_id, 'tracking/edit', { data: params.orderId });
        return res.send(200);
      }

    })
  },

  create_shipment: async(req, res) => {
    let params = req.allParams();
    console.log(params);
    let session_id = req.signedCookies['sails.sid'];
    let findToken = await Promise.resolve(Shop.findOne({ name: params.shop })
                                              .populate('shopifytoken'));
    let Shopify = new ShopifyApi({
      shop: params.shop,
      shopify_api_key: apiKey,
      access_token: findToken.shopifytoken[0].accessToken,
    });

    let foundOrder = await Order.find({ id: params.order });
    let { line_items, total_item, total_item_basecost } = foundOrder[0];
    let shippingWeight = 1;
    if (parseFloat(params.parcel.weight) > 1) {
      shippingWeight = parseFloat(params.parcel.weight)
    }

    Shopify.get('/admin/shop.json', function(err, address) {
      let print_custom_1 = '#' + params.order;
      const customsInfo = new api.CustomsInfo({
        customs_signer: 'Ton Le',
        contents_type: 'gift',
        contents_explanation : 'gift',
        customs_items: [
          new api.CustomsItem({
            'description': 'T-shirt',
            'quantity': total_item,
            'code': 'GM',
            'weight': shippingWeight,
            'value': total_item_basecost,
            'hs_tariff_number': '610910'
          })
        ],
      });

      let from_address = {
        street1: '6182 Winslow Dr',
        city: 'Huntington Beach',
        state: 'CA',
        zip: '92647',
        country: 'US',
        phone: '310-808-5243',
        company: address.shop.name,
      }
      // if (address.shop.country_code == 'US') {
      //   from_address = {
      //     street1: address.shop.address1,
      //     city: address.shop.city,
      //     state: address.shop.province,
      //     zip: address.shop.zip,
      //     country: 'US',
      //     company: address.shop.name,
      //   }
      // }

      const fromAddress = new api.Address(from_address);

      if (params.address.street2 == 'null') {
        delete params.address.street2;
      }

      if (params.address.country == 'US') {
        print_custom_1 = '';
      }

      const parcel = new api.Parcel({
        length: parseFloat(params.parcel.length),
        width: parseFloat(params.parcel.width),
        height: parseFloat(params.parcel.height),
        weight: parseFloat(params.parcel.weight)
        // predefined_package: 'FlatRateEnvelope'
      });

      const shipment = new api.Shipment({
        to_address: params.address,
        from_address: fromAddress,
        customs_info: customsInfo,
        parcel,
        options: {
          endorsement: 'RETURN_SERVICE_REQUESTED',
          invoice_number: '#' + params.order,
          print_custom_1
        }
      });

      shipment.save().then((result) => {
        console.log('result', result);
        // return res.json(result);
        sails.sockets.broadcast(session_id,
          'create/shipment',
          {
            data: result,
            id: params.orderID
          })
      });
    });
  },

  buy_shipment: async(req, res) => {
    let params = req.allParams();
    let { orderId } = params;
    let session_id = req.signedCookies['sails.sid'];

    api.Shipment.retrieve(params.shipmentId).then(shipment => {

      shipment.buy(params.rateId)
              .catch((err) => {
                console.log(err)
              })
              .then(async(result) => {
                let shop = params.shop;
                let findToken = await Promise.resolve(Shop.findOne({ name: shop })
                                                          .populate('shopifytoken'));

                let foundOrder = await Order.findOne({ orderid: orderId });

                if (findToken && foundOrder) {
                  let { line_items, createdAt, tradegecko_id } = foundOrder;
                  let Shopify = new ShopifyApi({
                    shop: shop,
                    shopify_api_key: apiKey,
                    access_token: findToken.shopifytoken[0].accessToken,
                  });

                  Shopify.post(`/admin/orders/${orderId}/fulfillments.json`, {
                    fulfillment: {
                      tracking_number: result.tracker.tracking_code,
                      tracking_company: result.tracker.carrier,
                      line_items
                    }
                  }, async(err, data) => {
                    if (err) return res.negotiate(err);
                    else {
                      data.fulfillment.shipment_id = result.id;
                      data.fulfillment.service_rate = result.selected_rate.service;
                      delete data.fulfillment.created_at;
                      delete data.fulfillment.updated_at;
                      await Promise.resolve(Fulfillment.create(data.fulfillment));

                      await Promise.resolve(Order.update({ orderid: orderId },
                        {
                          tracking: 'Fulfilled',
                          label: result.postage_label.label_url,
                          tag: 'print'
                        }));

                      sails.sockets.broadcast(session_id, 'create/label', { data: orderId });
                      console.log(result);
                      return res.send(200);
                    }
                  })
                }

              });
    });
  },

  edit_shipment: async(req, res) => {
    let params = req.allParams();
    let session_id = req.signedCookies['sails.sid'];

    api.Shipment.retrieve(params.shipmentId).then(shipment => {

      shipment.buy(params.rateId)
              .catch((err) => {
                console.log(err)
              })
              .then(async(result) => {
                let shop = params.shop;
                let findToken = await Promise.resolve(Shop.findOne({ name: shop })
                                                          .populate('shopifytoken'));
                let Shopify = new ShopifyApi({
                  shop: shop,
                  shopify_api_key: apiKey,
                  access_token: findToken.shopifytoken[0].accessToken,
                });

                let postData = {
                  "fulfillment": {
                    "tracking_number": result.tracker.tracking_code,
                    "tracking_company": result.tracker.carrier,
                    "id": params.fulfillmentId
                  }
                };
                // /admin/orders/'+params.orderId+'/fulfillments/'+params.fulfillmentId+'.json
                Shopify.put(`/admin/orders/${params.orderId}/fulfillments/${params.fulfillmentId}.json`,
                  postData,
                  async(err, data) => {
                    if (err) return res.negotiate(err); else {
                      data.fulfillment.shipment_id = result.id;
                      data.fulfillment.service_rate = result.selected_rate.service;
                      data.fulfillment.batch_id = null;
                      delete data.fulfillment.created_at;
                      delete data.fulfillment.updated_at;
                      // {order_id:params.orderId},data.fulfillment
                      await Promise.resolve(Fulfillment.update({ order_id: params.orderId },
                        data.fulfillment));
                      await Promise.resolve(Order.update({ orderid: params.orderId },
                        { label: result.postage_label.label_url }));

                      sails.sockets.broadcast(session_id, 'new/label', { data: params.orderId });
                      console.log(result);
                      return res.send(200);
                    }
                  })

              });
    });
  },

  void_shipment: (req, res) => {
    let params = req.allParams();
    console.log(params);
    let session_id = req.signedCookies['sails.sid'];

    api.Shipment.retrieve(params.shipmentId).then(shipment => {
      console.log(shipment);
      shipment.refund().then(async(result) => {
        console.log(result);
        let shop = params.shop;
        let findToken = await Promise.resolve(Shop.findOne({ name: shop })
                                                  .populate('shopifytoken'));
        let Shopify = new ShopifyApi({
          shop: shop,
          shopify_api_key: apiKey,
          access_token: findToken.shopifytoken[0].accessToken,
        });

        Shopify.post(`/admin/orders/${params.orderId}/fulfillments/${params.fulfillmentId}/cancel.json`,
          {},
          async(err) => {
            if (err) return res.negotiate(err); else {
              // data.fulfillment.shipment_id = result.id;
              // delete data.fulfillment.created_at;
              // delete data.fulfillment.updated_at;
              await Promise.resolve(Fulfillment.destroy({ order_id: params.orderId }));
              await Promise.resolve(Order.update({ orderid: params.orderId },
                {
                  tracking: 'In-Production',
                  label: 'no-label',
                  tag: 'picked'
                }));

              sails.sockets.broadcast(session_id, 'void/label', { data: params.orderId });
              return res.send(200);
            }
          })
      });
    });
  },

  check_address: (req, res) => {
    let params = req.allParams();
    console.log(params);
    // console.log(params);
    let session_id = req.signedCookies['sails.sid'];

    const verifiableAddress = new api.Address(params.address);

    verifiableAddress.save()
                     .catch(() => {
                       sails.sockets.broadcast(session_id,
                         'check/address',
                         {
                           msg: 'false',
                           id: params.orderID
                         });
                       return false
                     })
                     .then((addr) => {
                       sails.sockets.broadcast(session_id,
                         'check/address',
                         {
                           msg: addr.verifications.delivery.success,
                           id: params.orderID
                         })
                     });
  },

  get: async(req, res) => {
    let { id } = req.allParams();
    let result = await Fulfillment.findOne({
      select: ['tracking_url'],
      order_id: id
    });
    res.redirect(result.tracking_url);
  },

  getWeight: async(req, res) => {
    let params = req.allParams();
    // let getWeight = 0;
    // _.each(params,async(product)=>{
    //   let getProduct = await Product.findOne({id:product.productid})
    //   let quantity = product.quantity;
    //   getWeight += (getProduct.shippingWeight*quantity)
    // })
    // console.log('getWeight',getWeight)
  },
  auto_buy_label: async(req, res) => {
    let params = req.allParams();
    console.log(params);
    let session_id = req.signedCookies['sails.sid'];
    let findToken = await Promise.resolve(Shop.findOne({ name: params.shop })
                                              .populate('shopifytoken'));
    let Shopify = new ShopifyApi({
      shop: params.shop,
      shopify_api_key: apiKey,
      access_token: findToken.shopifytoken[0].accessToken,
    });

    let foundOrder = await Order.find({ id: params.order });
    let { line_items, total_item, total_item_basecost } = foundOrder[0];
    let shippingWeight = 0;
    line_items.map(async(item, index) => {
      let productid = item.sku.match(/(^[0-9]+)/)[0];
      let foundProduct = await Product.findOne({
        select: ['shippingWeight'],
        id: productid
      });
      shippingWeight += foundProduct.shippingWeight;
    })

    Shopify.get('/admin/shop.json', function(err, address) {
      let print_custom_1 = '#' + params.order;
      const customsInfo = new api.CustomsInfo({
        customs_signer: 'Ton Le',
        contents_type: 'gift',
        contents_explanation : 'gift',
        customs_items: [
          new api.CustomsItem({
            'description': 'T-shirt',
            'quantity': total_item,
            'code': 'GM',
            'weight': shippingWeight,
            'value': total_item_basecost,
            'hs_tariff_number': '610910'
          })
        ],
      });

      let from_address = {
        street1: '6182 Winslow Dr',
        city: 'Huntington Beach',
        state: 'CA',
        zip: '92647',
        country: 'US',
        phone: '310-808-5243',
        company: address.shop.name,
      }

      const fromAddress = new api.Address(from_address);

      if (params.address.street2 == 'null') {
        delete params.address.street2;
      }
      if (params.address.country == 'US') {
        print_custom_1 = '';
      }

      const parcel = new api.Parcel({
        length: parseFloat(params.parcel.length),
        width: parseFloat(params.parcel.width),
        height: parseFloat(params.parcel.height),
        weight: shippingWeight
        // predefined_package: 'FlatRateEnvelope'
      });

      const shipment = new api.Shipment({
        to_address: params.address,
        from_address: fromAddress,
        customs_info: customsInfo,
        parcel,
        options: {
          endorsement: 'RETURN_SERVICE_REQUESTED',
          invoice_number: '#' + params.order,
          print_custom_1
        }
      });
      //
      shipment.save().then(s => {
        console.log('result s.rate', s.rates);
        let getDHL = [];
        s.rates.map((rate)=>{
          // rate.service == 'ParcelsExpeditedDomestic'
          // rate.service == 'ParcelPlusExpeditedDomestic'
          if(rate.service == 'First' || rate.service == 'Priority' || rate.service == 'DHLPacketInternationalPriority' || rate.service == 'DHLPacketPlusInternational'){
            getDHL.push(rate)
          }
        })

        let rateId = minby(getDHL, o => parseFloat(o.rate))['id'];

        console.log('rateId', rateId);
        s.buy(rateId).then(async(result) => {

          console.log('BUY result', result)
          let postData = {
            "fulfillment": {
              "tracking_number": result.tracker.tracking_code,
              "tracking_company": result.tracker.carrier,
              "line_items": params.items
            }
          };

          Shopify.post(`/admin/orders/${params.orderID}/fulfillments.json`,
            postData,
            async(err, data) => {
              if (err) return res.negotiate(err); else {
                data.fulfillment.shipment_id = result.id;
                data.fulfillment.service_rate = result.selected_rate.service;
                delete data.fulfillment.created_at;
                delete data.fulfillment.updated_at;
                await Promise.resolve(Fulfillment.create(data.fulfillment));
                await Promise.resolve(Order.update({ orderid: params.orderID },
                  {
                    tracking: 'Fulfilled',
                    label: result.postage_label.label_url,
                    tag: 'print'
                  }));

                console.log('update result', result);
                // sails.sockets.broadcast(session_id,'fulfilled/success',result);
                return res.send(200);
              }
            })
        });

      });
    });
  },
};

