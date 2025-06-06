import { laser } from '../shared/laser';
import ship_map from './assets/tilemap-editor.json'
import {stars} from './index'
import {ship_colors, ship} from '../shared/ship'
import { distanceCalc, distanceCalcCargo, posDistanceCalc } from '../shared/distance';

const blinkies = {}
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x+r, y);
    this.arcTo(x+w, y,   x+w, y+h, r);
    this.arcTo(x+w, y+h, x,   y+h, r);
    this.arcTo(x,   y+h, x,   y,   r);
    this.arcTo(x,   y,   x+w, y,   r);
    this.closePath();
    return this;
}
const mouseoverColor = {true: '#d63031', false: 'black'}
/*
ALL THIS STUFF IS CLIENT-SIDE STUFF 
*/

const canvas = document.querySelector('canvas')

// perhaps move the menu stack to the client side game app
export let menustack = []
const c = canvas.getContext('2d')

export function setCanvasDims() {
    const scaleRatio = Math.max(1,400/innerWidth)
    canvas.width = scaleRatio * innerWidth
    canvas.height = scaleRatio * innerHeight
    c.width = scaleRatio * innerWidth
    c.height = scaleRatio * innerHeight
    
}
function renderBlinkies(x, y) {
    if (!(x + y in blinkies)) {
        blinkies[x+y] = 0
    }
    const width = ship.block
    const height = ship.block
    const num = Math.floor(Math.random() * (11));
    const subsize = width / 6
    const r = Math.sqrt(2 * Math.pow((subsize/2),2))
    c.fillStyle = '#d63031'
    c.fillRect(x + ((1/6) * width), y + ((1/6) * height), subsize, subsize)
    c.fillStyle = '#55efc4'
    c.fillRect(x + width - ((1/6) * width) - subsize, y + height - ((1/6) * height) - subsize, subsize, subsize)
    c.strokeStyle = '#ffeaa7'
    c.fillStyle = '#ffeaa7'
    c.beginPath()
    c.arc(x + ((1/6) * width) + subsize / 2, y + height - ((1/6) * height) - (subsize / 2), r, 0 , 2 * Math.PI)
    c.arc(x + ((1/6) * width) + subsize / 2, y + height - ((1/6) * height) - (subsize / 2), r, 0 , 2 * Math.PI)
    c.stroke()
    c.fill()
    blinkies[x + y] = 0

}

