// var sleep = require('sleep');
module.exports = {
  //job concurrency
  concurrency: 10, // * with scale instance
  perform: function(job, context, done) {
    // Domain wrapper to fix stuck active jobs
    const domain = require('domain').create();
    domain.on('error', function(err) { // help dont stuck as active job
      done(err);
    });

    // Main process function
    domain.run(function() {
      const { type, data } = job;
      const { shopifyAuth, shopifyPutUrl, putImg } = data;
      // console.log('context', context);
      sails.log.debug('PushShopifyWorker', type, data);

      const Shopify = new ShopifyApi(shopifyAuth);

      Shopify.put(shopifyPutUrl, putImg, (error, result) => {
        if (error) {
          sails.log.debug('PushShopifyWorker Variants PUT ERROR:', putImg, error);
          throw new Error(error);
        }
        if (result) {
          sails.log.debug('PushShopifyWorker Variants PUT RESULT:', result);
          done(null, result);
        }
      })
    });

  }

};
