import {ship} from '../shared/ship'
export class player {
    constructor(user, parentShip, x, y, pair) {

        this.user = user
        // this will ultimately just store the id for the ship from which the player originates
        this.parentShip = parentShip.id
        // the ship the player is currently on
        this.currentShip = parentShip.id
        // determine whether the player is to be rendered in ship view or player view
        this.playerView = true
        // this is the position within the ship's internal grid
        this.position = {
            x: x,
            y: y
        }
        this.width = 25
        this.height = 25
        this.worldPosition =  {
            x: (this.position.x * parentShip.shipblock) -this.width / 2  + parentShip.shipblock / 2,
            y: (this.position.y * parentShip.shipblock) -this.height / 2 + parentShip.shipblock / 2
        }
        // this rotation is relative to an upwards facing ship
        this.rotation = 0
        this.pair = pair
        this.direction = 0
        this.animation = 0
        this.weaponsDirection = 0
    }
    
    moveShip(shipid, x, y) {
        this.currentShip = shipid
        this.position.x = x
        this.position.y = y
    }
    movePlayer(x, y, s) {
        // position bounds are set at 9 because the ship is 10x10 units
        
        const corrected_x = Math.floor((x + this.width) / s.shipblock)
        const corrected_y = Math.floor((y + this.height) / s.shipblock)
        const lower_x = Math.floor(x / s.shipblock)
        const lower_y = Math.floor(y / s.shipblock)
        //console.log("x:",x, " y:", y)
        //console.log("corrected x:", corrected_x," corrected y:", corrected_y)
        //if (ship.grid[corrected_x][corrected_y] === 1 && s.playerGrid[x][y] === 0 && x >= 0 && x < 9 && y >= 0 && y < 9) {
           // s.playerGrid[x][y] = 1
            //s.playerGrid[this.position.x][this.position.y] = 0
            //this.position = {x: x, y: y}
        //}
        if (ship.grid[corrected_x][corrected_y] === 1 && ship.grid[lower_x][lower_y] === 1) {
            //s.playerGrid[x][y] = 1
            //s.playerGrid[this.position.x][this.position.y] = 0
            this.position = {x: corrected_x, y: corrected_y}
            this.worldPosition = {x: x, y: y}
            this.animation += 1
        }
    }
    togglePlayerView() {
        this.playerView = !this.playerView
    }

}