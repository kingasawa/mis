// var sleep = require('sleep');
module.exports = {
  //job concurrency
  concurrency: 2, // * with scale instance
  perform: function(job, context, done) {
    // Domain wrapper to fix stuck active jobs
    const domain = require('domain').create();
    domain.on('error', function(err) { // help dont stuck as active job
      done(err);
    });

    // Main process function
    domain.run(function() {
      const { type, data } = job;
      const { shopifyAuth, shopifyPutUrl } = data;

      sails.log.debug('DeleteShopifyWorker', type, data);

      const Shopify = new ShopifyApi(shopifyAuth);

      Shopify.delete(shopifyPutUrl, (error, result) => {
        if (error) {
          sails.log.debug('DeleteShopifyWorker ERROR:', putData, error);
          throw new Error(error);
        }
        if (result) {
          sails.log.debug('DeleteShopifyWorker RESULT:', result);
          done(null, result);
        }
      })
    });

  }

};
