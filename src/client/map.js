// project internal grid position to place on screen

/*

so ... the ship will have its own internal coordinate system for purposes of player movement
see the ship grid for more details.
all ship coordinates are projected to coordinates in world space

my feeling is that the gap (in screen space terms) between the coordinates in world space should be the size of a ship block

the question is 
*/
class map {
    constructor() {
        this.width = 5000
        this.height = 5000
        this.grid = {}
        this.gridpos = {}
    }

    addShip(ship_id, x, y) {
        if (x >= 0 && x < 100 && y >=0 && y < 100) {
            this.grid[ship_id] = {x: x, y: y}
            this.gridpos[((x.toString()).concat("-")).concat(y.toString())] = ship_id
        }
    }
    removeShip(ship_id) {
        const x = this.grid[ship_id].x
        const y = this.grid[ship_id].y
        delete this.gridpos[((x.toString()).concat("-")).concat(y.toString())]
        delete this.grid[ship_id]

    }

   
}