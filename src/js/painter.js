(function (palette, $, undefined) {
    palette.Note = function(note, direction) {
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
            }
            else if (parts[2] == 'b') {
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

    palette.Note.prototype.letter = function () {
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

    palette.Note.prototype.accidental = function () {
        if ([1, 3, 6, 8, 10].indexOf(this.semitone) == -1) {
            return "";
        }
        if (this.direction == 'up') {
            return "#";
        }
        return "b";
    };

    palette.Note.prototype.toString = function () {
        var parts = [this.letter(), this.accidental()];
        if (this.octave !== null) {
            parts.push('/' + this.octave);
        }
        return parts.join('');
    };
})(window.anticipatoryMusicProducer.Palette =
    window.anticipatoryMusicProducer.Palette || {}, jQuery);

(function (painter, $, undefined) {
    var activeNotes = [];

    painter.onNoteOn = function(note) {
        activeNotes.push(new window.anticipatoryMusicProducer.Palette.Note(note));
        painter.show();
    };

    painter.onNoteOff = function(note) {
        activeNotes = activeNotes.filter(function(noteObj) { return (noteObj.number != note); });
        painter.show();
    };

    painter.show = function(label) {
        this.canvas = document.getElementById('canvas');
        this.clear();
        var notes = activeNotes;
        var treble = notes.filter(function(note) { return (note.octave >= 4); });
        var bass = notes.filter(function(note) { return (note.octave < 4); });

        var staves = drawGrandStaff();

        drawNotes(staves.treble, treble, label);
        drawNotes(staves.bass, bass, label);
    };

    painter.clear = function() {
        while (this.canvas.lastChild) {
            this.canvas.removeChild(this.canvas.lastChild);
        }
        this.renderer = new Vex.Flow.Renderer(this.canvas, Vex.Flow.Renderer.Backends.RAPHAEL);
        this.ctx = this.renderer.getContext();
    };

    var drawTrebleStaff = function(x) {
        var y = 110;
        x = x || 20;
        return new Vex.Flow.Stave(x, y, 400).addClef('treble').setContext(painter.ctx).draw();
    };

    var drawBassStaff = function(x) {
        var y = 170;
        x = x || 20;
        return new Vex.Flow.Stave(x, y, 400).addClef('bass').setContext(painter.ctx).draw();
    };

    var drawGrandStaff = function() {
        var trebleStave = drawTrebleStaff();
        var bassStave = drawBassStaff();

        new Vex.Flow.StaveConnector(trebleStave, bassStave).setType(3).setContext(painter.ctx).draw();
        new Vex.Flow.StaveConnector(trebleStave, bassStave).setType(1).setContext(painter.ctx).draw();
        new Vex.Flow.StaveConnector(trebleStave, bassStave).setType(6).setContext(painter.ctx).draw();

        return {treble: trebleStave, bass: bassStave};
    };

    var drawNotes = function(stave, notes, label) {
        if (!notes.length) return;

        var staveNote = new Vex.Flow.StaveNote({
            clef: stave.clef, duration: "w",
            keys: notes.map(function(n) { return n.toString(); })
        });

        notes.forEach(function(note, i) {
            if (note.accidental()) {
                staveNote.addAccidental(i, new Vex.Flow.Accidental(note.accidental()));
            }
        });

        if (label) {
            var just = Vex.Flow.Annotation.VerticalJustify[stave.clef == 'bass' ? 'BOTTOM' : 'TOP'];
            staveNote.addAnnotation(0, (new Vex.Flow.Annotation(label))
                    .setFont("Times", 12)
                    .setJustification(Vex.Flow.Annotation.Justify.CENTER)
                    .setVerticalJustification(just)
            );
        }

        // Create a voice in 4/4
        var Voice = new Vex.Flow.Voice({
            num_beats: 4, beat_value: 4, resolution: Vex.Flow.RESOLUTION
        });

        // Add notes to voice
        Voice.addTickables([staveNote]);

        // Format and justify the notes
        new Vex.Flow.Formatter().joinVoices([Voice]).format([Voice], 300);

        // Render voice
        Voice.draw(stave.getContext(), stave);
    };
})(window.anticipatoryMusicProducer.Painter =
    window.anticipatoryMusicProducer.Painter || {}, jQuery);
