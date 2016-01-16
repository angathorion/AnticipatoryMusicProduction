(function (Player, $, undefined) {
    Player.init = function() {
        var instrumentNameSelector = document.getElementById("instrument_name");
        var instrumentName = "acoustic_grand_piano";
        if (instrumentNameSelector) {
            instrumentName = instrumentNameSelector.options[instrumentNameSelector.selectedIndex].value;
        }
        MIDI.loadPlugin({
            soundfontUrl: "./soundfont/",
            instrument  : instrumentName,
            onprogress  : function (state, progress) {},
            onsuccess   : function (note, velocity) {
                MIDI.programChange(0, MIDI.GM.byName[instrumentName].number);
            }
        });
        checkAndLoadInstruments();
    };

    Player.init();
    function checkAndLoadInstruments() {
        // check if instruments are different
        // load if they are
    }

    Player.playBar = function(bar, channel) {
        checkAndLoadInstruments();
        var base = bar.barStart;
        bar.barObjects.forEach(function(barObject) {
            var note = barObject.note.number;
            var velocity = barObject.velocity;
            var timeOn = (barObject.timeOn - base) / 1000;
            var timeOff = (barObject.timeOff - base) / 1000;
            MIDI.noteOn(channel, note, velocity, timeOn);
            MIDI.noteOff(channel, note, timeOff);
        });
    }
})(window.anticipatoryMusicProducer.Player =
    window.anticipatoryMusicProducer.Player || {}, jQuery);
