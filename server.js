const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
const requestIp = require('request-ip')
const redis = require("redis")
const redisClient = redis.createClient()
require('colors')

function consoleLog(event, method, msg = undefined) {
  console.log(event.red + '.' + method.yellow + (msg !== undefined ? (' => ' + msg) : ''))
}

// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/index.html');
// });

redisClient.sadd('channels', 'green');
redisClient.sadd('channels', 'blue');
redisClient.sadd('channels', 'yellow');
redisClient.sadd('channels', 'red');

io.on('connection', (socket) => {

  socket.on('chat.join', data => {
    redisClient.smembers('channels', (err, channels) => {
      channels.forEach(channel => {
        socket.emit('channel.get', JSON.stringify({channel}));
      });
    });
  })

  socket.on('channel.join', data => {

    const parsedData = JSON.parse(data)
    consoleLog('chat', 'join', `${parsedData.username} in channel ${parsedData.channel} has IP ${requestIp.getClientIp(socket.request)}`)
    socket.username = parsedData.username
    socket.channel = parsedData.channel
    socket.join(socket.channel)
    socket.broadcast.emit('channel.join', JSON.stringify({channel: parsedData.channel, username: parsedData.username}))

    // Retrieve all users from the SET "users"
    redisClient.smembers('user$[socket.channel]', (err, users) => {
      users.forEach(user => {
          socket.emit('channel.add_user', JSON.stringify({
            username: user,
            channel: socket.channel,
          }));
      });
    });
    redisClient.smembers('channels', (err, channels) => {
      channels.forEach(channel => {
        socket.emit('channel.get', JSON.stringify({channel}));
      });
    });

    // Retrieve all messages of the LIST "messages"
    redisClient.lrange(`messages$[socket.channel]`, 0, 40, (err, jsonMessages) => {
      jsonMessages.reverse().forEach((jsonMessage) => {
        socket.emit('chat.message', jsonMessage);
      });
    });

    // Add current user to the SET "users"
    redisClient.sadd('user$[socket.channel]', socket.username);
  })

  // socket.on('channel.join', (data) => {
  //   const parsedData = JSON.parse(data)
  //   consoleLog('chat', 'join', ('[' + socket.username + ']').bold + " " + parsedData.channel)
  //   socket.username = parsedData.username
  //   socket.channel = parsedData.channel
  //   socket.join(socket.channel)
  // })

  socket.on('channel.leave', (data) => {
    const parsedData = JSON.parse(data)
    socket.username = parsedData.username
    socket.channel = parsedData.channel
    socket.leave(socket.channel)
    redisClient.del('user$[socket.channel]', socket.username);
    socket.broadcast.emit('channel.del_user', JSON.stringify({
      username: socket.username,
      channel: socket.channel,
    }));

  })
  socket.on('chat.message', (data) => {
    console.log(data)
    const parsedData = JSON.parse(data)
    consoleLog('chat', 'message', ('[' + socket.username + ']').bold + ' ' +  parsedData.channel + ': ' + parsedData.message)
    const response = JSON.stringify({
      username: socket.username,
      message: parsedData.message,
      channel: parsedData.channel
    });

    redisClient.lpush(`messages$[socket.channel]`, response, (err, reply) => {
      console.log('redis lpush => ' + reply);
    });
    // socket.broadcast.emit('chat.message', response)
    io.emit('chat.message', response)
  })

  socket.on('disconnect', () => {
    consoleLog('socket', 'disconnect', ('[' + socket.username + ']').bold + ' socket closed')

    if (socket.username !== undefined) {
      // Emit event "chat.disconnect" to connected users (without the current one)
      socket.broadcast.emit('chat.disconnect', JSON.stringify({
        username: socket.username
      }))

      // Remove current user to the SET "users"
      redisClient.srem('users', socket.username)
    }
  })
})

http.listen(port, () => {
  console.log('listening on *:' + port)
})
