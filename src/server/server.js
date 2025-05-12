const express = require('express')
const http = require('http')
const { Server } = require("socket.io")
const path = require('path')
const { game: Game } = require('./game')
const { star } = require('../shared/star')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 8081

// Debug logging
console.log('=========== SERVER STARTING ===========');
console.log(`Configured to use PORT: ${PORT}`);
console.log(`Environment PORT: ${process.env.PORT}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log('Current time:', new Date().toISOString());
console.log('Process ID:', process.pid);
console.log('Using in-memory state management (no Redis required)');

// Configure Express with CORS and other middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: true
}))

app.use(express.static(path.join(process.cwd(), 'src/client/serve')))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Create HTTP server and Socket.IO instance
console.log('Creating HTTP server and Socket.IO instance...');
const httpServer = http.createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true,
  transports: ['polling', 'websocket'],
  path: '/socket.io/',
  connectTimeout: 30000
})
console.log('Socket.IO server created with configuration:', {
  transports: ['polling', 'websocket'],
  path: '/socket.io/'
});

// Initialize game and stars
const g = new Game()
const stars = []
for (let i = 0; i < 50000; i++) {
    stars.push(new star(50000, 50000))
}


// Test endpoint to verify weapon mechanics
app.get('/test-weapon', (req, res) => {
  try {
    console.log('Received test weapon endpoint request');
    // Find first player in game
    const players = Object.keys(g.players);
    if (players.length === 0) {
      console.log('No players found for test weapon');
      return res.json({ success: false, error: 'No players found' });
    }
    
    const firstPlayerId = players[0];
    const firstPlayer = g.players[firstPlayerId];
    const shipId = firstPlayer.currentShip;
    const testAngle = Math.PI/4; // 45 degrees
    
    console.log(`Test firing weapon for player ${firstPlayerId} on ship ${shipId} at angle ${testAngle}`);
    
    // Fire the weapon
    g.handleFire(testAngle, shipId);
    
    // Send update to all clients
    for (const player in g.sockets) {
      if (g.players[player]) {
        const update = g.generateGameUpdate(g.players[player]);
        g.sockets[player].emit('update', update);
      }
    }
    
    return res.json({ 
      success: true, 
      message: 'Test weapon fired',
      shipId: shipId,
      angle: testAngle,
      laserCount: g.shiplasers.length
    });
  } catch (error) {
    console.error('Error in test-weapon endpoint:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Register Socket.IO handlers
console.log('Setting up socket connection handler...');

io.on('connection', socket => {
    console.log(`\n==== NEW SOCKET CONNECTION: ${socket.id} ====`);
    console.log(`Connection time: ${new Date().toISOString()}`);
    console.log(`Transport: ${socket.conn && socket.conn.transport ? socket.conn.transport.name : 'unknown'}`);
    
    // Validate socket before adding to game
    if (!socket || !socket.id) {
        console.error('Invalid socket object received in connection handler');
        return;
    }
    
    // Add connection to game
    try {
        g.addConnection(socket);
        console.log(`Socket ${socket.id} added to game.sockets`);
        
        // Debug: verify the socket was added properly
        if (!g.sockets[socket.id]) {
            console.error(`SOCKET ERROR: Socket ${socket.id} was not properly added to game.sockets`);
        }
    } catch (error) {
        console.error(`Error adding socket connection:`, error);
    }
    
    // Send initial stars data
    socket.emit('stars', stars);
    
    // Setup disconnect handler
    socket.on('disconnect', (reason) => {
        console.log(`Socket ${socket.id} disconnected. Reason: ${reason}`);
        try {
            g.disconnect(socket);
            console.log(`Socket ${socket.id} removed from game`);
        } catch (error) {
            console.error(`Error handling disconnect for socket ${socket.id}:`, error);
        }
    });
    
    socket.on('join', (data) => {
        try {
            const { user, pair } = data;
            console.log(`Received 'join' event from ${socket.id}: user=${user}, pair=${pair}`);
            
            // Fix parameter order: should be user, socket, pair to match game.js definition
            const playerAdded = g.addPlayer(user, socket, pair); 
            
            if (playerAdded) {
                console.log(`Player ${user} added successfully for socket ${socket.id}`);
                // Emit 'ready' back to the client that just joined
                socket.emit('ready'); 
                console.log(`Emitted 'ready' to ${socket.id}`);
            } else {
                // Handle cases where player couldn't be added (e.g., username taken)
                console.log(`Failed to add player ${user} for socket ${socket.id}`);
                // Optionally emit an error back to the client
                // socket.emit('join_error', 'Failed to join game.');
            }
        } catch (error) {
            console.error(`Error handling join event for ${socket.id}:`, error);
            // Optionally emit an error back to the client
            // socket.emit('join_error', 'Server error during join.');
        }
    });
    
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
    
    // Handle direction input (player movement)
    socket.on('direction', (input) => {
        try {
            console.log(`Received 'direction' event from ${socket.id}: ${input}`);
            
            if (g.players[socket.id]) {
                // Log the player's keys before the change
                const playerBefore = {
                    position: { ...g.players[socket.id].position },
                    worldPosition: { ...g.players[socket.id].worldPosition },
                    keys: { ...g.players[socket.id].keys }
                };
                
                // Apply the input
                g.handleDirectionInput(socket.id, input);
                
                // Log the player's keys after the change
                const playerAfter = {
                    position: { ...g.players[socket.id].position },
                    worldPosition: { ...g.players[socket.id].worldPosition },
                    keys: { ...g.players[socket.id].keys }
                };
                
                console.log(`Applied direction ${input} to player ${socket.id}. Keys changed:`, {
                    before: playerBefore.keys,
                    after: playerAfter.keys
                });
            } else {
                console.error(`Player ${socket.id} not found for direction event`);
            }
        } catch (error) {
            console.error(`Error handling direction event:`, error);
        }
    });
    
    // Handle direction stop input
    socket.on('stopDirection', (input) => {
        try {
            if (g.players[socket.id]) {
                g.stopDirection(socket.id, input);
            }
        } catch (error) {
            console.error(`Error handling stopDirection event:`, error);
        }
    });
    
    // Handle player weapon direction
    socket.on('playerDirection', (data) => {
        try {
            if (g.players[socket.id]) {
                g.handlePlayerDirection(socket.id, data);
            }
        } catch (error) {
            console.error(`Error handling playerDirection event:`, error);
        }
    });
    
    // Handle power system updates from tactical menu
    socket.on('power', (data) => {
        try {
            console.log(`Received 'power' event from ${socket.id}:`, data);
            if (g.players[socket.id]) {
                // Extract data from the event
                const { system, level, ship } = data;
                
                if (typeof system === 'string' && typeof level === 'number' && ship) {
                    console.log(`Updating power: ${system} to level ${level} for ship ${ship}`);
                    g.handlePowerUpdate(system, level, ship);
                    
                    // Force an immediate update to show power changes
                    g.shouldSendUpdate = true;
                } else {
                    console.error(`Invalid power data format:`, data);
                }
            } else {
                console.error(`Player ${socket.id} not found for power event`);
            }
        } catch (error) {
            console.error(`Error handling power event:`, error);
        }
    });
    
    socket.on('fire', (data) => {
        try {
            console.log('==== FIRE EVENT RECEIVED ====');
            console.log(`Socket ID: ${socket.id}, Data: ${JSON.stringify(data)}`);
            console.log(`Timestamp: ${new Date().toISOString()}`);
            
            if (g.players[socket.id]) {
                const angle = data.angle !== undefined ? data.angle : 0;
                const shipId = data.ship || g.players[socket.id].currentShip;
                console.log(`Invoking ship weapon fire: angle=${angle}, shipId=${shipId}`);
                g.handleFire(angle, shipId);
                
                // Broadcast update to all connected players
                for (const playerId in g.sockets) {
                    if (g.players[playerId]) {
                        const update = g.generateGameUpdate(g.players[playerId]);
                        g.sockets[playerId].emit('update', update);
                    }
                }
                console.log('Fire event processed successfully');
            } else {
                console.error(`Player ${socket.id} not found for fire event`);
            }
        } catch (error) {
            console.error(`Error handling fire event:`, error, error.stack);
        }
    });
    
    // Handle player laser firing
    socket.on('pfire', () => {
        try {
            console.log(`==== PLAYER FIRE EVENT RECEIVED ====`);
            console.log(`Socket ID: ${socket.id}`);
            console.log(`Timestamp: ${new Date().toISOString()}`);
            
            const beforeCount = g.playerlasers ? g.playerlasers.length : 0;
            
            if (g.players[socket.id]) {
                console.log(`Processing player fire from ${socket.id}`);
                console.log(`Player data:`, {
                    position: g.players[socket.id].position,
                    worldPosition: g.players[socket.id].worldPosition,
                    currentShip: g.players[socket.id].currentShip,
                    weaponsDirection: g.players[socket.id].weaponsDirection
                });
                
                // Call the handler
                g.handlePlayerFire(socket.id);
                
                // Check if lasers were added
                const afterCount = g.playerlasers ? g.playerlasers.length : 0;
                console.log(`Player lasers before: ${beforeCount}, after: ${afterCount}`);
                
                if (afterCount > beforeCount) {
                    // Force an immediate update to all clients
                    console.log('Forcing immediate update to all clients');
                    for (const playerId in g.sockets) {
                        if (g.players[playerId]) {
                            const update = g.generateGameUpdate(g.players[playerId]);
                            // Log the update for the player who fired
                            if (playerId === socket.id) {
                                console.log(`Update for firing player includes ${update.playerlasers.length} player lasers`);
                            }
                            g.sockets[playerId].emit('update', update);
                        }
                    }
                } else {
                    console.warn('No new player lasers were created');
                }
                
                console.log('Player fire event processed successfully');
            } else {
                console.error(`Player ${socket.id} not found for pfire event`);
            }
        } catch (error) {
            console.error(`Error handling player fire event:`, error);
        }
    });

    // Rest of the socket handlers...
    // [...original code...]
    
    socket.on('ping', (callback) => {
        console.log(`Received ping from ${socket.id}`);
        if (typeof callback === 'function') {
            callback();
        } else {
            socket.emit('pong');
        }
    });
})

// Start the server
console.log('Starting HTTP server...');
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});

console.log('server initialization complete!')


