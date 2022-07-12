import { ship } from "./ship"


export class player {
    constructor(user, parentShip, x, y) {

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
        this.keys = {
            left: {
                pressed: false
            },
            right: {
                pressed: false
            },
            up: {
                pressed: false
            },
            down: {
                pressed: false
            },
            use: {
                pressed: false
            }
        }
    }
    setPressed(key) {
        this.keys[key].pressed = true
    }
    setUnpressed(key) {
        this.keys[key].pressed = false
    }
    moveShip(shipid, x, y) {
        this.currentShip = shipid
        this.position.x = x
        this.position.y = y
    }
    movePlayer() {
        // position bounds are set at 9 because the ship is 10x10 units
        if (this.keys.left.pressed === true) {
            if (this.position.x > 0) {
                if (ship.grid[this.position.x - 1][this.position.y] === 1) {
                    this.position = {x: this.position.x - 1, y: this.position.y}
                }
                else {
                    this.setUnpressed('left')
                }
            }
            else {
                this.setUnpressed('left')
            }
            this.setUnpressed('left')
        }
        else if (this.keys.right.pressed === true) {
            if (this.position.x < 9) {
                if (ship.grid[this.position.x + 1][this.position.y] === 1) {
                    this.position = {x: this.position.x + 1, y: this.position.y}
                }
                else {
                    this.setUnpressed('right')
                }
            }
            else {
                this.setUnpressed('right')
            } 
            this.setUnpressed('right')
        }
        else if (this.keys.up.pressed === true) {
            if (this.position.y > 0) {
                if (ship.grid[this.position.x][this.position.y-1] === 1) {
                    this.position = {x: this.position.x, y: this.position.y-1}
                }
                else {
                    this.setUnpressed('up')
                }
            }
            else {
                this.setUnpressed('up')
            }
            this.setUnpressed('up')
        }
        else if (this.keys.down.pressed === true) {
            if (this.position.y < 9) {
                if (ship.grid[this.position.x][this.position.y + 1] === 1) {
                    this.position = {x: this.position.x, y: this.position.y + 1}
                }
                else {
                    this.setUnpressed('down')
                }
            }
            else {
                this.setUnpressed('down')
            }
            this.setUnpressed('down')
        }
    }
    
    togglePlayerView() {
        this.playerView = !this.playerView
    }

    use() {
        if (this.keys.use.pressed === true) {
            if (this.position.x === 1 && this.position.y === 2) {
                this.togglePlayerView()
            }
        }
        this.setUnpressed('use')
    }
    update() {
        this.use()
        this.movePlayer()
    }
}