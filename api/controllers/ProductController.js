import request from 'request';
// import keyby from 'lodash.keyby';
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


const apiKey = '06636a56f6226cc663470ee0e58b0623';
const apiSecret =  'e6648b8d4cf98043e99fd8fde6559c22';
const barcodelookupKey = 'gvua5ur4pw2hlz9qxqruza5hltt3m4'

module.exports = {
  index: (req, res) => {
    return res.notFound()
  },

  add_product: async(req,res) => {
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
    // console.log('categories', categories);

    let findBrand = await Brand.find();
    let findMerchant = await Merchant.find();
    return res.view('product/add',{findBrand,findMerchant,categories})
  },

  edit_product: async(req,res) => {
    let {id} = req.allParams();
    let post = await Post.findOne({id});

    //check own
    if(post.global === 0 && req.user.group === 3 && post.owner !== req.user.id){
      return res.forbidden()
    }

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

    console.log('post', post);
    return res.view('product/edit',{post,findBrand,findMerchant,categories})
  },

  add: async(req,res) => {
    let params = req.allParams();
    let {product,category,collections,brand,mpn,gtin,merchant,compare_at_price,
        global,price,option1,option2,option3,sku,weight,weight_unit,stock} = params;
    console.log('params', params);

    //editing ....
    // let status = 'Disabled';
    // if(product.images.length === 0 || gtin === 0){
    //   status = 'Error'
    // }

    if(compare_at_price.length === 0){
      compare_at_price = price;
    }

      product.owner = req.user.id;

      product.category = category;
      product.brand = brand;
      product.collections = collections;
      product.mpn = mpn;
      product.gtin = gtin;
      product.global = global;
      product.price = price;
      product.compare_at_price = compare_at_price;
      product.sku = sku;
      product.weight = weight;
      product.weight_unit = weight_unit;
      product.stock = stock;
      product.merchant = merchant;
      product.option1 = option1;
      product.option2 = option2;
      product.option3 = option3;
      // product.status = status;

      let findBrand = await Brand.findOne({name:brand})
        if(!findBrand){
         Brand.create({name:brand}).then((result)=>{
           console.log('add brand', result);
         })
        }

      Post.create(product).then((createPost)=>{
        res.json(createPost)
        console.log('create post done',createPost.id);
      }).catch((err)=>{
        res.json(err);
        console.log('err', err);
      })


    //   console.log('data', data);
    // })


  },

  edit: async(req,res) => {
    let params = req.allParams();
    let {id,product,category,collections,brand,mpn,gtin,merchant,compare_at_price,
      global,price,option1,option2,option3,sku,weight,weight_unit,stock} = params;
    console.log('params', params);

    //check own
    let findPost = await Post.findOne({id})

    product.owner = req.user.id;
    product.category = category;
    product.brand = brand;
    product.collections = collections;
    product.mpn = mpn;
    product.gtin = gtin;
    product.global = global;
    product.price = price;
    product.compare_at_price = compare_at_price;
    product.sku = sku;
    product.weight = weight;
    product.weight_unit = weight_unit;
    product.stock = stock;
    product.merchant = merchant;
    product.option1 = option1;
    product.option2 = option2;
    product.option3 = option3;

    let findBrand = await Brand.findOne({name:brand})
    if(!findBrand){
      Brand.create({name:brand}).then((result)=>{
        console.log('add brand', result);
      })
    }

    console.log('findPost', findPost);
    let discount = parseFloat(price)*0.15
    if(findPost.productid && findPost.productid.length > 0 ){
      let findProduct = await Product.findOne({productId:findPost.productid});
      await Promise.all(
        findProduct.variants.map((variant)=>{
          variant.inventory_quantity = stock;
          variant.price = parseFloat(price) - discount
          variant.compare_at_price = price
        })
      )
      let shop = findProduct.shop;
      let findToken = await Promise.resolve(Shop.findOne({name:shop}).populate('shopifytoken'));
      let shopifyAuth = {
        shop:shop ,
        shopify_api_key:  apiKey,
        access_token: findToken.shopifytoken[0].accessToken,
      };
      let apiConfig = {
        rate_limit_delay: 10000, // 10 seconds (in ms) => if Shopify returns 429 response code
        backoff: 5, // limit X of 40 API calls => default is 35 of 40 API calls
        backoff_delay: 2000 // 1 second (in ms) => wait 1 second if backoff option is exceeded
      };
      shopifyAuth = Object.assign(apiConfig, shopifyAuth)
      const Shopify = new ShopifyApi(shopifyAuth);
      let putData = {
        "product": {
          "id": findPost.productid,
          "variants": findProduct.variants
        }
      }

      Shopify.put(`/admin/products/${findPost.productid}.json`,putData,(err,data)=>{
        if(err) console.log('err', err);
      })
    }

    Post.update({id},product).then((updatePost)=>{
      res.json(updatePost);
      console.log('update post done',updatePost.id);
    }).catch((err)=>{
      res.json(err)
      console.log('err', err);
    })
    // console.log('data', data);
    // })
  },

  delete: async(req,res) => {
    let {id} = req.allParams();
    console.log('delete post id', id);
    Post.update({id},{status:'Disabled'})
        .then(success => res.json({success}))
        .catch(error => res.json({error}) )

  },

  datatable: async(req, res) => {
    bluebird.promisifyAll(Post);

    var tableDefinition = {
      dbType: 'postgres',
      sSelectSql: `id,title,price,status,images`,
      sTableName: 'public.post',
      sWhereAndSql: ``,
      aSearchColumns: ['id','title','status']
    };

    let queryParams = req.allParams();
    let queryBuilder = new QueryBuilder(tableDefinition);
    let queries = queryBuilder.buildQuery(queryParams);


    /** fix "createdAt" search issue **/
    let newQueries = {};

    _.each(queries, (value, key) => {newQueries[key] = value.replace( /([a-z]{1,})([A-Z][a-z]{1,})\b/g, '"$1$2"' );})
    queries = newQueries;

    console.log('queries', JSON.stringify(queries, null, 4));
    /** fix "createdAt" search issue **/

      // sails.log.debug("SCP:Order:Datatables", queries);
    let recordsFiltered;
    if (queries.recordsFiltered) {
      recordsFiltered = await (Post.queryAsync(queries.recordsFiltered));
      recordsFiltered = recordsFiltered.rows;
    }

    let recordsTotal = await (Post.queryAsync(queries.recordsTotal));
    recordsTotal = recordsTotal.rows;

    // let newSelect = knex.with('userDatatable',knex.raw(queries.select))
    //                     .from('userDatatable')
    // console.log('newSelect', newSelect.toString());

    let select = await (Post.queryAsync(queries.select));
    select = select.rows;

    let results = {
      recordsTotal,
      select
    };
    if (recordsFiltered) {
      results.recordsFiltered = recordsFiltered;
    }

    res.json(queryBuilder.parseResponse(results));
  },

  sync: async(req,res) => {
    const session_id = req.signedCookies['sails.sid'];
    let discount = 15;
    discount = discount/100
    let {selectedProducts,shop} = req.allParams();

    selectedProducts.map(async(productid)=>{
      let findPost = await Post.findOne({id:productid})
      let syncData = {
        "product": {
          "title": findPost.title,
          "body_html": findPost.body_html,
          "vendor": findPost.brand,
          "product_type": findPost.product_type,
          "tags": findPost.tags,
          "published": true,
          "options": findPost.options,

          "variants": findPost.variants,
          "images": findPost.images
        }
      }
      console.log('findPost', findPost);

      findPost.variants.map((item)=>{
        let discountPrice = item.compare_at_price*discount
        item.price = Math.ceil(item.compare_at_price - discountPrice) - 0.01
      })

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


      let shopifyPostUrl = `/admin/products.json`;

      console.log('syncData', syncData);
      const publisher = sails.hooks.kue_publisher;
      const publishData = {
        syncData,
        shopifyPostUrl,
        shopifyAuth,
        title: shopifyAuth.shop
      };

      // sails.log.debug("syncData", syncData);

      //publish send confirmation email
      publisher.create('syncproduct', publishData)
               .priority('high')
               // .searchKeys( ['title', 'putImg'] )
               .attempts(1)
               .backoff( { delay: 3 * 1000, type: 'fixed'} )
               .on('complete', function(result){
                 console.log('Sync product Job completed with data ', result);
                 Post.update({id:productid},{
                   store:shop,
                   productid: result.product.id,
                   status: 'Synced'
                 }).then((resultPush)=>{
                   console.log('resultPush', resultPush);
                   sails.sockets.broadcast(session_id, 'pushto/shopify', { resultPush })
                 }).catch((err)=>{
                   console.log('err', err);
                 })

               })
               .removeOnComplete( true )
               .ttl(600000)
               .save();
    })
  },

  unsync: async(req,res) => {
    const session_id = req.signedCookies['sails.sid'];
    let {selectedProducts} = req.allParams();

    selectedProducts.map(async(productid)=>{
      let findPost = await Post.findOne({id:productid})

      let findToken = await Promise.resolve(Shop.findOne({name:findPost.store}).populate('shopifytoken'));

      let shopifyAuth = {
        shop:findPost.store,
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


      let shopifyPostUrl = `/admin/products/${findPost.productid}.json`;

      const publisher = sails.hooks.kue_publisher;
      const publishData = {
        shopifyPostUrl,
        shopifyAuth,
        title: shopifyAuth.shop
      };

      // sails.log.debug("syncData", syncData);

      //publish send confirmation email
      publisher.create('unsyncproduct', publishData)
               .priority('high')
               // .searchKeys( ['title', 'putImg'] )
               .attempts(30)
               .backoff( { delay: 3 * 1000, type: 'fixed'} )
               .on('complete', function(result){
                 console.log('Sync product Job completed with data ', result);
                 Post.update({id:productid},{
                   store:'',
                   productid: '',
                   status: 'Unsync'
                 }).then((resultPush)=>{
                   console.log('resultPush', resultPush);
                   sails.sockets.broadcast(session_id, 'unsync/shopify', { resultPush })
                 }).catch((err)=>{
                   console.log('err', err);
                 })

               })
               .removeOnComplete( true )
               .ttl(600000)
               .save();
    })
  },

  restock: async(req,res) => {
    const session_id = req.signedCookies['sails.sid'];
    let {selectedProducts} = req.allParams();

    selectedProducts.map(async(productid)=>{
      let findPost = await Post.findOne({id:productid})

      findPost.variants.map((variant)=>{
        variant.inventory_quantity = 5
      })

      let syncData = {
        "product": {
          "variants": findPost.variants,
        }
      }

      if(findPost.store){
        console.log('store', findPost.store);
        let findToken = await Promise.resolve(Shop.findOne({name:findPost.store}).populate('shopifytoken'));

        let shopifyAuth = {
          shop:findPost.store,
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


        let shopifyPostUrl = `/admin/products/${findPost.productid}.json`;

        const publisher = sails.hooks.kue_publisher;
        const publishData = {
          syncData,
          shopifyPostUrl,
          shopifyAuth,
          title: shopifyAuth.shop
        };

        // sails.log.debug("syncData", syncData);

        //publish send confirmation email
        publisher.create('restockproduct', publishData)
                 .priority('high')
                 // .searchKeys( ['title', 'putImg'] )
                 .attempts(30)
                 .backoff( { delay: 3 * 1000, type: 'fixed'} )
                 .on('complete', function(result){
                   console.log('Restock product Job completed with data ', result);
                   Post.update({id:productid},{
                     stock:5
                   }).then((resultPush)=>{
                     console.log('resultPush', resultPush);
                     sails.sockets.broadcast(session_id, 'restock/shopify', { resultPush })
                   }).catch((err)=>{
                     console.log('err', err);
                   })

                 })
                 .removeOnComplete( true )
                 .ttl(600000)
                 .save();
      } else {
        Post.update({id:productid},{stock:5}).exec((updateSuccess)=>{
          console.log('updated stock');
        })
      }

    })
  },

  get_gtin: async(req,res) => {
    let {id} = req.allParams();
    let productData = await Post.findOne({id});
    let {title,brand,mpn} = productData;
    console.log('product data', {title,brand,mpn});
    mpn = mpn.toLowerCase();
    let url = `https://www.barcodelookup.com/restapi?mpn=${mpn}&key=${barcodelookupKey}`

    request.get({url},async(error,response,body) => {
      if(error) {
        console.log('err', error);
        return false;
      }

      let items = [];
      let getData = JSON.parse(body);
      if(getData.result[0].barcode === null){
        return res.json({error:'product not found'})
      }
      await Promise.all(
        getData.result.map((item)=>{
          item.details.manufacturer_part_number = item.details.manufacturer_part_number.toLowerCase();
          if(item.details.manufacturer_part_number == mpn){
            items.push({
              barcode:item.barcode,
              type: item.type,
              product_name: item.details.product_name,
              mpn: item.details.manufacturer_part_number,
              manufacturer: item.details.manufacturer,
              brand: item.details.brand,
              images: item.images
            });
          }
        })
      );

      if(items.length === 0){
        return res.json({error:'product not found'})
      }

      return res.json(items)

    })

  },

  update_gtin: async(req,res) => {
    let {id,barcode} = req.allParams();
    let findPost = await Post.findOne({id});
    // Post.update({id},{gtin:barcode}).then(async(result)=>{
    //
    //   return res.json(result)
    // }).catch((err)=>{
    //   return res.json(err)
    // })

    await Promise.all(
      findPost.variants.map((variant)=>{
        variant.barcode = barcode;
      })
    )
    Post.update({id},{gtin:barcode,variants:findPost.variants}).then((result)=>{
      return res.json(result)
      console.log('update success', id);
    }).catch((err)=>{
      return res.json(err)
      console.log('update fail', id);
    })
  },

  sync_gtin: async(req,res) => {
    let findPost = await Post.find({gtin: { '!' : 'null' }});
    console.log('find', findPost.length);

    let count = findPost.length;
    findPost.map(async(post)=>{
      count -= 1;
      console.log('count', count);
      let findGtin = post.gtin;
      let postId = post.id

        await Promise.all(
          post.variants.map((variant)=>{
            variant.barcode = findGtin;
          })
        )
        Post.update({id:post.id},{variants:post.variants}).then((result)=>{
          console.log('update success', post.id);
        }).catch((err)=>{
          console.log('update fail', post.id);
        })
    });
    res.send(200);
  },

  check_miss_gtin: async(req,res) => {
    let findPost = await Post.find({gtin: { '!' : 'null' }});
    // console.log('find', findPost.length);

    let count = findPost.length;
    findPost.map(async(post)=>{
      count -= 1;
      // console.log('count', count);
      let findGtin = post.gtin;
      let postId = post.id

      await Promise.all(
        post.variants.map((variant)=>{
          if(variant.barcode === null){
            console.log('miss', post.id);
          }else {
            console.log('yes',count);
          }
        })
      )

    });
    res.send(200);
  },

};

