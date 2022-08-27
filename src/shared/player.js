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
        this.health = 100
    }
    
    moveShip(shipid, x, y) {
        this.currentShip = parseInt(shipid)
        this.position.x = x
        this.position.y = y
        this.worldPosition.x = (this.position.x * ship.block) -this.width / 2  + ship.block / 2
        this.worldPosition.y = (this.position.y * ship.block) -this.height / 2 + ship.block / 2
    }
    movePlayer(x, y, s) {
        // position bounds are set at 9 because the ship is 10x10 units
        const lower_x = Math.floor(x / s.shipblock)
        const lower_y = Math.floor(y / s.shipblock)
        const upper_x = Math.floor((x + (this.width))/ s.shipblock)
        const upper_y = Math.floor((y + (this.height))/ s.shipblock)
        const left_x = Math.floor(x / s.shipblock)
        const left_y = Math.floor((y + this.height)/ s.shipblock)
        const right_x = Math.floor((x + this.width)/ s.shipblock)
        const right_y = Math.floor(y/ s.shipblock)
        if (ship.grid[lower_x][lower_y] === 1 && ship.grid[upper_x][upper_y] === 1 && ship.grid[left_x][left_y] === 1 && ship.grid[right_x][right_y] === 1) {
            this.position = {x: lower_x, y: lower_y}
            this.worldPosition = {x: x, y: y}
            //console.log(this.position, this.worldPosition)
            this.animation += 1
        }
    }
    togglePlayerView() {
        this.playerView = !this.playerView
    }
    hit() {
        this.health-=2;
        console.log(this.health)
    }
}