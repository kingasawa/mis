// var sleep = require('sleep');

const imageCacheSuffix = 'image'; //<variant>:image
const imageCacheExp = 86400 * 365; // 1year

module.exports = {
  //job concurrency
  concurrency: 1,
  perform: function(job, context, done) {

    // Domain wrapper to fix stuck active jobs
    const domain = require('domain').create();
    domain.on('error', function(err) { // help dont stuck as active job
      done(err);
    });

    // Main process function
    domain.run(async () => {
      const { type, data } = job;
      const { shopifyAuth, variant_id } = data;
      // sails.log.info('ShopifyImageWorker', type, data);

      const Shopify = new ShopifyApi(shopifyAuth);

      let imageUrl = await Cache.getAsync(`${variant_id}:${imageCacheSuffix}`)
      if(imageUrl !== null) { //imageUrl || imageUrl === 0|| imageUrl === "0"
        sails.log.info('ShopifyImageWorker load from cache variant_id:', variant_id);
        sails.log.info('ShopifyImageWorker load from cache, imageUrl:', imageUrl);
          return done(null, { src: imageUrl, variant_id });
      };

      Shopify.get(`/admin/variants/${variant_id}.json`, (variantErr, data) => {
        if (variantErr) {
          sails.log.info('Variants GET INFO ERROR:', variantErr);
          sails.log.debug('variantErr', variantErr.code);
          Cache.set(cacheKey, 0);
          Cache.expire(cacheKey, imageCacheExp);
          return done(null, { src: 0, variant_id }); //{ image: 0, message: 'image_id not found' }
          // throw new Error(variantErr);
        }
        sails.log.info('Variants GET INFO data:', data);
        let { variant: { image_id, product_id } } = data;

        let cacheKey = `${variant_id}:${imageCacheSuffix}`;
        if(!image_id) {
          Cache.set(cacheKey, 0);
          Cache.expire(cacheKey, imageCacheExp);
          return done(null, { src: 0, variant_id }); //{ image: 0, message: 'image_id not found' }
        }
        Shopify.get(`/admin/products/${product_id}/images/${image_id}.json`,(imageErr, imageData) => {
          if (imageErr) {
            Cache.set(`${variant_id}:${imageCacheSuffix}`, null, imageCacheExp)
            sails.log.info('Variants GET Image ERROR:', imageErr);
            throw new Error(imageErr);
          }
          const { image: { src } } = imageData;


          Cache.set(cacheKey, src);
          Cache.expire(cacheKey, imageCacheExp);

          return done(null, { src, variant_id });
        });
      });
    });

  }

};
