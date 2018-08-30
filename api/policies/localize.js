module.exports = function(req, res, next) {
  if(req.session.languagePreference){
    req.setLocale(req.session.languagePreference);
  }
  next();
};
