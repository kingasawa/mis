/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
let { apiKey, apiSecret } = sails.config.shopify;

module.exports = async function(req, res, next) {
  if(sails.config.environment === 'staging'){ //staging
    let devConfig = require('../../config/env/development.js');
    sails.log.debug("hmacAuth devConfig", _.get(devConfig, 'shopify.apiSecret'));
    apiSecret = _.get(devConfig, 'shopify.apiSecret'); // hack for embbed app issue
  }
  // sails.log.debug("hmacAuth sails.config.environment", sails.config.environment);
  // sails.log.debug("hmacAuth apiSecret", apiSecret);
  // Support non logged in only
  if (!req.user) {
    let { timestamp, shop } = req.allParams();
    const isAuthentic = await ShopifyPrime.Auth.isAuthenticRequest(req.allParams(), apiSecret);

    if (isAuthentic) {
      sails.log.info("hmacAuth isAuthen req.allParams()", req.allParams());
      sails.log.info("hmacAuth isAuthen isAuthentic", isAuthentic);

      let currentTs = Date.now()/1000 | 0;
      sails.log.info("hmacAuth authen timstamp ago", currentTs - timestamp);
      let passedTime = currentTs - timestamp;
      if (passedTime < 60) { //1min valid for request authen

        let shopData = await Shop.findOne({ name: shop });
        let user = await User.findOne(shopData.owner);

        sails.log.info("hmacAuthshopData", shopData);
        sails.log.info("hmacAuth user", user);
        // let user = {};
        req.login(user, function(err) {
          if (err) {
            sails.log.warn(err);
            return res.send(403, err);
          }

          req.session.user = user;
          req.session.authenticated = true;

          if (req.query.next) {
            return res.status(302).set('Location', url);
          }

          sails.log.info('hmacAuth user', user, 'authenticated successfully');
        });

      }
    }else{
      sails.log.info('hmacAuth !isAuthentic');
    }

  }

  return next();
};
