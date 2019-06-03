import moment from 'moment';
import bluebird from 'bluebird';
import groupBy from 'lodash.groupby';
// import Passport from 'passport';
const request = require('request');


const { apiKey, apiSecret } = sails.config.shopify;
const { shopifyVendor } = sails.config.shopify;
moment.tz.setDefault('Asia/Ho_Chi_Minh');

const knex = require('knex')({ client: 'pg' });

module.exports = {
  index: (req, res) => res.json({
    message: "Please dont route index",
    config: sails.config
  }),
  uploader: (req, res) => res.view('demo/uploader.ejs'),
  design: (req, res) => {

    //@TODO query from Model
    let data = {
      logo: ['0be9ce4cb37d4998996a04a15d982574', 'ae50a97854994d7284ef4076f156673f'], //user uploaded logo
      material: ['3b70c726a2b14e1380d385de8078a9e7', 'a96b0dd4ab0e4c4fb78b7da76f0905c9'],
    };
    res.view('demo/design', data)
  },
  publisher: (req, res) => {
    const publisher = sails.hooks.kue_publisher;
    const JOB_TIMEOUT = 3*1000; // 3s
    const job = publisher.create('test', {
      title: 'welcome msg',
      data: {
        university: 'fpt',
        hometown: 'sai gon',
        private_token: 'hello2017'
      },
      msg: 'Welcome Tam Du fpt',
      age: 30
    })
                         // .searchKeys( ['title', 'data'] )
                         .priority('high')
                         .attempts(10)
                         .backoff({
                           delay: JOB_TIMEOUT,
                           type: 'fixed'
                         })
                         .on('complete', function(result) {
                           sails.log.debug('Test:completed', result);
                         })
                         .on('failed attempt', function(errorMessage, doneAttempts) {
                           sails.log.debug('Test:failed attempt', errorMessage, doneAttempts);
                         }).on('failed', function(errorMessage) {
        sails.log.debug('Test:failed', errorMessage);
      })
                         .ttl(120000)
                         .removeOnComplete(true)
                         .save();

    sails.log.info('DemoController:publisher');

    res.json({
      message: "published",
    });
  },
  locales: (req, res) => {

    sails.log.debug('req.session', req.session);
    req.getLocale();

    res.json({
      message: res.i18n('Welcome'),
      session: req.session
    });
  },
  cache: async (req, res) => {
    Cache.set("name", "tam");
    Cache.set("zero", 0);
    Cache.expire("name", 120);
    let donthave = await Cache.getAsync("donthave"); //get with Async bluebird
    let zero = await Cache.getAsync("zero"); //get with Async bluebird
    let name = await Cache.getAsync("name"); //get with Async bluebird
    // Cache.getAsync("name").then(res => sails.log.debug('name res', res)); //get with Async bluebird

    sails.log.debug('donthave', donthave);
    res.json({
      donthave,
      zero,
      name
    });
  },
  getSize: async (req, res) => {
    let { id = 1, size = 's' } = req.allParams;
    let { size: sizes } = await Promise.resolve(MaterialSize.findOne({ id }));
    let result = sizes.find(item => item.size.toLowerCase() === size);
    let { price } = result;

    res.json(price);
    //tu xuc di khoan đã còn nữa nè :D
  },
  blast: async (req, res) => {
    for (let i = 0; i <= 500; i++) {
      sails.sockets.blast('demo/blast', { msg: 'this is blast all' });
    }
    res.json({ msg: 'blast 50' })
  },
  lodash: (req, res) => {
    const user = {
      tam: {
        name: 'du tam'
      },
    };

    // lodash se giup ong bao toan du lieu
    const khanhName = _.get(user, 'khanh.name', 'unnamed');
    res.json({
      ok: true,
      khanhName
    })
  },
  print: (req, res) => {
    res.view('demo/print')
  },
  rxjs: (req, res) => {

  },
  download: (req, res) => {
    Download.url(
      'https://easypost-files.s3-us-west-2.amazonaws.com/files/postage_label/20170415/f90b286338134f77b535a242ebd81feb.pdf')
    res.ok();
  }, // send email demo
  mailer: (req, res) => {
    let params = req.allParams();
    console.log('mailer', params);
    let user = {
      name: 'Khanh Tran',
      email: 'kingasawa@gmail.com'
    }
    Mailer.sendWelcomeMail(user);
    res.json({})
  }, // Analyze all report
  feedback: async(req,res) => {
    let params = req.allParams();
    let { fullname, email, order, question } = params;
    console.log('mailer', params);
    let feedback = {
      fullname, email, order, question
    }
    Mailer.sendFeedBack(feedback);
    res.json({msg:'done'})
  },
  // report: async (req, res) => {
  //   let params = req.allParams();
  //   let { export_report = false, REVALIDATE = false } = params;
  //   console.time('analyze-report');
  //   const allReport = await Report.Order({
  //     export_report,
  //     REVALIDATE
  //   });
  //
  //   console.timeEnd('analyze-report');
  //   // const allReport = await Report.Order({orderid: '5484266701', export_report: false});
  //   res.json(allReport);
  // },
  dashboard: async (req, res) => {
    // let params = req.allParams();
    // let { export_report = false, REVALIDATE = false } = params;
    // let dashboard = await Report.Dashboard({from:'04/01/2017', to : '04/30/2017'});
    let dashboard = await Report.orderDashboard({});
    res.json(dashboard);
  }, // hmac validate
  hmac: async (req, res) => {
    const isAuthentic = await ShopifyPrime.Auth.isAuthenticRequest(req.allParams(), apiSecret);

    res.json({
      isAuthentic,
      pr: req.allParams(),
    });
  }, //Authen using shopname - no hmac validate
  passport: async (req, res) => {
    // let data = sails.services.passport.authenticate('local');
    //
    // sails.log.debug("data", data);
    // res.json(data);

    let shopData = await Shop.findOne({ name: 'superbowltee.myshopify.com' });
    let user = await User.findOne(shopData.owner);

    sails.log.debug("shopData", shopData);
    sails.log.debug("user", user);
    // let user = {};
    req.login(user, function(err) {
      if (err) {
        sails.log.warn(err);
        return res.send(403, err);
      }

      req.session.user = user;
      req.session.authenticated = true;

      // Support socket
      if (req.isSocket) {
        return res.json({
          user,
          location
        });
      }

      // Upon successful login, optionally redirect the user if there is a
      // `next` query param
      if (req.query.next) {
        let url = sails.services.authservice.buildCallbackNextUrl(req);
        res.status(302).set('Location', url);
      }

      sails.log.info('user', user, 'authenticated successfully');
      return res.json(user);
    });

  },

  calculateDesign: async (req, res) => {
    let { saveId = 11, material = 3 } = req.allParams();
    let owner = req.user.id;

    let result = {};
    // result = await ProductDesign.calculateDesign({ owner, saveId });
    result = await ProductDesign.calculateDesign({
      material,
      owner,
      saveId
    });
    res.json(result);
  },
  test_order: async (req, res) => {
    let data = req.allParams();
    // let { orderid = '5027401426' } = req.allParams();
    // const foundOrder = await Order.findOne({ orderid });
    //
    // if(foundOrder){
    //   console.log('foundOrder', foundOrder);
    // }else{
    //   console.log('not foundOrder', foundOrder);
    // }

    let orderCreated = await Order.create(data);

    console.log('orderCreated', orderCreated);
    res.json({});
  },
  options: async (req, res) => {
    let result = await Option.getData();
    // console.log('data', result.data.length);
    // console.log('data', result);
    // let data = keyBy(result.data, 'type');
    // console.log('data result.data', result.data);
    // console.log('data result.data', JSON.stringify(result));
    // console.log('data keyby type', keyBy(result, 'type'));

    // result.size = keyBy(result.size, 'value')
    // result.color = keyBy(result.color, 'name')
    res.json(result);
  },
  getSku: async (req, res) => {
    let veryOldSku = 'unit-144-White-M';
    let oldSku = 'unit-245-ultra_cotton_short_sleeve_tee-navy-L';
    let { sku } = req.allParams();

    //test
    sku = sku || `${veryOldSku}`;

    let result = Report.getGearmentSKU(sku, 'Gearment');
    res.json(result);
  },
  updateSKU: async (req, res) => {
    console.log('begin updateSKU update');
    let findVariant = await Promise.resolve(Variant.find());

    // console.log(findVariant);
    _.each(findVariant, async (variant, index) => {
      let sku = variant.sku.split('-');
      let shop = variant.shop;
      let campaignID = sku[1];
      let frontSide = 2;
      // let materialID = sku[3];

      // OLD SKU
      let colorName = sku[3];
      colorName = colorName.replace('_', ' ');
      colorName = colorName.charAt(0).toUpperCase() + colorName.slice(1);

      let material = await Promise.resolve(Material.findOne({
        select: ['id'],
        type: sku[2]
      }));
      let color = await Promise.resolve(Option.findOne({
        select: ['id'],
        name: colorName
      }));
      let size = await Promise.resolve(Option.findOne({
        select: ['id'],
        value: sku[4]
      }));
      let design = await Promise.resolve(Campaign.findOne({
        select: ['numbericDesignId'],
        id: sku[1]
      }));

      // CURRENT SKU
      // let material = await Promise.resolve(Material.findOne({select:['id'],name:variant.item}));
      // let newSKU = `unit-${sku[1]}-${sku[2]}-${material.id}-${sku[4]}-${sku[5]}-${sku[6]}`
      let newSKU = `unit-${campaignID}-${frontSide}-${material.id}-${color.id}-${size.id}-${design.numbericDesignId}`;

      //
      let findToken = await Promise.resolve(Shop.findOne({ name: shop }).populate('shopifytoken'));

      let Shopify = new ShopifyApi({
        shop: shop,
        shopify_api_key: apiKey,
        access_token: findToken.shopifytoken[0].accessToken,
      });

      let putData = {
        "variant": {
          "sku": newSKU,
          "vendor": shopifyVendor,
        }
      }

      let putUrl = `/admin/variants/${variant.variantID}.json`;

      Shopify.put(putUrl, putData, (err, result) => {
        if (err) return console.log(err);
        console.log(result)
      })

      // console.log(newSKU);
      Variant.update({ id: variant.id }, { sku: newSKU }).exec((err, data) => {
        if (err) return console.log(err)
        console.log('Variant.update data', data);
        const Shopify = new ShopifyApi(shopifyAuth);
      })

      if (index === findVariant.length - 1) {
        res.json({ msg: `update done ${findVariant.length} variant(s)` });
      }
    })

  },
  getProductID: (req, res) => {
    let params = req.allParams();
    let findToken = Shop.findOne({ name: params.shop }).populate('shopifytoken');

    let Shopify = new ShopifyApi({
      shop: params.shop,
      shopify_api_key: apiKey,
      access_token: findToken.shopifytoken[0].accessToken,
    });

    Shopify.get(`/admin/products/${params.id}.json`, (err, data) => {
      res.json(data)
    })
  },
  materialKeyBy: async (req, res) => {
    let materialData = await Material.keyBy();
    res.json(materialData);
  },
  productKeyBy: async (req, res) => {
    let productData = await Product.getProductKey();
    res.json(productData);
  },
  log: async (req, res) => {
    let user = {
      name: "teo",
      age: "33"
    }
    sails.log.debug("DEBUG", req.user);
    sails.log.info("INFO");
    sails.log.warn("WARN");
    sails.log.error("ERROR");
    let type = 'ultra_cotton_short_sleeve_tee';
    let materialData = await Material.findOne({ or: [{ type }, { oldType: type }] })
                                     .populate('size')
                                     .populate('shipfee');
    console.log('materialData', materialData);
    res.json({});
  },
  logout: async (req, res) => {

    // sails.services.passport.deserializeUser(function(id, done) {
    //   console.log('id', id);
    //   done(err, user);
    // });
    // console.log('req.session.passport', req.session.passport);
    res.json({});
  },
  addProduct: async (req, res) => {
    Product.addProduct({});
    res.json({});
  },
  variantWarning: async (req, res) => {
    let warningData = await Product.count({
      id: 4,
      where: { base_price: 0 }
    });
    res.json(warningData);
  },
  updateLastLogin: async (req, res) => {
    let lastLogin = (new Date()).toString();
    let warningData = await User.update(2, { last_login: lastLogin });

    console.log(moment(warningData[0].last_login).format())
    res.json(warningData);
  },
  knex: async (req, res) => {
    // SELECT distinct(o.owner), u.username, o.id, o."createdAt" FROM public.order o
    // left join public.user u on o.owner = u.id
    // where o.sync=1
    // and o."createdAt" >= '05/04/2017' and date '05/20/2017' + interval '1 day' - interval '1 second'
    let query = knex.select('*').from('books').toString();
    console.log('query', query);
    res.json({ test: query });
  },
  time: async (req, res) => {
    // SELECT distinct(o.owner), u.username, o.id, o."createdAt" FROM public.order o
    // left join public.user u on o.owner = u.id
    // where o.sync=1
    // and o."createdAt" >= '05/04/2017' and date '05/20/2017' + interval '1 day' - interval '1 second'
    let data = await Product.findOne(1).limit(1);
    console.log('data', data);
    res.json({ data });
  },
  bluebird: async (req, res) => {
    bluebird.promisifyAll(Order);

    let data = await Order.queryAsync(`select *, "createdAt" AT TIME ZONE '+7' from public.order limit 2`);

    console.log('data', data.rows[0]);

    res.json(data.rows[0]);
  },

  orderhiveitemview: async (req, res) => {
    let data = await Orderhive.itemView();

    console.log('orderhive data', data);
    res.json(data)
  },

  lzw: async (req, res) => {
    let { s = 'test' } = req.allParams()

    let compressedData = Lzw.compress(s);
    let decompressedData = Lzw.decompress(compressedData);

    res.json({
      compressedData,
      decompressedData,
      passed: decompressedData === s
    })
  },

  getOrderDate: async (req, res) => {
    let result = await Order.find().limit(1);
    let date = result[0].createdAt

    console.log('date', moment(date).format('DDMMYYYY'));

    res.json({
      result
    })
  },
  task: async function() {
    // Order.update({tracking:'pending',sync:1},{tracking:'Awaiting-Fulfillment'}).exec((err,result)=>{
    //   console.log('update ok',result)
    // })
    let queryOrder = `SELECT id FROM public.order where id=5560`;

    let query = `UPDATE public.order SET "tracking" = 'In-Production', 
                  "payment_status" = 'pending' 
                WHERE id in (${queryOrder})`;

    Order.query(query, (err, result) => {
      if(err) return sails.log.error('Task:Update:Order update tracking error',err)
      // sails.log.debug('Task:Update:Order Update tracking every hour',result)
    })

    let queryAllOrderData = `SELECT * FROM public.order where id=5560`;

    Order.query(queryAllOrderData, async (err, orderDataResult) => {
      let orderData = orderDataResult.rows;
      if(err) return sails.log.error('Task:Update:Order sync TradeGecko error', err )
      if(!orderData){
        sails.log.debug('Task:Update:Order Sync TradeGecko every hour null orderData')
      }
      // sails.log.debug('Task:Update:Order Sync TradeGecko every hour orderData', orderData)


      if(orderData){
        orderData.map(async order => {
          // console.log('order', order);
          let { id, createdAt, line_items } = order;
          let issued_at = moment(createdAt).format('DD-MM-YYYY');
          let order_line_items = []

          if(line_items){

            await Promise.all(line_items.map(item => {
              let { quantity, tradegecko_id: variant_id  } = item;
              order_line_items.push({
                variant_id,
                quantity
              });
            }))


            let createOrderData = {
              issued_at,
              "status": "active",
              // payment_status: "paid", // must have order line items price
              order_line_items,
              "company_id": 15890479,
              "billing_address_id": 19294849,
              "shipping_address_id": 19294849,
            }

            console.log('createOrderData', createOrderData);

            let createOrder = await TradeGecko.createOrder(createOrderData);

            if(createOrder && createOrder.id){
              await Order.update({ id }, { tradegecko_id: createOrder.id })
              console.log('Sync TradeGecko Order done', id, createOrder.id );
            }
          }

        })
      }
    })

    // 1. create order "payment_status": "paid"
  },

  scanner: async(req,res) => {
      res.view('test/scanner');
  },

  zipcode: async(req,res) => {
    console.log('params', req.allParams());
      let { city,state } = req.allParams();
      let apikey = 'UfUH5TMl2BigYz4qaI7TCIMC6QYapsdjI70N0M83orkn0oOa7V4JDQlJHkU6N7pv';


      if(city && state){
        await request(`https://www.zipcodeapi.com/rest/${apikey}/city-zips.json/${city}/${state}`, function (error, response, body) {
          const result = JSON.parse(body);
          return res.json(result)
        });
      }

      else {
        res.view('test/zipcode')
      }


  },

  test: async(req,res) => {
    let request = require('request');
    let url ='https://shipint.live/aftership'
    request.post(url, function (error, response, body) {
      if (!error) {
        console.log(body);
      }
      return res.json(response)
    });
  },

  report: async (req, res) => {


    bluebird.promisifyAll(Order);
    // const orderData = await Order.queryAsync(`
    // select picker, status, count(id), sum(total_price) from "order"
    // WHERE "picker" is not null
    // AND "picker" <> ''
    // GROUP BY picker,status
    // ORDER BY picker
    //   `);
    //
    // const orderMoney = await Order.queryAsync(`
    // select picker, status, sum(total_price) from "order"
    // GROUP BY picker,status
    // ORDER BY status
    //   `);

    // const orderGroup = groupBy(orderData.rows,'picker')
    // const userList = Object.keys(orderGroup)

    const queryStatus = await Order.queryAsync(`
    select status from "order"
    GROUP BY status
    `)

    const queryUser = await Order.queryAsync(`
    select picker from "order"
    WHERE "picker" is not null
    AND "picker" <> ''
    GROUP BY picker
    `)

    const userData = []

    queryUser.rows.map((user)=>{
      queryStatus.rows.map(async(status)=>{
        console.log('user', user);
        console.log('status', status);
        const orderData = await Order.queryAsync(`
          select picker, status, count(id), sum(total_price) from "order"
          WHERE "picker" = '${user.picker}'
          AND "status" = '${status.status}'
          GROUP BY picker,status
        `);
        console.log('userData orderData.rows', orderData.rows);
        userData.push(orderData.rows)
      })
    })

    console.log('userData', userData);
    // const rows = []
    // const orderUser = groupBy(orderData.rows,'picker')
    // const orderStatus = groupBy(orderData.rows,'status')
    // const objUser = Object.keys(orderUser)
    // const objStatus = Object.keys(orderStatus)
    //
    // objStatus.map((s)=>{
    //   objUser.map((u)=>{
    //     if(orderUser[s].picker !== u)
    //     rows.push()
    //   })
    // })

    // const reportMoney = groupBy(orderMoney.rows,'status')
    // console.log('orderGroup', orderGroup['Go GO']);

    // const reportData = {orderGroup,obj}

    // console.log('orderGroup', orderGroup);
    res.json({msg:'ok'})
  },

};

