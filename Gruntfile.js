'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    watch: {
      styles: {
        files: 'static/less/**/*.less',
        tasks: ['less'],
        options: {
          interrupt: true,
        },
      },
    },

    less: {
      development: {
        options: {
          paths: ['node_modules/semantic-ui-less'],
        },
        files: {
          'static/css/app.css': 'static/less/app.less',
        }
      },
    },

    concat: {
      options: {
        separator: ';',
      },
      dist: {
        src: [
          'node_modules/jquery/dist/jquery.js',
          'node_modules/semantic-ui-less/definitions/**/*.js',
        ],
        dest: 'static/js/semantic-ui.js',
      },
    },

  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('default', ['concat', 'less']);
};
