var express = require('express');
module.exports.express = {
  middleware: {
    custom: true
  },

  customMiddleware: function(app) {
    // serve static here
    app.use('/static', express.static('static'));
  }
  /*cache*/
  /** CACHE
   var cache = require('express-redis-cache')({
      host: 'localhost', port: 6379
    });

   app.get('*',
   cache.route({ expire: 120  }), // cache entry name is `cache.prefix + "/"`
   function (req, res, next)  {

      console.log('get cache');
        next()
      });
   */
};
