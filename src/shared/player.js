import {ship} from '../shared/ship'
export class player {
    constructor(user, parentShip, x, y, pair) {
        this.user = user
        // Store only the ship ID, not the entire ship object
        this.parentShip = typeof parentShip === 'object' ? parentShip.id : parentShip
        // Store only the ship ID
        this.currentShip = typeof parentShip === 'object' ? parentShip.id : parentShip
        
        // Calculate initial position based on ship block size if ship object provided
        const shipBlock = parentShip.shipblock || 40 // Default block size if not provided
        
        this.playerView = true
        this.position = {
            x: x,
            y: y
        }
        this.width = 25
        this.height = 25
        
        // Calculate world position if ship object provided
        this.worldPosition = {
            x: (this.position.x * shipBlock) - this.width / 2 + shipBlock / 2,
            y: (this.position.y * shipBlock) - this.height / 2 + shipBlock / 2
        }
        
        this.rotation = 0
        this.pair = pair
        this.direction = 0
        this.animation = 0
        this.weaponsDirection = 0
        this.health = 100
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false,
            use: false
        }
    }
    
    moveShip(shipid, x, y) {
        this.currentShip = parseInt(shipid)
        this.position.x = x
        this.position.y = y
        this.worldPosition.x = (this.position.x * ship.block) -this.width / 2  + ship.block / 2
        this.worldPosition.y = (this.position.y * ship.block) -this.height / 2 + ship.block / 2
    }
    movePlayer(x, y, cargo_grid) {
        // position bounds are set at 9 because the ship is 10x10 units
        const lower_x = Math.floor(x / ship.block)
        const lower_y = Math.floor(y / ship.block)
        const upper_x = Math.floor((x + (this.width))/ ship.block)
        const upper_y = Math.floor((y + (this.height))/ ship.block)
        const left_x = Math.floor(x / ship.block)
        const left_y = Math.floor((y + this.height)/ ship.block)
        const right_x = Math.floor((x + this.width)/ ship.block)
        const right_y = Math.floor(y/ ship.block)
        if (ship.grid[lower_x][lower_y] === 1 && ship.grid[upper_x][upper_y] === 1 && ship.grid[left_x][left_y] === 1 && ship.grid[right_x][right_y] === 1 && cargo_grid[lower_x][lower_y] === 0 && cargo_grid[upper_x][upper_y] === 0 && cargo_grid[left_x][left_y] === 0 && cargo_grid[right_x][right_y] === 0) {
            this.position = {x: lower_x, y: lower_y}
            this.worldPosition = {x: x, y: y}
        }
    }
    togglePlayerView() {
        this.playerView = !this.playerView
    }
    hit() {
        this.health-=10;
        if (this.health <= 0) {
            this.health = 0
        }
    }
    update(cargo_grid) {
        if (this.keys.left) {
            this.movePlayer(this.worldPosition.x - 4, this.worldPosition.y, cargo_grid)
            if (this.direction === 1) {
                this.animation = this.animation < 3.8 ? this.animation + 0.2 : 0
            }
            else {
                this.direction = 1
                this.animation = 0
            }
        }

        else if (this.keys.right) {
            this.movePlayer(this.worldPosition.x + 4, this.worldPosition.y, cargo_grid)
            if (this.direction === 3) {
                this.animation = this.animation < 3.8 ? this.animation + 0.2 : 0
            }
            else {
                this.direction = 3
                this.animation = 0
            }
        }

        else if (this.keys.up) {
            this.movePlayer(this.worldPosition.x, this.worldPosition.y - 4, cargo_grid)
            
            if (this.direction === 0) {
                this.animation = this.animation < 3.8 ? this.animation + 0.2 : 0
            }
            else {
                this.direction = 0
                this.animation = 0
            }
        }

        else if (this.keys.down) {
            this.movePlayer(this.worldPosition.x, this.worldPosition.y + 4, cargo_grid)
            if (this.direction === 2) {
                this.animation = this.animation < 3.8 ? this.animation + 0.2 : 0
            }
            else {
                this.direction = 2
                this.animation = 0
            }
        }
    }
}