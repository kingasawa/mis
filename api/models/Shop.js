/**
 * Shop.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    name: {
      type: 'string',
      index: true,
      required: true,
      notNull: true
    },
    // products: {
    //   collection: 'product',
    //   via: 'shop',
    //   dominant: true
    // },
    // No ref here
    shopifytoken: {
      collection: 'shopifytoken',
      via: 'shop',
      // dominant: true
    },
    // Ref
    owner: {
      model: 'user',
      required: true,
      index: true,
      integer: true
    },
    notifications: {
      collection: 'notification',
      via: 'shop'
    }
  }
};

