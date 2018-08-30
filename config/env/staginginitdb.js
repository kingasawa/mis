
module.exports = {
  hookTimeout: 3600000,
  connections: {
    nodeshopisPostgres: {
      adapter: 'sails-postgresql',
      host: 'staging-postgres-dbm',
      user: 'postgres', // optional
      password: 'nodeshopisX2017', // optional
      database: 'nodeshopis' //optional
    }
  },
  models: {
    migrate: 'alter',
    connection: 'nodeshopisPostgres'
  },
  bootstrap: (cb) => {
    sails.log.debug('Bootstrap:initdb:process.exit()');
    cb('InitDB ORM loaded!');//dont start app
    process.exit();
  },
  log: {
    // level: "silent"
    level: "debug"
  },
  // Only alterDB enabled
  hooks:  {
    babel: true,
    orm: true,
    auth: true,
    userhooks: true,
    logger: false,
    request: false,
    views: false,
    blueprints: false,
    responses: false,
    controllers: false,
    sockets: false,
    pubsub: false,
    policies: false,
    services: false,
    csrf: false,
    cors: false,
    i18n: false,
    userconfig: false,
    session: false,
    grunt: false,
    http: false,
    kue_publisher: false,
    kue_subscriber: false
  },
  port: 3002,
};

