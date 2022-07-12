import ship_map from './assets/tilemap-editor.json'

var ship_grid = Array(10).fill().map(() => Array(10))
for (const key in ship_map.map) {
    const target_x = parseInt(key.split("-")[0])
    const target_y = parseInt(key.split("-")[1])
    if ((ship_map.map[key].x === 6 && ship_map.map[key].y === 1) || (ship_map.map[key].x === 4 && ship_map.map[key].y === 3)) {
        ship_grid[target_x][target_y] = 1
    }
    else {
        ship_grid[target_x][target_y] = 0
    }
}
export class ship {
    static grid = ship_grid
    constructor(x, y, player, id) {
        this.id = id
        // this is the top left position of the ship
        this.position = {x: x, y: y}
        // shipblock will be scaled at render time
        this.shipblock = 25
        // this is the rotation relative to the rest of the world
        this.rotation = 0
        
        this.players = [player]
        this.moving = false
        this.availablePower = 2
        this.systems = {shields: 4, engines: 4, weapons: 4}

        // will normally be 0 but just temp moved up to 12 just to demonstrate menu functionality
        this.cargo = 12
    }
    setRotation(deg) {
        this.rotation = deg
    }
    addPlayer(player) {
        this.players.push(player)
    }
    update() {
        if (this.moving && this.player) {
            this.position.x += 2 * Math.sin(this.rotation) * this.systems.engines / 2
            this.position.y -= 2 * Math.cos(this.rotation) * this.systems.engines / 2
        }
    }
}