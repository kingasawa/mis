/**
 * Shop.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    title: {
      type: 'string',
      index: true,
      required: true,
      notNull: true
    },
    code: {
      type: 'string'
    },
    type: {
      type: 'string'
    },
    value: {
      type: 'float',
      index:true,
      required: true
    },
    start: {
      type: 'string',
      index:true,
    },
    end: {
      type: 'string',
      index:true
    },
    category: {
      type: 'string'
    }
  }
};

