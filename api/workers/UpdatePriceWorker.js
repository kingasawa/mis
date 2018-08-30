module.exports = {
  //job concurrency
  concurrency: 1,
  perform: function(job, context, done) {
    // Domain wrapper to fix stuck active jobs
    const domain = require('domain').create();
    domain.on('error', function(err) { // help dont stuck as active job
      console.log('UpdatePriceWorker:domain:error',err);
      done(err);
    });

    // Main process function
    domain.run(async () => {
      const { type, data } = job;
      const { shopifyAuth, shopifyPostUrl, putData } = data;

      console.log('Update price on shopify worker Run');

      const Shopify = new ShopifyApi(shopifyAuth);

      Shopify.put(shopifyPostUrl, putData, (error, result) => {
        if (error) {
          console.log('push product error', error);
          throw new Error(error);
        }
        if (result) {
          console.log('PushProductShopify Worker RESULT:', result);
          done(null, result);
        }
      })
    });
  }

};
