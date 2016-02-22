(function (Player, $, undefined) {
    Player.previous = {};
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
        Player.previous[0] = instrumentName;
        checkAndLoadInstruments();
    };

    Player.init();
    function checkAndLoadInstruments() {
        // check if instruments are different
        // load if they are
    }

    Player.playBar = function(bar, instrumentName, channel) {
        checkAndLoadInstruments();
        if (channel in Player.previous) {
            if (Player.previous[channel] != instrumentName) {
                Player.previous[channel] = instrumentName;
                MIDI.loadPlugin({
                    soundfontUrl: "./soundfont/",
                    instrument  : instrumentName,
                    onprogress  : function (state, progress) {},
                    onsuccess   : function (note, velocity) {
                        MIDI.programChange(channel, MIDI.GM.byName[instrumentName].number);
                    }
                });
            }
        } else {
            Player.previous[channel] = instrumentName;
            MIDI.loadPlugin({
                soundfontUrl: "./soundfont/",
                instrument  : instrumentName,
                onprogress  : function (state, progress) {},
                onsuccess   : function (note, velocity) {
                    MIDI.programChange(channel, MIDI.GM.byName[instrumentName].number);
                }
            });
        }
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
