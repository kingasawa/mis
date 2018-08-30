/**
 * Product.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    productId: {
      type: 'string',
      index: true,
    },
    shop: {
      type: 'string'
    },
    title: {
      type: 'string',
      index: true
    },
    body_html: {
      type: 'longtext'
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
    handle: {
      type: 'string'
    },
    published_at: {
      type: 'string'
    },
    template_suffix: {
      type: 'string'
    },
    published_scope: {
      type: 'string'
    },
    tags: {
      type: 'string'
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
    metafields_global_title_tag: {
      type: 'longtext'
    },
    metafields_global_description_tag: {
      type: 'longtext'
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
      type: 'integer',
      defaultsTo: 1,
      enum: [1, 2, 3], // 1: not, 2: active, 3: disable
      index: true
    },
    owner: {
      model: 'user',
      index: true,
      required: true,
      integer: true
    }

  },

};

