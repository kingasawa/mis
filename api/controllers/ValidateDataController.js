/**
 * AboutUsController
 *
 * @description :: Server-side logic for managing aboutuses
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const { apiKey, apiSecret } = sails.config.shopify;

const easypostapi = 'VOlV03Gkzwt03ENcMBnbDQ';
const EasyPost = require('node-easypost');

const api = new EasyPost(easypostapi);

module.exports = {
  address: async (req, res) => {
    let params = req.allParams();
    console.log('params', params);
    let {sid,orderid,address1,address2,city,state,zipcode,country} = params;
    let findData = await ImportCache.findOne({sid});
    let fileData = findData.file_data;
    _.each(fileData ,(data)=>{

      if(data.orderid == orderid){
        data.address1 = address1;
        data.address2 = address2;
        data.city = city;
        data.state = state;
        data.zipcode = zipcode;
        data.country = country;
      }
    });

    const verifiableAddress = new api.Address({
      verify: ['delivery'],
      street1: address1,
      street2: address2,
      city: city,
      state: state,
      zip: zipcode,
      country: country
    });

    let validate;
    let checkAddress = await Promise.resolve(verifiableAddress.save());
    console.log('checkAddress.verifications',checkAddress.verifications );
    if(checkAddress.verifications.delivery.success === false){
      validate = 'false'
    } else {
      validate = 'true'
    }

    ImportCache.update({sid},{file_data:fileData}).exec((result)=>{
      return res.json({address:params,msg:validate});
    })
  },

  product: async(req,res) => {
    let params = req.allParams();
    let {color, size, newstyle, oldstyle, oldcolor, oldsize, orderid, sid, errorcode, errornumber} = params;
    let success = 'true';
    let findColor;
    let findSize;
    let findData = await ImportCache.findOne({sid});
    let fileData = findData.file_data;

    if (newstyle){
      let materialData = await Material.findOne({name:newstyle},{select: ['id']});
        if (!materialData) success = 'false';
        _.each(fileData ,(data)=>{
          if(data.number == errornumber){
            data.style = newstyle;
          }
        });
    } else {
      let materialData = await Material.findOne({name:oldstyle},{select: ['id']});
      let colorData = await MaterialColor.findOne({material:materialData.id});
      let sizeData = await MaterialSize.findOne({material:materialData.id});

      if (errorcode == '202') {
        findColor = _.find(colorData.color,{'name':`${color}`});
          if(!findColor) success = 'false';
          _.each(fileData ,(data)=>{
            if(data.number == errornumber){
              data.color = color;
            }
          });
      } else if (errorcode == '203') {
        findSize = _.find(sizeData.size,{'size':`${size}`});
        if(!findSize) success = 'false';
        _.each(fileData ,(data)=>{
          if(data.number == errornumber){
            data.size = size;
          }
        });
      } else if (errorcode == '204') {
        findColor = _.find(colorData.color,{'name':`${color}`});
        findSize = _.find(sizeData.size,{'size':`${size}`});
        if(!findColor || !findSize) success = 'false';
        _.each(fileData ,(data)=>{
          if(data.number == errornumber){
            data.color = color;
            data.size = size
          }
        });
      }
    }

    if(success == 'true'){
      ImportCache.update({sid},{file_data:fileData}).exec((result)=>{
        console.log('result',result);
        return res.json({msg:'true',errornumber:errornumber});
      })
    } else {
      return res.json({msg:'false',errornumber:errornumber});
    }


  },
};

