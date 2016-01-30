// Base motion detector declaration

(function (motionDetector, $, undefined) {
    var barOffsetSelector = document.getElementById("bar_offset");

    motionDetector.modules = {};
    var defaultModule = "gestModule";
    var currentModule = null;
    var moduleList = null;

    motionDetector.makeModuleList = function() {
        var keys = [];
        for (var key in this.modules) {
            if (this.modules.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
        return keys;
    };

    motionDetector.initialize = function() {
        for (var key in this.modules) {
            if (this.modules.hasOwnProperty(key)) {
                this.modules[key].initialize();
            }
        }
        moduleList = this.makeModuleList();
        currentModule = defaultModule || moduleList[0];
    };

    motionDetector.start = function() {
        this.modules[currentModule].start();
    };

    motionDetector.stop = function() {
        this.modules[currentModule].stop();
    };

    motionDetector.setOffset = function(offset) {
        barOffsetSelector.value = offset;
    }
})(window.anticipatoryMusicProducer.motionDetector =
    window.anticipatoryMusicProducer.motionDetector || {}, jQuery);

// gest module
(function (motionDetector, $, undefined) {
    var gestModule = {};

    gestModule.initialize = function () {
        gest.options.subscribeWithCallback(function(gesture) {
            //handle gesture .direction .up .down .left .right .error
            switch(gesture.direction) {
                case "Up":
                    motionDetector.setOffset(1);
                    break;
                case "Long up":
                    motionDetector.setOffset(1);
                    break;
                case "Down":
                    motionDetector.setOffset(2);
                    break;
                case "Long down":
                    motionDetector.setOffset(2);
                    break;
                case "Left":
                    motionDetector.setOffset(3);
                    break;
                case "Right":
                    motionDetector.setOffset(4);
                    break;
                default:
                    throw(gesture.error);
            }
        });
        gest.options.sensitivity(85);
    };

    gestModule.start = function() {
        gest.start();
    };

    gestModule.stop = function() {
        gest.stop();
    };

    motionDetector.modules.gestModule = gestModule;
})(window.anticipatoryMusicProducer.motionDetector =
    window.anticipatoryMusicProducer.motionDetector || {}, jQuery);

// headtrackr module
(function (motionDetector, $, undefined) {
    var headtrackrModule = {};
    var video = document.getElementById("v");
    var canvas = document.getElementById("c");

    headtrackrModule.tracker = new headtrackr.Tracker({calcAngles: true});

    headtrackrModule.initialize = function () {
        headtrackrModule.tracker.init(video, canvas);
        document.addEventListener('headtrackrStatus',
            function (event) {
                console.log(event);
            }
        );
        document.addEventListener('facetrackingEvent',
            function (event) {
                console.log(event.angle);
            }
        );
    };

    headtrackrModule.start = function() {
        headtrackrModule.tracker.start();
    };

    headtrackrModule.stop = function() {
        headtrackrModule.tracker.stop();
        headtrackrModule.tracker.stopStream();
    };

    motionDetector.modules.headtrackrModule = headtrackrModule;
})(window.anticipatoryMusicProducer.motionDetector =
    window.anticipatoryMusicProducer.motionDetector || {}, jQuery);
