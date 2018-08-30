let nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');

const auth = {
  auth: {
    api_key: 'key-c2e917db0ce38a931689df47c69754a0',
    domain: 'shipint.com'
  }
}

module.exports = {
    sendWelcomeMail: async (obj) => {
    sails.hooks.email.send("welcomeEmail", {
      Name: obj.name
    }, {
      to: obj.email,
      subject: "Welcome Email"
    }, function(err) {
      console.log(err || "Mail Sent!");
    })
  },

  sendFeedBack: async(obj) => {
      console.log('obj', obj);
    let nodemailerMailgun = nodemailer.createTransport(mg(auth));

    nodemailerMailgun.sendMail({
      from: `${obj.fullname} <${obj.email}>`,
      to: 'support@shipint.com', // An array if you have multiple recipients.
      subject: `Feedback - Order Number: ${obj.order}`,
      text: obj.question,
    }, function (err, info) {
      if (err) {
        console.log('Error: ' + err);
      }
      else {
        console.log('Response: ' + info);
      }
    });
  },
};
