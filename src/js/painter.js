(function (Painter, $, undefined) {
    /**
     * Array of Notes that are currently active (i.e. note-on messages received, but not note-off)
     * Will be updated by onNoteOn/onNoteOff callbacks
     * @type {Palette.Note[]}
     */
    var activeNotes = [];
    var cache = false;
    Painter.unprocessedCache = [{}, {}, {}, {}, {}, {}];
    Painter.cachedResults = [null, null, null, null, null, null];

    /**
     * A callback that adds a given note to be drawn on the canvas
     * @param {number} note The MIDI value of the note
     */
    Painter.onNoteOn = function (note) {
        activeNotes.push(new Palette.Note(note));
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

    Painter.clearActiveNotes = function(beatOffset){
        // Clean all active notes at the start of each bar
        if (beatOffset == 0 && activeNotes.length != 0) {
            activeNotes = [];
        }
    };

    // Clear canvas for new frame
    Painter.clearCanvas = function() {
        this.canvas = document.getElementById('canvas');
        this.clear();
    };

    Painter.drawNowMarker = function() {
        Painter.ctx.paper.path( "M260,60 L260,800" );
    };

    var drawBarObjects = function(barObjects, stave) {
        var Voices = barObjects.voices;
        var tiesArray = barObjects.ties;
        var beamsArray = barObjects.beams;
        Voices.forEach(function (voice) {
            voice.draw(Painter.ctx, stave);
        });

        tiesArray.forEach(function (tie) {
            //tie.setContext(stave.getContext()).draw();
        });

        beamsArray.forEach(function (beam) {
            beam.setContext(Painter.ctx).draw();
        });
    };

    Painter.drawBars = function (beatOffset, bars, label) {
        var x, y, width, y_separation, drawStaffBrackets, drawFrontConnector, drawEndConnector;
        width = 400;
        y = 110;
        x = -80 - beatOffset * width;
        y_separation = 90;
        drawStaffBrackets = true;
        drawFrontConnector = true;
        drawEndConnector = false;
        bars.forEach(function (bar, index, array) {
            if (index != 0) {
                drawStaffBrackets = false;
            }
            if (index == array.length - 1) {
                drawEndConnector = true;
            }
            var staves = makeGrandStaff(x, y, width, y_separation, drawStaffBrackets, drawFrontConnector, drawEndConnector);

            if (!cache || Painter.unprocessedCache[index].toString() != bar.toString()) {
                var bar_objects = bar.bar_objects.filter(function (bar_object) {
                    return bar_object.endBeat > bar_object.startBeat;
                });
                this.canvas = document.getElementById('canvas');
                var treble = bar_objects.filter(function (bar_object) {
                    return (bar_object.note.octave >= 4);
                });
                var bass = bar_objects.filter(function (bar_object) {
                    return (bar_object.note.octave < 4);
                });

                var time_signature = bar.time_signature;

                var trebleBarObjects = makeBarObjects(staves.treble, processNotes(treble), time_signature, label);
                var bassBarObjects = makeBarObjects(staves.bass, processNotes(bass), time_signature, label);

                Painter.unprocessedCache[index] = bar;
                Painter.cachedResults[index] = {treble: trebleBarObjects, bass: bassBarObjects};
            }
            staves.treble.draw();
            staves.bass.draw();
            drawBarObjects(Painter.cachedResults[index].treble, staves.treble);
            drawBarObjects(Painter.cachedResults[index].bass, staves.bass);

            x += width;
        });
    };
    Painter.show = function (label, bars, beatOffset) {
        Painter.clearActiveNotes(beatOffset);
        Painter.clearCanvas();
        Painter.drawNowMarker();
        Painter.drawBars(beatOffset, bars, label);
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
        var maxVoices = 7;
        var voices = [[groups.shift()]];
        while (groups.length > 0 && maxVoices > 0) {
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
                voices.push([groups.shift()]);
                maxVoices -= 1;
            }
        }
        return voices;
    };

    var makeStaff = function (x, y, width, type) {
        y = y || 110;
        x = x || 20;
        width = width || 400;
        var stave = new Vex.Flow.Stave(x, y, width);
        // Setting clef type and drawing it is separate because of decoupled engraving logic
        stave.clef = type;
        return stave.setContext(Painter.ctx);
    };

    var makeGrandStaff = function (x, y, width, y_separation, drawStaffBrackets, drawFrontConnector,
                                   drawEndConnector) {
        var trebleStave = makeStaff(x, y, width, 'treble');
        var bassStave = makeStaff(x, y + y_separation, width, 'bass');

        if (drawStaffBrackets)
            new Vex.Flow.StaveConnector(trebleStave, bassStave).setType(3).setContext(Painter.ctx).draw();
        if (drawFrontConnector)
            new Vex.Flow.StaveConnector(trebleStave, bassStave).setType(1).setContext(Painter.ctx).draw();
        if (drawEndConnector)
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

    var buildSeparateNotes = function (staveNote, value, note_type, stave, time_signature, startRendered, staveNoteArray, tieArray, color) {
        var staveNoteSplitData = calculateStaveNoteSplit(value);
        var opts = {
            clef     : stave.clef,
            duration : (anticipatoryMusicProducer.Scheduler.quantization_interval_denominator / (staveNoteSplitData.base_value / time_signature.value)).toString() +
            stringFill("d", staveNoteSplitData.num_dots) + note_type,
            keys     : staveNote.map(function (note) {
                return note.note.toString();
            }),
            auto_stem: true
        };
        var noteGroup = new Vex.Flow.StaveNote(opts);
        noteGroup.setStyle({fillStyle: color,  strokeStyle: color, stemStyle: color});
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
            var notes = buildSeparateNotes(staveNote, staveNoteSplitData.remainder, note_type, stave, time_signature, true, staveNoteArray, tieArray, color);
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

    var makeBarObjects = function (stave, voices, time_signature) {
        var rest_pos = stave.clef == "treble" ? 71 : 50;

        // This does rest padding
        for (var j = 0; j < voices.length; j++) {
            var voice = voices[j];
            var end = time_signature.count;
            for (var i = voice.length - 1; i >= 0; i--) {
                if (voice[i][0].endBeat < end) {
                    voice.splice(i + 1, 0,
                        [new Palette.BarObject(true, end, voice[i][0].endBeat, new Palette.Note(rest_pos))]);
                }
                end = voice[i][0].startBeat;
            }
            if (voice[0][0].startBeat > 0) {
                voice.splice(0, 0, [new Palette.BarObject(true, voice[0][0].startBeat, 0, new Palette.Note(rest_pos))]);
            }
        }

        if (voices.length == 0) {
            voices = [[[new Palette.BarObject(true, time_signature.count, 0, new Palette.Note(rest_pos))]]];
        }
        // This breaks up the notes
        var tiesArray = [];
        var beamsArray = [];
        voices = voices.map(function (currentVoice) {
            var staveNoteArray = [];
            var colors = ["red", "black", "orange", "green", "blue", "purple"];
            var colorIndex = 0;
            currentVoice.forEach(function (staveNote) {
                var full_value = (staveNote[0].endBeat - staveNote[0].startBeat) * anticipatoryMusicProducer.Scheduler.quantization_interval_denominator;
                var note_type = (staveNote[0].rest == 1 ? "r" : "");
                var notes = buildSeparateNotes(staveNote, full_value, note_type, stave, time_signature, false, staveNoteArray, tiesArray, colors[colorIndex]);

                staveNoteArray = notes.staveNoteArray;
                tiesArray = notes.tieArray;
                colorIndex += 1;
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
            {autobeam: true, align_rests: false, context: Painter.ctx, stave: stave});

        beamsArray = _.flatten(beamsArray);

        return {voices: Voices, ties: tiesArray, beams: beamsArray, minWidth: formatter.getMinTotalWidth()};
    };

})(window.anticipatoryMusicProducer.Painter =
    window.anticipatoryMusicProducer.Painter || {}, jQuery);
