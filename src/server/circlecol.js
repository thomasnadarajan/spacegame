import { distanceCalc } from "../shared/distance"

export const circleCollision = (ship1, ship2, laser) => {
    if (ship2 !== null) {
        if (distanceCalc(ship1, ship2) <= ship1.radius + ship2.radius) {
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