var Scheduler = anticipatoryMusicProducer.Scheduler;
var Painter = anticipatoryMusicProducer.Painter;
function readTextFile(file)
{
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                var allText = rawFile.responseText;
                alert(allText);
            }
        }
    }
    rawFile.send(null);
}
QUnit.test( "hello test", function( assert ) {
    var time_signature = {value: 4, count: 4};
    var bar = new Scheduler.Bar(0, time_signature, []);
    bar.initializeStartTime();

    var bar_obj = {
        note   : new Palette.Note(60),
        done   : true,
        timeOn : performance.now(),
        timeOff: performance.now() + 2000,
        tempo  : Scheduler.currentTempo
    };

    bar.bar_objects.push(bar_obj);

    Painter.show(0, [Scheduler.quantizeBar(bar), Scheduler.quantizeBar(bar), Scheduler.quantizeBar(bar)], 0);
    var s = new XMLSerializer();
    console.log(Painter.ctx);

    var content = s.serializeToString(Painter.ctx.paper.canvas);

    if (content == full_note) {
        console.log("YAY");
    }

    readTextFile("ground_truth/full_note.svg");
    assert.ok( 1 == "1", "Passed!" );
});
