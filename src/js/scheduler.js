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

    Scheduler.Debugger = function () {
        this.data_div = $('#debug_data')[0];
        this.last_beat = 0;
        this.time_taken = 0;
    };

    Scheduler.Debugger.prototype.update = function (beat_offset, currentTempo, bps, now) {
        this.beat_offset = beat_offset;
        this.currentTempo = currentTempo || this.currentTempo;
        this.bps = bps || this.bps;
        this.now = now || this.now;
        if (this.beat_offset % 1 == 0) {
            this.time_taken = this.now - this.last_beat;
            this.last_beat = this.now;
        }
    };

    Scheduler.Debugger.prototype.write = function () {
        if (this.data_div) {
            this.data_div.innerText = "Current Beat Offset: " + this.beat_offset.toString() + "\n" +
                "Tempo: " + this.currentTempo + "\nSeconds per beat: " + 1 / bps + "\nTime taken last beat: " + this.time_taken;
        }
    };

    Scheduler.debugger = new Scheduler.Debugger();

    Scheduler.currentTempo = 120;
    var bps = Scheduler.currentTempo / 60.0;
    var time_per_beat = 1.0 / bps; // in seconds
    var time_signature = {value: 4, count: 4};
    var beat_offset = 0; // This is the number of beats away from start of current bar
    var last_beat = 0;
    var time_per_bar = time_per_beat * time_signature.count; // in seconds
    Scheduler.quantizationIntervalDenominator = 8; // quantizes to this fraction of a beat
    Scheduler.refreshMultiplier = 4;
    Scheduler.interval = time_per_beat / Scheduler.quantizationIntervalDenominator / Scheduler.refreshMultiplier * 1000;
    Scheduler.currentBar = 1;
    Scheduler.drawOffset = 0;
    var bars = [new Scheduler.Bar(-1, time_signature, []), new Scheduler.Bar(0, time_signature, []),
        new Scheduler.Bar(1, time_signature, []), new Scheduler.Bar(2, time_signature, []),
        new Scheduler.Bar(3, time_signature, []), new Scheduler.Bar(4, time_signature, []),
        new Scheduler.Bar(5, time_signature, []), new Scheduler.Bar(6, time_signature, [])];


    var bar = bars[Scheduler.currentBar];

    var bar_offset_selector = document.getElementById("bar_offset");
    Scheduler.eventLoop = function () {
        // run every tick
        // update beat offset
        beat_offset = (beat_offset + ((2 / Scheduler.quantizationIntervalDenominator) / Scheduler.refreshMultiplier)) % time_signature.count;
        Scheduler.debugger.update(beat_offset, Scheduler.currentTempo, Scheduler.bps, performance.now(), last_beat);
        Scheduler.debugger.write();
        var selected_bar = parseInt(bar_offset_selector ? bar_offset_selector.options[bar_offset_selector.selectedIndex].value : 1);
        if (selected_bar != Scheduler.currentBar) {
            Scheduler.currentBar = selected_bar;
            bars[selected_bar].bar_objects.forEach(function (note) {
                note.done = true;
            });
        }
        var now = performance.now();
        bar = bars[Scheduler.currentBar];
        if (beat_offset == 0) {
            socket.emit('heartbeat');
            bars.splice(0, 1);
            bars.forEach(function (bar) {
                bar.bar_number -= 1;
                var updatedStart = now + bar.bar_number * time_per_bar * 1000;
                bar.bar_objects.forEach(function (bar_object){
                    bar_object.timeOn = bar_object.timeOn - bar.bar_start + updatedStart;
                    bar_object.timeOff = bar_object.timeOff - bar.bar_start + updatedStart;
                });
                bar.bar_start = now + bar.bar_number * time_per_bar * 1000;
            });
            bars.push(new Scheduler.Bar(7, time_signature, []));
            bar = bars[Scheduler.currentBar];
        }
        // Dynamically updates the note depending on how long you hold it
        var activeNotes = bar.bar_objects.filter(function (noteObj) {
            return (noteObj.done == false);
        });

        activeNotes.forEach(function (noteObj) {
            noteObj.timeOff = now + bar.bar_number * time_per_bar * 1000;
        });
        // pass bars to painter to draw
        var quantized_bars = bars.map(Scheduler.quantizeBar);
        Scheduler.drawOffset = beat_offset / time_signature.count;

        var animate = function() {
            anticipatoryMusicProducer.playerPainter.show.bind(anticipatoryMusicProducer.playerPainter, "", quantized_bars, Scheduler.drawOffset)();
            //anticipatoryMusicProducer.Painter.collaborator_context.drawImage(anticipatoryMusicProducer.Painter.player_canvas, 0, 0);

            socket.emit('broadcast_canvas', {quantized_bars: JSON.stringify(quantized_bars, functionReplacer), offset: Scheduler.drawOffset});
        };
        requestAnimationFrame(animate);
    };

    Scheduler.quantizeBar = function (bar) {
        // bar should be an array of objects with note, timeOn, timeOff. If noteOff time is not
        // available, assume performance.now()
        // returns an array of objects with the MIDI data, and the quantized beats. Those with the same beat length
        // should be grouped together
        // values returned are relative to the beginning of the bar
        var quantized_bar = new Scheduler.Bar(0, time_signature, []);
        var bar_start = bar.bar_start;
        quantized_bar.bar_start = bar.bar_start;
        quantized_bar.bar_objects = bar.bar_objects.map(function (note) {
            var startBeatLocation = quantize(getBeatLocation(note.timeOn, bar_start));
            var endBeatLocation = quantize(getBeatLocation(note.timeOff, bar_start));
            // Sanitize
            // Error with first beat; to fix
            if (endBeatLocation > time_signature.count && startBeatLocation > time_signature.count) {
                return null;
            }
            // If both start and end beat are at the very end, bring the start beat forward a little
            if (startBeatLocation == endBeatLocation && endBeatLocation == time_signature.count) {
                startBeatLocation = endBeatLocation - 1 / Scheduler.quantizationIntervalDenominator;
            } else if (startBeatLocation == endBeatLocation) { // Otherwise push the end beat ahead a little
                endBeatLocation = startBeatLocation + 1 / Scheduler.quantizationIntervalDenominator;
            }

            if ((!startBeatLocation && startBeatLocation != 0) ||
                (!endBeatLocation && endBeatLocation != 0)) {
                return null;
            }

            return new Palette.BarObject(false,
                endBeatLocation > time_signature.count ? time_signature.count : (endBeatLocation > startBeatLocation ?
                    endBeatLocation : endBeatLocation + 1 / Scheduler.quantizationIntervalDenominator),
                startBeatLocation % time_signature.count,
                note.note);
        });
        quantized_bar.bar_objects = quantized_bar.bar_objects.filter(
            function (bar_object) {
                return bar_object;
            });
        return quantized_bar;
    };

    /**
     * A callback that adds a given note to be drawn on the canvas
     * @param {number} note The MIDI value of the note
     * @param {number} time DOMHighResTimeStamp representing time on
     */
    Scheduler.onNoteOn = function (note, time) {
        bar.bar_objects.push({
            note   : new Palette.Note(note),
            done   : false,
            timeOn : time + bar.bar_number * time_per_bar * 1000,
            timeOff: time + bar.bar_number * time_per_bar * 1000,
            tempo  : Scheduler.currentTempo
        });
    };

    /**
     * A callback that removes a given note from the canvas
     * @param {number} note The MIDI value of the note
     * @param {number} time DOMHighResTimeStamp representing time off
     */
    Scheduler.onNoteOff = function (note, time) {
        var releasedNote = bar.bar_objects.filter(function (noteObj) {
            return (noteObj.note.number == note);
        });

        if (releasedNote) {
            releasedNote.forEach(function (note) {
                note.timeOff = time + bar.bar_number * time_per_bar * 1000;
                note.done = true;
            })
        }
    };

    /**
     * quantizes a fractional beat count to the quantization interval, eg. 2.27321 => 2.25
     * @param beat_count
     * @returns {number}
     */
    var quantize = function (beat_count) {
        var quantized = Math.round((beat_count * Scheduler.quantizationIntervalDenominator)) / Scheduler.quantizationIntervalDenominator;
        return quantized;
    };

    // Calculate elapsed beats since play start timestamp
    var getBeatLocation = function (note_start_timestamp, bar_start_timestamp) {
        var elapsed_seconds = (note_start_timestamp - bar_start_timestamp) / 1000.0;
        return elapsed_seconds * bps;
    };

})(window.anticipatoryMusicProducer.Scheduler =
    window.anticipatoryMusicProducer.Scheduler || {}, jQuery);
