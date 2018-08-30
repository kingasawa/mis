module.exports.kue_publisher = {
  //control activeness of publisher
  //its active by default
  active: true,

  // disableSearch: false,

  //default key prefix for kue in
  //redis server
  prefix: 'q',

  //default redis configuration
  redis: {
    //default redis server port
    port: 6379,
    //default redis server host
    host: 'redis'
  },
  //number of milliseconds
  //to wait
  //before shutdown publisher
  shutdownDelay: 5000
}
