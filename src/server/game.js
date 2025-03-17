import {player} from '../shared/player'
import {ship} from '../shared/ship'
import {shiplaser, playerlaser} from '../shared/laser'
import { cargoCollide, circleCollision, playerCollide, worldCollide } from './circlecol'
import {cargo} from '../shared/cargo'
import { leaderboard } from '../shared/leaderboard'
import { RedisManager } from './redisManager'

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
        
        // Initialize Redis manager
        this.redisManager = new RedisManager()
        
        // Initialize game state properly
        this.initializeGameState().catch(err => {
            console.error('Failed to initialize game state:', err)
        })
    }

    async initializeGameState() {
        try {
            console.log('Initializing game state...');
            
            // Clear existing Redis state
            await this.redisManager.clearState();
            
            // Load initial state from Redis (which will now be empty)
            const state = await this.redisManager.getGameState()
            
            // Initialize empty game state
            this.ships = {}
            this.players = {}
            this.cargo = []
            
            console.log('Game state initialized with empty Redis cache');

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
        this.sockets[socket.id] = socket
    }
    checkCollisions(newShip) {
        for (const shipId in this.ships) {
            if (circleCollision(newShip, this.ships[shipId])) {
                return true;
            }
        }
        return false;
    }
    async addPlayer(user, socket) {
        console.log(`Attempting to add player: ${user} with socket ID: ${socket.id}`);
        try {
            // Generate random ship position and ID
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
                await this.redisManager.registerPairCode(pair_code)
                
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
                await this.redisManager.addPlayer(socket.id, playerData)

                console.log(`===== PLAYER CREATION SUCCESS =====`);
                console.log(`Player created: ${user} with socket ID: ${socket.id}`);
                console.log(`Player data:`, JSON.stringify(playerData, null, 2));
                console.log(`Ready to emit 'ready' event to socket: ${socket.id}`);
                
                // Check socket state before emitting
                console.log(`Socket connected status: ${socket.connected}`);
                console.log(`Socket object type: ${typeof socket}`);
                console.log(`Socket emit function type: ${typeof socket.emit}`);
                
                // Send ready event through socket with extra check
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
        this.players[player].keys[key] = true
        if (key === 'use') {
            this.usePlayer(player)
        }
    }
    stopDirection(player, key) {
        this.players[player].keys[key] = false
        this.players[player].animation = 0
    }
    handleFire(rotation, ship) {
        const parentShip = this.ships[ship]
        const rot = rotation + parentShip.rotation
        const originx = parentShip.position.x 
        const originy = parentShip.position.y - 10 * parentShip.shipblock
        const x = Math.cos(rot) * (originx - parentShip.position.x) - Math.sin(rot) * (originy - parentShip.position.y) + parentShip.position.x;
        const y = Math.sin(rot) * (originx - parentShip.position.x) + Math.cos(rot) * (originy - parentShip.position.y) + parentShip.position.y;
        this.shiplasers.push(new shiplaser(x, y, rot, parentShip))
    }
    handlePowerUpdate(system, level, ship) {
        const s = system.replace('Shifter', '').toLowerCase()
        const used = (level+1) - this.ships[ship].systems[s]
        this.ships[ship].systems[s] = level + 1
        this.ships[ship].availablePower -= used
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
        const p = this.players[player]
        const s = this.ships[p.currentShip]
        const rot = p.weaponsDirection
        const originx = p.worldPosition.x + p.width / 2 
        const originy = p.worldPosition.y + p.height / 2 - 30
        const rotx = p.worldPosition.x+ p.width / 2
        const roty = p.worldPosition.y + p.height / 2
        const x = Math.cos(rot) * (originx - rotx) - Math.sin(rot) * (originy - roty) +rotx;
        const y = Math.sin(rot) * (originx - rotx) + Math.cos(rot) * (originy - roty) + roty;
        this.playerlasers.push(new playerlaser(x, y, rot, p, s))
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
        if (this.shouldSendUpdate) {
            for (const laser of this.shiplasers) {
                if (laser.x < 0 || laser.x > 50000 || laser.y < 0 || laser.y > 50000) {
                    laser.setDestroyed()
                }
            }
            this.shiplasers = this.shiplasers.filter(laser => !laser.destroyed)
            this.playerlasers = this.playerlasers.filter(laser => !laser.destroyed)
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
                        currentPlayer.update(currentShip.cargomap);
                    }
                }
            }
            for (const laser of this.shiplasers) {
                laser.update()
            }
            for (const laser of this.playerlasers) {
                laser.update()
            }
            for (const ship in this.ships) {
                for (const laser of this.shiplasers) {
                    if (laser.ship !== this.ships[ship].id) {
                        if (circleCollision(this.ships[ship], null, laser)) {
                            this.ships[ship].hit(laser)
                            laser.setDestroyed()
                        }
                    }
                }
                for (const cargo of this.cargo) {
                    if (cargoCollide(this.ships[ship], cargo)) {
                        this.ships[ship].cargo += cargo.cargo
                        this.cargo.splice(this.cargo.indexOf(cargo), 1)
                    }
                }
            }
            for (const laser of this.playerlasers) {
                for (const player in this.players) {
                    if (laser.ship === this.players[player].currentShip) {
                        if (playerCollide(this.players[player], null, laser)) {
                            this.players[player].hit()
                            laser.setDestroyed()
                        }
                    }
                }
                var worldCol = false
                for (let x = 0; x < 10; x++) {
                    for (let y = 0; y < 10; y++) {
                        if (ship.grid[x][y] === 0) {
                            const blockPosition = {x: x * ship.block, y: y * ship.block, width: ship.block, height: ship.block}
                            if (worldCollide(laser, blockPosition)) {
                                laser.setDestroyed()
                                worldCol = true
                            }
                        }
                    }
                    if (worldCol) {
                        break
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
                this.players[player].update(this.ships[this.players[player].currentShip].cargomap)
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
            
            // Sync leaderboard to Redis
            await this.redisManager.updateLeaderboard(this.leaderboard)

            // Sync complete game state to Redis periodically (every 5 seconds)
            if (Date.now() - this.lastUpdate > 5000) {
                await this.syncGameState()
                this.lastUpdate = Date.now()
            }
        } else {
            this.shouldSendUpdate = true;
        }
    }
    generateGameUpdate(me) {
        var lead = this.leaderboard
        if (!this.deleting) {
            lead = new leaderboard()
            let pairscores = []
            
            // Collect all ships and their cargo levels
            for (const shipId in this.ships) {
                const ship = this.ships[shipId];
                // Find if this ship belongs to a pair
                let pairId = null;
                for (const pair in this.pairs) {
                    if (this.pairs[pair].ship === parseInt(shipId)) {
                        pairId = pair;
                        break;
                    }
                }
                
                // If ship belongs to a pair, add its score
                if (pairId !== null) {
                    pairscores.push({
                        pair: pairId,
                        score: ship.cargo || 0
                    });
                }
            }
            
            // Sort by score in descending order
            pairscores.sort((a, b) => b.score - a.score)
            
            // Add top 5 scores to leaderboard
            for (let i = 0; i < pairscores.length && i < 5; i++) {
                lead.addPair(pairscores[i].pair, pairscores[i].score)
            }
            
            this.leaderboard = lead
        }
        
        const update = {
            me: me,
            players: this.players,
            ships: this.ships,
            shiplasers: this.shiplasers,
            playerlasers: this.playerlasers,
            cargo: this.cargo,
            leaderboard: lead,
            pairs: this.pairs // Add pairs to the update so client knows about pair assignments
        }
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
            await this.redisManager.updatePlayerPosition(player, {
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
            await this.redisManager.removePlayer(socket.id)
            
            // Get the player's pair code
            const playerPairCode = this.players[socket.id].pair;
            
            // If this was the last player with this pair code, remove it from instance tracking
            if (playerPairCode && this.pairs[playerPairCode]) {
                const pair = this.pairs[playerPairCode];
                if (pair.players.length <= 1) {
                    await this.redisManager.removePairCode(playerPairCode);
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
            // Prepare data for Redis storage
            const gameState = {
                players: Object.entries(this.players).reduce((acc, [id, playerInstance]) => {
                    acc[id] = {
                        id: id,
                        username: playerInstance.user,
                        position: playerInstance.position,
                        health: playerInstance.health,
                        currentShip: playerInstance.currentShip,
                        playerView: playerInstance.playerView,
                        pair: playerInstance.pair,
                        keys: playerInstance.keys || {},
                        worldPosition: playerInstance.worldPosition
                    }
                    return acc
                }, {}),
                ships: Object.entries(this.ships).reduce((acc, [id, shipInstance]) => {
                    acc[id] = {
                        id: parseInt(id),
                        position: shipInstance.position,
                        rotation: shipInstance.rotation,
                        hull: shipInstance.hull,
                        cargo: shipInstance.cargo,
                        players: shipInstance.players,
                        systems: shipInstance.systems,
                        moving: shipInstance.moving,
                        shipblock: shipInstance.shipblock
                    }
                    return acc
                }, {}),
                cargo: this.cargo.map(cargoInstance => ({
                    x: cargoInstance.x,
                    y: cargoInstance.y,
                    cargo: cargoInstance.cargo
                })),
                leaderboard: this.leaderboard
            }

            // Sync to Redis
            await this.redisManager.updateGameState(gameState)
        } catch (err) {
            console.error('Failed to sync game state:', err)
        }
    }
}   