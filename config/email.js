var mg = require('nodemailer-mailgun-transport');

var auth = {
  auth: {
    api_key: 'key-c2e917db0ce38a931689df47c69754a0',
    domain: 'shipint.live'
  }
}

module.exports.email = {
  service: "Mailgun",
  templateDir: "views/emailTemplates",
  from: "noreply@shipint.com",
  testMode: false,
  ssl: true,
  transporter: mg(auth)
}
