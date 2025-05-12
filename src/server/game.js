import {player} from '../shared/player'
import {ship} from '../shared/ship'
import {shiplaser, playerlaser} from '../shared/laser'
import { cargoCollide, circleCollision, playerCollide, worldCollide } from './circlecol'
import {cargo} from '../shared/cargo'
import { leaderboard } from '../shared/leaderboard'
import { MemoryStateManager } from './memoryStateManager'

export class game {
    constructor() {
        this.sockets ={}
        this.players = {}
        this.keys = {}
        this.pairs = {}
        // a list of all the ships in the game
        this.ships = {}
        this.usernames = []
        // a list of all the lasers in flight
        this.shiplasers = []
        this.playerlasers = []
        this.cargo = []
        this.lastUpdate = Date.now()
        this.shouldSendUpdate = false
        this.cargoRequests = {}
        this.counter = 0
        this.leaderboard = new leaderboard()
        this.deleting = false
        this.timeouts = {}
        
        // Initialize Memory state manager
        this.stateManager = new MemoryStateManager()
        
        // Initialize game state properly
        this.initializeGameState().catch(err => {
            console.error('Failed to initialize game state:', err)
        })
    }

    async initializeGameState() {
        try {
            console.log('Initializing game state...');
            
            // Clear existing state
            await this.stateManager.clearState();
            
            // Initialize empty game state
            this.ships = {}
            this.players = {}
            this.cargo = []
            
            console.log('Game state initialized with empty memory cache');

            // Start the game loop
            setInterval(this.update.bind(this), 1000/60)
        } catch (e) {
            console.error('Failed to initialize game state:', e)
        }
    }

