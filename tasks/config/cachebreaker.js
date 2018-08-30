module.exports = function(grunt) {

  grunt.config.set('cachebreaker', {
    // Append a md5 hash to 'all.js' which is located in 'index.html'
      js: {
        // optionsMulti: {
        //   match: [
        //     {
        //       // Pattern    // File to hash
        //       'production.min.js': './tmp/public/min/production.min.js',
        //       'production.min.css':    './tmp/public/min/production.min.css'
        //     }
        //   ],
        //   replacement: 'md5'
        // },
        options: {
          match: ['production.min.js'],
          replacement: 'md5',
          src: {
            path: '.tmp/public/min/production.min.js'
          }
        },
        files: {
          src: ['views/layout.ejs']
        }
      },
    css: {
      options: {
        match: ['production.min.css'],
        replacement: 'md5',
        src: {
          path: '.tmp/public/min/production.min.css'
        }
      },
      files: {
        src: ['views/layout.ejs']
      }
    }
  });

  grunt.loadNpmTasks('grunt-cache-breaker');
};
