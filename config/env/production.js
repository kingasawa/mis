/**
 * Production environment settings
 *
 * This file can include shared settings for a production environment,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

module.exports = {

  /***************************************************************************
   * Set the default database connection for models in the production        *
   * environment (see config/connections.js and config/models.js )           *
   ***************************************************************************/

  // models: {
  //   connection: 'someMysqlServer'
  // },
  globals: {
    baseUrl: 'shipint.live'
  },
  connections: {
    nodeshopisPostgres: {
      adapter: 'sails-postgresql',
      host: 'postgres-dbm',
      user: 'postgres', // optional
      password: 'nodeshopisX2017', // optional
      database: 'nodeshopis' //optional
    }
  },

  models: {
    migrate: 'safe',
    // migrate: 'drop',
    connection: 'nodeshopisPostgres'
  },

  port: process.env.PORT || 3000,

  session: {
    adapter: 'connect-redis',
    host: 'redis',
    port: 6379,
    ttl: 60*60*24*7,
    db: 4,
    pass:  '',
    prefix: 'sess:',
  },
  ssl: {
    ca: require('fs').readFileSync(require('path').resolve(__dirname,'../../docker/nginx/certs/beta/ca_bundle.crt')),
    key: require('fs').readFileSync(require('path').resolve(__dirname,'../../docker/nginx/certs/beta/private.key')),
    cert: require('fs').readFileSync(require('path').resolve(__dirname,'../../docker/nginx/certs/beta/certificate.crt'))
  },

  /***************************************************************************
   * Set the port in the production environment to 80                        *
   ***************************************************************************/

  /***************************************************************************
   * Set the log level in production environment to "silent"                 *
   ***************************************************************************/

  log: {
    // level: "silent"
    level: "debug"
  },
  kue_subscriber: {
    redis: {
      // No DB select here
      port: 6379,
      host: 'redis',
    },
  },
  kue_publisher: {
    redis: {
      // No DB select here
      port: 6379,
      host: 'redis',
    },
  },
  cache: {
    host: 'redis',
    port: 6379,
    db: 1
  },
  sockets: {
    adapter: 'socket.io-redis',
    host: 'redis',
    port: 6379,
    db: 3
  },
  blueprints:  {
    rest: false
  },
};