    addTimeout(socket) {
        this.timeouts[socket] = setTimeout(() => {
            this.sockets[socket].emit('timedOut')
            this.disconnect(this.sockets[socket], false)
        }, 5000)
    }
    cancelTimeout(socket) {
        clearTimeout(this.timeouts[socket])
    }
    addConnection(socket) {
        if (!socket || !socket.id) {
            console.error('Cannot add connection: Invalid socket object');
            return false;
        }
        
        // Store socket with its ID as the key
        console.log(`Adding socket connection: ${socket.id}`);
        this.sockets[socket.id] = socket;
        return true;
    }
    checkCollisions(newShip) {
        for (const shipId in this.ships) {
            if (circleCollision(newShip, this.ships[shipId])) {
                return true;
            }
        }
        return false;
    }
    async addPlayer(user, socket, existingPairCode = null) {
        // Validate socket exists and has an ID
        if (!socket || !socket.id) {
            console.error(`Cannot add player: Invalid socket object provided for user ${user}`);
            return false;
        }
        
        console.log(`Attempting to add player: ${user} with socket ID: ${socket.id}`);
        try {
            // If joining with an existing pair code
            if (existingPairCode) {
                console.log(`Joining with existing pair code: ${existingPairCode}`);
                
                // Check if pair code exists in our pairs object
                if (this.pairs[existingPairCode]) {
                    const pairData = this.pairs[existingPairCode];
                    const shipId = pairData.ship;
                    
                    // Check if the ship exists
                    if (this.ships[shipId]) {
                        console.log(`Using existing ship with ID: ${shipId}`);
                        const shipObj = this.ships[shipId];
                        
                        // Create player with existing ship ID and pair code
                        const newPlayer = new player(user, shipId, 1, 2, existingPairCode);
                        
                        // Update player's world position based on ship
                        newPlayer.worldPosition = {
                            x: (newPlayer.position.x * shipObj.shipblock) - newPlayer.width / 2 + shipObj.shipblock / 2,
                            y: (newPlayer.position.y * shipObj.shipblock) - newPlayer.height / 2 + shipObj.shipblock / 2
                        };
                        
                        // Store player in game state
                        this.players[socket.id] = newPlayer;
                        
                        // Add player to ship's player list
                        this.ships[shipId].addPlayer(socket.id);
                        
                        // Add player to the pair's player list
                        this.pairs[existingPairCode].players.push(socket.id);
                        
                        // Prepare clean player data for Redis
                        const playerData = {
                            username: user,
                            position: newPlayer.position,
                            worldPosition: newPlayer.worldPosition,
                            health: newPlayer.health,
                            currentShip: shipId,
                            playerView: true,
                            pair: existingPairCode,
                            keys: {}
                        };
                        
                        console.log(`Saving player data to Redis with existing pair code`);
                        // Save to Redis
                        await this.stateManager.addPlayer(socket.id, playerData);
                        
                        // Send ready event through socket
                        try {
                            if (socket && typeof socket.emit === 'function') {
                                socket.emit('ready');
                                console.log(`'ready' event emitted successfully to socket: ${socket.id}`);
                            } else {
                                console.error(`Socket invalid or missing emit function`);
                            }
                        } catch (emitError) {
                            console.error(`Error emitting 'ready' event:`, emitError);
                        }
                        
                        return {
                            player: newPlayer,
                            ship: shipObj
                        };
                    } else {
                        console.error(`Ship with ID ${shipId} not found for pair code ${existingPairCode}`);
                        return false;
                    }
                } else {
                    console.error(`Pair code ${existingPairCode} not found in local state`);
                    return false;
                }
            }
            
            // Generate random ship position and ID for new players
            const x = 5000 * (0.25 + Math.random() * 0.5)
            const y = 5000 * (0.25 + Math.random() * 0.5)
            const ship_id = Math.floor(1000 + Math.random() * 9000)
            const temp = new ship(x, y, ship_id)
            
            console.log(`Created ship with ID: ${ship_id} at position x:${x}, y:${y}`);
            
            // Check if ship position is valid
            if (!this.checkCollisions(temp)) {
                console.log(`No collision detected, proceeding with player creation`);
                // Create ship first
                this.ships[ship_id] = temp
                
                // Generate a unique pair code if not provided
                const pair_code = Math.floor(1000 + Math.random() * 9000).toString()
                console.log(`Generated pair code: ${pair_code}`);
                
                // Create player with ship ID and initial position
                const newPlayer = new player(user, ship_id, 1, 2, pair_code)
                
                // Update player's world position based on ship
                newPlayer.worldPosition = {
                    x: (newPlayer.position.x * temp.shipblock) - newPlayer.width / 2 + temp.shipblock / 2,
                    y: (newPlayer.position.y * temp.shipblock) - newPlayer.height / 2 + temp.shipblock / 2
                }
                
                // Store player in game state
                this.players[socket.id] = newPlayer
                
                // Add player to ship's player list
                this.ships[ship_id].addPlayer(socket.id)
                
                // Create or update pair in pairs list
                this.pairs[pair_code] = {
                    ship: ship_id,
                    players: [socket.id]
                }
                
                console.log(`Registering pair code: ${pair_code} with Redis`);
                // Register the pair code with this instance
                await this.stateManager.registerPairCode(pair_code)
                
                // Update leaderboard with initial cargo
                this.leaderboard.addPair(pair_code, temp.cargo || 0)
                
                // Prepare clean player data for Redis
                const playerData = {
                    username: user,
                    position: newPlayer.position,
                    worldPosition: newPlayer.worldPosition,
                    health: newPlayer.health,
                    currentShip: ship_id,
                    playerView: true,
                    pair: pair_code,
                    keys: {}
                }
                
                console.log(`Saving player data to Redis`);
                // Save to Redis
                await this.stateManager.addPlayer(socket.id, playerData)

                console.log(`===== PLAYER CREATION SUCCESS =====`);
                console.log(`Player created: ${user} with socket ID: ${socket.id}`);
                // console.log(`Player data:`, JSON.stringify(playerData, null, 2)); // Avoid stringify for complex objects
                console.log('Player data (excluding position objects):', {
                    username: playerData.username,
                    health: playerData.health,
                    currentShip: playerData.currentShip,
                    playerView: playerData.playerView,
                    pair: playerData.pair
                    // Add other primitive fields if needed
                });
                // TODO: Inspect playerData.position and playerData.worldPosition if error persists
                console.log(`Ready to emit 'ready' event to socket: ${socket.id}`);
                
                // Check socket state before emitting
                console.log(`Socket connected status: ${socket.connected}`);
                console.log(`Socket emit function type: ${typeof socket.emit}`);
                
                // Send ready event through socket
                try {
                    if (socket && typeof socket.emit === 'function') {
                        socket.emit('ready');
                        console.log(`'ready' event emitted successfully to socket: ${socket.id}`);
                    } else {
                        console.error(`Socket invalid or missing emit function`);
                    }
                } catch (emitError) {
                    console.error(`Error emitting 'ready' event:`, emitError);
                }
                
                return {
                    player: newPlayer,
                    ship: temp
                }
            } else {
                console.error(`Ship collision detected, player creation failed`);
            }
        } catch (e) {
            console.error('Failed to add player:', e);
            throw e; // Re-throw to handle in the calling code
        }
    }
    setShipDirection(player, dir) {
        this.ships[player.currentShip].setRotation(dir)
    }
    handleDirectionInput(player, key) {
        const p = this.players[player]
        p.keys[key] = true
        if (key === 'use') {
            this.usePlayer(player)
        }
    }
    stopDirection(player, key) {
        this.players[player].keys[key] = false
        this.players[player].animation = 0
    }
    handleFire(rotation, ship) {
        console.log(`Handling fire request: rotation=${rotation}, ship=${ship}`);
        
        // Check if the ship exists
        if (!this.ships[ship]) {
            console.error(`Cannot fire: Ship ${ship} not found`);
            return;
        }
        
        const parentShip = this.ships[ship];
        
        // Calculate the exact position and rotation for the laser
        const rot = rotation + parentShip.rotation;
        
        // Calculate the offset from the ship's center based on ship size
        const shipSize = 10 * parentShip.shipblock;
        
        // Calculate the weapon position at the front of the ship in the direction of aim
        // Using sin for X and -cos for Y to match the game's coordinate system
        const offsetX = Math.sin(rot) * shipSize;
        const offsetY = -Math.cos(rot) * shipSize;
        
        // Set the laser's initial position at the edge of the ship
        const x = parentShip.position.x + offsetX;
        const y = parentShip.position.y + offsetY;
        
        // Create and add the laser
        const newLaser = new shiplaser(x, y, rot, parentShip);
        this.shiplasers.push(newLaser);
        
        console.log(`Laser created at position (${x}, ${y}) with rotation ${rot}, total lasers: ${this.shiplasers.length}`);
        
        // Force an immediate update
        this.shouldSendUpdate = true;
    }
    handlePowerUpdate(system, level, ship) {
        console.log(`Processing power update: system=${system}, level=${level}, ship=${ship}`);
        
        // If the ship doesn't exist in this.ships, log and return
        if (!this.ships[ship]) {
            console.error(`Ship ${ship} not found for power update`);
            return;
        }
        
        // Extract the system name from the shifter name (e.g., WeaponsShifter -> weapons)
        const systemName = system.replace('Shifter', '').toLowerCase();
        
        // Check if the system exists on the ship
        if (!this.ships[ship].systems || !this.ships[ship].systems.hasOwnProperty(systemName)) {
            console.error(`System ${systemName} not found on ship ${ship}`);
            return;
        }
        
        // Calculate power usage
        const currentLevel = this.ships[ship].systems[systemName] || 1;
        const newLevel = level + 1; // Level is 0-indexed from the UI, but 1-indexed in the model
        const powerDelta = newLevel - currentLevel;
        
        console.log(`Power update calculation: current=${currentLevel}, new=${newLevel}, delta=${powerDelta}`);
        
        // Check if ship has enough available power
        if (this.ships[ship].availablePower === undefined) {
            console.log(`Ship ${ship} has undefined availablePower, setting to default (2)`);
            this.ships[ship].availablePower = 2; // Default value if not set
        }
        
        console.log(`Before update: availablePower=${this.ships[ship].availablePower}`);
        
        // Check if the update is valid
        if (powerDelta > this.ships[ship].availablePower) {
            console.error(`Not enough power available: needed=${powerDelta}, available=${this.ships[ship].availablePower}`);
            return;
        }
        
        // Apply the update
        this.ships[ship].systems[systemName] = newLevel;
        this.ships[ship].availablePower -= powerDelta;
        
        console.log(`Power update applied: ${systemName}=${newLevel}, availablePower=${this.ships[ship].availablePower}`);
        
        // Force an update to be sent
        this.shouldSendUpdate = true;
    }
    handlePlayerDirection(player, data) {
        this.players[player].weaponsDirection = data
        if (data >= Math.PI/4 && data < 3*Math.PI/4) {
            this.players[player].direction = 3
        }
        else if (data >= 3*Math.PI/4 || data < - 3*Math.PI/4) {
            this.players[player].direction = 2
        }
        else if (data >= - 3*Math.PI/4 && data < - Math.PI/4) {
            this.players[player].direction = 1
        }
        else {
            this.players[player].direction = 0
        }
    }
    handlePlayerFire(player) {
        try {
            console.log(`Creating player laser for player ${player}`);
            
            // Verify the player exists
            if (!this.players[player]) {
                console.error(`Player ${player} not found for firing`);
                return;
            }
            
            const p = this.players[player];
            
            // Verify the player's ship exists
            if (!p.currentShip || !this.ships[p.currentShip]) {
                console.error(`Ship ${p.currentShip} not found for player ${player}`);
                return;
            }
            
            const s = this.ships[p.currentShip];
            
            
            
            
            // Debug the player's world position
            console.log(`PLAYER DATA:`, {
                position: p.position,
                worldPosition: p.worldPosition,
                width: p.width,
                height: p.height,
                weaponsDirection: p.weaponsDirection
            });
            
            // Compute player's true world position for spawning
            const localX = -(5 * s.shipblock) + p.worldPosition.x + (p.width / 2);
            const localY = -(5 * s.shipblock) + p.worldPosition.y + (p.height / 2);
            const laserX = s.position.x + localX;
            const laserY = s.position.y + localY;
            // Combine weapon and ship rotation for firing direction
            const spawnRot = p.weaponsDirection + s.rotation;
            console.log('PLAYER LASER SPAWN AT TRUE POS:', { x: laserX, y: laserY, rotation: spawnRot });
            const newLaser = new playerlaser(laserX, laserY, spawnRot, p, s);
            
            // Add the laser
            this.playerlasers.push(newLaser);
            
            // Force an immediate update
            this.shouldSendUpdate = true;
        } catch (error) {
            console.error('Error in handlePlayerFire:', error);
        }
    }
    checkShipDestroy() {
        let marked_pairs= []
        let marked_ships = []
        for (const ship in this.ships) {
            if (this.ships[ship].hull <= 0) {
                for (const pair in this.pairs) {
                    if (this.pairs[pair].ship === parseInt(ship)) {
                        marked_pairs.push(pair)
                        for (const player of this.pairs[pair].players) {
                            delete this.players[player]
                            this.sockets[player].emit('dead')
                        }
                    }
                }
                marked_ships.push(ship)
            }
        }
        for (const ship of marked_ships) {
            delete this.ships[ship]
        }
        for (const pair of marked_pairs) {
            delete this.pairs[pair]
        }
    }
    async update(){
            
            for (const laser of this.shiplasers) {
                laser.update();
                for (const ship in this.ships) {
                    if (laser.ship !== this.ships[ship].id) {
                        if (circleCollision(this.ships[ship], null, laser)) {
                            this.ships[ship].hit(laser)
                            laser.setDestroyed()
                        }
                    }
                }
            }
            
            for (const laser of this.playerlasers) {
                // Log before update
                const beforeX = laser.x;
                const beforeY = laser.y;
                
                // Update position
                laser.update();
                
                // Log movement
                const deltaX = laser.x - beforeX;
                const deltaY = laser.y - beforeY;
                console.log(`Player laser moved: (${beforeX}, ${beforeY}) → (${laser.x}, ${laser.y}), delta: (${deltaX}, ${deltaY})`);
                
                // If the laser is out of bounds, mark it as destroyed
                if (laser.x < 0 || laser.x > 50000 || laser.y < 0 || laser.y > 50000) {
                    laser.destroyed = true;
                    continue;
                }
                
                // Check player collision with the laser
                for (const player in this.players) {
                    // Skip collision check if laser is already marked destroyed
                    if (laser.destroyed) continue;
                    
                    if (laser.ship === this.players[player].currentShip) {
                        if (playerCollide(this.players[player], null, laser)) {
                            console.log(`Player laser HIT player ${player}`);
                            this.players[player].hit();
                            laser.setDestroyed();
                        }
                    }
                }
                
                // Check ship wall collision for laser
                // Get the ship associated with this laser for proper collision detection
                const shipId = typeof laser.ship === 'object' ? laser.ship.id : laser.ship;
                
                
                // If the laser isn't destroyed yet, also check for collisions with ship walls
                if (!laser.destroyed) {
                    const shipInstance = this.ships[shipId];
                    if (shipInstance) {
                        console.log('Checking laser collide')
                        const blockSize = shipInstance.shipblock;
                        const leftMostX = shipInstance.position.x - 5 * blockSize;
                        const leftMostY = shipInstance.position.y - 5 * blockSize;
                        // Iterate through all wall tiles (grid value 0)
                        outer: for (let gx = 0; gx < ship.grid.length; gx++) {
                            for (let gy = 0; gy < ship.grid[0].length; gy++) {
                                if (ship.grid[gx][gy] === 0) {
                                    const blockPos = {
                                        x: leftMostX + gx * blockSize,
                                        y: leftMostY + gy * blockSize,
                                        width: blockSize,
                                        height: blockSize
                                    };
                                    if (worldCollide(laser, blockPos)) {
                                        console.log(`Player laser collided with wall tile at [${gx},${gy}] on ship ${shipId}`);
                                        laser.setDestroyed();
                                        break outer;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
        

        this.shiplasers = this.shiplasers.filter(laser => !laser.destroyed);
        this.playerlasers = this.playerlasers.filter(laser => !laser.destroyed);
        
                
        this.checkShipDestroy()
        var markedPlayers = []
        for (const player in this.players) {
            // Validate that the player's ship exists
            const currentPlayer = this.players[player];
            const currentShip = this.ships[currentPlayer.currentShip];
            
            if (!currentShip) {
                console.error(`Ship ${currentPlayer.currentShip} not found for player ${player}, removing player`);
                delete this.players[player];
                if (this.sockets[player]) {
                    this.sockets[player].emit('dead');
                }
                continue;
            }

            if (currentPlayer.health === 0) {
                currentShip.removePlayer(player);
                markedPlayers.push(player);
            } else {
                currentPlayer.health = Math.min(currentPlayer.health + 1, currentPlayer.health);
                // Only update player if their ship exists and has a cargomap
                if (currentShip && currentShip.cargomap) {
                    currentPlayer.update(currentShip.cargomap, currentShip.shipblock);
                }
            }
        }
        for (const ship in this.ships) {
            for (const cargo of this.cargo) {
                if (cargoCollide(this.ships[ship], cargo)) {
                    this.ships[ship].cargo += cargo.cargo
                    this.cargo.splice(this.cargo.indexOf(cargo), 1)
                }
            }
        }
        if (this.cargo.length < 10) {
            this.cargoGenerator()
        }
        var markedTransports = []
        for (const transport in this.cargoRequests) {
            if (this.cargoRequests[transport].time % 240 === 0 && this.cargoRequests[transport].time !== 0) {
                if (this.ships[transport].cargo > 0) {
                    this.ships[this.cargoRequests[transport].sink].cargo += 1
                    this.ships[transport].cargo -= 1
                }
                if (this.ships[transport].cargo === 0) {
                    markedTransports.push(transport)
                }

            }
            this.cargoRequests[transport].time += 1
        }
        for (const transport of markedTransports) {
            delete this.cargoRequests[transport]
        }
        
        for (const ship in this.ships) {
            const f = circleCollision
            this.ships[ship].update(this.ships,f)
        }
        for (const player in this.players) {
            const p = this.players[player];
            const ship = this.ships[p.currentShip]; // Get the current ship
            
            // Ensure ship exists and has cargomap and shipblock
            if (ship && ship.cargomap && ship.shipblock) {
                p.update(ship.cargomap, ship.shipblock); // Pass shipblock size
            } else {
                // Handle cases where ship data is missing or incomplete
                console.warn(`Skipping player update for ${player}: Missing ship data`);
                // Optionally, call update without cargomap/block if needed
                // p.update(null, null); 
            }
        }
        Object.keys(this.sockets).forEach(playerID => {
            const socket = this.sockets[playerID];
            if (playerID in this.players && this.ships[this.players[playerID].currentShip]) {
                const player = this.players[playerID];
                socket.emit('update', this.generateGameUpdate(player));
            } else {
                socket.emit('update', this.generateGameUpdate(null));
            }
        })
        this.shouldSendUpdate = false;
        
        // Sync leaderboard to memory
        await this.stateManager.updateLeaderboard(this.leaderboard)

        // Sync complete game state to memory periodically (every 5 seconds)
        if (Date.now() - this.lastUpdate > 5000) {
            await this.syncGameState()
            this.lastUpdate = Date.now()
        }
    }
    generateGameUpdate(mePlayerInstance) {
        // Debug: log the mePlayerInstance to understand its structure
            
        var lead = this.leaderboard
        if (!this.deleting) {
            lead = new leaderboard()
            let pairscores = []
            
            // Collect all ships and their cargo levels
            for (const shipId in this.ships) {
                const ship = this.ships[shipId];
                let pairId = null;
                for (const pair in this.pairs) {
                    if (this.pairs[pair].ship === parseInt(shipId)) {
                        pairId = pair;
                        break;
                    }
                }
                if (pairId !== null) {
                    pairscores.push({
                        pair: pairId,
                        score: ship.cargo || 0
                    });
                }
            }
            pairscores.sort((a, b) => b.score - a.score)
            for (let i = 0; i < pairscores.length && i < 5; i++) {
                lead.addPair(pairscores[i].pair, pairscores[i].score)
            }
            this.leaderboard = lead
        }
        
        // --- Create simplified, serializable data --- 

        const simplifiedPlayers = {};
        for (const id in this.players) {
            const p = this.players[id];
            if (!p) continue; // Skip if player object is missing
            simplifiedPlayers[id] = {
                id: id,
                user: p.user,
                position: p.position, 
                worldPosition: p.worldPosition,
                health: p.health,
                currentShip: p.currentShip, // Send ship ID
                playerView: p.playerView,
                pair: p.pair,
                keys: p.keys || {}, // Ensure keys exist
                direction: p.direction || 0, // Default direction
                width: p.width || 32, // Player width
                height: p.height || 48, // Player height
                weaponsDirection: p.weaponsDirection || 0, // Weapon direction
                animation: p.animation || 0
                // Add other necessary primitive properties from player class
            };
        }
    
        // Create simplified ship objects
        const simplifiedShips = {};
        for (const [shipId, ship] of Object.entries(this.ships)) {
            if (!ship) continue;  // Skip if ship is null or undefined
            
            // Only include necessary ship data to avoid circular references
            simplifiedShips[shipId] = {
                id: shipId,
                name: ship.name || `Ship ${shipId}`,
                position: JSON.parse(JSON.stringify(ship.position || { x: 0, y: 0 })),
                rotation: ship.rotation || 0,
                velocity: JSON.parse(JSON.stringify(ship.velocity || { x: 0, y: 0 })),
                health: ship.health || 100,
                maxHealth: ship.maxHealth || 100,
                shield: ship.shield || 0,
                maxShield: ship.maxShield || 50,
                hull: ship.hull || 100,  // Add hull property
                mass: ship.mass || 1000,
                radius: ship.radius || 50,
                type: ship.type || 'default',
                availablePower: ship.availablePower !== undefined ? ship.availablePower : 2,
                systems: ship.systems ? JSON.parse(JSON.stringify(ship.systems)) : {
                    weapons: 1,
                    shields: 1,
                    engines: 1
                },
                cargo: ship.cargo || 0,  // Add cargo property
                players: ship.players || [],  // Add players array
                shipblock: ship.shipblock || 40,  // Add shipblock property
                moving: ship.moving || false,  // Add moving property
                cargomap: ship.cargomap || Array(10).fill().map(() => Array(10).fill(0))  // Add cargomap
            };
        }
    
        // Assuming laser and cargo classes are simple data objects or have a toJSON/toPlainObject method
        const simplifiedShipLasers = this.shiplasers.map(l => ({
            x: l.x,
            y: l.y,
            rotation: l.rotation,
            totalrotation: l.totalrotation, 
            destroyed: l.destroyed,
            shipId: l.ship, // Assuming base class stores ship ID correctly
            radius: l.radius,
            power: l.power, // Specific to shiplaser
            position: l.position || { x: l.x, y: l.y }
        }));
        
        // Enhance player lasers data for better client-side rendering
        const simplifiedPlayerLasers = this.playerlasers.map(l => {
            
            return {
                x: l.x,
                y: l.y,
                rotation: l.rotation,
                totalrotation: l.totalrotation, 
                destroyed: l.destroyed,
                ship: typeof l.ship === 'object' ? l.ship.id : l.ship, // Ensure ship is always an ID
                player: typeof l.player === 'object' 
                    ? (l.player.id || (typeof l.player === 'string' ? l.player : null)) 
                    : l.player, // Handle player reference correctly
                radius: l.radius || 5, // Default radius if missing
                position: l.position || { x: l.x, y: l.y } // Ensure position exists
            };
        });

        const simplifiedCargo = this.cargo.map(c => c); // Adjust if cargo are complex classes

        // Find the simplified data for the 'me' player
        let meSimplified = null;
        
        // If we have a player instance, find it in our simplified players
        if (mePlayerInstance) {
            // Try to find player by direct reference (checking if it's one of our players)
            const socketId = Object.keys(this.players).find(key => this.players[key] === mePlayerInstance);
            
            if (socketId) {
                // We found the player by reference, use its socket ID to get the simplified version
                meSimplified = simplifiedPlayers[socketId];
            } 
            else if (mePlayerInstance.id) {
                // If it has an ID, try to find it directly
                meSimplified = simplifiedPlayers[mePlayerInstance.id];
            }
            
            // If we still can't find it, log detailed info
            if (!meSimplified) {
                console.warn(`Could not find simplified data for 'me' player`, {
                    playerHasId: !!mePlayerInstance.id,
                    playerId: mePlayerInstance.id,
                    socketIdFound: !!socketId,
                    availablePlayerIds: Object.keys(simplifiedPlayers).join(', ')
                });
            }
        }

        // --- TEMPORARY DEBUGGING: Send ONLY 'me' --- 
        const update = {
            me: meSimplified || { 
                position: { x: 0, y: 0 },
                worldPosition: { x: 0, y: 0 },
                health: 100,
                currentShip: null,
                playerView: true,
                pair: null,
                keys: {}
            }, // Provide default object instead of null
            players: simplifiedPlayers, // Re-enable players
            ships: simplifiedShips, // Re-enable ships
            shiplasers: simplifiedShipLasers, // Re-enable shiplasers
            playerlasers: simplifiedPlayerLasers, // Re-enable playerlasers
            cargo: simplifiedCargo, // Re-enable cargo
            leaderboard: lead.toJSON(), // Use toJSON() to get the correct structure
            pairs: this.pairs // Re-enable pairs
        }
        // console.log('Generated update:', JSON.stringify(update, null, 2)); // Careful: might be huge
        return update
    }

    async movePlayer(player, s = null) {
        const p = this.players[player]
        if (s !== null) {
            for (const position of ship.type['transport']) {
                const found = false
                for (const play of this.ships[s].players) {
                    if (this.players[play].position.x === position.x && this.players[play].position.y === position.y) {
                        found = true
                        break
                    }
                }
                if (!found) {
                    this.ships[p.currentShip].removePlayer(player, p.position)
                    p.moveShip(s, position.x, position.y)
                    this.ships[s].addPlayer(player)
                }
            }
        }
        
        // Update Redis with new position
        if (p && p.position) {
            await this.stateManager.updatePlayerPosition(player, {
                x: p.position.x,
                y: p.position.y,
                rotation: p.direction || 0
            })
        }
    }
    usePlayer(player) {
        const p = this.players[player]
        if (p.position.x === 1 && p.position.y === 2) {
            p.togglePlayerView()
            this.ships[p.currentShip].moving = !this.ships[p.currentShip].moving
        }
    }
    handleTransportStart(data) {
        if (!(data.source in this.cargoRequests )) {
            this.cargoRequests[data.source] = {sink: data.sink, time: 0}
        }
        else if (data.sink !== this.cargoRequests[data.source].sink) {
            this.cargoRequests[data.source].sink = data.sink
            this.cargoRequests[data.source].time = 0
        }
    }

    cancelTransportRequest(data) {
        delete this.cargoRequests[data.source]
    }
    cargoGenerator() {
        const total = Math.random() * (51  - 25) + 25
        for (let i = 0; i < total; i++) {
            this.cargo.push(new cargo(10000, 10000))
        }
    }
    async disconnect(socket, hard = true) {
        // Remove from Redis first
        if (this.players[socket.id]) {
            await this.stateManager.removePlayer(socket.id)
            
            // Get the player's pair code
            const playerPairCode = this.players[socket.id].pair;
            
            // If this was the last player with this pair code, remove it from instance tracking
            if (playerPairCode && this.pairs[playerPairCode]) {
                const pair = this.pairs[playerPairCode];
                if (pair.players.length <= 1) {
                    await this.stateManager.removePairCode(playerPairCode);
                }
            }
        }
        
        const playerID = socket.id;
        if (hard === true) {
            delete this.sockets[playerID];
        }
        if (playerID in this.players) {
            const currentShip = this.players[playerID].currentShip;
            delete this.players[playerID];
            this.ships[currentShip].removePlayer(playerID)
            if (this.ships[currentShip].players.length === 0) {
                delete this.ships[currentShip]
            }
        }
        this.deleting = true
        let deletePairs = []
        for (const pair in this.pairs) {
            if (this.pairs[pair].players.includes(playerID.toString())) {
                this.pairs[pair].players.splice(this.pairs[pair].players.indexOf(playerID), 1)
                if (this.pairs[pair].players.length === 0) {
                    deletePairs.push(pair)
                }
            }
        }
        for (const p of deletePairs) {
            delete this.pairs[p]
        }
        this.deleting = false
    }

    async syncGameState() {
        try {
            console.log('Preparing game state for memory sync');
            
            // Add minimal debug info about what we're about to sync
            console.log(`Syncing: ${Object.keys(this.players).length} players, ${Object.keys(this.ships).length} ships, ${this.cargo.length} cargo items`);
            
            // Create a clean clone of the game state without socket references
            // rather than modifying the original object
            const gameState = {
                players: {},
                ships: {}, 
                cargo: [],
                leaderboard: [],
                pairs: {},
                cargoRequests: {}
            };
            
            // Sanitize players
            for (const [id, playerInstance] of Object.entries(this.players)) {
                if (playerInstance) {
                    gameState.players[id] = {
                        id: id,
                        username: playerInstance.user,
                        position: playerInstance.position ? { ...playerInstance.position } : null,
                        health: playerInstance.health,
                        currentShip: playerInstance.currentShip,
                        playerView: playerInstance.playerView,
                        pair: playerInstance.pair,
                        keys: playerInstance.keys ? { ...playerInstance.keys } : {},
                        worldPosition: playerInstance.worldPosition ? { ...playerInstance.worldPosition } : null
                    };
                }
            }
            
            // Sanitize ships
            for (const [id, shipInstance] of Object.entries(this.ships)) {
                if (shipInstance) {
                    gameState.ships[id] = {
                        id: id,
                        position: shipInstance.position ? { ...shipInstance.position } : null,
                        dir: shipInstance.dir,
                        speed: shipInstance.speed,
                        powerState: shipInstance.powerState ? { ...shipInstance.powerState } : null,
                        health: shipInstance.health,
                        owner: shipInstance.owner,
                        // Include any other relevant ship state
                    };
                }
            }
            
            // Add cargo
            gameState.cargo = this.cargo.map(c => ({
                id: c.id,
                position: c.position ? { ...c.position } : null,
                type: c.type,
                // Include any other relevant cargo state
            }));
            
            // Add leaderboard
            gameState.leaderboard = this.leaderboard;
            
            // Add pairs
            gameState.pairs = { ...this.pairs };
            
            // Sanitize cargoRequests
            for (const [sourceId, requestData] of Object.entries(this.cargoRequests)) {
                if (requestData) {
                    gameState.cargoRequests[sourceId] = {
                        sink: requestData.sink,
                        time: requestData.time
                    };
                }
            }
            
            // Debug: test stringify locally first to catch and identify circular references
            try {
                // First try stringify the game state directly in this function
                const jsonStr = JSON.stringify(gameState);
                console.log(`Successfully stringified game state (${jsonStr.length} characters)`);
                
                // If we got here, update to memory
                await this.stateManager.updateGameState(gameState);
            } catch (jsonError) {
                console.error('Circular reference detected in game state:', jsonError.message);
                
                // Try to identify which part of the state has the circular reference
                console.log('Attempting to identify problematic part of state...');
                
                const parts = [
                    'players', 'ships', 'cargo', 'leaderboard', 'pairs', 'cargoRequests'
                ];
                
                for (const part of parts) {
                    try {
                        JSON.stringify(gameState[part]);
                        console.log(`Part ${part} is OK`);
                    } catch (partError) {
                        console.error(`Circular reference found in ${part}:`, partError.message);
                    }
                }
                
                // Don't try to update if we have a circular reference
                console.error('Skipping state sync due to circular reference');
            }
        } catch (error) {
            console.error('Error syncing game state:', error);
        }
    }
}   
