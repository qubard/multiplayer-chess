var connect = require('connect');
var http = require('http');
var url = require('url');
var fs = require('fs');

var myModule = require('./myModule');

var app = connect()
var WebSocketServer = require('ws').Server;
var server = http.createServer(app);

var wss = new WebSocketServer({ server: server});

String.prototype.contains = function(s) { return this.indexOf(s) != -1; }

var FEN = ["rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"]; // the FEN stack maintained by the server, useful for sending the n-1'th FEN and then playing a move on the clientside so the highlighting isn't bugged
var lastMsg; // the last message

var white; var black;

wss.on('connection', function(ws) {
	console.log('Client connected ' + new Date());
	if(FEN.length > 1) {
		console.log("Sending data to new player.");
		broadcast(JSON.stringify({lastMove: lastMsg, FEN : FEN[FEN.length-2], currentFEN : FEN[FEN.length-1], online: wss.clients.length, white: white, black: black})); // update the FEN for everyone, send the n'th and n-1'th FEN
	} else {
		broadcast(JSON.stringify({FEN: FEN[0], currentFEN : FEN[0], online: wss.clients.length, white: white, black: black}));
		console.log("Sending default data.");
	}
	
	ws.on('message', function(msg) {
		var o = JSON.parse(msg);
		if(o.username) {
			console.log(o);
			if(o.color == 'w' && !white) {
				if(black != o.username) {
					white = o.username;
					broadcast(JSON.stringify({white:o.username, black: black}));
				}
			} else if(o.color == 'b' && !black) {
				if(white != o.username) {
					black = o.username;
					broadcast(JSON.stringify({black:o.username, white: white}));
				}
			}
		} else {
			if(o.FEN != null) {
				if(FEN[FEN.length-1] != o.FEN && FEN.indexOf(o.FEN) == -1) {
					FEN.push(o.FEN);
				}
				lastMsg = o;
				console.log("FEN stack looks like:");
				console.log(FEN);
			}
			broadcast(msg);
		}
	})
	
	ws.on('close', function() {
		if(wss.clients.length < 2) {
			white = null;
			black = null;
			lastMsg = null;
			FEN = ["rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"];
			broadcast(JSON.stringify({FEN: FEN[0], currentFEN : FEN[0], online: wss.clients.length, white: white, black: black})); 
		}
	})
});

function broadcast(msg) {
	wss.clients.forEach(function(client) {
		client.send(msg);
	});
}

// respond to all requests 
app.use(function(req, res){
	var urlObj = url.parse(req.url, true, false);
		if(urlObj.pathname.contains('index')) {
			myModule.readFile(fs, 'index.html', res);
		} else if(urlObj.pathname.contains('js') || urlObj.pathname.contains('css') || urlObj.pathname.contains('img')) {
			myModule.readFile(fs, urlObj.pathname.substring(1, urlObj.pathname.length), res);
		} else if(urlObj.pathname.contains('css')) {
			fs.readFile(urlObj.pathname.substring(1, urlObj.pathname.length), function(err, contents) {
				  if(!err) {
					  res.end(contents);
				  } else {
					  console.log(err);
				  }
			});
		}
 });
 
//create node.js http server and listen on port 
server.listen(80);