/**
 * AboutUsController
 *
 * @description :: Server-side logic for managing aboutuses
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

import request from 'request';
// import keyby from 'lodash.keyby';
const { apiKey, apiSecret } = sails.config.shopify;
import replace from 'lodash.replace';
import uuidv4 from 'uuid/v4';
import keyby from 'lodash.keyby';
import sumby from 'lodash.sumby';
import sanitizer from 'sanitizer';
import concat from 'lodash.concat';
import fill from 'lodash.fill';
import moment from 'moment';
import lzma from 'lzma';


// const apiKey = '9ecfc20ce93ac92b9d146486441c6e7f';
// const apiSecret =  '29279b2a2026e3092f3daa4cb93362bf';

module.exports = {
  //update compare_at_price
  update_price: async (req, res) => {
    let findPost = await Post.find();
    findPost.map((post)=>{
      let currentPrice = post.price;
      let discount = currentPrice*0.15
      let updatePrice = currentPrice-discount;
      Post.update({id:post.id},
        { price:updatePrice,
          compare_at_price:currentPrice
        }).then((result)=>{
          console.log('update price', post.id);
      })
    })
    res.send(200);
  },

  update_price_int: async(req,res) => {
    let findPost = await Post.find();
    findPost.map((post)=>{
      let price = post.price;
      price = parseInt(price)-0.01;
      Post.update({id:post.id},
        {price}).then((result)=>{
        console.log('update price', post.id);
      })
    })
    res.send(200)
  },

  update_variant_price: async(req,res) => {
    let findPost = await Post.find();
    findPost.map(async(post)=>{
      await Promise.all(
        post.variants.map((variant)=>{
          variant.price = post.price;
          variant.compare_at_price = post.compare_at_price;
        })
      )
      Post.update({id:post.id},{variants:post.variants}).then((result)=>{
        console.log('update variant', post.id);
      })

    })
    res.send(200)
  },

  update_price_shopify: async(req,res) => {
    let shop = 'amaris-mart.myshopify.com';
    let findProduct = await Product.find();
    // console.log('findProduct', findProduct);
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

      findProduct.map(async(product)=>{
        Post.findOne({productid:product.productId}).then(async(result)=>{
          if(!result){
            return false;
          }
          await Promise.all(
            product.variants.map((variant)=>{
              variant.price = result.price;
              variant.compare_at_price = result.compare_at_price
            })
          )

          let putData = {
            "product": {
              "id": product.productId,
              "variants": product.variants
            }
          }
          let shopifyPostUrl = `/admin/products/${product.productId}.json`;
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

        })
      })


    res.send(200)

  },

  cancel_fulfillment: async(req,res) => {
    let shop = 'amaris-mart.myshopify.com';
    let orderid = '380272574498'
    let fulfillmentid = '364727468066'
    // console.log('findProduct', findProduct);
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

    Shopify.post(`/admin/orders/${orderid}/fulfillments/${fulfillmentid}/cancel.json`,{}, (err,data) => {
      if (err) {
        console.log('err', err);
      }
    })
    res.send(200)
  },
};

