import { distanceCalc } from "../shared/distance"

const circleCollision = (ship1, ship2, laser) => {
    if (ship2 !== null) {
        if (distanceCalc(ship1, ship2) <= ship1.radius + ship2.radius) {
            return true
        }
        return false
    }
    else {
        if (distanceCalc(ship1, laser) <= ship1.radius + laser.radius) {
            return true
        }
        return false
    }
}