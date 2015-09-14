(function (anticipatoryMusicProducer, $, undefined) {
    // add event handlers
    anticipatoryMusicProducer.Interface.addNoteOnListener(anticipatoryMusicProducer.Painter.onNoteOn);
    anticipatoryMusicProducer.Interface.addNoteOffListener(anticipatoryMusicProducer.Painter.onNoteOff);
    anticipatoryMusicProducer.Painter.show();

})(window.anticipatoryMusicProducer = window.anticipatoryMusicProducer || {}, jQuery);
