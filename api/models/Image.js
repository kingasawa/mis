module.exports = {
  attributes: {
    id: {
      type: 'string',
      primaryKey: true
    },
    name: {
      type: 'string',
      index: true
    },
    type: {
      type: 'integer',
      defaultsTo: 1,
      index: true,
      enum: [1, 2, 3, 4, 5, 6, 7, 8, 9], // 1: design
    },
    owner: {
      model: 'user',
      required: true,
      index: true,
      integer: true
    }
  }
};

