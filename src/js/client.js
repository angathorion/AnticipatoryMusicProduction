$(function() {
    // Initialize variables
    var $window = $(window);
    var $nicknameInput = $('#nickname'); // Input for username
    var $sessionInput = $('#session'); // Input for username

    var $loginPage = $('.login.page'); // The login page
    var $playerScoresheet = $('#scoresheet');
    var $collaboratorScoresheet = $('#collaborator_scoresheet');

    // Prompt for setting a username
    var username;
    var sessionName = "";

    var connected = false;

    var socket = io();

    var waitForHeartbeat = false;
    var inRoom = false;

    // Sets the client's username
    function tryJoinSession () {
        username = cleanInput($nicknameInput.val().trim());
        sessionName = cleanInput($sessionInput.val().trim());

        // If the username is valid
        if (username && sessionName) {
            $loginPage.off('click');

            // Join session with username
            socket.emit('subscribe', {username: username, sessionName: sessionName});
            socket.emit('init', {username: username, sessionName: sessionName});
            $loginPage.fadeOut();
        }
    }

    // Prevents input from having injected markup
    function cleanInput (input) {
        return $('<div/>').text(input).text();
    }

    // Keyboard events

    $window.keydown(function (event) {
        // When the client hits ENTER on their keyboard
        if (event.which === 13) {
            if (!inRoom) {
                tryJoinSession();
            }
        }
    });

    // Socket events
    socket.on('start', function () {
        inRoom = true;
        console.log("Received init");
        anticipatoryMusicProducer.init();
        $playerScoresheet.fadeIn();
    });

    // Whenever the server emits 'new message', update the chat body
    socket.on('receive_canvas', function (data) {
        //anticipatoryMusicProducer.Painter.collaborator_context.drawImage(
        //    data, 0, 0);
        //var canvas = anticipatoryMusicProducer.Painter.collaborator_canvas;
        //canvas.loadFromJSON(data, canvas.renderAll.bind(canvas));
        //anticipatoryMusicProducer.Painter.collaborator_canvas.getContext('2d').drawImage(data.datastring, 0, 0);
        requestAnimationFrame(function() {
            anticipatoryMusicProducer.collaboratorPainter.show.bind(anticipatoryMusicProducer.collaboratorPainter, "",
                data.quantized_bars, data.offset)();
        });
    });

    socket.on('wait_for_heartbeat', function() {
        console.log('waiting for heartbeat');
        waitForHeartbeat = true;
    });

    // Whenever the server emits 'user joined', log it in the chat body
    socket.on('user joined', function (data) {
        console.log(data.username + ' joined ' + data.sessionName);
    });

    // Whenever the server emits 'user left', log it in the chat body
    socket.on('user left', function (data) {
        console.log(data.username + ' left ' + data.sessionName);
    });

    socket.on('heartbeat', function () {
        if (!inRoom && waitForHeartbeat) {
            inRoom = true;
            waitForHeartbeat = false;
            anticipatoryMusicProducer.init();
            $playerScoresheet.fadeIn();
            $collaboratorScoresheet.fadeIn();
        }
    })
});
