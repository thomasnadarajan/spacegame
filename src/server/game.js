import {player} from '../shared/player'
import {ship} from '../shared/ship'
import {laser} from '../shared/laser'
import { checkCollisions } from './collisions'
export class game {
    constructor() {
        this.sockets ={}
        this.players = {}
        this.keys = {}
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
            this.players[socket.id] = new player(player_user, ship_id, 1, 2)
            this.ships[ship_id].addPlayer(socket.id, this.players[socket.id].position)
            const ship_id2 = Math.floor(1000 + Math.random() * 9000)
            this.ships[ship_id2] = new ship(x + 450, y, ship_id2)
            //console.log(ship_id, ": ", this.ships[ship_id].position.x)
            //console.log(ship_id2, ": ", this.ships[ship_id2].position.x - (this.ships[ship_id2].shipblock * 5))
        }
        else {
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {
                    if (ship.grid[i][j] === 1 && this.ships[pair].playerGrid[i][j] === 0) {
                        this.players[socket.id] = new player(player_user, pair, i, j)
                        this.ships[pair].addPlayer(socket.id, this.players[socket.id].position)
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
        //console.log(parentShip.id, "x: ", parentShip.position.x, " y: ", parentShip.position.y)
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
            checkCollisions(this.shiplasers, this.ships)
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
                p.movePlayer(p.position.x - 1, p.position.y, this.ships[p.currentShip])
                this.keys[player].left = false
            }

            else if (this.keys[player].right) {
                p.movePlayer(p.position.x + 1, p.position.y, this.ships[p.currentShip])
                this.keys[player].right = false
            }

            else if (this.keys[player].up) {
                p.movePlayer(p.position.x, p.position.y - 1, this.ships[p.currentShip])
                this.keys[player].up = false
            }

            else if (this.keys[player].down) {
                p.movePlayer(p.position.x, p.position.y + 1, this.ships[p.currentShip])
                this.keys[player].down = false
            }
        }
    }
    usePlayer(player) {
        const p = this.players[player]
        if (p.position.x === 1 && p.position.y === 2) {
            p.togglePlayerView()
        }
    }


    updateLasers() {
        for (const laser of this.shiplasers) {
            if (laser.x === 0 || laser.x === 9 || laser.y === 0 || laser.y === 9) {
                this.shiplasers.splice(this.shiplasers.indexOf(laser), 1)
            }
            else {
                laser.x += Math.cos(laser.rotation)
                laser.y += Math.sin(laser.rotation)
            }
        }
    }
}