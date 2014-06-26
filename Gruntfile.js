module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        jasmine: {
            byda: {
                src: 'index.min.js',
                options: {
                    keepRunner: true,
                    template: 'spec/runner.tmpl',
                    specs: 'spec/**/*spec.js',
                    helpers: 'spec/helpers/*.js'
                }
            }
        },
        jshint: {
            all: ['Gruntfile.js', 'index.js', 'spec/*.js']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('test', ['jshint', 'jasmine']);
};