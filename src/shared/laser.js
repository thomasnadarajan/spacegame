export class laser {
    constructor(x, y, rotation, ship) {
        this.x = x
        this.y = y
        // this rotation is about the center of the ship from which the laser is fired
        this.rotation = rotation
        //this.totalrotation = rotation + ship.rotation + Math.PI / 2
        //this.totalrotation = rotation + Math.PI / 2
        this.totalrotation = rotation
        this.ship = ship.id
        this.radius = 5
    }
    update() {
        this.x += Math.sin(this.totalrotation)
        this.y -= Math.cos(this.totalrotation)
    }
}