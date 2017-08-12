// Load required modules
const mongo = require('mongodb').MongoClient;
var http    = require("http");              // http server core module
var https = require('https');
var fs = require('fs');
var app = require("express")();           // web framework external module
var serveStatic = require('serve-static');  // serve static files
var socketIo = require("socket.io");        // web socket external module
var easyrtc = require("easyrtc");               // EasyRTC external module
var dgram = require('dgram');
var request = require('request');
var axios = require('axios');
var options = {
  key: fs.readFileSync('keys/key.pem'),
  cert: fs.readFileSync('keys/cert.pem')
};

var brightness;

// Connect to mongo
//C:\Program Files\MongoDB\Server\3.4\bin


mongo.connect('mongodb://127.0.0.1/mongochat', function(err, db){
    if(err){
        throw err;
    }

    console.log('MongoDB connected...');

    // Connect to Socket.io
    socketServer.on('connection', function(socket){
      brightness = 254;

      getApiAndEmit(socket);



        let chat = db.collection('chats');

        // Create function to send status
        sendStatus = function(s){
            socket.emit('status', s);
        }

        // Get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err){
                throw err;
            }

            // Emit the messages
            socket.emit('output', res);
        });

        // Handle input events
        socket.on('input', function(data){
            let name = data.name;
            let message = data.message;

            // Check for name and message
            if(name == '' || message == ''){
                // Send error status
                sendStatus('Please enter a name and message');
            } else {
                // Insert message
                chat.insert({name: name, message: message}, function(){
                    socketServer.emit('output', [data]);

                    // Send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }
        });

        // Handle clear
        socket.on('clear', function(data){
            // Remove all chats from collection
            chat.remove({}, function(){
                // Emit cleared
                socket.emit('cleared');
            });
        });
    });
});

//C:\Program Files\MongoDB\Server\3.4\bin\mongod
const getApiAndEmit = async socket => {
  try {
    const energy = await axios.get(
      "http://192.168.0.6/emoncms/feed/timevalue.json?id=1&apikey=fddf9b5ee1d7217dd310bc0c5269e998"
    )
    const lightinfo = await axios.get(
      "http://192.168.0.3/api/aKkMwrFSuI4zeztRtAdF-KuY2LINDjkOlzMXps-O/lights/3"
    )
    const hashrate = await axios.post("http://dwarfpool.com/eth/api?wallet=c92c9889196360226815c353747a5a1e8d70fe91&email=eth@example.com"
  )
  const turnlighton = await axios.put(
    "http://192.168.0.3/api/aKkMwrFSuI4zeztRtAdF-KuY2LINDjkOlzMXps-O/lights/3/state",{"on":true, "bri":brightness,"hue":10000}
  )
    socket.emit("FromAPI",lightinfo.data, energy.data, hashrate.data,);
    } catch (e) {
    console.log(e);
  }
}

app.use(serveStatic(__dirname, {'index': ['html/index.html']}));
var webServer = http.createServer(app).listen(80,"192.168.0.4");
//var webServer = https.createServer(options, app).listen(80,"192.168.0.4");
var socketServer = socketIo.listen(webServer);

const udpServer = dgram.createSocket('udp4');
udpServer.bind(55424,"192.168.0.4");

var CPosX;
var CPosY;

udpServer.on('message', (msg1, rinfo) => {
  var BCIString = String.fromCharCode.apply(null, new Uint16Array(msg1))
  var CPx = BCIString.indexOf("CursorPosX");
  var CPy = BCIString.indexOf("CursorPosY");
  var TarC = BCIString.indexOf("TargetCode");
  var ResC = BCIString.indexOf("ResultCode");
  if(CPx == 0){
    CPosX = parseFloat(BCIString.substring(11,15));
  }
  if(CPy == 0){
    CPosY = parseFloat(BCIString.substring(11,15));
  }
  if(CPy == 0 || CPx == 0){
    socketServer.emit('Pos',{ PosX: (CPosX-1548)/387, PosY: ((CPosY-1548)/290)+6.15});
  }
});

var myIceServers = [
  {"url":"stun:stun.l.google.com:19302"},
  {"url":"stun:stun1.l.google.com:19302"},
  {"url":"stun:stun2.l.google.com:19302"},
  {"url":"stun:stun3.l.google.com:19302"}
  // {
  //   "url":"turn:[ADDRESS]:[PORT]",
  //   "username":"[USERNAME]",
  //   "credential":"[CREDENTIAL]"
  // },
  // {
  //   "url":"turn:[ADDRESS]:[PORT][?transport=tcp]",
  //   "username":"[USERNAME]",
  //   "credential":"[CREDENTIAL]"
  // }
];

easyrtc.setOption("appIceServers", myIceServers);
easyrtc.setOption("demosEnable", false);

// Start EasyRTC server
var rtc = easyrtc.listen(app, socketServer, null, function(err, rtcRef) {
    rtcRef.events.on("roomCreate", function(appObj, creatorConnectionObj, roomName, roomOptions, callback) {
    });
});
