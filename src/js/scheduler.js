(function (scheduler, $, undefined) {
    var tempo = 120;
    var bps = tempo / 60.0;
    var beat_offset = 0; // This needs to change when the player jumps to a new section
    var play_start_timestamp = 0; // update using a callback?
    var quantization_interval_denominator = 4; // quantizes to this fraction of a beat
    // This function assumes you cannot change the tempo, for now. It's a bad assumption, but this will just test
    // the idea

    var quantize = function(beat_count) {
        return Math.round((beat_count * quantization_interval_denominator)) / quantization_interval_denominator;
    };

    scheduler.calculateNoteStartLocation = function(x, note_start_timestamp) {
        var elapsed_seconds = (note_start_timestamp - play_start_timestamp) / 1000.0;
        var elapsed_beats = elapsed_seconds * bps;
        console.log("Elapsed Seconds % 10: " + elapsed_seconds % 10 + "; Elapsed beats % 4: " + elapsed_beats % 4);
        console.log("Elapsed beats (quantized) % 4: " + quantize(elapsed_beats % 4));
    };

})(window.anticipatoryMusicProducer.Scheduler =
    window.anticipatoryMusicProducer.Scheduler || {}, jQuery);
