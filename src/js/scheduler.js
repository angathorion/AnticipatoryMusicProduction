(function (Scheduler, $, undefined) {
    Scheduler.Bar = function (bar_number, time_signature, bar_objects, bar_start) {
        this.bar_number = bar_number || 0;
        this.bar_objects = bar_objects || [];
        this.time_signature = time_signature || {value: 4, count: 4};
        this.bar_start = bar_start || performance.now();
        return this;
    };

    Scheduler.Bar.prototype.toString = function () {
        return "".concat(this.bar_objects);
    };

    Scheduler.Bar.initializeStartTime = function() {
        this.bar_start = performance.now();
    }

    Scheduler.currentTempo = 120;
    var bps = Scheduler.currentTempo / 60.0;
    var time_signature = {value: 4, count: 4};
    var beat_offset = 0; // This is the number of beats away from start of current bar
    Scheduler.quantization_interval_denominator = 16; // quantizes to this fraction of a beat
    Scheduler.refreshMultiplier = 1;
    Scheduler.interval = ((1.0 / bps) / Scheduler.quantization_interval_denominator * 1000);
    Scheduler.currentBar = 1;
    var bars = [new Scheduler.Bar(0, time_signature, []), new Scheduler.Bar(0, time_signature, []),
        new Scheduler.Bar(0, time_signature, []), new Scheduler.Bar(0, time_signature, []),
        new Scheduler.Bar(0, time_signature, []), new Scheduler.Bar(0, time_signature, [])];


    var bar = bars[Scheduler.currentBar];

    var quantizeBar = function (bar) {
        // bar should be an array of objects with note, timeOn, timeOff. If noteOff time is not
        // available, assume performance.now()
        // returns an array of objects with the MIDI data, and the quantized beats. Those with the same beat length
        // should be grouped together
        // values returned are relative to the beginning of the bar
        var quantized_bar = new Scheduler.Bar(0, time_signature, []);
        var bar_start = bar.bar_start;
        quantized_bar.bar_objects = bar.bar_objects.map(function (note) {
            var startBeatLocation = quantize(getBeatLocation(note.timeOn, bar_start));
            var endBeatLocation = quantize(getBeatLocation(note.timeOff, bar_start));
            return new Palette.BarObject(false,
                endBeatLocation > time_signature.count ? time_signature.count : (endBeatLocation > startBeatLocation ?
                    endBeatLocation : endBeatLocation + 1 / Scheduler.quantization_interval_denominator),
                startBeatLocation % time_signature.count,
                note.note);
        });
        return quantized_bar;
    };

    var getCurrentBar = function () {
        return Math.floor(beat_offset / time_signature.count);
    };

    Scheduler.eventLoop = function () {
        // run every tick
        // update beat offset
        beat_offset = (beat_offset + (1 / Scheduler.quantization_interval_denominator) / Scheduler.refreshMultiplier) % time_signature.count;
        if (beat_offset == 0) {
            bars.splice(0, 1);
            bars.push(new Scheduler.Bar(0, time_signature, []));
            bars[Scheduler.currentBar] = new Scheduler.Bar(0, time_signature, []);
            bar = bars[Scheduler.currentBar];
        }

        // Dynamically updates the note depending on how long you hold it
        var activeNotes = bar.bar_objects.filter(function (noteObj) {
            return (noteObj.done == false);
        });
        console.log(activeNotes.length);
        activeNotes.forEach(function(noteObj) {
            noteObj.timeOff = performance.now();
        });

        // pass bars to painter to draw
        anticipatoryMusicProducer.Painter.show("", bars.map(quantizeBar), beat_offset / time_signature.count);
    };
    /**
     * A callback that adds a given note to be drawn on the canvas
     * @param {number} note The MIDI value of the note
     * @param {number} time DOMHighResTimeStamp representing time on
     */
    Scheduler.onNoteOn = function (note, time) {
        bar.bar_objects.push(
            {
                note   : new Palette.Note(note),
                done   : false,
                timeOn : time,
                timeOff: -1,
                tempo  : Scheduler.currentTempo
            });
        //quantizeBar(bar);
    };

    /**
     * A callback that removes a given note from the canvas
     * @param {number} note The MIDI value of the note
     * @param {number} time DOMHighResTimeStamp representing time off
     */
    Scheduler.onNoteOff = function (note, time) {
        var releasedNote = bar.bar_objects.filter(function (noteObj) {
            return (noteObj.note.number == note);
        })[0];
        if (releasedNote) {
            releasedNote.timeOff = time;
            releasedNote.done = true;
        }
    };

    /**
     * quantizes a fractional beat count to the quantization interval, eg. 2.27321 => 2.25
     * @param beat_count
     * @returns {number}
     */
    var quantize = function (beat_count) {
        return Math.round((beat_count * Scheduler.quantization_interval_denominator)) / Scheduler.quantization_interval_denominator;
    };

    // Calculate elapsed beats since play start timestamp
    var getBeatLocation = function (note_start_timestamp, bar_start_timestamp) {
        var elapsed_seconds = (note_start_timestamp - bar_start_timestamp) / 1000.0;
        return elapsed_seconds * bps;
    };

})(window.anticipatoryMusicProducer.Scheduler =
    window.anticipatoryMusicProducer.Scheduler || {}, jQuery);
