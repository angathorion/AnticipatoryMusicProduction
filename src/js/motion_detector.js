// Base motion detector declaration

(function (motionDetector, $, undefined) {
    var barOffsetSelector = document.getElementById("bar_offset");
    var loopSelector = document.getElementById("looping");
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
    };

    motionDetector.getOffset = function(offset) {
        return barOffsetSelector.value;
    };

    motionDetector.toggleLooping = function() {
        if (loopSelector.value == 1) {
            loopSelector.value = 0;
        } else {
            loopSelector.value = 1;
        }
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
                case "Left":
                    motionDetector.toggleLooping();
                    break;
                case "Right":
                    if (motionDetector.getOffset() == 1) {
                        motionDetector.setOffset(4);
                    } else {
                        motionDetector.setOffset(1);
                    }
                    break;
                default:
                    throw("Unrecognized gesture.");
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
