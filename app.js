var express = require('express')
  , app = express()
  , mongoose = require('mongoose')
  , http = require('http')
  , server = http.createServer(app)
  , routes = require('./routes')
  , socket = require('./routes/socket.js')
  , api = require('./routes/api.js')
  , io = require('socket.io').listen(server);
// Configuration
var config = require('./config')(app, express, mongoose);
// Routes
app.get('/', routes.index);
app.get   ('/api/list'    , api.list);
app.post  ('/api/add' , api.add);
app.post  ('/api/archive' , api.archive);
app.put   ('/api/update/:id', api.update);

// redirect all others to the index (HTML5 history)
app.get('*', routes.index);

// Socket.io Communication
io.sockets.on('connection', socket);

// Start server
var port = 3001;

server.listen(port);