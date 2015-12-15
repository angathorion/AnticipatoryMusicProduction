(function (anticipatoryMusicProducer, $, undefined) {
    // add event handlers
    // rethink handler parameter passing
    anticipatoryMusicProducer.Interface.addNoteOnListener(anticipatoryMusicProducer.playerPainter.onNoteOn);
    anticipatoryMusicProducer.Interface.addNoteOffListener(anticipatoryMusicProducer.playerPainter.onNoteOff);
    anticipatoryMusicProducer.Interface.addNoteOnListener(anticipatoryMusicProducer.Scheduler.onNoteOn);
    anticipatoryMusicProducer.Interface.addNoteOffListener(anticipatoryMusicProducer.Scheduler.onNoteOff);
    anticipatoryMusicProducer.interval = new anticipatoryMusicProducer.setInterval(
        anticipatoryMusicProducer.Scheduler.eventLoop, anticipatoryMusicProducer.Scheduler.interval);
})(window.anticipatoryMusicProducer = window.anticipatoryMusicProducer || {}, jQuery);
