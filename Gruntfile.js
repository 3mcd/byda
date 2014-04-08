module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        jshint: {
            all: ['Gruntfile.js', 'index.js']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('test', ['jshint']);
};