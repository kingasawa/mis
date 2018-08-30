const json2csv = require('json2csv');
const moment = require('moment');
const _ = require('lodash');
const fs = require('fs');

const CACHE_CSV_FILE_ENABLED = false;

module.exports = function sendCSV (data) {
  // let req = this.req;
  let res = this.res;
  // let sails = req._sails;
  let { filename = 'gearment', prefix = 'feeds-'  } = data;
  let csv = json2csv(data);
  let csvFilename = prefix + filename + '-' + moment().format("YYYYMMDDHHmm") + ".csv";
  let csvPath = `${process.cwd()}/csv/${csvFilename}`;

  // Load cached file
  if(CACHE_CSV_FILE_ENABLED === true){
    if (fs.existsSync(csvPath)) {
      fs.readFile(csvPath, 'utf8', function (err, data) {
        res.attachment(csvFilename);
        return res.end(data, 'UTF-8');
      })
      return;
      // return res.json({ msg: 'existed' });
    }

    fs.writeFile(csvPath, csv, function(err) {
      if (err) throw err;
      sails.log.debug('File saved:', csvPath);
      res.attachment(csvFilename);
      res.end(csv, 'UTF-8');
    });
  }else{
    res.attachment(csvFilename);
    res.end(csv, 'UTF-8');
  }

  // console.log('res json');
  // res.json({});
  // json2csv(data, function(err, csv) {
  //   if (err) console.log(err);
  //   res.attachment(csvFilename);
  //   res.end(csv, 'UTF-8');
  // });
};
