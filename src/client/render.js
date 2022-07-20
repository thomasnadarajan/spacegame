import { ship_mats } from './asset'
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
    //c.fillStyle = 'solid black'
    //c.fillRect(0, 0, canvas.width, canvas.height)
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
    c.fillStyle = 'black'
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
            c.textAlign = 'center'
            c.font = menu.buttonFontSize.concat("px Antonio")
            c.fillText(comp, menu.components[comp].LeftBound, menu.components[comp].BotBound)
        }
        else {
            c.textAlign = 'left'
            c.font = menu.mainFontSize.concat("px Antonio")
            c.fillText(menu.units.toString().concat(" ").concat(comp), menu.components[comp].LeftBound, menu.components[comp].BotBound)
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
}
function playerRenderPilotMode(player, playerShip, centerShip) {

    // this will eventually be replaced by the parent ship
    const canvasX = canvas.width / 2 + (playerShip.position.x - centerShip.position.x)
    const canvasY = canvas.height / 2 + (playerShip.position.y - centerShip.position.y)
    c.save()
    c.translate(canvasX, canvasY)
    c.rotate(playerShip.rotation)
    c.fillStyle = 'black'
    c.fillRect(-player.width / 2 + (player.position.x * playerShip.shipblock) - (5 * playerShip.shipblock) + playerShip.shipblock / 2, -player.height / 2 + (player.position.y * playerShip.shipblock) - (5 * playerShip.shipblock) + playerShip.shipblock / 2, 
    player.width, player.height)
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
    c.fillStyle = 'black'
    c.fillRect(-player.width / 2 + (player.position.x * playerShip.shipblock) - (5 * playerShip.shipblock) + playerShip.shipblock / 2, -player.height / 2 + (player.position.y * playerShip.shipblock) - (5 * playerShip.shipblock) + playerShip.shipblock / 2, 
    player.width, player.height)
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
    shipDraw(ship)
    c.restore()
}
// player always renders in the center of the screen
// many test functions in here at the moment
export function animate() {
    c.clearRect(0, 0, canvas.width, canvas.height)
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
    }
    else {
        for (const ship in this.ships) {
            shipRenderPilotMode(this.ships[ship], playerShip)
        }
        for (const player in this.players) {
            playerRenderPilotMode(this.players[player], this.ships[this.players[player].currentShip], playerShip)
        }
    }
}