(function (motionDetector, $, undefined) {
    var barOffsetSelector = document.getElementById("bar_offset");

    motionDetector.initialize = function() {
        gest.options.subscribeWithCallback(function(gesture) {
            //handle gesture .direction .up .down .left .right .error
            switch(gesture.direction) {
                case "Up":
                    barOffsetSelector.value = 1;
                    break;
                case "Long up":
                    barOffsetSelector.value = 1;
                    break;
                case "Down":
                    barOffsetSelector.value = 2;
                    break;
                case "Long down":
                    barOffsetSelector.value = 2;
                    break;
                case "Left":
                    barOffsetSelector.value = 3;
                    break;
                case "Right":
                    barOffsetSelector.value = 4;
                    break;
                default:
                    throw(gesture.error);
            }
            console.log(barOffsetSelector.value);
        });
        //gest.options.debug(true);
        gest.options.sensitivity(85);
    };

    motionDetector.start = function() {
        gest.start();
    };

    motionDetector.stop = function() {
        gest.stop();
    }

})(window.anticipatoryMusicProducer.motionDetector =
    window.anticipatoryMusicProducer.motionDetector || {}, jQuery);
