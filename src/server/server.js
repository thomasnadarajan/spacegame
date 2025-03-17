import {Server} from 'socket.io'
import express from 'express'
import {createServer} from 'http'
import path from 'path'
import {game} from './game'
import {star} from '../shared/star'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 8081

// Debug logging
console.log(`Configured to use PORT: ${PORT}`)
console.log(`Environment PORT: ${process.env.PORT}`)
console.log(`NODE_ENV: ${process.env.NODE_ENV}`)

// Configure Express with CORS and other middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['polling', 'websocket'],
  connectTimeout: 30000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e8
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

// Route to test socket.io connection
app.get('/socket.io-test', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Socket.IO Test</title>
        <script src="/socket.io/socket.io.js"></script>
        <script>
          const socket = io();
          socket.on('connect', () => {
            document.getElementById('status').textContent = 'Connected to Socket.IO';
            document.getElementById('id').textContent = socket.id;
          });
          socket.on('connect_error', (err) => {
            document.getElementById('status').textContent = 'Connection error: ' + err.message;
          });
        </script>
      </head>
      <body>
        <h1>Socket.IO Connection Test</h1>
        <p>Status: <span id="status">Connecting...</span></p>
        <p>Socket ID: <span id="id">Not connected</span></p>
      </body>
    </html>
  `);
});

console.log('server running!')

io.on('connection', socket => {
    console.log(`New socket connection: ${socket.id}`);
    g.addConnection(socket)
    socket.emit('stars', stars)
    
    socket.on('update', (data) => {
        try {
            if (data === null) {
                console.log(`Received null update from socket: ${socket.id}`);
            } else if (g.players[socket.id]) {
                g.setShipDirection(g.players[socket.id], data)
            }
        } catch (error) {
            console.error(`Error handling update event:`, error);
        }
    })
    socket.on('fire', (data) => {
        try {
            if (g.players[socket.id]) {
                g.handleFire(data, g.players[socket.id].currentShip)
            }
        } catch (error) {
            console.error(`Error handling fire event:`, error);
        }
    })
    socket.on('pfire', () => {
        try {
            if (g.players[socket.id]) {
                g.handlePlayerFire(socket.id)
            }
        } catch (error) {
            console.error(`Error handling pfire event:`, error);
        }
    })
    socket.on('power', data => {
        try {
            if (g.players[socket.id]) {
                g.handlePowerUpdate(data.system, data.level, g.players[socket.id].currentShip)
            }
        } catch (error) {
            console.error(`Error handling power event:`, error);
        }
    })
    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        g.disconnect(socket)
    })
    socket.on('direction', (key) => {
        try {
            if (g.players[socket.id]) {
                g.handleDirectionInput(socket.id, key)
            }
        } catch (error) {
            console.error(`Error handling direction event:`, error);
        }
    })
    socket.on('stopDirection', (key) => {
        try {
            if (g.players[socket.id]) {
                g.stopDirection(socket.id, key)
            }
        } catch (error) {
            console.error(`Error handling stopDirection event:`, error);
        }
    })
    socket.on('playerDirection', (data) => {
        try {
            if (g.players[socket.id]) {
                g.handlePlayerDirection(socket.id, data)
            }
        } catch (error) {
            console.error(`Error handling playerDirection event:`, error);
        }
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
                            socket.emit('game_error', 'Failed to join with pair code');
                        }
                    } catch (error) {
                        console.error(`Error joining with pair code:`, error);
                        socket.emit('game_error', 'Server error joining with pair code');
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
                        socket.emit('game_error', 'Failed to create player');
                    }
                } catch (error) {
                    console.error(`Error creating player:`, error);
                    socket.emit('game_error', 'Server error creating player');
                }
            }
        } catch (error) {
            console.error(`Error processing join request:`, error);
            socket.emit('game_error', 'Server error processing join request');
        }
    })
    socket.on('startCargoTransport', data => {
      try {
        if (data && g.players[socket.id]) {
          g.handleTransportStart(data)
        }
      } catch (error) {
        console.error(`Error handling startCargoTransport event:`, error);
      }
    })
    socket.on('cancelCargoTransport', data => {
      try {
        if (data && g.players[socket.id]) {
          g.cancelTransportRequest(data)
        }
      } catch (error) {
        console.error(`Error handling cancelCargoTransport event:`, error);
      }
    })
    socket.on('timeout', () => {
      try {
        g.addTimeout(socket.id)
      } catch (error) {
        console.error(`Error handling timeout event:`, error);
      }
    })
    socket.on('cancelTimeout', () => {
      try {
        g.cancelTimeout(socket.id)
      } catch (error) {
        console.error(`Error handling cancelTimeout event:`, error);
      }
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
                        if (result) {
                            console.log(`Player joined with pair code ${data.s}: ${data.u} (socket: ${socket.id})`);
                        } else {
                            console.error(`Failed to create player with pair code for: ${data.u} (socket: ${socket.id})`);
                            socket.emit('game_error', 'Failed to create player');
                        }
                    } catch (playerError) {
                        console.error(`Error creating player:`, playerError);
                        socket.emit('game_error', 'Error creating player');
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
                    if (result) {
                        console.log(`Player created successfully for: ${data.u} (socket: ${socket.id})`);
                    } else {
                        console.error(`Failed to create player for: ${data.u} (socket: ${socket.id})`);
                        socket.emit('game_error', 'Failed to create player');
                    }
                } catch (error) {
                    console.error(`Error creating player:`, error);
                    socket.emit('game_error', 'Server error creating player');
                }
            }
        } catch (error) {
            console.error(`Error processing join request:`, error);
            socket.emit('game_error', 'Server error processing join request');
        }
    })
})
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`)
})



