/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
module.exports = async function(req, res, next) {
  const group = _.get(req, 'user.group'); //default is 0
  const { MANAGER } = _.get(sails, 'config.globals.group');

  if(req.user){
    console.log('req.cookie', req.cookies);
    let { r } = req.cookies;

    if(!r){
      res.cookie('r', '1', { maxAge: 43200000, httpOnly: true })
      let lastLogin = (new Date()).toString();
      let { id } = req.user;
      console.log('update id last login', id, lastLogin );
      await User.update(id, { last_login: lastLogin });
    }
  }

  if (req.session.authenticated &&
      group <= MANAGER // group 1,2,3 is ok
  ) {
    return next();
  }

  // User is not allowed
  // (default res.forbidden() behavior can be overridden in `config/403.js`)
  return res.redirect('/login?location=acp');
};
