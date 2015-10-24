(function (Palette, $, undefined) {
    /**
     * @param {number} note The MIDI value of the note
     * @param {string} direction String indicating the direction of the offset for sharp/flat ('up' or 'down')
     * @returns {Palette.Note}
     * @constructor
     */
    Palette.Note = function (note, direction) {
        var note_indexes = 'C|D|EF|G|A|B';
        var parts;

        this.direction = direction || 'up';

        if (!isNaN(parseInt(note, 10))) {
            this.number = parseInt(note, 10);
            this.octave = Math.floor(this.number / 12) - 1;
            this.semitone = this.number % 12;
        }
        else if (typeof note === "string" || note instanceof String) {
            parts = note.toUpperCase().match(/^([A-G])(B|#)?\/?([0-9]?)$/);
            if (!parts) {
                throw new Error("Could not parse note from: " + note);
            }

            this.semitone = note_indexes.indexOf(parts[1]);
            if (parts[2] == '#') {
                this.semitone += 1;
                this.direction = 'up';
            } else if (parts[2] == 'b') {
                this.semitone -= 1;
                this.direction = 'down';
            }
            this.number = this.semitone;
            if (parts[3]) {
                this.octave = parseInt(parts[3], 10);
                this.number += (this.octave - 1) * 12;
            }
            this.semitone = this.number % 12;
        }
        return this;
    };

    /**
     * Returns the note name (A-G)
     * @returns {string} Note name as a string
     */
    Palette.Note.prototype.letter = function () {
        // There's probably a more elegant way to do thisâ€¦ but this gets it done.
        var notes = '';
        if (this.direction == 'up') {
            notes = 'CCDDEFFGGAAB';
        }
        else {
            notes = 'CDDEEFGGAABB';
        }
        return notes.charAt(this.semitone);
    };

    /**
     * Returns the accidental of the note
     * @returns {string} Returns either "", "#" or "b"
     */
    Palette.Note.prototype.accidental = function () {
        if ([1, 3, 6, 8, 10].indexOf(this.semitone) == -1) {
            return "";
        }
        if (this.direction == 'up') {
            return "#";
        }
        return "b";
    };

    /**
     * Converts note to string representation
     * @returns {string} Returns the string representation of the note
     */
    Palette.Note.prototype.toString = function () {
        var parts = [this.letter(), this.accidental()];
        if (this.octave !== null) {
            parts.push('/' + this.octave);
        }
        return parts.join('');
    };
})(window.anticipatoryMusicProducer.Palette =
    window.anticipatoryMusicProducer.Palette || {}, jQuery);

(function (Painter, $, undefined) {
    /**
     * Array of Notes that are currently active (i.e. note-on messages received, but not note-off)
     * Will be updated by onNoteOn/onNoteOff callbacks
     * @type {Palette.Note[]}
     */
    var activeNotes = [];

    /**
     * A callback that adds a given note to be drawn on the canvas
     * @param {number} note The MIDI value of the note
     */
    Painter.onNoteOn = function (note) {
        activeNotes.push(new window.anticipatoryMusicProducer.Palette.Note(note));
    };

    /**
     * A callback that removes a given note from the canvas
     * @param {number} note The MIDI value of the note
     */
    Painter.onNoteOff = function (note) {
        activeNotes = activeNotes.filter(function (noteObj) {
            return (noteObj.number != note);
        });
    };

    /**
     * @todo Fix this function!
     * @param label
     */
    Painter.show = function (label, bar) {
        var time_signature = bar.time_signature;
        var bar_objects = bar.bar_objects.filter(function (bar_object) {
            return bar_object.endBeat > bar_object.startBeat;
        });
        this.canvas = document.getElementById('canvas');
        this.clear();
        var treble = bar_objects.filter(function (bar_object) {
            return (bar_object.note.octave >= 4);
        });
        var bass = bar_objects.filter(function (bar_object) {
            return (bar_object.note.octave < 4);
        });
        var staves = drawGrandStaff();
        drawNotes(staves.treble, processNotes(treble), time_signature, label);
        drawNotes(staves.bass, processNotes(bass), time_signature, label);
    };


    /**
     * Removes all objects on the canvas
     */
    Painter.clear = function () {
        while (this.canvas.lastChild) {
            this.canvas.removeChild(this.canvas.lastChild);
        }
        this.renderer = new Vex.Flow.Renderer(this.canvas, Vex.Flow.Renderer.Backends.RAPHAEL);
        this.ctx = this.renderer.getContext();
    };

    var processNotes = function (bar_objects) {
        // First group the chords together (i.e. notes that start and end on the same beat)
        // Can do this using the Cantor pairing function
        if (bar_objects.length == 0) {
            return bar_objects;
        }
        var groups = _.groupBy(bar_objects, function (bar_object) {
            return 0.5 * (bar_object.startBeat + bar_object.endBeat) *
                (bar_object.startBeat + bar_object.endBeat + 1) + bar_object.endBeat
        });
        // Now sort by start time
        groups = _.sortBy(_.toArray(groups), function (group) {
            return group[0].endBeat;
        });


        // Use greedy interval packing algorithm
        // https://www.cs.duke.edu/courses/fall03/cps260/notes/lecture05.pdf

        // Remove the interval that ends first
        var voices = [[groups.shift()]];
        while (groups.length > 0) {
            // See if there are non overlapping intervals, and get the first one
            var first_non_overlapping = _.find(groups, function (group) {
                return group[0].startBeat >= _.last(_.last(voices))[0].endBeat;
            });

            if (first_non_overlapping) {
                // If it exists, then put it in the latest voice
                _.last(voices).push(first_non_overlapping);
                groups = _.without(groups, first_non_overlapping);
            } else {
                // This interval doesn't exist; we create a new voice
                voices.push([groups.shift()])
            }
        }
        return voices;
    };


    var drawTrebleStaff = function (x) {
        var y = 110;
        x = x || 20;
        return new Vex.Flow.Stave(x, y, 400).addClef('treble').setContext(Painter.ctx).draw();
    };

    var drawBassStaff = function (x) {
        var y = 200;
        x = x || 20;
        return new Vex.Flow.Stave(x, y, 400).addClef('bass').setContext(Painter.ctx).draw();
    };

    var drawGrandStaff = function () {
        var trebleStave = drawTrebleStaff();
        var bassStave = drawBassStaff();

        new Vex.Flow.StaveConnector(trebleStave, bassStave).setType(3).setContext(Painter.ctx).draw();
        new Vex.Flow.StaveConnector(trebleStave, bassStave).setType(1).setContext(Painter.ctx).draw();
        new Vex.Flow.StaveConnector(trebleStave, bassStave).setType(6).setContext(Painter.ctx).draw();

        return {treble: trebleStave, bass: bassStave};
    };

    // Calculate how a single note should be split; does single pass
    var calculateStaveNoteSplit = function (full_value) {
        var base_value = Math.pow(2, full_value.toString(2).length - 1);
        var tentative_dotted_val = 0;
        var n = 0;
        while (tentative_dotted_val < full_value) {
            n += 1;
            tentative_dotted_val = base_value * (2 - 1 / Math.pow(2, n));
        }
        var log_val = Math.pow(2, n - 1);
        var dotted_value = base_value * (2 - 1 / log_val);
        var num_dots = n - 1;
        var remainder = full_value - dotted_value;
        return {base_value: base_value, num_dots: num_dots, remainder: remainder};
    };

    // Helper function to build string
    var stringFill = function (x, n) {
        var s = '';
        for (; ;) {
            if (n & 1) s += x;
            n >>= 1;
            if (n) x += x;
            else break;
        }
        return s;
    };

    var buildSeparateNotes = function (staveNote, value, note_type, stave, time_signature, startRendered, staveNoteArray, tieArray) {
        var staveNoteSplitData = calculateStaveNoteSplit(value);
        var noteGroup = new Vex.Flow.StaveNote({
            clef     : stave.clef,
            duration : (16 / (staveNoteSplitData.base_value / time_signature.value)).toString() +
            stringFill("d", staveNoteSplitData.num_dots) + note_type,
            keys     : staveNote.map(function (note) {
                return note.note.toString();
            }),
            auto_stem: true
        });
        noteGroup.setStave(stave);
        // add dots if any
        for (var i = 0; i < staveNoteSplitData.num_dots; i++) {
            noteGroup.addDotToAll();
        }
        // add accidentals if any to all notes
        noteGroup.keys.forEach(function (key, index) {
            var pitch = key.split("/")[0];
            if (pitch.length > 1) {
                noteGroup.addAccidental(index, new Vex.Flow.Accidental(pitch[1]));
            }
        });
        staveNoteArray.push(noteGroup);

        if (staveNoteSplitData.remainder > 0) {
            var notes = buildSeparateNotes(staveNote, staveNoteSplitData.remainder, note_type, stave, time_signature, true, staveNoteArray, tieArray);
            staveNoteArray = notes.staveNoteArray;
            tieArray = notes.tieArray;
            if (staveNoteArray.length > 1 && note_type == "" && startRendered == true) {
                var ties = new Vex.Flow.StaveTie({
                    first_note   : staveNoteArray[staveNoteArray.length - 2],
                    last_note    : staveNoteArray[staveNoteArray.length - 1],
                    first_indices: [0, staveNoteArray[staveNoteArray.length - 2].length],
                    last_indices : [0, staveNoteArray[staveNoteArray.length - 1].length]
                });
                ties.setContext(stave.getContext());
                tieArray.push(ties);
            }
        }
        return {staveNoteArray: staveNoteArray, tieArray: tieArray};
    };

    var drawNotes = function (stave, voices, time_signature) {
        var rest_pos = stave.clef == "treble" ? 71 : 50;
        // This does rest padding
        for (var j = 0; j < voices.length; j++) {
            var voice = voices[j];
            var end = time_signature.count;
            for (var i = voice.length - 1; i >= 0; i--) {
                if (voice[i][0].endBeat < end) {
                    voice.splice(i + 1, 0, [{
                        rest: 1, endBeat: end, startBeat: voice[i][0].endBeat,
                        note: new anticipatoryMusicProducer.Palette.Note(rest_pos)
                    }]);
                }
                end = voice[i][0].startBeat;
            }
            if (voice[0][0].startBeat > 0) {
                voice.splice(0, 0, [{
                    rest: 1, endBeat: voice[0][0].startBeat, startBeat: 0,
                    note: new anticipatoryMusicProducer.Palette.Note(rest_pos)
                }]);
            }
        }

        if (voices.length == 0) {
            voices = [[[{
                rest: 1, endBeat: time_signature.count, startBeat: 0,
                note: new anticipatoryMusicProducer.Palette.Note(rest_pos)
            }]]];
        }
        // This breaks up the notes
        var tiesArray = [];
        var beamsArray = [];
        voices = voices.map(function (currentVoice) {
            var staveNoteArray = [];
            currentVoice.forEach(function (staveNote) {
                var full_value = (staveNote[0].endBeat - staveNote[0].startBeat) * 16;
                var note_type = (staveNote[0].rest == 1 ? "r" : "");
                var notes = buildSeparateNotes(staveNote, full_value, note_type, stave, time_signature, false, staveNoteArray, tiesArray);

                staveNoteArray = notes.staveNoteArray;
                tiesArray = notes.tieArray;
            });
            beamsArray.push(Vex.Flow.Beam.generateBeams(staveNoteArray, {
                beam_rests      : false,
                beam_middle_only: false
            }));

            return staveNoteArray;
        });

        // Create a voice in 4/4
        var Voices = voices.map(function (voice) {
            var Voice = new Vex.Flow.Voice({
                num_beats: time_signature.count, beat_value: time_signature.value, resolution: Vex.Flow.RESOLUTION
            });
            // Add notes to voice
            Voice.addTickables(voice);

            return Voice;
        });

        var formatter = new Vex.Flow.Formatter();
        formatter.joinVoices(Voices).format(Voices, 300,
            {align_rests: false, context: Painter.ctx, stave: stave});
        // Format and justify the notes
        Voices.forEach(function (voice) {
            voice.draw(Painter.ctx, stave);
        });

        tiesArray.forEach(function (tie) {
            tie.setContext(stave.getContext()).draw();
        });

        beamsArray = _.flatten(beamsArray);
        beamsArray.forEach(function (beam) {
            beam.setContext(Painter.ctx).draw();
        });

    };
})(window.anticipatoryMusicProducer.Painter =
    window.anticipatoryMusicProducer.Painter || {}, jQuery);
