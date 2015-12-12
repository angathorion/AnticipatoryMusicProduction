module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        qunit: {
            //files: ['qunit/index.html']
            all: {
                options: {
                    urls: [
                        'http://localhost:3000/qunit/index.html',
                    ]
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
        }
    });

    // Load plugin
    grunt.loadNpmTasks('grunt-contrib-qunit');

    // Task to run tests
    grunt.registerTask('test', 'qunit');
};
