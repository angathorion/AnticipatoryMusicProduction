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
        var treble = bar_objects.filter(function (bar_object) {return (bar_object.note.octave >= 4);});
        var bass = bar_objects.filter(function (bar_object) {return (bar_object.note.octave < 4);});
        var staves = drawGrandStaff();
        if (treble.length > 0) {
            drawNotes(staves.treble, processNotes(treble), time_signature, label);
        }
        if (bass.length > 0) {
            drawNotes(staves.bass, processNotes(bass), time_signature, label);
        }
    };

    var processNotes = function (bar_objects) {
        // First group the chords together (i.e. notes that start and end on the same beat)
        // Can do this using the Cantor pairing function
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

    var drawTrebleStaff = function (x) {
        var y = 110;
        x = x || 20;
        return new Vex.Flow.Stave(x, y, 400).addClef('treble').setContext(Painter.ctx).draw();
    };

    var drawBassStaff = function (x) {
        var y = 170;
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

    var drawNotes = function (stave, notes, time_signature, label) {
        if (!notes.length) return;
        // Must pad with rests
        var voices = notes.map(function(currentVoice) {
            return currentVoice.map(function(staveNote) {
                /*
                return staveNote.map(function(note) {
                    return new Vex.Flow.StaveNote({
                        clef: stave.clef,
                        duration: "w",
                        // I doubt this will work for other signatures though; need to check
                        keys: [note.note.toString()]
                    });
                });*/

                var noteGroup = new Vex.Flow.StaveNote({
                    clef: stave.clef,
                    duration: "q",
                    // I doubt this will work for other signatures though; need to check
                    keys: staveNote.map(function(note) { return note.note.toString();})
                });
                noteGroup.keys.forEach(function(key, index, keys) {
                    var pitch = key.split("/")[0];
                    if (pitch.length > 1) {
                        noteGroup.addAccidental(index, new Vex.Flow.Accidental(pitch[1]));
                    }
                });
                return noteGroup;

            });
        });

        if (label) {
            var just = Vex.Flow.Annotation.VerticalJustify[stave.clef == 'bass' ? 'BOTTOM' : 'TOP'];
            staveNote.addAnnotation(0, (new Vex.Flow.Annotation(label))
                    .setFont("Times", 12)
                    .setJustification(Vex.Flow.Annotation.Justify.CENTER)
                    .setVerticalJustification(just)
            );
        }
        console.log(voices);
        // Create a voice in 4/4
        var Voice = new Vex.Flow.Voice({
            num_beats: 4, beat_value: 4, resolution: Vex.Flow.RESOLUTION
        });
        // Add notes to voice
        Voice.addTickables(voices[0]);

        // Format and justify the notes
        new Vex.Flow.Formatter().joinVoices([Voice]).format([Voice], 300);

        // Render voice
        Voice.draw(stave.getContext(), stave);
    };
})(window.anticipatoryMusicProducer.Painter =
    window.anticipatoryMusicProducer.Painter || {}, jQuery);
