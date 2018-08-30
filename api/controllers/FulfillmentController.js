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
// const { easypostapi } = sails.config.easypost;


// test api 0qSy6pqLZyeXoXajMpcwBg
// live api VOlV03Gkzwt03ENcMBnbDQ

const EasyPost = require('node-easypost');

// const easypostapi = 'VOlV03Gkzwt03ENcMBnbDQ';
const easypostapi = '0qSy6pqLZyeXoXajMpcwBg';
const api = new EasyPost(easypostapi);

module.exports = {

  create_shop: async(req,res) => {
     let params = req.allParams();
     console.log('params', params);
     let { shop, name, street1, city, state, zip, country, phone } = params;
     let createData = {
       shop,
       name,
       address: {
         street1, city, state, zip, country, phone
       },
       owner: req.user.id
     }
     console.log('createData', createData);
     ManualShop.create(createData).exec((err,result)=>{
       if(err) console.log(err);
       return res.redirect('/order/import')
     })
  },
  fulfill: async(req, res) => {
    let params = req.allParams();
    let session_id = req.signedCookies['sails.sid'];
    console.log('params', params);
    let shop = params.shop;

    let fulfillmentData = {

    }
    Fulfillment.create(fulfillmentData).exec((err, result) => {
      if (err) console.log('err', err);
      return console.log('fulfillment', result)
    });
    await Promise.resolve(Order.update({ orderid: params.orderId },{ tracking: 'Fulfilled' }));

    sails.sockets.broadcast(session_id, 'order/shipped', { data: params.orderId });
    return res.send(200);

  },

  edit_tracking: async(req, res) => {
    let params = req.allParams();
    console.log(params);
    let session_id = req.signedCookies['sails.sid'];

    let putData = {
      "fulfillment": {
        "tracking_number": params.trackingNumber,
        "tracking_company": params.trackingCompany,
        "id": params.fulfillmentId
      }
    };

  },

  create_shipment: async(req, res) => {
    let params = req.allParams();
    console.log(params);
    let session_id = req.signedCookies['sails.sid'];
    let findToken = await Promise.resolve(Shop.findOne({ name: params.shop })
                                              .populate('shopifytoken'));
    let shopData = ManualShop.findOne({shop:params.shop});
    let foundOrder = await Order.findOne({ id: params.order });

    let { line_items, total_item, total_item_basecost } = foundOrder;
    let shippingWeight = 1;
    if (parseFloat(params.parcel.weight) > 1) {
      shippingWeight = parseFloat(params.parcel.weight)
    }

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
        company: shopData.name,
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

                let foundOrder = await Order.findOne({ orderid: orderId });

                if (foundOrder) {
                  let { line_items, createdAt, tradegecko_id } = foundOrder;

                  let fulfillmentData = {
                    // data.fulfillment.shipment_id = result.id;
                    // data.fulfillment.service_rate = result.selected_rate.service;
                    // delete data.fulfillment.created_at;
                    // delete data.fulfillment.updated_at;
                  }

                  await Promise.resolve(Fulfillment.create(fulfillmentData));

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
                let fulfillmentData = {
                //   data.fulfillment.shipment_id = result.id;
                // data.fulfillment.service_rate = result.selected_rate.service;
                // delete data.fulfillment.created_at;
                // delete data.fulfillment.updated_at;
                // {order_id:params.orderId},data.fulfillment
                }
                await Promise.resolve(Fulfillment.update({ order_id: params.orderId },
                  fulfillmentData));
                await Promise.resolve(Order.update({ orderid: params.orderId },
                  { label: result.postage_label.label_url }));

                sails.sockets.broadcast(session_id, 'new/label', { data: params.orderId });
                console.log(result);
                return res.send(200);

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
        await Promise.resolve(Fulfillment.destroy({ order_id: params.orderId }));
        await Promise.resolve(Order.update({ orderid: params.orderId },
          {
            tracking: 'In-Production',
            label: 'no-label',
            tag: 'picked'
          }));

        sails.sockets.broadcast(session_id, 'void/label', { data: params.orderId });
        return res.send(200);

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

  auto_buy_label: async(req, res) => {
    let params = req.allParams();
    console.log(params);
    let session_id = req.signedCookies['sails.sid'];

    let foundOrder = await Order.findOne({ id: params.order });
    let { line_items, total_item, total_item_basecost } = foundOrder;
    let shippingWeight = 0;
    line_items.map(async(item, index) => {
      let productid = item.sku.match(/(^[0-9]+)/)[0];
      let foundProduct = await Product.findOne({
        select: ['shippingWeight'],
        id: productid
      });
      shippingWeight += foundProduct.shippingWeight;
    })


      let print_custom_1 = '#' + params.order;
      const customsInfo = new api.CustomsInfo({
        customs_signer: 'Ton Le',
        contents_type: 'gift',
        customs_items: [
          new api.CustomsItem({
            'description': 'T-shirt',
            'quantity': total_item,
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
        company: '',
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
          if (rate.carrier == 'DHLGlobalMail' || rate.carrier == 'DHLGlobalmailInternational'){
            getDHL.push(rate)
          }
        })

        let rateId = minby(getDHL, o => parseFloat(o.rate))['id'];
        // let rateId = minby(s.rates, o => parseFloat(o.rate))['id'];
        console.log('rateId', rateId);
        s.buy(rateId).then(async(result) => {

          console.log('BUY result', result)

          let fulfillmentData = {
            // data.fulfillment.shipment_id = result.id;
            // data.fulfillment.service_rate = result.selected_rate.service;
            // delete data.fulfillment.created_at;
            // delete data.fulfillment.updated_at;
          }

          await Promise.resolve(Fulfillment.create(fulfillmentData));
          await Promise.resolve(Order.update({ orderid: params.orderID },
            {
              tracking: 'Fulfilled',
              label: result.postage_label.label_url,
              tag: 'print'
            }));

          console.log('update result', result);
          return res.send(200);
        });

      });

  },
};

