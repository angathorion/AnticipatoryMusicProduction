(function (anticipatoryMusicProducer, $, undefined) {
    // add event handlers
    // rethink handler parameter passing
    anticipatoryMusicProducer.Interface.addNoteOnListener(anticipatoryMusicProducer.Painter.onNoteOn);
    anticipatoryMusicProducer.Interface.addNoteOffListener(anticipatoryMusicProducer.Painter.onNoteOff);
    anticipatoryMusicProducer.Interface.addNoteOnListener(anticipatoryMusicProducer.Scheduler.onNoteOn);
    anticipatoryMusicProducer.Interface.addNoteOffListener(anticipatoryMusicProducer.Scheduler.onNoteOff);
    anticipatoryMusicProducer.interval = setInterval(anticipatoryMusicProducer.Scheduler.eventLoop,
        anticipatoryMusicProducer.Scheduler.interval);
})(window.anticipatoryMusicProducer = window.anticipatoryMusicProducer || {}, jQuery);
