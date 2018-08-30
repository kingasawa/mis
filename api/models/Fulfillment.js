/**
 * Fulfillment.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    id: {
      type:'string',
      primaryKey: true,
      unique: true
    },
    order_id: {
      type:'string'
    },
    status: {
      type:'string'
    },
    service: {
      type:'string',
    },
    service_rate: {
      type: 'string'
    },
    tracking_company: {
      type: 'string'
    },
    shipment_status: {
      type: 'string'
    },
    tracking_number: {
      type: 'string'
    },
    tracking_numbers: {
      type: 'json'
    },
    tracking_url: {
      type: 'longtext'
    },
    tracking_urls: {
      type: 'json'
    },
    receipt: {
      type: 'json'
    },
    line_items: {
      type: 'json'
    },
    shipment_id: {
      type: 'string'
    },
    batch_id: {
      type: 'string'
    }
  }
};

