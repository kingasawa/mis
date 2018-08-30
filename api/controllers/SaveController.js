/**
 * SaveController
 *
 * @description :: Server-side logic for managing aboutuses
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  campaign: (req, res) => {
    let params = req.allParams();
    params.owner = req.session.user.id;
    let session_id = req.signedCookies['sails.sid'];
    SaveCampaign.create(params).exec((err,result) => {
      sails.log.debug("save settings create result", result);
      sails.sockets.broadcast(session_id,'save/campaign',{data:result.id})
    })
  },
  delete: (req,res)=> {
    let params = req.allParams();
    params.owner = req.session.user.id;
    let session_id = req.signedCookies['sails.sid'];
    SaveCampaign.destroy(params).exec((err,result)=>{
      sails.log.debug("save settings delete result", result);
      if(!err) return res.send(200)
    })
  },
  update: (req,res)=> {
    let params = req.allParams();
    params.owner = req.session.user.id;
    let session_id = req.signedCookies['sails.sid'];
    console.log('Save Update params', params);
    SaveCampaign.update(params.id, params).exec((err,result)=>{
      sails.log.debug("save settings update result", result);
      if(!err) return res.send(200)
    })
  },

  // get: (req,res) => {
  //   let params = req.allParams();
  //   SaveCampaign.findOne(params.id).exec((err,foundSave) => {
  //     res.view('scp/view-save',foundSave);
  //   })
  // },

  /*
  get: async(req,res) => {
    let params = req.allParams();
    let owner = req.user.id;

    let getSave = await Promise.resolve(SaveCampaign.findOne({ id: params.id, owner }));
    let foundSave = await Promise.resolve(SaveCampaign.find({owner:req.session.user.id}));
    let getFee = await Promise.resolve(Setting.findOne({ select: ['taxFee','shippingFee'], id: 1 }));
    let allDesign = await Promise.resolve(Design.find({owner:req.session.user.id}));
    let foundShop = await Promise.resolve(Shop.find({owner:req.session.user.id}));
    Material.find({sort:'id ASC'})
      .populate('size')
      .populate('color')
      .populate('image')
      .populate('cost')
      .populate('config')
      .exec(function(err,foundMaterial){
        if (err) return res.negotiate(err);
        console.log(getSave);
        return res.view('scp/view-save',{getSave,foundSave,foundMaterial,allDesign,foundShop,getFee});
      });

  },
  */


};

