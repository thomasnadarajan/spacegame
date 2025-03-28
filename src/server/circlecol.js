import { distanceCalc, distanceCalcCargo } from "../shared/distance"
export const rectangleOverlap = (l1, r1, l2, r2) => {
    if (l1.x == r1.x || l1.y == r1.y || r2.x == l2.x || l2.y == r2.y) {
        return false;
    }
    if (l1.x > r2.x || l2.x > r1.x) {
        return false
    }
    if (r1.y > l2.y || r2.y > l1.y) {
        return false
    }
    return true
}
export const circleCollision = (ship1, ship2, laser) => {
    if (ship2 !== null) {
        if (distanceCalc(ship1, ship2) < ship1.radius + ship2.radius) {
            return true
        }
        return false
    }
    else {
        const dist = distanceCalc(ship1, laser)
        if (dist <= ship1.radius + laser.radius) {
            return true
        }
        return false
    }
}

export const cargoCollide = (ship, cargo) => {
    if (distanceCalcCargo(ship, cargo) < ship.radius + cargo.radius) {
        return true
    }
    return false
}
const circleRect = ( cx,  cy,  radius,  rx,  ry,  rw,  rh) => {

    // temporary variables to set edges for testing
    var testX = cx;
    var testY = cy;
  
    if (cx < rx) {testX = rx}  // test left edge
    else if (cx > rx+rw) {testX = rx+rw}   // right edge
    if (cy < ry)         {testY = ry}      // top edge
    else if (cy > ry+rh) {testY = ry+rh}   // bottom edge
  
    // get distance from closest edges
     const distX = cx-testX;
     const distY = cy-testY;
     const distance = Math.sqrt( (distX*distX) + (distY*distY) );
  
    // if the distance is less than the radius, collision!
    if (distance <= radius) {
      return true;
    }
    return false;
  }
export const playerCollide = (player1, player2, laser) => {
    if (player2 !== null) {
        left1 = {x: player1.worldPosition.x , y: player1.worldPosition.y}
        right1 = {x: player1.worldPosition.x + player1.width, y: player1.worldPosition.y + player1.height}
        left2 = {x: player2.worldPosition.x , y: player2.worldPosition.y}
        right2 = {x: player2.worldPosition.x + player2.width , y: player2.worldPosition.y + player2.height }
        return rectangleOverlap(left1, right1, left2, right2)
    }
    else {
        // temporary variables to set edges for testing
        const cx = laser.position.x
        const cy = laser.position.y
        const rx = player1.worldPosition.x
        const ry = player1.worldPosition.y
        const rw = player1.width
        const rh = player1.height
        return circleRect(cx, cy, laser.radius, rx, ry, rw, rh)
    }
}
export const worldCollide = (laser, blockPosition) => {
    const cx = laser.position.x
    const cy = laser.position.y
    const rx = blockPosition.x
    const ry = blockPosition.y
    const rw = blockPosition.width
    const rh = blockPosition.height
    return circleRect(cx, cy, laser.radius, rx, ry, rw, rh)
}