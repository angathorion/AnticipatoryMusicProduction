(function (anticipatoryMusicProducer, $, undefined) {
    // add event handlers
    // rethink handler parameter passing
    anticipatoryMusicProducer.Interface.addNoteOnListener(anticipatoryMusicProducer.Painter.onNoteOn);
    anticipatoryMusicProducer.Interface.addNoteOffListener(anticipatoryMusicProducer.Painter.onNoteOff);
    anticipatoryMusicProducer.Interface.addNoteOnListener(anticipatoryMusicProducer.Scheduler.onNoteOn);
    anticipatoryMusicProducer.Interface.addNoteOffListener(anticipatoryMusicProducer.Scheduler.onNoteOff);
    anticipatoryMusicProducer.interval = new anticipatoryMusicProducer.setInterval(anticipatoryMusicProducer.Scheduler.eventLoop,
        anticipatoryMusicProducer.Scheduler.interval / anticipatoryMusicProducer.Scheduler.refreshMultiplier);
    anticipatoryMusicProducer.interval.run();
})(window.anticipatoryMusicProducer = window.anticipatoryMusicProducer || {}, jQuery);
