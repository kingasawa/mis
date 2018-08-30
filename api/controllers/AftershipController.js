/**
 * AboutUsController
 * tonypham8188@gmail.comUGlife123@
 * @description :: Server-side logic for managing aboutuses
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const http = require('http');
const apiKey = '22328965-7073-434b-a7a9-6c727695b399';
const Aftership = require('aftership')(apiKey);


module.exports = {
  couriers: async (req, res) => {
    Aftership.call('GET', '/couriers',(err, result)=> {
      console.log(Aftership.rate_limit);
      res.json({result})
    });
  },

  add_tracking: async(req,res) => {
    let {id,slug} = req.allParams()
    let postTracking = {
      "tracking": {
        "tracking_number": '5435345353',
        "title": "manual",
        "slug": "DHL"
      }
    }
    if(slug){
      postTracking.tracking.slug = slug
    }

    Aftership.call('POST', '/trackings' ,{body:postTracking}, (err, result)=> {
      console.log(Aftership.rate_limit);
      res.json({result})
    });
  },

  index: async(req,res) => {
    let params = req.allParams();
    console.log('params', params);

    // res.statusCode = 200;
    res.set({
      'Content-Type': 'application/json',
      'accept': '*/*'
    })
    res.ok({result:'success'})
  },
};

