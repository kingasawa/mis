/**
 * Built-in Log Configuration
 * (sails.config.log)
 *
 * Configure the log level for your app, as well as the transport
 * (Underneath the covers, Sails uses Winston for logging, which
 * allows for some pretty neat custom transports/adapters for log messages)
 *
 * For more information on the Sails logger, check out:
 * http://sailsjs.org/#!/documentation/concepts/Logging
 */


var winston = require('winston');
var logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      json: true,
      level: 'silly',
      // rewriters: [
      //   (level, msg, meta) => {
      //     // meta.app = 'myApp';
      //     return meta;
      //   }
      // ],
      formatter: function(options) {
        // Return string will be passed to logger.
        options.teo = 'teo';
        console.log('options', options);
        return options;
      }
    })
  ],
  exitOnError: false
});

// A file based transport logging only errors formatted as json.
// customLogger.add(winston.transports.File, {
//   level: 'error',
//   filename: 'filename.log',
//   json: true
// });


module.exports.log = {

  // Pass in our custom logger, and pass all log levels through.
  custom: logger,
  // level: 'info',
  // Disable captain's log so it doesn't prefix or stringify our meta data.
  inspect: false
  /***************************************************************************
  *                                                                          *
  * Valid `level` configs: i.e. the minimum log level to capture with        *
  * sails.log.*()                                                            *
  *                                                                          *
  * The order of precedence for log levels from lowest to highest is:        *
  * silly, verbose, info, debug, warn, error                                 *
  *                                                                          *
  * You may also set the level to "silent" to suppress all logs.             *
  *                                                                          *
  ***************************************************************************/

  // level: 'info'

};
