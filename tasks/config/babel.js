module.exports = function(grunt) {

  grunt.config.set('babel', {
    dev: {
      options: {
        presets: ['es2015', 'es2017']
      },
      files: [{
        expand: true,
        cwd: 'assets/js/',
        src: ['*.js', 'modules/*.js', 'modules/**/*.js', '!dependencies'],
        // src: ['*.js', 'modules/*.js', 'modules/**/*.js', '!dependencies'],
        dest: '.tmp/public/js/',
        ext: '.js'
      }]
    }
  });

  grunt.loadNpmTasks('grunt-babel');
};
