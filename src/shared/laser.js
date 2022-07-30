export class laser {
    constructor(x, y, rotation, ship) {
        this.originx = ship.position.x
        this.originy = ship.position.y
        this.x = x
        this.y = y
        // this rotation is about the center of the ship from which the laser is fired
        this.rotation = rotation
        this.totalrotation = rotation + ship.rotation + Math.PI / 2
        this.ship = ship.id
        this.length = 10
    }
    update() {
        this.x += Math.cos(this.totalrotation)
        this.y += Math.sin(this.totalrotation)
    }
}