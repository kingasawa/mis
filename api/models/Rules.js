/**
 * Shop.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    price_rule_id: {
      type: 'string',
      index: true,
      required: true,
      notNull: true
    },
    discount_code_id: {
      type: 'string'
    },
    shop: {
      type: 'string',
      index:true,
      required: true
    },
    discount_id: {
      type: 'integer',
      required: true
    }
  }
};

