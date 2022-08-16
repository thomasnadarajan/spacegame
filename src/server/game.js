import {player} from '../shared/player'
import {ship} from '../shared/ship'
import {laser} from '../shared/laser'
import { circleCollision } from './circlecol'
export class game {
    constructor() {
        this.sockets ={}
        this.players = {}
        this.keys = {}
        this.pairs = {}
        // a list of all the ships in the game
        this.ships = {}

        // a list of all the lasers in flight
        this.shiplasers = []
        this.playerlasers = []
        
        this.lastUpdate = Date.now()
        this.shouldSendUpdate = false
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
            this.ships[ship_id].addPlayer(socket.id, this.players[socket.id].position)
            //const ship_id2 = Math.floor(1000 + Math.random() * 9000)
            //this.ships[ship_id2] = new ship(x + 575, y, ship_id2)
            
        }
        else {
            // Eventually we will do type checking/cleansing client side.
            const pair_proper = parseInt(pair)
            const parentShip = this.ships[this.pairs[pair_proper].ship]
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) { 
                    if (ship.grid[i][j] === 1 && parentShip.playerGrid[i][j] === 0) {
                        this.players[socket.id] = new player(player_user, parentShip, i, j, pair_proper)
                        parentShip.addPlayer(socket.id, this.players[socket.id].position)
                        this.keys[socket.id] = {
                            left: false,
                            right: false,
                            up: false,
                            down: false,
                            use: false
                        }
                        return
                    }
                }
            }
        }
        this.keys[socket.id] = {
            left: false,
            right: false,
            up: false,
            down: false,
            use: false
        }
    }
    setShipDirection(player, dir) {
        this.ships[player.currentShip].setRotation(dir)
    }
    handleDirectionInput(player, key) {
        this.keys[player][key] = true
        if (key !== 'use') {
            this.movePlayer(player)
        }
        else {
            this.usePlayer(player)
        }
        
    }
    handleFire(rotation, ship) {
        const parentShip = this.ships[ship]
        const rot = rotation + parentShip.rotation
        const originx = parentShip.position.x 
        const originy = parentShip.position.y - 10 * parentShip.shipblock
        const x = Math.cos(rot) * (originx - parentShip.position.x) - Math.sin(rot) * (originy - parentShip.position.y) + parentShip.position.x;
        const y = Math.sin(rot) * (originx - parentShip.position.x) + Math.cos(rot) * (originy - parentShip.position.y) + parentShip.position.y;
        //console.log("Bullet x:", x, " Bullet y: ", y)
        //console.log(parentShip.id, "x: ", parentShip.position.x - 5 * parentShip.shipblock, " y: ", parentShip.position.y - 5 * parentShip.shipblock)
        this.shiplasers.push(new laser(x, y, rot, parentShip))
    }
    handlePowerUpdate(system, level, ship) {
        const s = system.replace('Shifter', '').toLowerCase()
        const used = (level+1) - this.ships[ship].systems[s]
        this.ships[ship].systems[s] = level + 1
        this.ships[ship].availablePower -= used
    }
    update(){
        if (this.shouldSendUpdate) {
            for (const laser of this.shiplasers) {
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
            this.shiplasers = this.shiplasers.filter(laser => !laser.destroyed)
            for (const ship in this.ships) {
                this.ships[ship].update()
            }
            Object.keys(this.sockets).forEach(playerID => {
                const socket = this.sockets[playerID];
                if (playerID in this.players) {
                    //this.players[playerID].update()
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
            playerlasers: []
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
                    this.ships[s].addPlayer(player, position)
                }
            }
            
        }
        else {
            if (this.keys[player].left) {
                p.movePlayer(p.worldPosition.x - 5, p.worldPosition.y, this.ships[p.currentShip])
                if (p.direction === 1) {
                    p.animation = p.animation < 8 ? p.animation + 1 : 0
                }
                else {
                    p.direction = 1
                    p.animation = 0
                }
                this.keys[player].left = false
            }

            else if (this.keys[player].right) {
                p.movePlayer(p.worldPosition.x + 5, p.worldPosition.y, this.ships[p.currentShip])
                if (p.direction === 3) {
                    p.animation = p.animation < 8 ? p.animation + 1 : 0
                }
                else {
                    p.direction = 3
                    p.animation = 0
                }
                this.keys[player].right = false
            }

            else if (this.keys[player].up) {
                p.movePlayer(p.worldPosition.x, p.worldPosition.y - 5, this.ships[p.currentShip])
                
                if (p.direction === 0) {
                    p.animation = p.animation < 8 ? p.animation + 1 : 0
                }
                else {
                    p.direction = 0
                    p.animation = 0
                }
                this.keys[player].up = false
            }

            else if (this.keys[player].down) {
                p.movePlayer(p.worldPosition.x, p.worldPosition.y + 5, this.ships[p.currentShip])
                if (p.direction === 2) {
                    p.animation = p.animation < 8 ? p.animation + 1 : 0
                }
                else {
                    p.direction = 2
                    p.animation = 0
                }
                this.keys[player].down = false
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
}