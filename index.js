var express = require('express');
var app = express();
var http = require('http').Server(app);

app.use(express.static('src'));
app.use('/js/vendor', express.static('node_modules'));


app.get('/', function(req, res){
    res.sendFile(__dirname + '/src/index.html');
});

app.set('port', (process.env.PORT || 5000));

http.listen(app.get('port'), function(){
    console.log('listening on *:' + app.get('port'));
});
