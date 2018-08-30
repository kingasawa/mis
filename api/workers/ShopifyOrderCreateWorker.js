module.exports = {
  //job concurrency
  concurrency: 5,
  perform: function(job, context, done) {
    // Domain wrapper to fix stuck active jobs
    const domain = require('domain').create();
    domain.on('error', function(err) { // help dont stuck as active job
      sails.log.error('ShopifyOrderCreateWorker:domain:error',err);
      done(err);
    });

    // Main process function
    domain.run(async () => {
      sails.log.debug('ShopifyOrderCreateWorker Run');
      return WebHook.Order(job, context, done);
    });
  }

};

// Create https://jsonblob.com/bb00e273-1f63-11e7-a0ba-8d8d7ddfe77d
// Update https://jsonblob.com/ce1427a9-1f63-11e7-a0ba-cfb75ade9733
