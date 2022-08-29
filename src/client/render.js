import { laser, playerlaser, shiplaser } from '../shared/laser';
import { ship_mats, player_mats } from './asset'
import ship_map from './assets/tilemap-editor.json'

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
const mouseoverColor = {true: 'white', false: 'black'}
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


function renderTransportMenu(menu) {
    renderMenuHeader(menu)
    // MAIN STUFF
    c.fillStyle = '#ffaa90'
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
                        c.fillStyle = 'white'
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
                        c.fillStyle = 'white'
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
    c.fillStyle = '#cc2233'
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
    c.fillStyle = '#ffaa90'
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
function renderTacticalMenu(menu) {
    // HEADER STUFF
    renderMenuHeader(menu)
    // MAIN STUFF
    c.fillStyle = '#ffaa90'
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
                    c.fillStyle = 'white'
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
                c.fillText(comp.concat(menu.availablePower.toString()), menu.components[comp].LeftBound, menu.components[comp].BotBound)
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
        menu.update(data.ships[data.me.currentShip])
        renderTacticalMenu(menu)
    }
    c.fillStyle = 'black'
}
function drawPlayerWeapon(player, playerShip) {
    const x = -(5 * playerShip.shipblock) + player.worldPosition.x + player.width / 2
    const y = -(5 * playerShip.shipblock) + player.worldPosition.y + player.height / 2
    c.fillStyle = 'red'
    c.translate(x, y)
    c.rotate(player.weaponsDirection)
    c.beginPath()
    c.strokeStyle = 'red'
    c.lineWidth = 5
    c.moveTo(0, 0)
    c.lineTo(0, -30)
    c.stroke()
    c.rotate(-player.weaponsDirection)
    c.translate(-x, -y)
}
function drawPlayerLaser(l, ship) {
    c.save()
    const canvasX = canvas.width / 2 - (5 * ship.shipblock) + l.x
    const canvasY = canvas.height / 2- (5 * ship.shipblock) + l.y
    c.translate(canvasX, canvasY)
    c.rotate(laser.totalrotation)
    c.beginPath()
    c.fillStyle = 'red'
    c.strokeStyle = 'white'
    c.lineWidth = 1/4 * l.radius
    c.arc(0,0,l.radius * 3/4,0, 2* Math.PI)
    c.fill()
    c.stroke()
    c.restore()
}
function playerRenderPilotMode(player, playerShip, centerShip) {

    // this will eventually be replaced by the parent ship
    const canvasX = canvas.width / 2 + (playerShip.position.x - centerShip.position.x)
    const canvasY = canvas.height / 2 + (playerShip.position.y - centerShip.position.y)
    c.save()
    c.translate(canvasX, canvasY)
    c.rotate(playerShip.rotation)
    c.drawImage(player_mats, 16 + (player.animation * 64), 15 + (player.direction * 64), 32, 46, -(5 * playerShip.shipblock) + player.worldPosition.x, -(5 * playerShip.shipblock) + player.worldPosition.y, player.width, player.height)
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
    if (playerShip.id === centerShip.id) {
        drawPlayerWeapon(player, playerShip)
    }
    c.drawImage(player_mats, 16 + (player.animation * 64), 15 + (player.direction * 64), 32, 46, -(5 * playerShip.shipblock) + player.worldPosition.x, -(5 * playerShip.shipblock) + player.worldPosition.y, player.width, player.height)
    c.restore()
}

function weaponsMode(playerShip, rotation) {
    const canvasX = canvas.width / 2
    const canvasY = canvas.height / 2 - (10 * playerShip.shipblock)
    c.save()
    c.translate(canvas.width / 2, canvas.height / 2)
    c.rotate(rotation)
    c.translate(-(canvas.width / 2), -(canvas.height / 2))
    c.translate(canvasX, canvasY)    
    c.beginPath()
    c.fillStyle = 'red'
    c.strokeStyle = 'white'
    c.lineWidth = 1/4 * laser.radii["ship"]
    c.arc(0,0,laser.radii["ship"] * 3/4,0, 2* Math.PI)
    c.fill()
    c.stroke()
    c.restore()
}
function laserRenderPlayerMode(laser, centerShip) {
    c.save()
    c.translate(canvas.width/2, canvas.height/2)
    c.rotate(-1 * centerShip.rotation)
    c.translate(-canvas.width/2, -canvas.height/2)
    const canvasX = canvas.width / 2 + (laser.x - centerShip.position.x)
    const canvasY = canvas.height / 2 + (laser.y - centerShip.position.y)
    c.translate(canvasX, canvasY)
    c.rotate(laser.totalrotation)
    c.beginPath()
    c.fillStyle = 'red'
    c.strokeStyle = 'white'
    c.lineWidth = 1/4 * laser.radius
    c.arc(0,0,laser.radius * 3/4,0, 2* Math.PI)
    c.fill()
    c.stroke()
    c.restore()
}

