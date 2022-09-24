export class laser {
    static radii = {
        "ship": 20,
        "player": 5
    }
    constructor(x, y, rotation, ship) {
        this.x = x
        this.y = y
        this.rotation = rotation
        this.totalrotation = rotation
        this.position = {x: this.x, y: this.y}
        this.destroyed = false
        this.ship = ship.id
    }
    update() {
        this.x += 4 * Math.sin(this.totalrotation)
        this.y -= 4 * Math.cos(this.totalrotation)
        this.position = {x: this.x, y: this.y}
    }
    setDestroyed() {
        this.destroyed = true
    }
}

export class shiplaser extends laser {
    constructor(x, y, rotation, ship) {
        super(x, y, rotation,ship)
        this.radius = laser.radii["ship"]
        this.power = ship.systems.weapons * 5
        
    }
}

export class playerlaser extends laser {
    constructor(x, y, rotation, player, ship) {
        super(x, y, rotation, ship)
        this.player = player
        this.radius = laser.radii["player"]
        
    }
}