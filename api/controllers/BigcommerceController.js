/**
 * ShopifyController
 *
 * @description :: Server-side logic for managing Shopifies
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const { baseUrl } = sails.config.globals
// const { apiKey, apiSecret } = sails.config.shopify;
const clientId = 'mj4okgolq7iovnn5iwddxlm7iouhd1l';
const clientSecret =  '8n6uzzgmb1g42cue0sd5vh2y8g8wgw6';
const BigCommerce = require('node-bigcommerce');

const bigCommerce = new BigCommerce({
  logLevel: 'info',
  clientId: clientId,
  secret: clientSecret,
  callback: `https://${baseUrl}/auth`,
  responseType: 'json',
  apiVersion: 'v3' // Default is v2
});

  //shopify app dev
// var apiKey = '5be0da665e61116428d9fc135b5d452a';
// var apiSecret =  '061120df23906afe20fd899e78147857';

module.exports = {

  sync: (req,res) => {
    let params = req.allParams();
    console.log('params', params);

    bigCommerce.authorize({
      scope: 'store_v2_orders_read_only store_v2_products_read_only users_basic_information store_v2_default',
      user: {
        id: 12345,
        username: 'John Smith',
        email: 'john@success.com'
      },
      context: 'stores/vnmmmm'
    }).then((data)=>{
      console.log('data', data);
    }).catch((error)=>{
      console.log('error', error);
    })

  },


	index: (req,res) => {
	  let params = req.allParams();
    console.log('params', params);
  },

  sync_callback: (req,res) => {
    let params = req.allParams();
    console.log('params', params);
  },


  oauth: async(req,res) => {
    let params = req.allParams();
    console.log('params', params);
    const bigCommerce = new BigCommerce();
    bigCommerce.authorize(req.query).then((data)=>{
      console.log('data', data);
    })

  },

  uninstall: async(req,res) => {
    let params = req.allParams();
    console.log('params', params);
  },

};

