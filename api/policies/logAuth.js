let { apiKey, apiSecret } = sails.config.shopify;

module.exports = async function(req, res, next) {
  let { controller, action } = req.options;
  let params = req.allParams();

  let userId = _.get(req, 'user.id', 0);

  let logData = {
    policies: 'logAuth',
    controller,
    action,
    params
  }
  logData.ip = req.ip;
  logData.sessionId = req.signedCookies['sails.sid'];

  if(userId){
    logData.userId = userId;
  }

  // sails.log.debug('req.headers', req.headers);
  // sails.log.debug('req.session', req.session);

  sails.log.debug(logData);

  return next();
};
