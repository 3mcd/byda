module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        jasmine: {
            byda: {
                src: 'index.js',
                options: {
                    template: 'spec/runner.tmpl',
                    specs: 'spec/**/*spec.js',
                    helpers: 'spec/helpers/*.js'
                }
            }
        },
        jshint: {
            all: ['Gruntfile.js', 'index.js']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('test', ['jshint', 'jasmine']);
};