var sys = require('sys')
  , serialport = require('serialport')
  , SerialPort = serialport.SerialPort
;

var io = require('socket.io').listen(4649);

io.sockets.on('connection', function(socket) {
  var serial = new SerialPort('/dev/tty.usbmodemfa131', {
      baudrate: 9600
    , parser: serialport.parsers.readline()
  });
  
  serial.on('data', function(chunk) {
    // chunk is a Buffer object.
    var sent = chunk.toString().trim();
    socket.emit('serial', sent);
  });

  serial.on('error', function(message) {
    sys.puts('error: ' + message);
  });
});
