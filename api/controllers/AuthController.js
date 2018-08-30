/**
 * Authentication Controller
 */
module.exports = {

  index: async (req, res) => {
    if(req.isAuthenticated()){
      const { session } = req
      // console.log('req', req);
      const roles = await User.findOne(session.user.id).populate('roles')
                              .then(function (user) {
                                console.log('roles', user.roles);
                                return user.roles;
                              });

      const isAdmin = await User.findOne(session.user.id).populate('roles', {
        where: {
          name: 'admin'
        },
        limit: 1
      }).then(function (user) {
        // @todo check is admin then return?
        return user.roles;
      });

      return res.json({
        roles,
        isAdmin,
        session: req.session
      });
    }

    res.redirect(req.query.next || '/login');
  },
  /**
   * Log out a user and return them to the homepage
   *
   * Passport exposes a logout() function on req (also aliased as logOut()) that
   * can be called from any route handler which needs to terminate a login
   * session. Invoking logout() will remove the req.user property and clear the
   * login session (if any).
   *
   * For more information on logging out users in Passport.js, check out:
   * http://passportjs.org/guide/logout/
   *
   * @param {Object} req
   * @param {Object} res
   */
  logout: function (req, res) {
    req.session.passport = {}
    req.session.user = {}

    req.session.authenticated = false;
    req.logout();
    if (!req.isSocket) {
      res.redirect(req.query.next || '/login');
    }
    else {
      res.ok();
    }
  },

  /**
   * Create a third-party authentication endpoint
   *
   * @param {Object} req
   * @param {Object} res
   */
  provider: function (req, res) {
    // Quick hack for no logout needed -> quick authen with all service
    req.session.passport = {}
    req.session.user = {}
    req.session.authenticated = false;
    sails.services.passport.endpoint(req, res);
  },

  /**
   * Create a authentication callback endpoint
   *
   * This endpoint handles everything related to creating and verifying Pass-
   * ports and users, both locally and from third-aprty providers.
   *
   * Passport exposes a login() function on req (also aliased as logIn()) that
   * can be used to establish a login session. When the login operation
   * completes, user will be assigned to req.user.
   *
   * For more information on logging in users in Passport.js, check out:
   * http://passportjs.org/guide/login/
   *
   * @param {Object} req
   * @param {Object} res
   */
  callback: function (req, res) {
    let action = req.param('action');
    let location = 'acp'
    // const location = _.get(req.allParams(), 'location', 'scp');
    function negotiateError (err) {

      // Support Socket
      if(req.isSocket){
        const { error } = req.flash();
        console.log('error', error);
        return res.send(403, { error });
      }

      if (action === 'register') {
        res.redirect('/register');
      }
      else if (action === 'login') {
        res.redirect('/login');
      }
      else if (action === 'disconnect') {
        res.redirect('back');
      }
      else {
        // make sure the server always returns a response to the client
        // i.e passport-local bad username/email or password
        res.send(403, err);
      }
    }

    sails.services.passport.callback(req, res, function (err, user) {
      if (err || !user) {
        sails.log.warn(user, err);
        return negotiateError(err);
      }

      req.login(user, function (err) {
        console.log('user login', user);
        if (err) {
          sails.log.warn(err);
          return negotiateError(err);
        }

        req.session.user = user;
        req.session.authenticated = true;

        if(user.group === 3){
          location = 'scp';
        }
        // Support socket
        if(req.isSocket){
          return res.json({
            user,
            location
          });
        }

        // Upon successful login, optionally redirect the user if there is a
        // `next` query param
        if (req.query.next) {
          let url = sails.services.authservice.buildCallbackNextUrl(req);
          res.status(302).set('Location', url);
        }

        sails.log.info('user', user, 'authenticated successfully');
        return res.json(user);
      });
    });
  },

  /**
   * Disconnect a passport from a user
   *
   * @param {Object} req
   * @param {Object} res
   */
  disconnect: function (req, res) {
    sails.services.passport.disconnect(req, res);
  }
};
