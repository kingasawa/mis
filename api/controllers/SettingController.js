/**
 * SettingController
 *
 * @description :: Server-side logic for managing aboutuses
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  // index:(req,res)=> {
  //   let newData = {
  //
  //     taxFee: 1,
  //     shippingFee: 1,
  //     printFee: 1,
  //   };
  //   Setting.create(newData).exec(function(err,result){
  //     console.log(result);
  //   })
  // },
  newset: (req, res) => {
    let params = req.allParams();
    console.log(params);
    Setting.update({id:1},params)
      .exec(function(err,updateResult){
      if (err) return res.negotiate(err);
      console.log(updateResult);
      return res.redirect('/acp/system');
    })
  }
};

