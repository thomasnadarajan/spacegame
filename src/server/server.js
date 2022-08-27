import {Server} from 'socket.io'
import express from 'express'
import {createServer} from 'http'

import {game} from './game'
const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer)
const g = new game()
app.get('/', (req, res) => {
    res.send(window.location);
  });
console.log('server running!')

io.on('connection', socket => {
    g.addConnection(socket)
    socket.on('addPlayer', (data) => {
      g.addPlayer(socket, data.u, data.s)
    })
    socket.on('mouseInput', data => {
      g.setShipDirection(g.players[socket.id], data)
    })
    socket.on('keyInput', data => {
      g.handleDirectionInput(socket.id, data)
    })
    socket.on('transport', data => {
      try{
        g.movePlayer(data.player, data.ship)
      }
      catch (err) {
        if (err.name === 'TypeError') {
          console.log(err)
        }
      }
    })
    socket.on('powerUpdate', data => {
      g.handlePowerUpdate(data.system, data.level, data.ship)
    })
    socket.on('fire', data => {
      g.handleFire(data.angle, data.ship)
    })
    socket.on('playerWeaponsDirection', data => {
      g.handlePlayerDirection(socket.id, data)
    })
    socket.on('playerFire', () => {g.handlePlayerFire(socket.id)})
    socket.on('startCargoTransport', data => {
      g.handleTransportStart(data)
    })
    socket.on('cancelCargoTransport', data => {
      g.cancelTransportRequest(data)
    })
})
httpServer.listen(3000)



