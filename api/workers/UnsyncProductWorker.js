module.exports = {
  //job concurrency
  concurrency: 1,
  perform: function(job, context, done) {
    // Domain wrapper to fix stuck active jobs
    const domain = require('domain').create();
    domain.on('error', function(err) { // help dont stuck as active job
      console.log('Un-SyncProductWorker:domain:error',err);
      done(err);
    });

    // Main process function
    domain.run(async () => {
      const { type, data } = job;
      const { shopifyAuth, shopifyPostUrl } = data;

      console.log('unsync product from shopify worker Run');

      const Shopify = new ShopifyApi(shopifyAuth);

      Shopify.delete(shopifyPostUrl, (error, result) => {
        if (error) {
          console.log('unsync product error', error);
          if(error.code == 403 && error.error == 'Contact support'){
            done(null)
          } else {
            throw new Error(error);
          }

        }
        if (result) {
          console.log('UnsyncProductShopify Worker RESULT:', result);
          done(null, result);
        }
      })
    });
  }

};
