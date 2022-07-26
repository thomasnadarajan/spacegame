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
    g.addConnection(socket)
    socket.on('addPlayer', (data) => {
      g.addPlayer(socket, 'test'.concat(count.toString()), data.s)
    })
    socket.on('mouseInput', data => {
      g.setShipDirection(g.players[socket.id], data)
    })
    socket.on('keyInput', data => {
      g.handleDirectionInput(socket.id, data)
    })
    socket.on('transport', data => {
      g.movePlayer(data.player, data.ship)
    })
    socket.on('powerUpdate', data => {
      g.handlePowerUpdate(data.system, data.level, data.ship)
    })
    count++
})
httpServer.listen(3000)



