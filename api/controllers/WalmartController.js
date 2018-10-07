/**
 * AboutUsController
 *
 * @description :: Server-side logic for managing aboutuses
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const request = require('request');
const apiKey = 'hu5rpk7mstvzqxnmmeu495x6'

module.exports = {
  getItem: async (req, res) => {
    let { id } = req.allParams()
    let result = await Walmart.getItem(id)
    console.log('result', result);

    res.json(result)
  }
};

