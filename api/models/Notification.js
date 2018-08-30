/**
 * Notification.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    topic: {
      type: 'string'
    },
    address: {
      type: 'string'
    },
    notificationid: {
      model: 'shop'
    },
    shop: {
      model: 'shop',
      unique: true,
    }
  }
};

