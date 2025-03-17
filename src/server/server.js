import {Server} from 'socket.io'
import express from 'express'
import {createServer} from 'http'
import path from 'path'
import {game} from './game'
import {star} from '../shared/star'
const app = express()
const PORT = process.env.PORT || 8081

// Debug logging
console.log(`Configured to use PORT: ${PORT}`)
console.log(`Environment PORT: ${process.env.PORT}`)
console.log(`NODE_ENV: ${process.env.NODE_ENV}`)

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
})
const g = new game()

let stars = []
for (let i = 0; i < 25000; i++) {
    stars.push(new star(10000, 10000))
}

app.use(express.static(path.resolve('./src/client/serve')))

// Route to check server status
app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

console.log('server running!')

io.on('connection', socket => {
    console.log(`New socket connection: ${socket.id}`);
    g.addConnection(socket)
    socket.emit('stars', stars)
    
    socket.on('update', (data) => {
        if (data === null) {
            console.log(`Received null update from socket: ${socket.id}`);
        } else {
            g.setShipDirection(g.players[socket.id], data)
        }
    })
    socket.on('fire', (data) => {
        g.handleFire(data, g.players[socket.id].currentShip)
    })
    socket.on('pfire', () => {
        g.handlePlayerFire(socket.id)
    })
    socket.on('power', data => {
        g.handlePowerUpdate(data.system, data.level, g.players[socket.id].currentShip)
    })
    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        g.disconnect(socket)
    })
    socket.on('direction', (key) => {
        g.handleDirectionInput(socket.id, key)
    })
    socket.on('stopDirection', (key) => {
        g.stopDirection(socket.id, key)
    })
    socket.on('playerDirection', (data) => {
        g.handlePlayerDirection(socket.id, data)
    })
    socket.on('join', async (data) => {
        console.log(`Join request received from socket ${socket.id}:`, data);
        try {
            if (data.code != null && data.name != null) {
                console.log(`Processing join request with pair code: ${data.code}`);
                const isValid = await g.redisManager.isPairCodeRegistered(data.code);
                if (isValid) {
                    console.log(`Valid pair code: ${data.code} for socket: ${socket.id}`);
                    // Valid pair code, can join
                    try {
                        // Add the player with the pair code
                        const result = await g.addPlayer(data.name, socket, data.code);
                        if (result) {
                            console.log(`Player joined with pair code ${data.code}: ${data.name} (socket: ${socket.id})`);
                        } else {
                            console.error(`Failed to join player with pair code for: ${data.name} (socket: ${socket.id})`);
                            socket.emit('error', 'Failed to join with pair code');
                        }
                    } catch (error) {
                        console.error(`Error joining with pair code:`, error);
                        socket.emit('error', 'Server error joining with pair code');
                    }
                } else {
                    console.log(`Invalid pair code: ${data.code} for socket: ${socket.id}`);
                    socket.emit('pairError');
                }
            } else if (data.name != null) {
                console.log(`Processing player creation for: ${data.name} (socket: ${socket.id})`);
                try {
                    // Create new player
                    const result = await g.addPlayer(data.name, socket);
                    if (result) {
                        console.log(`Player created successfully for: ${data.name} (socket: ${socket.id})`);
                    } else {
                        console.error(`Failed to create player for: ${data.name} (socket: ${socket.id})`);
                        socket.emit('error', 'Failed to create player');
                    }
                } catch (error) {
                    console.error(`Error creating player:`, error);
                    socket.emit('error', 'Server error creating player');
                }
            }
        } catch (error) {
            console.error(`Error processing join request:`, error);
            socket.emit('error', 'Server error processing join request');
        }
    })
    socket.on('startCargoTransport', data => {
      g.handleTransportStart(data)
    })
    socket.on('cancelCargoTransport', data => {
      g.cancelTransportRequest(data)
    })
    socket.on('timeout', () => {
      g.addTimeout(socket.id)
    })
    socket.on('cancelTimeout', () => {
      g.cancelTimeout(socket.id)
    })
    
    // Add legacy handler for old client code
    socket.on('addPlayer', async (data) => {
        console.log(`Legacy addPlayer request received from socket ${socket.id}:`, data);
        try {
            if (data.s != null) {
                // Handle pair code
                console.log(`Processing join request with pair code: ${data.s}`);
                const isValid = await g.redisManager.isPairCodeRegistered(data.s);
                if (isValid) {
                    console.log(`Valid pair code: ${data.s} for socket: ${socket.id}`);
                    try {
                        const result = await g.addPlayer(data.u, socket, data.s);
                        if (!result) {
                            console.error(`Failed to create player with pair code for: ${data.u} (socket: ${socket.id})`);
                            socket.emit('error', 'Failed to create player');
                        }
                    } catch (playerError) {
                        console.error(`Error creating player:`, playerError);
                        socket.emit('error', 'Error creating player');
                    }
                } else {
                    console.log(`Invalid pair code: ${data.s} for socket: ${socket.id}`);
                    socket.emit('pairError');
                }
            } else {
                console.log(`Processing player creation for: ${data.u} (socket: ${socket.id})`);
                try {
                    // Create new player
                    const result = await g.addPlayer(data.u, socket);
                    if (!result) {
                        console.error(`Failed to create player for: ${data.u} (socket: ${socket.id})`);
                        socket.emit('error', 'Failed to create player');
                    }
                } catch (error) {
                    console.error(`Error creating player:`, error);
                    socket.emit('error', 'Server error creating player');
                }
            }
        } catch (error) {
            console.error(`Error processing join request:`, error);
            socket.emit('error', 'Server error processing join request');
        }
    })
})
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`)
})



