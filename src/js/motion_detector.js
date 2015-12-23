(function (motionDetector, $, undefined) {
    var bar_offset_selector = document.getElementById("bar_offset");

    motionDetector.initialize = function() {
        gest.options.subscribeWithCallback(function(gesture) {
            //handle gesture .direction .up .down .left .right .error
            switch(gesture.direction) {
                case "Up":
                    bar_offset_selector.value = 1;
                    break;
                case "Long up":
                    bar_offset_selector.value = 1;
                    break;
                case "Down":
                    bar_offset_selector.value = 2;
                    break;
                case "Long down":
                    bar_offset_selector.value = 2;
                    break;
                case "Left":
                    bar_offset_selector.value = 3;
                    break;
                case "Right":
                    bar_offset_selector.value = 4;
                    break;
                default:
                    throw(gesture.error);
            }
            console.log(bar_offset_selector.value);
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