function renderTransportMenu(menu) {
    renderMenuHeader(menu)
    // MAIN STUFF
    c.fillStyle = '#b2bec3'
    c.fillRect(menu.topBoundHoriz, menu.mainTopBound,menu.width, menu.mainHeight)
    c.fillStyle = 'black'
    c.font = menu.mainFontSize.concat("px Antonio")
    for (const comp in menu.components) {
        c.textAlign = menu.components[comp].Alignment
        c.fillStyle = 'black'
        if (menu.components[comp].Type === 'button') {
            c.fillStyle = mouseoverColor[menu.components[comp].Mouseover]
            c.font = menu.buttonFontSize.concat("px Antonio")
            c.fillText(comp, menu.components[comp].LeftBound, menu.components[comp].BotBound)
        }
        else if (menu.components[comp].Type === 'title') {
            c.font = menu.mainFontSize.concat("px Antonio")
            if (menu.components[comp].Alternative) {
                c.fillText(menu.components[comp].AlternativeText, menu.components[comp].LeftBound, menu.components[comp].BotBound)
            }
            else {
                c.fillText(comp, menu.components[comp].LeftBound, menu.components[comp].BotBound)
            }
        }
        else if (menu.components[comp].Type === 'buttonList') {
            let currentHeight = 0
            c.font = menu.listFontSize.concat("px Antonio")
            if (comp === 'CrewList') {
                for (const crew of menu.crewList) {
                    if (menu.components[comp].Mouseover === true && menu.components[comp].Segment === currentHeight || menu.selectedPlayer === crew) {
                        c.fillStyle = '#d63031'
                    }
                    else {
                        c.fillStyle = 'black'
                    }
                    c.fillText(crew, menu.components[comp].LeftBound, menu.components[comp].BotBound - currentHeight * 2 * parseInt(menu.listFontSize))
                    currentHeight += 1 
                }
            }
            else {
                for (const ship of menu.shipList) {
                    if (menu.components[comp].Mouseover === true && menu.components[comp].Segment === currentHeight || menu.selectedShip === ship) {
                        c.fillStyle = '#d63031'
                    }
                    else {
                        c.fillStyle = 'black'
                    }
                    c.fillText(ship, menu.components[comp].LeftBound, menu.components[comp].BotBound - currentHeight * 2 * parseInt(menu.listFontSize))
                    currentHeight += 1 
                }
            }
        }
    }
}
function renderMenuHeader(menu) {
    c.fillStyle = '#636e72'
    c.roundRect(menu.topBoundHoriz, menu.topBoundVert, menu.width, menu.headerHeight, 15).fill()
    c.font = menu.headerFontSize.concat("px Antonio")
    c.fillStyle = 'white'
    c.textAlign = 'left'
    c.fillText(menu.heading, menu.topBoundHoriz * 1.1, menu.topBoundVert + 0.8 * menu.headerHeight)
}
function renderCargoMenu(menu) {
    // HEADER STUFF
    renderMenuHeader(menu)
    // MAIN STUFF
    c.fillStyle = '#b2bec3'
    c.fillRect(menu.topBoundHoriz, menu.mainTopBound,menu.width, menu.mainHeight)
    c.fillStyle = 'black'
    c.font = menu.mainFontSize.concat("px Antonio")
    for (const comp in menu.components) {
        if (menu.components[comp].Type === 'button') {
            c.textAlign = menu.components[comp].Alignment
            c.fillStyle = mouseoverColor[menu.components[comp].Mouseover]
            c.font = menu.buttonFontSize.concat("px Antonio")
            c.fillText(comp, menu.components[comp].LeftBound, menu.components[comp].BotBound)
        }
        else {
            c.textAlign = 'left'
            c.font = menu.mainFontSize.concat("px Antonio")
            if (menu.components[comp].Alternative) {
                c.fillText(menu.components[comp].AlternativeText, menu.components[comp].LeftBound, menu.components[comp].BotBound)
            }
            else {
                c.fillText(menu.units.toString().concat(" ".concat(comp)), menu.components[comp].LeftBound, menu.components[comp].BotBound)
            }
        }
    }

}
function renderStarsPlayerMode(centerShip) {
    for (const star of stars) {
        if (Math.sqrt((star.x - centerShip.position.x) ** 2 + (star.y - centerShip.position.y) ** 2) < 1000) {
            const canvasX = canvas.width / 2 + (star.x - centerShip.position.x)
            const canvasY = canvas.height / 2 + (star.y - centerShip.position.y)
            c.save()
            c.translate(canvas.width/2, canvas.height/2)
            c.rotate(-1 * centerShip.rotation)
            c.translate(-canvas.width/2, -canvas.height/2)
            c.translate(canvasX, canvasY)
            c.beginPath();
            c.fillStyle = star.style
            c.arc(0, 0, star.radius, 0, 360);
            c.fill()
            c.restore()
        }
    }
    
}

