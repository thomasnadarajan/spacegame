import {player} from '../shared/player'
import {ship} from '../shared/ship'
export class game {
    constructor() {
        this.sockets ={}
        this.players = {}

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
            console.log(ship_id)
            this.ships[ship_id] = new ship(x, y, this.players[socket.id], ship_id)
            console.log(ship_id)
            this.players[socket.id] = new player(player_user, ship_id, 1, 2)
            this.ships[ship_id].addPlayer(socket.id, this.players[socket.id].position)
        }
        else {
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {
                    if (ship.grid[i][j] === 1 && this.ships[pair].playerGrid[i][j] === 0) {
                        this.players[socket.id] = new player(player_user, pair, i, j)
                        this.ships[pair].addPlayer(socket.id, this.players[socket.id].position)
                        return
                    }
                }
            }
        }
    }
    setShipDirection(player, dir) {
        this.ships[player.currentShip].setRotation(dir)
    }
    handleDirectionInput(player, key) {
        if (player.playerView && key !== 'use') {

            player.setPressed(key)
        }
        else if (key === 'use') {
            player.setPressed(key)
        }
    }
    update(){
        if (this.shouldSendUpdate) {
            Object.keys(this.sockets).forEach(playerID => {
                const socket = this.sockets[playerID];
                if (playerID in this.players) {
                    this.players[playerID].update()
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
            shiplasers: [],
            playerlasers: []
        }
        return update
    }

    movePlayer(player, s, direction = null){
        if (direction === null) {
            const p = this.players[player]
            for (const position of ship.type['transport']) {
                const found = false
                for (const play of this.ships[s].players) {
                    if (this.players[play].position.x === position.x && this.players[play].position.y === position.y) {
                        found = true
                        break
                    }
                }
                if (!found) {
                    p.moveShip(s, position.x, position.y)
                }
            }
            
        }
        else {
            console.log('placeholder for directional movement')
        }
    }
}