var _ = require('lodash');
var _super = require('sails-authen/api/models/User');

_.merge(exports, _super);
_.merge(exports, {
  attributes: {
    shops: {
      collection: 'shop',
      via: 'owner'
    },


    products: {
      collection: 'product',
      via: 'owner'
    },

    posts: {
      collection: 'post',
      via: 'owner'
    },

    images: {
      collection: 'image',
      via: 'owner'
    },

    balance: {
      type: 'float',
      defaultsTo: 0
    },

    group: {
      type: 'integer',
      defaultsTo: 3,
      enum: [1, 2, 3], // 1: admin, 2: manager, 3: shipper
      index: true
    },
    auto_pay: {
      type: 'integer',
      defaultsTo: 1
    },
    last_login: {
      type: 'datetime'
    },
    payment_method: {
      type: 'string'
    },
    commission: {
      type: 'integer'
    },
    status: {
      type: 'string',
      defaultsTo: 'Active',
    },

    getGroupName: function () {
      const groupMap = {
        1: 'admin',
        2: 'manager',
        3: 'seller'
      }
      return groupMap[this.group];
    },
  }
});
