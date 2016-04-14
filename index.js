var express = require('express');
var app = express();
var http = require('http').Server(app);


////
var https = require('https');
var fs = require('fs');

var options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};

var a = https.createServer(options, app).listen(5000);

http = a;
////

var io = require('socket.io')(http);


app.use(express.static('src'));
app.use('/js/vendor', express.static('node_modules'));


app.get('/', function(req, res){
    res.sendFile(__dirname + '/src/index.html');
});

app.set('port', (process.env.PORT || 5000));

http.listen(app.get('port'), function(){
    console.log('listening on *:' + app.get('port'));
});

var users = new Object();

io.sockets.on('connection', function (socket) {
    socket.on('heartbeat', function() {
        socket.broadcast.emit('heartbeat');
    });


    socket.on('init', function(data) {
        console.log("users in room: " + Object.keys(io['sockets']['adapter']['rooms'][data.sessionName]).length.toString());
        if (Object.keys(io['sockets']['adapter']['rooms'][data.sessionName]).length == 1) {
            console.log('start');
            io.to(socket.id).emit('start');
        } else {
            console.log('wait for heartbeat');
            io.to(socket.id).emit('wait_for_heartbeat');
        }
    });

    socket.on('subscribe', function(data) {
        console.log(data.username + " has joined " + data.sessionName);
        socket.join(data.sessionName);
        users[socket.id] = data;
        io.to(data.sessionName).emit('user joined', data);
    });

    socket.on('disconnect', function() {
        if (users[socket.id]) {
            console.log(users[socket.id].username + " has left " + users[socket.id].sessionName);
            io.to(users[socket.id].sessionName).emit('user left', users[socket.id]);
            users[socket.id] = "";
        }
    });

    socket.on('broadcast_canvas', function(data) {
        if (users[socket.id]) {
            socket.broadcast.to(users[socket.id].sessionName).volatile.emit('receive_canvas', data);
        }
    });

    socket.on('send_midi_signals', function(data) {
        if (users[socket.id]) {
            socket.broadcast.to(users[socket.id].sessionName).volatile.emit('receive_midi_signals', data);
        }
    });

    socket.on('request_connected_count', function(data) {
        io.to(socket.id).emit(Object.keys(io['sockets']['adapter']['rooms'][data.sessionName]).length);
    })
});
