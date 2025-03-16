import {Server} from 'socket.io'
import express from 'express'
import {createServer} from 'http'
import path from 'path'
import {game} from './game'
import {star} from '../shared/star'
const app = express()
const PORT = process.env.PORT || 8081
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
})
const g = new game()

let stars = []
for (let i = 0; i < 25000; i++) {
    stars.push(new star(10000, 10000))
}

app.use(express.static(path.resolve('./src/client/serve')))

console.log('server running!')

io.on('connection', async (socket) => {
    g.addConnection(socket)
    socket.emit('stars', stars)
    
    socket.on('addPlayer', async (data) => {
        try {
            if (data.s) { // If a pair code is provided
                // Check which instance this pair code belongs to
                const instanceId = await g.redisManager.getPairInstance(data.s);
                
                if (instanceId && instanceId !== g.redisManager.instanceId) {
                    // This pair code belongs to another instance
                    socket.emit('redirect', {
                        instanceId: instanceId,
                        pairCode: data.s
                    });
                    return;
                }
            }
            
            // If no pair code or pair code belongs to this instance
            g.addPlayer(data.u, socket)
        } catch (err) {
            console.error('Error in addPlayer:', err);
            socket.emit('error', 'Failed to join game');
        }
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
    socket.on('timeout', () => {
      g.addTimeout(socket.id)
    })
    socket.on('cancelTimeout', () => {
      g.cancelTimeout(socket.id)
    })
})
httpServer.listen(PORT)



