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

    addPlayer(socket, player_user, pair = null) {
        if(pair === null) {
            const x = 5000 * (0.25 + Math.random() * 0.5)
            const y = 5000 * (0.25 + Math.random() * 0.5)
            const ship_id = Math.floor(1000 + Math.random() * 9000)
            this.ships[ship_id] = new ship(x, y, socket.id, ship_id)
            this.sockets[socket.id] = socket

            this.players[socket.id] = new player(player_user, ship_id, 1, 2)
        }
        else {
            console.log('placeholder')
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
                this.players[playerID].update()
              const socket = this.sockets[playerID];
              const player = this.players[playerID];
              socket.emit('update', this.generateGameUpdate(player));
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
}