import {Server} from 'socket.io'
import express from 'express'
import {createServer} from 'http'
import path from 'path'
import {game} from './game'
import {star} from '../shared/star'
const app = express()
const PORT = process.env.PORT || 5500
const httpServer = createServer(app)
const io = new Server(httpServer)
const g = new game()

let stars = []
for (let i = 0; i < 2000; i++) {
    stars.push(new star(25000, 25000))
}

app.use(express.static(path.resolve('./src/client/serve')))

console.log('server running!')

io.on('connection', socket => {
    g.addConnection(socket)
    socket.emit('stars', stars)
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
    socket.on('disconnect', () => {
      g.disconnect(socket)
      socket.disconnect()
    })
    socket.on('stopDirection', data => {
      g.stopDirection(socket.id, data)
    })
})
httpServer.listen(PORT)



