/**
 * ShopifyController
 *
 * @description :: Server-side logic for managing Shopifies
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const { baseUrl } = sails.config.globals
// const { apiKey, apiSecret } = sails.config.shopify;
// const { apiKey, apiSecret } = sails.config.shopify;
const apiKey = '37ba19c60c3afeafdcb6e24f0c8e252d';
const apiSecret =  '22a3bfc470e705982986685f3d123808';

  //shopify app dev
// var apiKey = '5be0da665e61116428d9fc135b5d452a';
// var apiSecret =  '061120df23906afe20fd899e78147857';

module.exports = {
	index: (req,res) => {

	  let params = req.allParams();
    let session_id = req.signedCookies['sails.sid'];
    // sails.sockets.join(req,session_id);
    Shop.findOne({name:params.shopifyname+'.myshopify.com'}).exec((err,foundShop)=>{
      if (!foundShop) {
        var Shopify = new ShopifyApi({
          shop: params.shopifyname,
          shopify_api_key: apiKey,
          shopify_shared_secret: apiSecret,
          shopify_scope: 'write_price_rules,write_products,read_orders,read_customers,write_customers,read_orders,write_orders,read_shipping,write_shipping,read_analytics',
          redirect_uri: `https://${baseUrl}/shopify/sync_callback`,
          nonce: params.uid // you must provide a randomly selected value unique for each authorization request
        });
        console.log('apiKey', apiKey);
        console.log('apiSecret', apiSecret);
        console.log('Shopify.buildAuthURL()', Shopify.buildAuthURL());
        res.redirect(Shopify.buildAuthURL());
      } else {
        sails.sockets.broadcast(session_id,'shop/exist',{msg:'shop exist'});
        res.json('exist');
      }
    });
  },

  sync_callback: (req,res) => {
    let params = req.allParams();
    let sessionId = req.signedCookies['sails.sid'];

    let Shopify = new ShopifyApi({
      shop: params.shop,
      shopify_api_key: apiKey,
      shopify_shared_secret: apiSecret,
    });
    let postData = {
      client_id:apiKey,
      client_secret:apiSecret,
      code:params.code
    };


    Shopify.post('/admin/oauth/access_token', postData, (err,data) => {
      if(err) {
        return sails.log.error({
          controller: 'shopify',
          action: 'sync_callback',
          error: err,
        })
      }

      let createShopParams = {name:params.shop,owner:params.state};

      sails.log.debug({
        controller: 'shopify',
        action: 'sync_callback',
        params: postData,
        data: data,
        createShopParams,
      })

      Shop.create(createShopParams).exec((err,createShop) => {

        let createData = {
          accessToken:data.access_token,
          scope:data.scope,
          shop:createShop.id
        }

        ShopifyToken.create(createData).exec((err,result)=> {
          if(err) {
            return sails.log.error({
              controller:'shopify',
              action:'ShopifyToken.create',
              error: err,
              params: createData,
            })
          }
          let Shopify = new ShopifyApi({
            shop: params.shop,
            shopify_api_key: apiKey,
            access_token: data.access_token
          });

          let orderCreateHook = {
            webhook: {
              "topic": "orders\/create",
              "address": `https:\/\/${baseUrl}\/notification\/order?act=create&shop=${params.shop}`, // Update new address when public
              "format": "json"
            }
          };
          Shopify.post('/admin/webhooks.json',orderCreateHook, (err,orderCreate) => {
            if(err){
              return sails.log.error({
                controller:'shopify',
                action:'/admin/webhooks.json',
                error: err,
                params: orderCreateHook,
              })
            }

          });


          let orderUpdateHook = {
            webhook: {
              "topic": "orders\/updated",
              "address": `https:\/\/${baseUrl}\/notification\/order?act=updated&shop=${params.shop}`, // Update new address when public
              "format": "json"
            }
          };
          Shopify.post('/admin/webhooks.json',orderUpdateHook, (err,orderUpdate) => {
            if(err){
              return sails.log.error({
                controller:'shopify',
                action:'/admin/webhooks.json',
                error: err,
                params: orderUpdateHook,
              })
            }
          });

          let productCreateHook = {
            webhook: {
              "topic": "products\/create",
              "address": `https:\/\/${baseUrl}\/notification\/product?act=create&shop=${params.shop}`, // Update new address when public
              "format": "json"
            }
          };
          Shopify.post('/admin/webhooks.json',productCreateHook, (err,productCreate) => {
            if(err){
              return sails.log.error({
                controller:'shopify',
                action:'/admin/webhooks.json',
                error: err,
                params: productCreateHook,
              })
            }
          });

          let productDeleteHook = {
            webhook: {
              "topic": "products\/delete",
              "address": `https:\/\/${baseUrl}\/notification\/product?act=delete&shop=${params.shop}`, // Update new address when public
              "format": "json"
            }
          };
          Shopify.post('/admin/webhooks.json',productDeleteHook, (err,productDelete) => {
            if(err){
              return sails.log.error({
                controller:'shopify',
                action:'/admin/webhooks.json',
                error: err,
                params: productDeleteHook,
              })
            }
          });

          let productUpdateHook = {
            webhook: {
              "topic": "products\/update",
              "address": `https:\/\/${baseUrl}\/notification\/product?act=update&shop=${params.shop}`, // Update new address when public
              "format": "json"
            }
          };
          Shopify.post('/admin/webhooks.json',productUpdateHook, (err,productUpdate) => {
            if(err){
              return sails.log.error({
                controller:'shopify',
                action:'/admin/webhooks.json',
                error: err,
                params: productUpdateHook,
              })
            }
          });

          let appUninstallHook = {
            webhook: {
              "topic": "app\/uninstalled",
              "address": `https:\/\/${baseUrl}\/notification\/app?act=uninstalled&shop=${params.shop}`, // Update new address when public
              "format": "json"
            }
          };
          Shopify.post('/admin/webhooks.json',appUninstallHook, (err,appUninstall) => {
            if(err){
              return sails.log.error({
                controller:'shopify',
                action:'/admin/webhooks.json',
                error: err,
                params: orderUpdateHook,
              })
            }
          });

          sails.log.debug({
            controller: 'shopify',
            action:'create_webhook',
            message: 'success',
            data: result,
          })

          res.redirect('/acp/store');
        });
      });
    });
  },



  custom:async(req,res)=> {
    let session_id = req.signedCookies['sails.sid'];
    // sails.sockets.join(req,session_id);
	  let params = req.allParams();
	  console.log(params);
    let findToken = await Promise.resolve(Shop.findOne({name: params.shop}).populate('shopifytoken'));
    var Shopify = new ShopifyApi({
      shop: params.shop,
      shopify_api_key: apiKey,
      access_token: findToken.shopifytoken[0].accessToken,
    });
    Shopify.get('/admin/custom_collections.json',function(err,data){
      sails.sockets.broadcast(session_id,'load/collection',{msg:data,pid:params.pid})
    })
  },
  update_address: (req,res)=>{
    let session_id = req.signedCookies['sails.sid'];
    let params = req.allParams();
    console.log('params update address')
    let updateData = {
      "order": {
        "id": params.orderid,
        "shipping_address": {
          "name": params.first_name+' '+params.last_name,
          "address1": params.address1,
          "address2": params.address2,
          "city": params.city,
          "zip": params.zip,
          "province": params.province,
          "country": params.country,
          "phone": params.phone
        }
      }
    }

    let shop = params.shop;
    Shop.findOne({name: shop}).populate('shopifytoken').exec((err,findToken)=>{
      const Shopify = new ShopifyApi({
        shop: shop,
        shopify_api_key: apiKey,
        access_token: findToken.shopifytoken[0].accessToken,
      });
      Shopify.put('/admin/orders/'+params.orderid+'.json',updateData,(err,data)=>{
        if(err) {
          res.json({result:'false',msg:err.error.shipping_address[0]})
          return false
        }
        // return res.json(data);
        Order.update({orderid:params.orderid},{shipping_address:data.order.shipping_address}).exec((err,resultUpdate)=>{
          if(err) console.log(err);
          let createData = {
            orderid:params.id,
            type: 'edit_address',
            data: {newValue:updateData.order.shipping_address,msg:'Shipping address updated'},
            owner: req.user.id
          }
          OrderAction.create(createData).exec((err,result)=>{
            if(err) return false;
            return res.json({result:'true'});
          })

        })
      })
    });

  },

  update_email: (req,res)=>{
    let { currentEmail, id, orderid, newEmail, shop } = req.allParams();
    let updateData = {
      "order": {
        "id": orderid,
        "email": newEmail
      }
    }
    Shop.findOne({name: shop}).populate('shopifytoken').exec((err,findToken)=>{
      const Shopify = new ShopifyApi({
        shop: shop,
        shopify_api_key: apiKey,
        access_token: findToken.shopifytoken[0].accessToken,
      });
      Shopify.put(`/admin/orders/${orderid}.json`,updateData, (err,data)=>{
        if(err) {
          console.log('err',err);
          return res.json({result:'false'})
        }
        Order.update({orderid:orderid},{email:data.order.email}).then((resultUpdate)=>{
          let createData = {
            orderid: id,
            type: 'edit_email',
            data: {currentEmail,newEmail,msg:'Email updated'},
            owner: req.user.id
          };
          OrderAction.create(createData).then((result)=>{
            return res.json({result:'true'})
          })
        }).catch((err)=>{
          console.log(err);
          return false;
        })
      })
    });

  },

  // add_discount: async(req,res) => {
  //   let params = req.allParams();
  //   let shops = await Shop.find();
  //   let {title,code,type,value,start,end} = params;
  //   // console.log('params', params);
  //   title = title.toUpperCase();
  //   code = code.toUpperCase();
  //
  //   Discount.create({title,code,type,value,start,end}).then((result)=>{
  //     // console.log('result', result);
  //     let postData = {
  //       "price_rule": {
  //         "title": title,
  //         "target_type": "line_item",
  //         "target_selection": "all",
  //         "allocation_method": "across",
  //         "value_type": type,
  //         "value": `-${value}`,
  //         "customer_selection": "all",
  //         "starts_at": start,
  //         "ends_at": end
  //       }
  //     }
  //
  //
  //     console.log('result', result);
  //
  //     shops.map((shop)=>{
  //       Shop.findOne({name: shop.name}).populate('shopifytoken').exec((err,findToken)=>{
  //         let Shopify = new ShopifyApi({
  //           shop: shop.name,
  //           shopify_api_key: apiKey,
  //           access_token: findToken.shopifytoken[0].accessToken,
  //         });
  //         Shopify.post(`/admin/price_rules.json`,postData, (err,data)=>{
  //           if(err) {
  //             console.log('err',err);
  //             return false;
  //           };
  //
  //
  //           let createDiscount = {
  //             "discount_code": {
  //               "code": code
  //             }
  //           }
  //           Shopify.post(`/admin/price_rules/${data.price_rule.id}/discount_codes.json`,
  //             createDiscount,(err,createResult)=>{
  //             if(err) {
  //               console.log(err);
  //               return false;
  //             }
  //
  //               Rules.create({
  //                 price_rule_id:data.price_rule.id,
  //                 shop:shop.name,
  //                 discount_id: result.id,
  //                 discount_code_id:createResult.discount_code.id
  //               }).then((createRules)=>{
  //                 console.log('create rules');
  //               }).catch((err)=>{
  //                 console.log('err', err);
  //               });
  //           })
  //         })
  //       });
  //     })
  //
  //     return res.json(result)
  //   }).catch((err)=>{
  //     console.log('err', err);
  //     return res.json(err)
  //   })
  //
  //
  //
  // },

  create_discount: async(req,res) => {
    let session_id = req.signedCookies['sails.sid'];
    let params = req.allParams();
    let shops = await Shop.find();
    let {title,type,value,category} = params;
    // console.log('params', params);
    title = title.toUpperCase();

    Discount.create({title,type,value,category}).then(async(result)=>{
      console.log('result', result);
      sails.sockets.broadcast(session_id,'create/discount',{result:'success',msg:'Created discount on system'});
      let findPost = await Post.find({category})
      sails.sockets.broadcast(session_id,'create/discount',{result:'info',msg:`Updating ${findPost.length} procut on system...`});

      findPost.map((post)=>{
        let productId = post.productid;
        let oldPrice = post.compare_at_price;
        let shop = post.store;
        let updatePrice;
        updatePrice = oldPrice - (oldPrice*(value/100))
        if(type == 'fixed_amount'){
          updatePrice = oldPrice - value;
        }

        Post.update({id:post.id},{price:updatePrice}).then(async(updatePrice)=>{
          if(productId.length > 0){
            await Promise.all(
              post.variants.map((variant)=>{
                variant.price = updatePrice;
              })
            )

            let putData = {
              "product": {
                "id": productId,
                "variants": post.variants
              }
            }

            let findToken = await Promise.resolve(Shop.findOne({name:shop}).populate('shopifytoken'));

            let shopifyAuth = {
              shop:shop,
              shopify_api_key: apiKey,
              access_token:findToken.shopifytoken[0].accessToken,
            };

            let apiConfig = {
              rate_limit_delay: 10000, // 10 seconds (in ms) => if Shopify returns 429 response code
              backoff: 5, // limit X of 40 API calls => default is 35 of 40 API calls
              backoff_delay: 2000 // 1 second (in ms) => wait 1 second if backoff option is exceeded
            };

            shopifyAuth = Object.assign(apiConfig, shopifyAuth);
            const Shopify = new ShopifyApi(shopifyAuth);

            let shopifyPostUrl = `/admin/products/${productId}.json`;
            const publisher = sails.hooks.kue_publisher;
            const publishData = {
              putData,
              shopifyPostUrl,
              shopifyAuth,
              title: shopifyAuth.shop
            };

            publisher.create('updateprice', publishData)
                     .priority('high')
                     // .searchKeys( ['title', 'putImg'] )
                     .attempts(30)
                     .backoff( { delay: 3 * 1000, type: 'fixed'} )
                     .on('complete', function(result){
                       console.log('update variant price Job completed with data ', result);
                     })
                     .removeOnComplete( true )
                     .ttl(600000)
                     .save();

          }
        })
      })

    }).catch((err)=>{
      console.log('err', err);
      sails.sockets.broadcast(session_id,'create/discount',{result:'erroe',msg:'Create discount failed'})
    })



  },

  edit_discount: async(req,res) => {
    let params = req.allParams();
    let {title,code,type,value,start,end,id} = params;
    title = title.toUpperCase();
    code = code.toUpperCase();
    console.log('params', params);

    let findRules = await Rules.find({discount_id:id});
    Discount.update({id},{title,code,type,value,start,end}).then((result)=>{
      console.log('result', result);
      let putData = {
        "price_rule": {
          "title": title,
          "value_type": type,
          "value": `-${value}`,
          "starts_at": start,
          "ends_at": end
        }
      }

      findRules.map((item)=>{
        Shop.findOne({name: item.shop}).populate('shopifytoken').exec((err,findToken)=>{
          let Shopify = new ShopifyApi({
            shop: item.shop,
            shopify_api_key: apiKey,
            access_token: findToken.shopifytoken[0].accessToken,
          });

          Shopify.put(`/admin/price_rules/${item.price_rule_id}.json`,putData,(err,data)=>{
            if(err) {
              console.log('err',err);
              return false;
            }

            Shopify.put(`/admin/price_rules/${item.price_rule_id}/discount_codes/${item.discount_code_id}.json`,
              {
                "discount_code": {
                  "id": item.discount_code_id,
                  "code": code,
                }
              }, (err,data)=>{
                if(err) {
                  console.log('err',err);
                  return false;
                }
              })
          })



        });
      });
      return res.json(result)
    }).catch((err)=>{
      console.log('err', err);
    })


  },

  delete_discount: async(req,res) => {
    let {id} = req.allParams();

    Discount.destroy({id}).then(async(result)=>{
      console.log('result', result);
      let findRules = await Rules.find({discount_id:id});
      console.log('findRules', findRules);

      findRules.map((item)=>{
        Shop.findOne({name: item.shop}).populate('shopifytoken').exec((err,findToken)=>{
          let Shopify = new ShopifyApi({
            shop: item.shop,
            shopify_api_key: apiKey,
            access_token: findToken.shopifytoken[0].accessToken,
          });

          Shopify.delete(`/admin/price_rules/${item.price_rule_id}.json`,(err,data)=>{
            if(err) {
              console.log('err',err);
              return false;
            }
            Rules.destroy({price_rule_id:item.price_rule_id}).then()
          })
        });
      })
      return res.json(result)
    }).catch((err)=>{
      console.log('err', err);
    })
  },

  delete_store: async(req,res) => {
    let {id,shop} = req.allParams();

    Shop.destroy({name:shop}).then(()=>{
      console.log('delete store', shop);
      return res.json({result:shop})
    });
  },

};

