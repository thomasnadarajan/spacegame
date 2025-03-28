export function distanceCalc(ship1, ship2) {
    return Math.sqrt(Math.pow(ship1.position.x - ship2.position.x, 2) + Math.pow(ship1.position.y - ship2.position.y, 2))
}

export function distanceCalcCargo(ship, cargo) { 
    return Math.sqrt(Math.pow(ship.position.x - cargo.x, 2) + Math.pow(ship.position.y - cargo.y, 2))
}
export function posDistanceCalc(pos1, pos2) {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2))
}