const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', socket => {
  socket.emit('me', socket.id);

  socket.on('disconnect', () => {
    socket.broadcast.emit('callEnded');
  });

  socket.on('callUser', data => {
    const userExist = !!io.sockets.adapter.rooms.get(data.userToCall);
    if (userExist) {
      io.to(data.userToCall).emit('callUser', {
        signal: data.signalData,
        from: data.from,
        name: data.name,
      });
    } else {
      io.to(data.from).emit('userNotFound');
    }
  });

  socket.on('answerCall', data => {
    io.to(data.to).emit('callAccepted', data.signal);
  });

  socket.on('userDisconnect', () => {
    socket.broadcast.emit('callEnded');
  });
});

server.listen(5000, () => console.log('server is running on port 5000'));
