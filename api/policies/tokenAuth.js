module.exports = async function(req, res, next) {
  let token = _.get(req.headers, `['x-token']`);
  if(!token){
    return res.json(403, { msg: 'token missing' })
  }
  let validToken = await ApiToken.findOne({ token });

  console.log('TokenAuth', validToken);
  if(validToken){
    let { owner } = validToken;
    req.owner = owner;
    return next();
  }
  res.json(403, { msg: 'wrong token' })
};
