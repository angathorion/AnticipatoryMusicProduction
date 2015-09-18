(function (Scheduler, $, undefined) {
    var tempo = 120;
    var bps = tempo / 60.0;
    var beat_offset = 0; // This needs to change when the player jumps to a new section
    var play_start_timestamp = performance.now(); // update using a callback?
    var quantization_interval_denominator = 4; // quantizes to this fraction of a beat

    var bar_objects = [];

    var quantizeBar = function(bar) {
        // bar should be an array of objects with MIDI data, noteOn time and noteOff time. If noteOff time is not
        // available, assume performance.now()
        // returns an array of objects with the MIDI data, and the quantized beats. Those with the same beat length
        // should be grouped together
    };

    var eventLoop = function() {

    };

    var quantize = function(beat_count) {
        return Math.round((beat_count * quantization_interval_denominator)) / quantization_interval_denominator;
    };

    Scheduler.calculateNoteStartLocation = function(x, note_start_timestamp) {
        var elapsed_seconds = (note_start_timestamp - play_start_timestamp) / 1000.0;
        var elapsed_beats = elapsed_seconds * bps;
        console.log("Elapsed Seconds % 10: " + elapsed_seconds % 10 + "; Elapsed beats % 4: " + elapsed_beats % 4);
        console.log("Elapsed beats (quantized) % 4: " + quantize(elapsed_beats % 4));
    };

})(window.anticipatoryMusicProducer.Scheduler =
    window.anticipatoryMusicProducer.Scheduler || {}, jQuery);