function renderStars(centerShip) {
    for (const star of stars) {
        if (Math.sqrt((star.x - centerShip.position.x) ** 2 + (star.y - centerShip.position.y) ** 2) < 1000) {
            const canvasX = canvas.width / 2 + (star.x - centerShip.position.x)
            const canvasY = canvas.height / 2 + (star.y - centerShip.position.y)
            c.save()
            c.translate(canvasX, canvasY)
            c.beginPath();
            c.fillStyle = star.style
            c.arc(0, 0, star.radius, 0, 360);
            c.fill()
            c.restore()
        }
    }
}
function renderTacticalMenu(menu) {
    // HEADER STUFF
    renderMenuHeader(menu)
    // MAIN STUFF
    c.fillStyle = '#b2bec3'
    c.fillRect(menu.topBoundHoriz, menu.mainTopBound,menu.width, menu.mainHeight)
    c.fillStyle = 'black'
    c.font = menu.mainFontSize.concat("px Antonio")
    for (const comp in menu.components) {
        if (menu.components[comp].Type === 'button') {
            c.textAlign = menu.components[comp].Alignment
            c.fillStyle = mouseoverColor[menu.components[comp].Mouseover]
            c.font = menu.buttonFontSize.concat("px Antonio")
            c.fillText(comp, menu.components[comp].LeftBound, menu.components[comp].BotBound)
        }
        else if (menu.components[comp].Type === 'shifter') {
            c.strokeStyle = 'black'
            c.lineWidth = 10
            for (let i = 0; i < 5; i++) {
                var fill = false
                if (i <= menu.components[comp].Level) {
                    fill = true
                    c.fillStyle = '#d63031'
                }
                if (menu.components[comp].Alignment === 'left') {
                    c.strokeRect(menu.components[comp].LeftBound, menu.components[comp].BotBound - (menu.shifterHeight * (i + 1)), menu.components[comp].Width, menu.shifterHeight)
                    if (fill) {
                        c.fillRect(menu.components[comp].LeftBound, menu.components[comp].BotBound - (menu.shifterHeight * (i + 1)), menu.components[comp].Width, menu.shifterHeight)
                    }
                }
                else if (menu.components[comp].Alignment === 'center') {
                    c.strokeRect(menu.components[comp].LeftBound - menu.components[comp].Width / 2, menu.components[comp].BotBound - (menu.shifterHeight * (i + 1)), menu.components[comp].Width, menu.shifterHeight)
                    if (fill) {
                        c.fillRect(menu.components[comp].LeftBound - menu.components[comp].Width / 2, menu.components[comp].BotBound - (menu.shifterHeight * (i + 1)), menu.components[comp].Width, menu.shifterHeight)
                    }
                }
                else {
                    c.strokeRect(menu.components[comp].LeftBound - menu.components[comp].Width, menu.components[comp].BotBound - (menu.shifterHeight * (i + 1)), menu.components[comp].Width, menu.shifterHeight)
                    if (fill) {
                        c.fillRect(menu.components[comp].LeftBound - menu.components[comp].Width, menu.components[comp].BotBound - (menu.shifterHeight * (i + 1)), menu.components[comp].Width, menu.shifterHeight)
                    }
                }
            }
        }
        else if (menu.components[comp].Type === 'title') {
            c.fillStyle = 'black'
            c.font = menu.shifterFontSize.concat("px Antonio")
            c.textAlign = menu.components[comp].Alignment
            if (comp === 'Available Power: ') {
                const powerValue = menu.availablePower !== undefined ? menu.availablePower.toString() : '0';
                c.fillText(comp.concat(powerValue), menu.components[comp].LeftBound, menu.components[comp].BotBound);
            }
            else {
                c.fillText(comp, menu.components[comp].LeftBound, menu.components[comp].BotBound)
            }
            
        }
    }
}
function menuRender(menu, data) {
    if (menu.heading === 'Transport') {
        menu.update(data)
        renderTransportMenu(menu)
    }
    else if (menu.heading === 'Cargo') {
        menu.update(data.ships[data.me.currentShip])
        renderCargoMenu(menu)
    }
    else if (menu.heading === 'Tactical') {
        // Make sure ship data has the required properties
        const shipData = data.ships[data.me.currentShip] || {};
        
        // Add default properties if missing
        const safeShipData = {
            availablePower: 2,
            systems: {
                weapons: 1,
                shields: 1,
                engines: 1
            },
            ...shipData  // This will overwrite defaults with actual values if they exist
        };
        
        menu.update(safeShipData)
        renderTacticalMenu(menu)
    }
    c.fillStyle = 'black'
}
function drawPlayerWeapon(player, playerShip) {
    const x = -(5 * playerShip.shipblock) + player.worldPosition.x + player.width / 2
    const y = -(5 * playerShip.shipblock) + player.worldPosition.y + player.height / 2
    c.fillStyle = 'rgba(214, 48, 49, 0.2)'
    c.strokeStyle = 'rgba(214, 48, 49, 0.2)'
    c.lineWidth = 1
    c.translate(x, y)
    c.beginPath()
    switch(player.direction) {
        case 1:
            c.arc(0,0,30,3 * Math.PI / 4, 5 * Math.PI / 4)
            c.lineTo(0,0)
            break
        case 2:
            c.arc(0, 0, 30, Math.PI / 4, 3 * Math.PI / 4)
            c.lineTo(0,0)
            break
        case 0:
            c.arc(0, 0, 30, 5 * Math.PI / 4, 7 * Math.PI / 4)
            c.lineTo(0,0)
            break
        case 3:
            c.arc(0, 0, 30, 7 * Math.PI / 4, Math.PI / 4)
            c.lineTo(0,0)
            break
    }
    c.closePath()
    c.stroke()
    c.fill()
    c.rotate(player.weaponsDirection)
    c.beginPath()
    c.strokeStyle = 'rgba(214, 48, 49, 0.8)'
    c.lineWidth = 1.5
    c.moveTo(0, 0)
    c.lineTo(0, -30)
    c.stroke()
    c.closePath()
    c.rotate(-player.weaponsDirection)
    c.translate(-x, -y)
}
function drawPlayerName(player, playerShip) {
    const x = -(5 * playerShip.shipblock) + player.worldPosition.x + (player.width / 2)
    const y = -(5 * playerShip.shipblock) + player.worldPosition.y + player.height + (0.75 * player.height)
    c.fillStyle = 'black'
    c.font = '12px Antonio'
    c.textAlign = 'center'
    c.fillText(player.user, x, y)
}
function drawPlayerLaser(l, ship) {
    try {
        if (l.x === undefined || l.y === undefined || ship.position === undefined) {
            console.error('Laser or Ship missing coordinates', { laser: l, ship });
            return;
        }

        // Calculate laser position relative to ship center, then rotate by ship rotation
        const relX = l.x - ship.position.x;
        const relY = l.y - ship.position.y;
        const angle = ship.rotation;
        const rotatedX = relX * Math.cos(angle) - relY * Math.sin(angle);
        const rotatedY = relX * Math.sin(angle) + relY * Math.cos(angle);
        const canvasX = canvas.width / 2 + rotatedX;
        const canvasY = canvas.height / 2 + rotatedY;

        // Guard against NaN
        if (isNaN(canvasX) || isNaN(canvasY)) return;

        // Draw directly using absolute canvas coordinates with a clean transform
        c.save();
        c.setTransform(1, 0, 0, 1, 0, 0); // Reset any existing transforms

        c.beginPath();
        c.fillStyle = '#ff00ff';
        c.strokeStyle = '#00ffff';
        c.lineWidth = 2;
        c.arc(canvasX, canvasY, 6, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.restore();
    } catch (err) {
        console.error('drawPlayerLaser error', err);
    }
}

function animatePlayerRender(player) {
    const startingX = -(5 * ship.block) + player.worldPosition.x
    const startingY = -(5 * ship.block) + player.worldPosition.y
    const smallRad = (player.width / 4) / 2
    const largeRad = (player.width / 2) / 2
    switch (player.direction) {
        case 0:
        case 2:
            c.beginPath()
            c.fillStyle = 'black'
            c.strokeStyle = 'black'
            if (player.animation >= 1.0 && player.animation < 2.0) {
                c.arc(startingX + smallRad, startingY + smallRad, smallRad, 0, 2 * Math.PI)
                c.arc(startingX + player.width / 2, startingY + player.height / 2, largeRad, 0, 2 * Math.PI)
                c.arc(startingX + player.width - smallRad, startingY + player.height - smallRad, smallRad, 0, 2 * Math.PI)
            }
            else if (player.animation >= 3.0) {
                c.arc(startingX + smallRad, startingY + player.height - smallRad, smallRad, 0, 2 * Math.PI)
                c.arc(startingX + player.width / 2, startingY + player.height / 2, largeRad, 0, 2 * Math.PI)
                c.arc(startingX + player.width - smallRad, startingY + smallRad, smallRad, 0, 2 * Math.PI)
            }
            else {
                c.arc(startingX + smallRad, startingY + player.height / 2, smallRad, 0, 2 * Math.PI)
                c.arc(startingX + player.width / 2, startingY + player.height / 2, largeRad, 0, 2 * Math.PI)
                c.arc(startingX + player.width - smallRad, startingY + player.height / 2, smallRad, 0, 2 * Math.PI)
            }
            c.stroke()
            c.fill()
            break
        case 1:
        case 3:
            c.beginPath()
            c.fillStyle = 'black'
            c.strokeStyle = 'black'
            if (player.animation >= 1.0 && player.animation < 2.0) {
                c.arc(startingX + smallRad, startingY + smallRad, smallRad, 0, 2 * Math.PI)
                c.arc(startingX + player.width / 2, startingY + player.height / 2, largeRad, 0, 2 * Math.PI)
                c.arc(startingX + player.width - smallRad, startingY + player.height - smallRad, smallRad, 0, 2 * Math.PI)
            }
            else if (player.animation >= 3.0) {
                c.arc(startingX + player.width - smallRad, startingY + smallRad, smallRad, 0, 2 * Math.PI)
                c.arc(startingX + player.width / 2, startingY + player.height / 2, largeRad, 0, 2 * Math.PI)
                c.arc(startingX + smallRad, startingY + player.height - smallRad, smallRad, 0, 2 * Math.PI)
            }
            else {
                c.arc(startingX + player.width / 2, startingY + smallRad, smallRad, 0, 2 * Math.PI)
                c.arc(startingX + player.width / 2, startingY + player.height / 2, largeRad, 0, 2 * Math.PI)
                c.arc(startingX + player.width / 2, startingY + player.height - smallRad, smallRad, 0, 2 * Math.PI)
            }
            c.stroke()
            c.fill()
            break
    }
    c.closePath()

}
function playerRenderPilotMode(player, playerShip, centerShip) {

    // this will eventually be replaced by the parent ship
    const canvasX = canvas.width / 2 + (playerShip.position.x - centerShip.position.x)
    const canvasY = canvas.height / 2 + (playerShip.position.y - centerShip.position.y)
    c.save()
    c.translate(canvasX, canvasY)
    c.rotate(playerShip.rotation)
    //c.drawImage(player_mats, 16 + (player.animation * 64), 15 + (player.direction * 64), 32, 46, -(5 * playerShip.shipblock) + player.worldPosition.x, -(5 * playerShip.shipblock) + player.worldPosition.y, player.width, player.height)
    animatePlayerRender(player)
    c.restore()
}
function playerRenderPlayerMode(player, playerShip, centerShip) {
    // playerShip refers to the ship of the player currently being rendered
    // centerShip refers to the ship that is at present in the center of THIS player's screen
    
    const canvasX = canvas.width / 2 + (playerShip.position.x - centerShip.position.x)
    const canvasY = canvas.height / 2 + (playerShip.position.y - centerShip.position.y)
    c.save()
    if (playerShip.position.x - centerShip.position.x !== 0 || playerShip.position.y - centerShip.position.y !== 0) {
        c.translate(canvas.width/2, canvas.height/2)
        c.rotate(-1 * centerShip.rotation)
        c.translate(-canvas.width/2, -canvas.height/2)
    }
    c.translate(canvasX, canvasY)
    if (playerShip.position.x - centerShip.position.x !== 0 || playerShip.position.y - centerShip.position.y !== 0) {
        c.rotate(playerShip.rotation)
    }
    if (playerShip.id === centerShip.id)  {
        drawPlayerWeapon(player, playerShip)
        drawPlayerName(player, playerShip)
    }
    
    animatePlayerRender(player)
    c.restore()
}
function drawCargoPlayerMode(cargo, centerShip) {
    const canvasX = canvas.width / 2 + (cargo.x - centerShip.position.x)
    const canvasY = canvas.height / 2 + (cargo.y - centerShip.position.y)
    c.save()
    c.translate(canvas.width/2, canvas.height/2)
    c.rotate(-1 * centerShip.rotation)
    c.translate(-canvas.width/2, -canvas.height/2)
    c.translate(canvasX, canvasY)
    c.strokeStyle = '#b2bec3'
    c.fillStyle = '#b2bec3'
    c.beginPath()
    c.arc(0, 0, cargo.radius, 0, 2 * Math.PI)
    c.stroke()
    c.fill()
    c.restore()
}
function drawCargoPilotMode(cargo, centerShip) {
    const canvasX = canvas.width / 2 + (cargo.x - centerShip.position.x)
    const canvasY = canvas.height / 2 + (cargo.y - centerShip.position.y)
    c.save()
    c.translate(canvasX, canvasY)
    c.strokeStyle = '#b2bec3'
    c.fillStyle = '#b2bec3'
    c.beginPath()
    c.arc(0, 0, cargo.radius, 0, 2 * Math.PI)
    c.stroke()
    c.fill()

    c.restore()
}
function weaponsMode(playerShip, rotation) {
    console.log('Rendering weapons mode indicator with rotation:', rotation);
    const canvasX = canvas.width / 2
    const canvasY = canvas.height / 2 - (10 * playerShip.shipblock)
    c.save()
    c.translate(canvas.width / 2, canvas.height / 2)
    c.rotate(rotation)
    c.translate(-(canvas.width / 2), -(canvas.height / 2))
    c.translate(canvasX, canvasY)    
    c.beginPath()
    c.fillStyle = '#d63031'
    c.strokeStyle = 'white'
    c.lineWidth = 1/4 * laser.radii["ship"]
    c.arc(0,0,laser.radii["ship"] * 3/4,0, 2* Math.PI)
    c.fill()
    c.stroke()
    c.restore()
}
function laserRenderPlayerMode(laser, centerShip) {
    // Debugging to help understand coordinate issues
    console.log('Rendering laser in player mode at:', laser.x, laser.y, 'with rotation:', laser.totalrotation);
    
    c.save();
    
    // Step 1: First move to the center of the screen
    c.translate(canvas.width/2, canvas.height/2);
    
    // Step 2: Rotate to counter the player's ship rotation to keep coordinates consistent
    c.rotate(-1 * centerShip.rotation);
    
    // Step 3: Move back to the original coordinate system
    c.translate(-canvas.width/2, -canvas.height/2);
    
    // Step 4: Calculate laser position relative to center of the screen
    const canvasX = canvas.width / 2 + (laser.x - centerShip.position.x);
    const canvasY = canvas.height / 2 + (laser.y - centerShip.position.y);
    
    // Step 5: Move to the laser position
    c.translate(canvasX, canvasY);
    
    // Step 6: Rotate to match the laser's rotation angle
    c.rotate(laser.totalrotation);
    
    // Step 7: Draw the laser with enhanced visibility
    c.beginPath();
    // Use more vibrant colors to ensure visibility
    c.fillStyle = '#ff0000'; // Bright red
    c.strokeStyle = '#ffffff'; // White outline
    c.lineWidth = 1/2 * laser.radius; // Thicker outline
    // Draw a larger circle for better visibility
    c.arc(0, 0, laser.radius, 0, 2 * Math.PI);
    c.fill();
    c.stroke();
    
    // Optional: Add a trailing effect for better visualization
    c.beginPath();
    c.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    c.moveTo(0, 0);
    c.lineTo(-15, 0); // Draw a small tail in the opposite direction of movement
    c.stroke();
    
    c.restore();
}

function laserRenderPilotMode(l, centerShip) {
    c.save();
    
    // Calculate laser position on screen
    const canvasX = canvas.width / 2 + (l.x - centerShip.position.x);
    const canvasY = canvas.height / 2 + (l.y - centerShip.position.y);
    
    // Move to the laser position
    c.translate(canvasX, canvasY);
    
    // Rotate to match the laser's rotation
    c.rotate(l.totalrotation);
    
    // Draw the laser with enhanced visibility
    c.beginPath();
    c.fillStyle = '#ff0000'; // Bright red
    c.strokeStyle = '#ffffff'; // White outline
    c.lineWidth = 1/2 * l.radius;
    c.arc(0, 0, l.radius, 0, 2 * Math.PI);
    c.fill();
    c.stroke();
    
    // Optional: Add a trailing effect for better visualization
    c.beginPath();
    c.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    c.moveTo(0, 0);
    c.lineTo(-15, 0); // Draw a small tail in the opposite direction of movement
    c.stroke();
    
    c.restore();
}
// simple function that takes in a ship, and renders using the blocks based on the ship position
function shipDraw(ship) {
    if (!ship || !ship.shipblock) {
        console.error('Invalid ship data for rendering:', ship);
        return;
    }
    
    const left_most_x = -1 * (5 * ship.shipblock);
    const left_most_y = -1 * (5 * ship.shipblock);
    
    try {
        for (const key_map of Object.keys(ship_map.map)) {
            const sp = key_map.split("-");
            const symb = ship_map.map[key_map].tileSymbol;
            const start_x = left_most_x + (parseInt(sp[0]) * ship.shipblock);
            const start_y = left_most_y + (parseInt(sp[1]) * ship.shipblock);
            
            // Draw the basic tile
            c.fillStyle = ship_colors[symb];
            c.fillRect(start_x, start_y, ship.shipblock, ship.shipblock);
            
            // Draw blinkies for blue tiles
            if (c.fillStyle === "#0984e3") {
                renderBlinkies(start_x, start_y, ship);
            }
            
            // Draw cargo for orange tiles if cargo exists at this position
            if (c.fillStyle === "#e17055" && 
                ship.cargomap && 
                ship.cargomap[parseInt(sp[0])] && 
                ship.cargomap[parseInt(sp[0])][parseInt(sp[1])] === 1) {
                
                c.fillStyle = "#b2bec3";
                const w = ship.shipblock * (3 / 4);
                c.fillRect(
                    start_x + (ship.shipblock / 2) - (w / 2), 
                    start_y + (ship.shipblock / 2) - (w / 2), 
                    w, w
                );
            }
        }
    } catch (error) {
        console.error('Error in shipDraw:', error, { ship });
    }
}
function drawLabels(ship, player) {
    const left_most_x = -1 * (5 * ship.shipblock)
    const left_most_y = -1 * (5 * ship.shipblock)
    var near = false
    for (const key_map of Object.keys(ship_map.map)) {

        const sp = key_map.split("-")
        const start_x = left_most_x + (parseInt(sp[0]) * ship.shipblock)
        const start_y = left_most_y+ (parseInt(sp[1]) * ship.shipblock)
        const pos = {x: parseInt(sp[0]), y: parseInt(sp[1])}
        c.fillStyle = "white"
        c.font = "10px Antonio"
        c.textAlign = 'center'
        if (pos.x === 8 && pos.y === 2 && posDistanceCalc(pos, player.position) <= 2) {
            c.fillText("Tactical", start_x + ship.shipblock/2, start_y - (5/4) * ship.shipblock)
            near = true
        }
        else if (pos.x === 8 && pos.y === 6 && posDistanceCalc(pos, player.position) <= 2) { 
            c.fillText("Transport", start_x + ship.shipblock/2, start_y - (5/4) * ship.shipblock)
            near = true
        }
        else if (pos.x === 3 && pos.y === 6 && posDistanceCalc(pos, player.position) <= 2) {
            c.fillText("Cargo", start_x + ship.shipblock/2, start_y - (5/4) * ship.shipblock)
            near = true
        }
        else if (pos.x === 1 && pos.y === 2 && posDistanceCalc(pos, player.position) <= 2) {
            c.fillText("Helm", start_x + ship.shipblock/2, start_y - (5/4) * ship.shipblock)
            near = true
        }
    }
    if (near) {
        return true
    }
}
function drawHealthShield(ship) {
    c.fillStyle = 'white';
    c.fillRect(
        - ship.radius,
        ship.radius + 0.15 * ship.radius,
        ship.radius * 2,
        ship.radius * 0.1,
    );
    c.fillStyle = '#74b9ff';
    c.fillRect(
        - ship.radius,
        ship.radius + 0.15 * ship.radius,
        ship.radius * 2 * (ship.shield / (ship.systems.shields * 20)),
        ship.radius * 0.1,
      );
}
// this function renders ships in playsaer view
// centerShip is a reference to whichever ship the player is currently on
function shipRenderPlayerMode(ship, centerShip, player) {
    var near = false
    const canvasX = canvas.width / 2 + (ship.position.x - centerShip.position.x)
    const canvasY = canvas.height / 2 + (ship.position.y - centerShip.position.y)
    c.save()
    if (ship.position.x - centerShip.position.x !== 0 || ship.position.y - centerShip.position.y !== 0) {
        c.translate(canvas.width/2, canvas.height/2)
        c.rotate(-1 * centerShip.rotation)
        c.translate(-canvas.width/2, -canvas.height/2)
    }
    c.translate(canvasX, canvasY)
    if (ship.position.x - centerShip.position.x !== 0 || ship.position.y - centerShip.position.y !== 0) {
        c.rotate(centerShip.rotation)
    }
    drawHealthShield(ship)
    if (ship.position.x - centerShip.position.x !== 0 || ship.position.y - centerShip.position.y !== 0) {
        c.rotate(-centerShip.rotation)
    }
    if (ship.position.x - centerShip.position.x !== 0 || ship.position.y - centerShip.position.y !== 0) {
        c.rotate(ship.rotation)
    }
    c.beginPath()
    c.fillStyle = "#2d3436"
    c.arc(0,0,ship.radius,0, 2* Math.PI)
    c.fill()
    shipDraw(ship)
    if (ship.id === centerShip.id) {
        near = drawLabels(ship, player)
    }
    
    c.restore()
    if (near) {
        c.fillStyle = "white"
        c.textAlign = 'left'
        c.font = "20px Antonio"
        c.fillText("Press Q to interact", canvas.width * 1/16, canvas.height - canvas.height * 1/12)
    }
}

// this is the rendering setup for pilot mode

function shipRenderPilotMode(ship, centerShip) {
    const canvasX = canvas.width / 2 + (ship.position.x - centerShip.position.x)
    const canvasY = canvas.height / 2 + (ship.position.y - centerShip.position.y)
    c.save()
    c.translate(canvasX, canvasY)
    drawHealthShield(ship)
    c.rotate(ship.rotation)
    c.beginPath()
    c.fillStyle = "#2d3436"
    c.arc(0,0,ship.radius,0, 2* Math.PI)
    c.fill()
    shipDraw(ship)
    c.restore()
    c.save()
}
function shieldsDown() {
    c.textAlign = 'center'
    c.font = "64px Antonio"
    c.fillStyle = 'red'
    c.fillText('-Shields Down!-', canvas.width/2, canvas.height / 2 - canvas.height / 4 - canvas.height / 8)
}

function drawPairCode(pairCode) {
    c.textAlign = 'left'
    c.font = "24px Antonio"
    c.fillStyle = 'gray'
    c.fillText('Pair Code: '.concat(pairCode.toString()), canvas.width - canvas.width / 8, canvas.height / 8)
}
// player always renders in the center of the screen
// many test functions in here at the moment
export function animate() {
    c.fillStyle = 'black'
    c.clearRect(0, 0, canvas.width, canvas.height)
    c.fillRect(0, 0, canvas.width, canvas.height)
    
    // Defensive check to ensure playerShip exists before using it
    const playerShip = this.me && this.me.currentShip ? this.ships[this.me.currentShip] : null;
    if (!playerShip) {
        console.error('Player ship not found:', this.me ? this.me.currentShip : 'Player not initialized');
        return; // Exit early if we don't have a valid player ship
    }
    
    // Check if weapons mode is active and render the aiming reticle
    if (this.weaponsMode) {
        weaponsMode(playerShip, this.weaponsAngle);
    }
    
    if (this.me.playerView) {
        renderStarsPlayerMode(playerShip)
        for (const ship in this.ships) {
            const targetShip = this.ships[ship];
            // Skip invalid ships
            if (!targetShip || !targetShip.position) continue;
            
            try {
                if (distanceCalc(playerShip, targetShip) < 1500) {
                    shipRenderPlayerMode(targetShip, playerShip, this.me)
                }
            } catch (error) {
                console.error('Error rendering ship:', error, { playerShip, targetShip });
            }
        }

        for (const player in this.players) {
            const targetPlayer = this.players[player];
            // Skip invalid players or players without a valid ship
            if (!targetPlayer || !targetPlayer.currentShip || !this.ships[targetPlayer.currentShip]) continue;
            
            try {
                if (distanceCalc(playerShip, this.ships[targetPlayer.currentShip]) < 1500) {
                    playerRenderPlayerMode(targetPlayer, this.ships[targetPlayer.currentShip], playerShip)
                }
            } catch (error) {
                console.error('Error rendering player:', error, { playerShip, targetPlayer });
            }
        }
        
        // Draw ship-fired lasers in player view
        for (const laser of this.shiplasers) {
            const dist = distanceCalc(playerShip, laser);
            if (dist < 1500) {
                laserRenderPlayerMode(laser, playerShip);
            } else {
                console.log(`Laser out of range: distance ${dist.toFixed(2)}`);
            }
        }

        // Draw actual player lasers at their true positions
        for (const laser of this.playerlasers) {
            if (laser && distanceCalc(playerShip, laser) < 1500) {
                drawPlayerLaser(laser, playerShip)
            }
        }
        // menu rendering stack goes here
        if (menustack.length >= 1) {
            try {
                menuRender(menustack[menustack.length - 1], this)
            } catch (error) {
                console.error('Error rendering menu:', error);
            }
        }  
        
        if (playerShip.shieldsDownBurn > 0) {
            try {
                shieldsDown()
            } catch (error) {
                console.error('Error in shields down animation:', error);
            }
        }
    }
    else {
        renderStars(playerShip)
        for (const ship in this.ships) {
            if (distanceCalc(playerShip, this.ships[ship]) < 1500) {
                shipRenderPilotMode(this.ships[ship], playerShip)
            }
        }
        for (const player in this.players) {
            if (distanceCalc(playerShip, this.ships[this.players[player].currentShip]) < 1500) {
                playerRenderPilotMode(this.players[player], this.ships[this.players[player].currentShip], playerShip)
            }
        }
        for (const cargo of this.cargo) {
            if (distanceCalcCargo(playerShip, cargo) < 1500) {
                drawCargoPilotMode(cargo, playerShip)
            }
        }
        // Draw ship-fired lasers in pilot mode
        for (const laser of this.shiplasers) {
            if (distanceCalc(playerShip, laser) < 1500) {
                laserRenderPilotMode(laser, playerShip);
            }
        }
    }
    drawPairCode(this.me.pair)
}