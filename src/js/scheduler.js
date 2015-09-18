(function (Scheduler, $, undefined) {
    Scheduler.currentTempo = 120;
    var bps = Scheduler.currentTempo / 60.0;
    var time_signature = {value: 4, count: 4};
    var beat_offset = 0; // This is the number of beats away from the start; update from GUI or something
    var play_start_timestamp = performance.now(); // update using a callback?
    var quantization_interval_denominator = 4; // quantizes to this fraction of a beat
    var bar_objects = [];
    var quantized_bar_objects = [];
    // array of bar objects
    var bars = [];

    var quantizeBar = function(bar) {
        // bar should be an array of objects with note, timeOn, timeOff. If noteOff time is not
        // available, assume performance.now()
        // returns an array of objects with the MIDI data, and the quantized beats. Those with the same beat length
        // should be grouped together
        quantized_bar_objects = bar.map(function(note) {
            var startBeatLocation = quantize(getBeatLocation(note.timeOn));
            var endBeatLocation = quantize(getBeatLocation(note.timeOff));
            return {note: note.note,
                startBeat: startBeatLocation,
                endBeat: endBeatLocation > time_signature.count ? time_signature.count :
                    (endBeatLocation > startBeatLocation ?
                    endBeatLocation : endBeatLocation + 1/quantization_interval_denominator)};
        })

    };

    var getCurrentBar = function() {
        return Math.floor(beat_offset / time_signature.count);
    };


    var eventLoop = function() {
        // run every tick
    };

    /**
     * A callback that adds a given note to be drawn on the canvas
     * @param {number} note The MIDI value of the note
     */
    Scheduler.onNoteOn = function(note, time) {
        bar_objects.push(
            {note: new window.anticipatoryMusicProducer.Palette.Note(note),
            timeOn: time,
            timeOff: performance.now(),
            tempo: Scheduler.currentTempo});
        quantizeBar(bar_objects);
        console.log(quantized_bar_objects);
    };

    /**
     * A callback that removes a given note from the canvas
     * @param {number} note The MIDI value of the note
     */
    Scheduler.onNoteOff = function(note) {
        var releasedNote = bar_objects.filter(function(noteObj) { return (noteObj.note.number == note); })[0];
        releasedNote.timeOff = performance.now();
    };

    /**
     * quantizes a fractional beat count to the quantization interval, eg. 2.27321 => 2.25
     * @param beat_count
     * @returns {number}
     */
    var quantize = function(beat_count) {
        return Math.round((beat_count * quantization_interval_denominator)) / quantization_interval_denominator;
    };

    // Calculate elapsed beats since play start timestamp
    var getBeatLocation = function(note_start_timestamp) {
        var elapsed_seconds = (note_start_timestamp - play_start_timestamp) / 1000.0;
        return elapsed_seconds * bps;
    };

})(window.anticipatoryMusicProducer.Scheduler =
    window.anticipatoryMusicProducer.Scheduler || {}, jQuery);
