(function (Scheduler, $, undefined) {
    Scheduler.Bar = function (barNumber, timeSignature, barObjects, barStart) {
        this.barNumber = barNumber || 0;
        this.barObjects = barObjects || [];
        this.timeSignature = timeSignature || {value: 4, count: 4};
        this.barStart = barStart || performance.now();
        return this;
    };

    Scheduler.Bar.prototype.toString = function () {
        return "".concat(this.barObjects);
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
    var timePerBeat = 1.0 / bps; // in seconds
    var timeSignature = {value: 4, count: 4};
    var beatOffset = 0; // This is the number of beats away from start of current bar
    var lastBeat = 0;
    var timePerBar = timePerBeat * timeSignature.count; // in seconds
    Scheduler.quantizationIntervalDenominator = 8; // quantizes to this fraction of a beat
    Scheduler.refreshMultiplier = 4;
    Scheduler.interval = timePerBeat / Scheduler.quantizationIntervalDenominator / Scheduler.refreshMultiplier * 1000;
    Scheduler.currentBar = 1;
    Scheduler.drawOffset = 0;
    var bars = [new Scheduler.Bar(-1, timeSignature, []), new Scheduler.Bar(0, timeSignature, []),
        new Scheduler.Bar(1, timeSignature, []), new Scheduler.Bar(2, timeSignature, []),
        new Scheduler.Bar(3, timeSignature, []), new Scheduler.Bar(4, timeSignature, []),
        new Scheduler.Bar(5, timeSignature, []), new Scheduler.Bar(6, timeSignature, [])];


    var bar = bars[Scheduler.currentBar];


    var barOffsetSelector = document.getElementById("bar_offset");
    Scheduler.eventLoop = function () {
        // run every tick
        // update beat offset
        beatOffset = (beatOffset + ((2 / Scheduler.quantizationIntervalDenominator) / Scheduler.refreshMultiplier)) % timeSignature.count;
        Scheduler.debugger.update(beatOffset, Scheduler.currentTempo, Scheduler.bps, performance.now(), lastBeat);
        Scheduler.debugger.write();
        var selectedBar = parseInt(barOffsetSelector ? barOffsetSelector.options[barOffsetSelector.selectedIndex].value : 1);
        if (selectedBar != Scheduler.currentBar) {
            Scheduler.currentBar = selectedBar;
            bars[selectedBar].barObjects.forEach(function (note) {
                note.done = true;
            });
        }
        var now = performance.now();
        bar = bars[Scheduler.currentBar];
        if (beatOffset == 0) {
            socket.emit('heartbeat');
            bars.splice(0, 1);
            bars.forEach(function (bar) {
                bar.barNumber -= 1;
                var updatedStart = now + bar.barNumber * timePerBar * 1000;
                bar.barObjects.forEach(function (bar_object){
                    bar_object.timeOn = bar_object.timeOn - bar.barStart + updatedStart;
                    bar_object.timeOff = bar_object.timeOff - bar.barStart + updatedStart;
                });
                bar.barStart = now + bar.barNumber * timePerBar * 1000;
            });
            bars.push(new Scheduler.Bar(7, timeSignature, []));
            bar = bars[Scheduler.currentBar];
        }
        // Dynamically updates the note depending on how long you hold it
        var activeNotes = bar.barObjects.filter(function (noteObj) {
            return (noteObj.done == false);
        });

        activeNotes.forEach(function (noteObj) {
            noteObj.timeOff = now + bar.barNumber * timePerBar * 1000;
        });
        // pass bars to painter to draw
        var quantizedBars = bars.map(Scheduler.quantizeBar);
        Scheduler.drawOffset = beatOffset / timeSignature.count;
        socket.emit('broadcast_canvas', {quantizedBars: JSON.stringify(quantizedBars), offset: Scheduler.drawOffset});

        var animate = function() {
            anticipatoryMusicProducer.playerPainter.show.bind(anticipatoryMusicProducer.playerPainter, "", quantizedBars, Scheduler.drawOffset)();
            if (anticipatoryMusicProducer.Client.state) {
                if (beatOffset == 0) {
                    anticipatoryMusicProducer.Client.state.shift();
                }
                anticipatoryMusicProducer.collaboratorPainter.show.bind(anticipatoryMusicProducer.collaboratorPainter, "", anticipatoryMusicProducer.Client.state, Scheduler.drawOffset)();
            }
        };
        requestAnimationFrame(animate);
    };

    Scheduler.quantizeBar = function (bar) {
        // bar should be an array of objects with note, timeOn, timeOff. If noteOff time is not
        // available, assume performance.now()
        // returns an array of objects with the MIDI data, and the quantized beats. Those with the same beat length
        // should be grouped together
        // values returned are relative to the beginning of the bar
        var quantized_bar = new Scheduler.Bar(0, timeSignature, []);
        var bar_start = bar.barStart;
        quantized_bar.barStart = bar.barStart;
        quantized_bar.barObjects = bar.barObjects.map(function (note) {
            var startBeatLocation = quantize(getBeatLocation(note.timeOn, bar_start));
            var endBeatLocation = quantize(getBeatLocation(note.timeOff, bar_start));
            // Sanitize
            // Error with first beat; to fix
            if (endBeatLocation > timeSignature.count && startBeatLocation > timeSignature.count) {
                return null;
            }
            // If both start and end beat are at the very end, bring the start beat forward a little
            if (startBeatLocation == endBeatLocation && endBeatLocation == timeSignature.count) {
                startBeatLocation = endBeatLocation - 1 / Scheduler.quantizationIntervalDenominator;
            } else if (startBeatLocation == endBeatLocation) { // Otherwise push the end beat ahead a little
                endBeatLocation = startBeatLocation + 1 / Scheduler.quantizationIntervalDenominator;
            }

            if ((!startBeatLocation && startBeatLocation != 0) ||
                (!endBeatLocation && endBeatLocation != 0)) {
                return null;
            }

            return new Palette.BarObject(false,
                endBeatLocation > timeSignature.count ? timeSignature.count : (endBeatLocation > startBeatLocation ?
                    endBeatLocation : endBeatLocation + 1 / Scheduler.quantizationIntervalDenominator),
                startBeatLocation % timeSignature.count,
                note.note);
        });
        quantized_bar.barObjects = quantized_bar.barObjects.filter(
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
        bar.barObjects.push({
            note   : new Palette.Note(note),
            done   : false,
            timeOn : time + bar.barNumber * timePerBar * 1000,
            timeOff: time + bar.barNumber * timePerBar * 1000,
            tempo  : Scheduler.currentTempo
        });
    };

    /**
     * A callback that removes a given note from the canvas
     * @param {number} note The MIDI value of the note
     * @param {number} time DOMHighResTimeStamp representing time off
     */
    Scheduler.onNoteOff = function (note, time) {
        var releasedNote = bar.barObjects.filter(function (noteObj) {
            return (noteObj.note.number == note);
        });

        if (releasedNote) {
            releasedNote.forEach(function (note) {
                note.timeOff = time + bar.barNumber * timePerBar * 1000;
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
