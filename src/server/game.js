import {player} from '../shared/player'
import {ship} from '../shared/ship'
import {shiplaser, playerlaser} from '../shared/laser'
import { circleCollision, playerCollide, worldCollide } from './circlecol'
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
        
        this.lastUpdate = Date.now()
        this.shouldSendUpdate = false
        this.cargoRequests = {}
        setInterval(this.update.bind(this), 1000/60)
    }
    addConnection(socket) {
        this.sockets[socket.id] = socket
    }
    addPlayer(socket, player_user, pair = null) {
        if(pair === null) {
            const x = 5000 * (0.25 + Math.random() * 0.5)
            const y = 5000 * (0.25 + Math.random() * 0.5)
            const ship_id = Math.floor(1000 + Math.random() * 9000)
            this.ships[ship_id] = new ship(x, y, ship_id)
            const code = Math.floor(1000 + Math.random() * 9000)
            this.pairs[code] = {ship: ship_id, players: [socket.id]}
            this.players[socket.id] = new player(player_user, this.ships[ship_id], 1, 2, code)
            this.ships[ship_id].addPlayer(socket.id)
            
            socket.emit('ready')

        }
        else {
            // Eventually we will do type checking/cleansing client side.
            const pair_proper = parseInt(pair)
            if (pair_proper in this.pairs) {
                const parentShip = this.ships[this.pairs[pair_proper].ship]
                for (let i = 0; i < 10; i++) {
                    for (let j = 0; j < 10; j++) { 
                        if (ship.grid[i][j] === 1 && parentShip.playerGrid[i][j] === 0) {
                            this.usernames.push(player_user)
                            this.players[socket.id] = new player(player_user, parentShip, i, j, pair_proper)
                            parentShip.addPlayer(socket.id)
                            socket.emit('ready')
                            return
                        }
                    }
                }
                
            }
            socket.emit('pairError')
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
        for (const ship in this.ships) {
            if (this.ships[ship].hull <= 0) {
                for (const player of this.ships[ship].players) {
                    delete this.players[player]
                    this.sockets[player].emit('dead')
                }
                delete this.ships[ship]
            }
        }
    }
    update(){
        if (this.shouldSendUpdate) {
            this.shiplasers = this.shiplasers.filter(laser => !laser.destroyed)
            this.playerlasers = this.playerlasers.filter(laser => !laser.destroyed)
            this.checkShipDestroy()
            var markedPlayers = []
            for (const player in this.players) {
                if (this.players[player].health === 0) {
                    const p = this.players[player]
                    this.ships[p.currentShip].removePlayer(player)
                    markedPlayers.push(player)
                }
                else {
                    this.players[player].health = Math.min(this.players[player].health + 1, this.players[player].health)
                }
            }
            for (const player of markedPlayers) {
                delete this.players[player]
                this.sockets[player].emit('dead')
            }
            for (const laser of this.shiplasers) {
                laser.update()
            }
            for (const laser of this.playerlasers) {
                laser.update()
            }
            for (const laser of this.shiplasers) {
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
                this.ships[ship].update()
            }
            for (const player in this.players) {
                this.players[player].update(this.ships[this.players[player].currentShip].cargomap)
            }
            Object.keys(this.sockets).forEach(playerID => {
                const socket = this.sockets[playerID];
                if (playerID in this.players) {
                    const player = this.players[playerID];
                    
                    socket.emit('update', this.generateGameUpdate(player));
                }
                else {
                    socket.emit('update', this.generateGameUpdate(null));
                }
            })
            this.shouldSendUpdate = false;
          } else {
            this.shouldSendUpdate = true;
          }
    }
    generateGameUpdate(me) {
        const update = {
            me: me,
            players: this.players,
            ships: this.ships,
            shiplasers: this.shiplasers,
            playerlasers: this.playerlasers
        }
        return update
    }

    movePlayer(player, s = null){
        const p = this.players[player]
        if (s!== null) {
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

    disconnect(socket) {
        const playerID = socket.id;
        delete this.sockets[playerID];
        if (playerID in this.players) {
            const currentShip = this.players[playerID].currentShip;
            delete this.players[playerID];
            this.ships[currentShip].removePlayer(playerID)
            if (this.ships[currentShip].players.length === 0) {
                delete this.ships[currentShip]
            }
        }
        for (const pair in this.pairs) {
            if (playerID in this.pairs[pair]) {
                this.pairs[pair].splice(this.pairs[pair].indexOf(playerID), 1)
                if (this.pairs[pair].length === 1) {
                    delete this.pairs[pair]
                }
            }
        }
    }
}   