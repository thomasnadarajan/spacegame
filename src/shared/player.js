import {ship} from '../shared/ship'

export class player {
    constructor(user, parentShip, x, y, pair) {

        this.user = user
        // this will ultimately just store the id for the ship from which the player originates
        this.parentShip = parentShip
        // the ship the player is currently on
        this.currentShip = this.parentShip

        // determine whether the player is to be rendered in ship view or player view
        this.playerView = true
        // this is the position within the ship's internal grid
        this.position = {
            x: x,
            y: y
        }
        this.width = 5
        this.height = 5

        // this rotation is relative to an upwards facing ship
        this.rotation = 0
        this.pair = pair
    }
    
    moveShip(shipid, x, y) {
        this.currentShip = shipid
        this.position.x = x
        this.position.y = y
    }
    movePlayer(x, y, s) {
        // position bounds are set at 9 because the ship is 10x10 units
        if (ship.grid[x][y] === 1 && s.playerGrid[x][y] === 0 && x >= 0 && x < 9 && y >= 0 && y < 9) {
            s.playerGrid[x][y] = 1
            s.playerGrid[this.position.x][this.position.y] = 0
            this.position = {x: x, y: y}
        }
    }
    togglePlayerView() {
        this.playerView = !this.playerView
    }

}