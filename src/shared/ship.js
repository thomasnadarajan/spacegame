import ship_map from './assets/tilemap-editor.json'

var ship_grid = Array(10).fill().map(() => Array(10))
var grid_types = {}
for (const key in ship_map.map) {
    const target_x = parseInt(key.split("-")[0])
    const target_y = parseInt(key.split("-")[1])
    if ((ship_map.map[key].x === 6 && ship_map.map[key].y === 1) || (ship_map.map[key].x === 4 && ship_map.map[key].y === 3)) {
        ship_grid[target_x][target_y] = 1
        if (ship_map.map[key].x === 6 && ship_map.map[key].y === 1) {
            if ('floor' in grid_types) {
                grid_types['floor'].push({x: target_x, y: target_y})
            }
            else {
                grid_types['floor'] = [{x: target_x, y: target_y}]
            }
        }
        else if (ship_map.map[key].x === 4 && ship_map.map[key].y === 3) {
            if ('transport' in grid_types) {
                grid_types['transport'].push({x: target_x, y: target_y})
            }
            else {
                grid_types['transport'] = [{x: target_x, y: target_y}]
            }
        }
    }
    else {
        ship_grid[target_x][target_y] = 0
    }
}

export class ship {
    static grid = ship_grid
    static type = grid_types
    constructor(x, y, id) {
        this.id = id
        // this is the center position of the ship
        this.position = {x: x, y: y}
        // shipblock will be scaled at render time - add an argument to the constructor for scale
        this.shipblock = 25
        // this is the rotation relative to the rest of the world
        this.rotation = 0
        this.players = []
        this.moving = false
        this.availablePower = 2
        this.systems = {shields: 1, engines: 1, weapons: 1}
        this.shield = this.systems.shields * 5
        this.hull = 100
        this.playerGrid = ship.grid.map((arr) => {return arr.slice()})
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                this.playerGrid[i][j] = 0
            }
        }
        // will normally be 0 but just temp moved up to 12 just to demonstrate menu functionality
        this.cargo = 12
        this.radius = Math.sqrt(2 * Math.pow(5 * this.shipblock, 2))

        this.shieldsDownBurn = 0
        //this.addPlayer(player, player.position)
    }
    setRotation(deg) {
        this.rotation = deg
    }
    addPlayer(player, position) {
        this.players.push(player)
        this.playerGrid[position.x][position.y] = 1
    }
    removePlayer(player, position) {
        this.players.splice(this.players.indexOf(player), 1)
        this.playerGrid[position.x][position.y] = 0
    }
    update() {
        if (this.shieldsDownBurn > 0) {
            this.shieldsDownBurn--
        }
        if (this.moving && this.player) {
            this.position.x += 2 * Math.sin(this.rotation) * this.systems.engines / 2
            this.position.y -= 2 * Math.cos(this.rotation) * this.systems.engines / 2
        }
    }
    hit() {
        if (this.shield > 0) {
            this.shield--
            if (this.shield === 0) {
                this.shieldsDownBurn = 40
            }
        }
        else  {
            this.hull -= 2
        }
    }
}