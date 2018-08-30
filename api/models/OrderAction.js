module.exports = {
  attributes: {
    orderid: {
      type: 'string'
    },
    type: {
      type: 'string'
    },
    data: {
      type: 'json'
    },
    owner: {
      type: 'string',
      index: true
    }
  }
};
