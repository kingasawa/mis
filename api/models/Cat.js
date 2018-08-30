/**
 * Invoice.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    name: {
      type: 'string'
    },
    parentid: {
      type: 'integer'
    },
    description: {
      type: 'longtext'
    },
    parentid: {
      type: 'integer'
    },
    discount_type: {
      type: 'string'
    },
    discount_value: {
      type: 'integer'
    },
    products: {
      collection: 'product',
      via: 'category'
    }
  }
};

