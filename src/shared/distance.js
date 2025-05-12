export function distanceCalc(ship1, ship2) {
    if (!ship1 || !ship2) return Infinity;
    if (!ship1.position || !ship2.position) {
        console.log('One of the ships has no position:', ship1, ship2);
        return Infinity;
    }
    if (typeof ship1.position.x !== 'number' || typeof ship1.position.y !== 'number' || 
        typeof ship2.position.x !== 'number' || typeof ship2.position.y !== 'number') {
        console.log('One of the ships has invalid position:', ship1, ship2);
        return Infinity;
    }
    
    return Math.sqrt(Math.pow(ship1.position.x - ship2.position.x, 2) + Math.pow(ship1.position.y - ship2.position.y, 2))
}

export function distanceCalcCargo(ship, cargo) { 
    if (!ship || !cargo) return Infinity;
    if (!ship.position || typeof cargo.x !== 'number' || typeof cargo.y !== 'number' ||
        typeof ship.position.x !== 'number' || typeof ship.position.y !== 'number') {
        return Infinity;
    }
    
    return Math.sqrt(Math.pow(ship.position.x - cargo.x, 2) + Math.pow(ship.position.y - cargo.y, 2))
}

export function posDistanceCalc(pos1, pos2) {
    if (!pos1 || !pos2) return Infinity;
    if (typeof pos1.x !== 'number' || typeof pos1.y !== 'number' ||
        typeof pos2.x !== 'number' || typeof pos2.y !== 'number') {
        return Infinity;
    }
    
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2))
}