module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        qunit: {
            //files: ['qunit/index.html']
            all: {
                options: {
                    urls: [
                        'http://localhost:3000/qunit/index.html',
                    ],
                    timeout: 10000
                }
            }
        },
        connect: {
            server: {
                options: {
                    port: 3000,
                    base: '.'
                }
            }
        },
        karma: {
            unit: {
                configFile: 'karma.conf.js'
            }
        }
    });

    // Load plugin
    //grunt.loadNpmTasks('grunt-contrib-connect');
    //grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-karma');
    // Task to run tests
    grunt.registerTask('test', ['karma']);
};
