import {Server} from 'socket.io'
import express from 'express'
import {createServer} from 'http'

import {game} from './game'
const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer)
const g = new game()
// this is just a temp counting thing, before we have frontend username entry
var count = 0
app.get('/', (req, res) => {
    res.send(window.location);
  });
console.log('server running!')

io.on('connection', socket => {
    g.addPlayer(socket, 'test'.concat(count.toString()))
    socket.on('mouseInput', data => {
      g.setShipDirection(g.players[socket.id], data)
    })
    socket.on('keyInput', data => {
      g.handleDirectionInput(g.players[socket.id], data)
    })
    count++
})
httpServer.listen(3000)



