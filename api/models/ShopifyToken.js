

module.exports = {


  attributes: {
    accessToken: {
      type: 'string',
      required: true,
      unique: true,
    },
    scope: {
      type: 'string',
      required: true,
    },
    shop: {
      model: 'shop',
      unique: true,
      // index: true
    }
  }
};
