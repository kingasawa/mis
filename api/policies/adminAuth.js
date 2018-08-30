/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
module.exports = function(req, res, next) {
  const group = _.get(req, 'user.group'); //default is 0
  const { ADMIN } = _.get(sails, 'config.globals.group');

  if (req.session.authenticated &&
      group === ADMIN // allow for admin only (1)
  ) {
    return next();
  }

  // User is not allowed
  // (default res.forbidden() behavior can be overridden in `config/403.js`)
  return res.redirect('/login?location=acp');
};
