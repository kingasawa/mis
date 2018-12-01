module.exports = {

  attributes: {
    sid: {
      type: 'string',
      index: true
    },
    file_name: {
      type: 'string'
    },
    file_size: {
      type: 'integer'
    },
    file_data: {
      type: 'json'
    },
    owner: {
      type: 'integer',
      model: 'user'
    }

  }
};

