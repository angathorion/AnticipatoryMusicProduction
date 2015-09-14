(function (anticipatoryMusicProducer, $, undefined) {
    // add event handlers
    // rethink handler parameter passing
    anticipatoryMusicProducer.Interface.addNoteOnListener(anticipatoryMusicProducer.Painter.onNoteOn);
    anticipatoryMusicProducer.Interface.addNoteOnListener(anticipatoryMusicProducer.Scheduler.calculateNoteStartLocation);
    anticipatoryMusicProducer.Interface.addNoteOffListener(anticipatoryMusicProducer.Painter.onNoteOff);
    anticipatoryMusicProducer.Painter.show();
})(window.anticipatoryMusicProducer = window.anticipatoryMusicProducer || {}, jQuery);
