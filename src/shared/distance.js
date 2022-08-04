export function distanceCalc(ship1, ship2) {
    return Math.sqrt(Math.pow(ship1.position.x - ship2.position.x, 2) + Math.pow(ship1.position.y - ship2.position.y, 2))
}