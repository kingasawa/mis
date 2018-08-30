const fs = require('fs');
const download = require('download');


module.exports = {
  url: (url, dest = 'static/pdf') => {
    const options = { timeout: 30000 };
    download(url, dest, options).then(() => {
      sails.log.info("Downloaded %s to %s", url, dest);
    });
  }
}
// //example
// Download.url(url, fileLocation)
//   .then( ()=> console.log('downloaded file no issues...'))
//   .catch( e => console.error('error while downloading', e));
