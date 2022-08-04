function get_opposite(angle, length, x, y) {
    const opp_x = length * Math.cos(angle) + x
    const opp_y  = length * Math.sin(angle) + y
    return {x: opp_x, y: opp_y}
}
const bullets = {}
function overlap(l1, l2) {
    
    if (!(l2.totalrotation in bullets)) {
        console.log("Ship: ", l1, "Laser: ", l2)
        bullets[l2.totalrotation] = l2
    }
    return !(l1.x > l2.x + l2.width || l1.x + l1.width < l2.x || l1.y > l2.y + l2.height || l1.y + l1.height < l2.y)
}


function collide(ship1, ship2 = null, laser = null) {
    var ship1_coords = []
    var last_angle = ship1.rotation - Math.PI
    const test_new = get_opposite(ship1.rotation - (Math.PI/4), Math.sqrt(250), ship1.position.x, ship1.position.y)
    const new_position = {x: ship1.position.x - 5 * ship1.shipblock, y: ship1.position.y - 5 * ship1.shipblock}
    ship1_coords.push(test_new)
    for (let i = 1; i <= 3; i++) {
        if (i == 0) {
            ship1_coords.push(get_opposite(last_angle, 10 * ship1.shipblock, ship1_coords[0].x, ship1_coords[0].y))
        }
        else {
            const new_angle = last_angle + Math.PI / 2
            ship1_coords.push(get_opposite(new_angle, 10 * ship1.shipblock, ship1_coords[i-1].x, ship1_coords[i-1].y))
            last_angle = new_angle
        }
    }
    const minx1 = Math.min(...ship1_coords.map(x => x.x))
    const maxx1 = Math.max(...ship1_coords.map(x => x.x))
    const miny1 = Math.min(...ship1_coords.map(x => x.y))
    const maxy1 = Math.max(...ship1_coords.map(x => x.y))
    const l1 = {x: minx1, y: miny1, width: maxx1 - minx1, height: maxy1 - miny1, id: ship1.id}
    // TODO FIX FOR ship2
    if (ship2 !== null) {
        var ship2_coords = []
        last_angle = ship2.rotation - Math.PI
        // fix this to correct for angle
        const new_position_ship2 = {x: ship2.position.x - 5 * ship2.shipblock, y: ship2.position.y - 5 * ship2.shipblock}
        ship2_coords.push(new_position_ship2)
        for (let i = 1; i <= 3; i++) {
            if (i === 1) {
                ship2_coords.push(get_opposite(last_angle, 10 * ship1.shipblock, ship2_coords[0].x, ship2_coords[0].y))
            }
            else {
                const new_angle = last_angle + Math.PI / 2
                ship2_coords.push(get_opposite(new_angle, 10 * ship1.shipblock, ship2_coords[i-1].x, ship2_coords[i-1].y))
                last_angle = new_angle
            }
        }
        const minx2 = Math.min(...ship2_coords.map(x => x.x))
        const maxx2 = Math.max(...ship2_coords.map(x => x.x))
        const miny2 = Math.min(...ship2_coords.map(x => x.y))
        const maxy2 = Math.max(...ship2_coords.map(x => x.y))
        const l2 = {x: minx2, y: miny2, width: maxx2 - minx2, height: maxy2 - miny2}
        return overlap(l1, l2)
    }
    else {
        var laser_coords = []
        laser_coords.push({x: laser.x, y: laser.y})
        last_angle = laser.rotation
        for (let i = 1; i <= 3; i++) {
            if (i === 1) {
                laser_coords.push(get_opposite(last_angle, laser.length, laser.x, laser.y))
            }
            else {
                const new_angle = last_angle + Math.PI / 2
                if (i == 2) {
                    laser_coords.push(get_opposite(new_angle, 5, laser_coords[i-1].x, laser_coords[i-1].y))
                }
                else {
                    laser_coords.push(get_opposite(new_angle, laser.length, laser_coords[i-1].x, laser_coords[i-1].y))
                }
                last_angle = new_angle
            }
        }
        const minx2 = Math.min(...laser_coords.map(x => x.x))
        const maxx2 = Math.max(...laser_coords.map(x => x.x))
        const miny2 = Math.min(...laser_coords.map(x => x.y))
        const maxy2 = Math.max(...laser_coords.map(x => x.y))
        const l2 = {x: minx2, y: miny2, width: maxx2 - minx2, height: maxy2 - miny2, rotation: laser.totalrotation, id: laser.ship}
        return overlap(l1, l2)
    }
}

export function checkCollisions(lasers, ships) {
    for (const laser of lasers) {
        for (const ship in ships) {
            if (laser.ship !== ships[ship].id) {
                if (collide(ships[ship], null, laser)) {
                    return true
                }
            }
        }
    }
}

