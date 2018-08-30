import keyBy from 'lodash.keyby';
/**
 * Option.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    name: {
      type:'string',
      index: true,
      required:true
    },
    type: {
      type:'string',
      required:true,
      index: true
    },
    value: {
      type:'string',
      index: true,
      required:true
    },
    code: {
      type:'string',
      index: true
    },
    status: {
      type:'string',
      defaultsTo: 'show'
    }
  },
  getData: async () => {
    const ENABLE_CACHE = false;
    let cachePrefix = 'options';
    let cacheKey = `${cachePrefix}:optionsData:5`;
    let cachedData = await Cache.getAsync(cacheKey);

    let data = {};

    if(ENABLE_CACHE && cachedData){
      sails.log.debug("load material from cache");
      data = JSON.parse(cachedData);
    } else {
      let sizeData = await Option.find({type : 'size'});
      let colorData = await Option.find({type : 'color'});

      data.size = keyBy(sizeData, 'value');
      data.color = keyBy(colorData, 'name');

      data.sizeId = keyBy(sizeData, 'id');
      data.colorId = keyBy(colorData, 'id');

      let dataString = JSON.stringify(data);

      Cache.set(cacheKey, dataString, 'EX', 600);
    }
    return data;
  },
};

