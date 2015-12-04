var Scheduler = anticipatoryMusicProducer.Scheduler;
var Painter = anticipatoryMusicProducer.Painter;

QUnit.test( "hello test", function( assert ) {
    var time_signature = {value: 4, count: 4};
    var bar = new Scheduler.Bar(0, time_signature, []);
    bar.initializeStartTime();

    var bar_obj = {
        note   : new Palette.Note(60),
        done   : true,
        timeOn : performance.now(),
        timeOff: performance.now() + 2500,
        tempo  : Scheduler.currentTempo
    };

    bar.bar_objects.push(bar_obj);

    Painter.show(0, [Scheduler.quantizeBar(bar), Scheduler.quantizeBar(bar), Scheduler.quantizeBar(bar)], 0);
    var s = new XMLSerializer();
    console.log(Painter.ctx);

    var content = s.serializeToString(Painter.ctx.paper.canvas);
    var ans = anticipatoryMusicProducer.Scheduler.quantizeBar(bar);
    console.log(content);
    assert.ok( 1 == "1", "Passed!" );
});
