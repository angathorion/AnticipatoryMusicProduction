module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
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
