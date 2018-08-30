/**
 * Product.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    title: {
      type: 'string',
      index: true
    },
    body_html: {
      type: 'longtext'
    },
    store:{
      type: 'string'
    },
    compare_at_price: {
      type: 'float'
    },
    price: {
      type: 'float'
    },
    sku: {
      type: 'string'
    },
    stock: {
      type: 'integer',
      defaultsTo: 0,
    },
    weight: {
      type: 'float',
      defaultsTo: 0,
    },
    weight_unit: {
      type: 'string'
    },
    vendor: {
      type: 'string',
      index: true
    },
    brand: {
      type: 'string'
    },
    mpn: {
      type: 'string'
    },
    gtin: {
      type: 'string'
    },
    merchant: {
      type: 'json'
    },
    collections: {
      type: 'string'
    },
    product_type: {
      type: 'string',
      index: true
    },
    tags: {
      type: 'string'
    },
    option1: {
      type: 'string'
    },
    option2: {
      type: 'string'
    },
    option3: {
      type:'string'
    },
    variants: {
      type: 'json'
    },
    options: {
      type: 'json'
    },
    images: {
      type: 'json'
    },

    category: {
      model: 'cat',
      index: true,
      type: 'string'
    },
    global: {
      type: 'integer',
      defaultsTo: 1,
      enum: [0,1], // 0: private, 1:global
      index: true
    },
    status: {
      type: 'string',
      defaultsTo: 'Unsync', //NOT , ACTIVE , DISABLE
      // enum: [1, 2, 3], // 1: not, 2: active, 3: disable
      index: true
    },
    productid:{
      type: 'string'
    },
    owner: {
      model: 'user',
      index: true,
      required: true,
      integer: true
    }

  },

};

