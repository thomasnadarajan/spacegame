export class star {
    constructor(mapwidth, mapheight) {
        this.x = Math.random() * mapwidth
        this.y = Math.random() * mapheight
        this.radius = Math.random() * 1.2
        this.style = "hsla(200,100%,50%,0.8)"
    }
}