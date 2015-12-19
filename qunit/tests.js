QUnit.module("module", {
    beforeEach: function(assert) {
        var divs = '<div id="test" style="visibility: hidden">' +
            '<canvas id="scoresheet" width="2000" height="500"></canvas>' +
            '<canvas id="collaborator_scoresheet" width="2000" height="500"></canvas>' +
            '<script>var socket = io()</script>' +
            '<form><label for="bar_offset">Bar Offset</label><select name="bar_offset" id="bar_offset">' +
            '<option value="1" selected>1</option><option value="2">2</option><option value="3">3</option>' +
            '<option value="4">4</option></select></form><div id="debug_data"></div></div>';
        var fixture = $("#qunit-fixture");
        fixture.append(divs);
        anticipatoryMusicProducer.init();
    },
    afterEach: function(assert) {
        anticipatoryMusicProducer.stop();
    }

});

QUnit.test("Full Note", function(assert) {
    var Scheduler = anticipatoryMusicProducer.Scheduler;
    Painter(window.anticipatoryMusicProducer.playerPainter =
        window.anticipatoryMusicProducer.playerPainter || {}, document.getElementById('scoresheet'), jQuery);
    var playerPainter = window.anticipatoryMusicProducer.playerPainter;
    var time_signature = {value: 4, count: 4};
    var bar = new Scheduler.Bar(0, time_signature, []);

    var bar_obj = {
        note   : new Palette.Note(60),
        done   : true,
        timeOn : performance.now(),
        timeOff: performance.now() + 2000,
        tempo  : Scheduler.currentTempo
    };

    bar.bar_objects.push(bar_obj);

    playerPainter.show(0, [Scheduler.quantizeBar(bar), Scheduler.quantizeBar(bar), Scheduler.quantizeBar(bar)], 0);

    assert.equal(playerPainter.player_context.hash(), '8b342642ca1722a720db7c2190b5ed8a');
});
