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
        this.radius = laser.radii["ship"]
    }
    update() {
        this.x += 8 * Math.sin(this.totalrotation)
        this.y -= 8 * Math.cos(this.totalrotation)
        this.position.x = this.x
        this.position.y = this.y
    }
    setDestroyed() {
        this.destroyed = true
    }
}

export class shiplaser extends laser {
    constructor(x, y, rotation, ship) {
        super(x, y, rotation, ship)
        this.radius = laser.radii["ship"]
        this.power = ship.systems.weapons * 5
        
        this.position = {x: this.x, y: this.y}
    }
}

export class playerlaser extends laser {
    constructor(x, y, rotation, player, ship) {
        super(x, y, rotation, ship)
        this.player = player
        this.radius = laser.radii["player"]
        
        this.position = {x: this.x, y: this.y}
    }
}