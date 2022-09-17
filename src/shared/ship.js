import ship_map from './assets/tilemap-editor.json'

var ship_grid = Array(10).fill().map(() => Array(10))
var grid_types = {}
export let ship_colors = {}
for (const key in ship_map.map) {
    const target_x = parseInt(key.split("-")[0])
    const target_y = parseInt(key.split("-")[1])
    if ((ship_map.map[key].x === 6 && ship_map.map[key].y === 1) || (ship_map.map[key].x === 4 && ship_map.map[key].y === 3) || (ship_map.map[key].x === 4 && ship_map.map[key].y === 0)) {
        ship_grid[target_x][target_y] = 1
        if (ship_map.map[key].x === 6 && ship_map.map[key].y === 1) {
            if ('floor' in grid_types) {
                grid_types['floor'].push({x: target_x, y: target_y})
            }
            else {
                grid_types['floor'] = [{x: target_x, y: target_y}]
                ship_colors[ship_map.map[key].tileSymbol] = '#dfe6e9'
            }
        }
        else if (ship_map.map[key].x === 4 && ship_map.map[key].y === 3) {
            if ('transport' in grid_types) {
                grid_types['transport'].push({x: target_x, y: target_y})
            }
            else {
                grid_types['transport'] = [{x: target_x, y: target_y}]
                ship_colors[ship_map.map[key].tileSymbol] = '#fdcb6e'
            }
        }
        else if (ship_map.map[key].x === 4 && ship_map.map[key].y === 0) {
            if ('cargopad' in grid_types) {
                grid_types['cargopad'].push({x: target_x, y: target_y})
            }
            else {
                grid_types['cargopad'] = [{x: target_x, y: target_y}]
                ship_colors[ship_map.map[key].tileSymbol] = "#e17055"
            }
        }
    }
    else {
        ship_grid[target_x][target_y] = 0
        if (ship_map.map[key].x === 2 && ship_map.map[key].y === 3) {
            if (!(ship_map.map[key].tileSymbol in ship_colors)) {
                ship_colors[ship_map.map[key].tileSymbol] = "#0984e3"
            }
        }
        else if (ship_map.map[key].x === 1 && ship_map.map[key].y === 3) {
            if (!(ship_map.map[key].tileSymbol in ship_colors)) {
                ship_colors[ship_map.map[key].tileSymbol] = "#0984e3"
            }
        }
        else {
            if (!(ship_map.map[key].tileSymbol in ship_colors)) {
                ship_colors[ship_map.map[key].tileSymbol] = '#2d3436'
            }
        }
    }
}

export class ship {
    static grid = ship_grid
    static type = grid_types
    static block = 40
    constructor(x, y, id) {
        this.id = id
        // this is the center position of the ship
        this.position = {x: x, y: y}
        // shipblock will be scaled at render time - add an argument to the constructor for scale
        this.shipblock = ship.block
        // this is the rotation relative to the rest of the world
        this.rotation = 0
        this.players = []
        this.moving = false
        this.availablePower = 2
        this.systems = {shields: 1, engines: 1, weapons: 1}
        this.shield = this.systems.shields * 20
        this.hull = 100
        this.playerGrid = ship.grid.map((arr) => {return arr.slice()})
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                this.playerGrid[i][j] = 0
            }
        }
        this.cargo = 10
        this.radius = Math.sqrt(2 * Math.pow(5 * this.shipblock, 2))

        this.shieldsDownBurn = 0

        this.cargomap = Array(10).fill().map(() => Array(10).fill(0));
    }
    setRotation(deg) {
        this.rotation = deg
    }
    addPlayer(player) {
        this.players.push(player)
    }
    removePlayer(player) {
        this.players.splice(this.players.indexOf(player), 1)
    }
    update() {
        if (this.shieldsDownBurn > 0) {
            this.shieldsDownBurn--
        }
        if (this.moving) {
            this.position.x += 2 * Math.sin(this.rotation) * this.systems.engines / 2
            this.position.y -= 2 * Math.cos(this.rotation) * this.systems.engines / 2
        }
        for (const place of grid_types['cargopad']) {
            this.cargomap[place.x][place.y] = 0
        }
        var q = 0
        for (let i = 10; i <= this.cargo && i / 10 <= grid_types['cargopad'].length; i += 10) {
            this.cargomap[grid_types['cargopad'][q].x][grid_types['cargopad'][q].y] = 1
            q++
        }
    }
    hit(laser) {
        if (this.shield > 0) {
            this.shield = Math.max(0, this.shield -laser.power)
            if (this.shield === 0) {
                this.shieldsDownBurn = 40
            }
        }
        else  {
            this.hull = Math.max(0, this.hull - laser.power)
        }
    }
    static findGridType(x, y) {
        for (const key in ship.type) {
            for (let i = 0; i < ship.type[key].length; i++) {
                if (ship.type[key][i].x === x && ship.type[key][i].y === y) {
                    return key
                }
            }
        }
        return null
    }
}