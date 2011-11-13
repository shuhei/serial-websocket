var serialport = require('serialport')
  , SerialPort = serialport.SerialPort
  , child = require('child_process')
  , express = require('express')
  , app = express.createServer()
  , io = require('socket.io').listen(app)
;

// Simple Array Remove inspired by John Resig
// http://ejohn.org/blog/javascript-array-remove/
Array.prototype.remove = function(i) {
  var sliced = this.slice(i + 1);
  this.length = i;
  // Use apply to push multiple values in an array.
  this.push.apply(this, sliced);
};

app.listen(3000);

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', { layout: false });

  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.get('/', function(req, res) {
  res.render('index', { socketHost: req.header('Header') });
});

var sockets = [];
io.sockets.on('connection', function(socket) {
  sockets.push(socket);
  io.sockets.on('diconnect', function() {
    for (var i = 0; i < sockets.length; i++) {
      if (sockets[i] === socket) {
        sockets.remove(i);
        break;
      }
    }
  });
});

child.exec('ls /dev/tty.usbmodem*', function(err, stdout, strerr) {
  if (err) {
    console.log(err.stack);
    process.exit(1);
  }
  
  var usbs = stdout.split('\n');
  if (usbs && usbs.length > 0) {
    startSerial(usbs[0]);
  } else {
    console.log('No USB device connected.');
    process.exit(1);
  }
});

function startSerial(path) {
  var serial = new SerialPort(path, {
      baudrate: 9600
    , parser: serialport.parsers.readline()
  });
  console.log('Connected to ' + path);

  serial.on('data', function(chunk) {
    // chunk is a Buffer object.
    var sent = chunk.toString().trim();
    for (var i = 0; i < sockets.length; i++) {
      sockets[i].emit('serial', sent);
    }
  });
  
  serial.on('error', function(message) {
    console.log('error: ' + message);
  });
}

