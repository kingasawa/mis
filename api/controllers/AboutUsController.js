/**
 * AboutUsController
 *
 * @description :: Server-side logic for managing aboutuses
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  index: async (req, res) => {
    let sampleDate = (new Date()).toString();
    let user = await Promise.resolve(User.find(1));

    console.log('user', user);

    let data = {
      currentDate: sampleDate,
      user
    };

    res.json(data);
    // return res.view('aboutUs', data)
  }
};