function laserRenderPilotMode(l, centerShip) {
    c.save()
    const canvasX = canvas.width / 2 + (laser.x - centerShip.position.x)
    const canvasY = canvas.height / 2 + (laser.y - centerShip.position.y)
    c.translate(canvasX, canvasY)
    c.rotate(l.totalrotation)
    c.beginPath()
    c.fillStyle = 'red'
    c.strokeStyle = 'white'
    c.lineWidth = 1/4 * l.radius
    c.arc(0,0,l.radius * 3/4,0, 2* Math.PI)
    c.fill()
    c.stroke()
    c.restore()
}
// simple function that takes in a ship, and renders using the blocks based on the ship position
function shipDraw(ship) {
    const left_most_x = -1 * (5 * ship.shipblock)
    const left_most_y = -1 * (5 * ship.shipblock)
    for (const key_map of Object.keys(ship_map.map)) {
        const sp = key_map.split("-")
        const symb  = ship_map.map[key_map].tileSymbol
        const start_x = left_most_x + (parseInt(sp[0]) * ship.shipblock)
        const start_y = left_most_y+ (parseInt(sp[1]) * ship.shipblock)
        for (const key_tile in ship_map.tileSet) {
            const tile = ship_map.tileSet[key_tile]
            if (tile.tileSymbol === symb) {
                c.drawImage(ship_mats, tile.x * 32, tile.y * 32, 32, 32, start_x, start_y, ship.shipblock, ship.shipblock)
            }
        }
    }
}
// this function renders ships in player view
// centerShip is a reference to whichever ship the player is currently on
function shipRenderPlayerMode(ship, centerShip) {
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
        c.rotate(ship.rotation)
    }
    c.beginPath()
    c.fillStyle = 'rgba(31, 29, 43, 1.0)'
    c.arc(0,0,ship.radius,0, 2* Math.PI)
    c.fill()
    shipDraw(ship)
    c.restore()
}

// this is the rendering setup for pilot mode

function shipRenderPilotMode(ship, centerShip) {
    const canvasX = canvas.width / 2 + (ship.position.x - centerShip.position.x)
    const canvasY = canvas.height / 2 + (ship.position.y - centerShip.position.y)
    c.save()
    c.translate(canvasX, canvasY)
    c.rotate(ship.rotation)
    c.beginPath()
    c.fillStyle = 'rgba(31, 29, 43, 1.0)'
    c.arc(0,0,ship.radius,0, 2* Math.PI)
    c.fill()
    shipDraw(ship)
    c.restore()
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
    const playerShip = this.ships[this.me.currentShip]
    if (this.me.playerView) {
        for (const ship in this.ships) {
            shipRenderPlayerMode(this.ships[ship], playerShip)
        }

        for (const player in this.players) {
            playerRenderPlayerMode(this.players[player], this.ships[this.players[player].currentShip], playerShip)
        }
        // menu rendering stack goes here
        if (menustack.length >= 1) {
            menuRender(menustack[menustack.length - 1], this)
        }
        if (this.weaponsMode) {
            weaponsMode(playerShip, this.weaponsAngle)
        }
        for (const laser of this.shiplasers) {
            laserRenderPlayerMode(laser, playerShip)
        }
        for (const laser of this.playerlasers) {
            if (laser.ship === this.me.currentShip) {
                drawPlayerLaser(laser, playerShip)
            }
        }
        if (playerShip.shieldsDownBurn > 0) {
            shieldsDown()
        }
    }
    else {
        for (const ship in this.ships) {
            shipRenderPilotMode(this.ships[ship], playerShip)
        }
        for (const player in this.players) {
            playerRenderPilotMode(this.players[player], this.ships[this.players[player].currentShip], playerShip)
        }
        for (const laser of this.shiplasers) {
            laserRenderPilotMode(laser, playerShip)
        }
    }
    drawPairCode(this.me.pair)
}