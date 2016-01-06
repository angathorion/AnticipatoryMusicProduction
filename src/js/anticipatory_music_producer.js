(function (anticipatoryMusicProducer, $, undefined) {
    anticipatoryMusicProducer.Interface = anticipatoryMusicProducer.Interface || {};
    anticipatoryMusicProducer.Scheduler = anticipatoryMusicProducer.Scheduler || {};
    anticipatoryMusicProducer.playerPainter = anticipatoryMusicProducer.playerPainter || {};
    anticipatoryMusicProducer.collaboratorPainter = anticipatoryMusicProducer.collaboratorPainter || {};
    anticipatoryMusicProducer.motionDetector = anticipatoryMusicProducer.motionDetector || {};
    anticipatoryMusicProducer.detectMotion = true;
    anticipatoryMusicProducer.init = function() {
        if (this.detectMotion) {
            this.motionDetector.initialize();
            this.motionDetector.start();
        }

        this.interval.run();
    };

    anticipatoryMusicProducer.stop = function() {
        this.motionDetector.stop();
        this.interval.stop();
    };

    // Self-correcting timer
    anticipatoryMusicProducer.setInterval = function(fn, duration){
        this.baseline = undefined;
        this.rate = "unchanged";
        this.run = function(){
            this.baseline = performance.now();
            anticipatoryMusicProducer.Scheduler.incrementBeat();
            fn();

            var end = performance.now();
            this.baseline += duration;

            var nextTick = duration - (end - this.baseline);
            if(nextTick<0){
                nextTick = 0
            }

            if (this.rate == "up") {
                nextTick = 0;
            } else if (this.rate == "down") {
                nextTick /= 0.8;
            }


            (function(i){
                i.timer = setTimeout(function(){
                    i.run(end)
                }, nextTick)
            }(this))
        };

        this.stop = function(){
            clearTimeout(this.timer)
        }
    };


})(window.anticipatoryMusicProducer = window.anticipatoryMusicProducer || {}, jQuery);

(function (Palette, $, undefined) {
    Palette.BarObject = function (isRest, endBeat, startBeat, note) {
        if (endBeat > 4.0) {
            throw "Error";
        }
        this.rest = isRest ? 1 : 0;
        this.endBeat = endBeat;
        this.startBeat = startBeat;
        this.note = note;
        return this;
    };

    Palette.BarObject.prototype.toString = function() {
        return "".concat(this.rest.toString(), this.endBeat.toString(), this.startBeat.toString(), this.note.toString());
    };

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
})(window.Palette =
    window.Palette || {}, jQuery);
