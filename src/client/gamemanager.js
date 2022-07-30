import {animate} from './render'
import { enableMouseDirection, disableMouseDirection, activateMenuListener, disableMenuListener, enableWeaponsListeners } from './input'
import { menustack } from './render'
import {transportmenu, cargomenu, tacticalmenu} from './menu'

export function distanceCalc(ship1, ship2) {
    return Math.sqrt(Math.pow(ship1.position.x - ship2.position.x, 2) + Math.pow(ship1.position.y - ship2.position.y, 2))
}

export class gamemanager {
    constructor(socket) {
        this.currentState = null
        this.animationFrameRequest = null
        this.socket = socket
        this.currentMousePosition = {x: 0, y: 0}
        this.weaponsAngle = 0
        this.weaponsMode = false
    }
    setCurrentState(state) {
        this.currentState = state
        this.currentState['weaponsAngle'] = this.weaponsAngle
        this.currentState['weaponsMode'] = this.weaponsMode
        if (this.currentState.me.playerView) {
            disableMouseDirection()
        }
        else {
            enableMouseDirection()
        }
    }
    updateMousePosition(x, y) {
        const currentMenu = menustack[menustack.length - 1]
        for (const comp in currentMenu.components) {
            if (currentMenu.components[comp].Type === 'button') {
                currentMenu.components[comp].Mouseover = currentMenu.isHover(currentMenu.components[comp], x, y).Mouseover
            }
            else if (currentMenu.components[comp].Type === 'buttonList'){
                const check = currentMenu.isHover(currentMenu.components[comp], x, y)
                currentMenu.components[comp].Mouseover = check.Mouseover
                currentMenu.components[comp].Segment = check.Segment
            }
            else if (currentMenu.components[comp].Type === 'shifter'){
                const check = currentMenu.isHover(currentMenu.components[comp], x, y)
                currentMenu.components[comp].Mouseover = check.Mouseover
                currentMenu.components[comp].Segment = check.Segment
            }
        }
    }
    handleWeaponsMove(input) {
        this.weaponsAngle = input
    }

    handleWeaponsClick() {
        this.socket.emit('fire', {angle: this.weaponsAngle, ship: this.currentState.me.currentShip})
    }
    updateMouseClick() {
        const currentMenu = menustack[menustack.length - 1]
        for (const comp in currentMenu.components) {
            const check = currentMenu.components[comp].Mouseover
            if (check) {
                const ret = currentMenu.clicked(comp, this.currentState)
                if (ret != null && ret === 'close') {
                    menustack.pop()
                    disableMenuListener()
                }
                else if (ret != null && ret === 'weapons') {
                    menustack.pop()
                    disableMenuListener()
                    this.weaponsMode = true
                    enableWeaponsListeners()
                }
            }
        }
    }
    renderCurrentState() {
        this.animationFrameRequest = requestAnimationFrame(animate.bind(this.currentState))
    }
    handleMouseInput(input) {
        this.socket.emit('mouseInput', input)
    }

    handlePowerUpdate(comp, level, ship) {
        const data = {system: comp, level: level, ship: ship}
        this.socket.emit('powerUpdate', data)
    }
    handleKeyInput(input) {
        if (input === 'use') {
            if (this.currentState.me.position.x === 8 && this.currentState.me.position.y === 2) {
                menustack.push(new tacticalmenu(this.currentState.me.currentShip))
                activateMenuListener()
            }
            else if (this.currentState.me.position.x === 8 && this.currentState.me.position.y === 6) {
                menustack.push(new transportmenu(this.currentState.me.currentShip))
                activateMenuListener()
            }
            else if (this.currentState.me.position.x === 3 && this.currentState.me.position.y === 6) {
                console.log('cargo')
                menustack.push(new cargomenu(this.currentState.me.currentShip))
                activateMenuListener()
            }
            else {
                this.socket.emit('keyInput', input)
            }
            
        }
        else {
            this.socket.emit('keyInput', input)
        }
    }
    handleTransportRequest() {
        const currentMenu = menustack[menustack.length - 1]
        if (currentMenu.mode === 'send') {
            this.socket.emit('transport', {
                player: currentMenu.selectedPlayerSend,
                ship: currentMenu.selectedShip
            })
        }
        else {
            this.socket.emit('transport', {
                player: currentMenu.selectedPlayerSend,
                ship: currentMenu.ship
            })
        }
        menustack.pop()
    }

    // THIS IS JUST FOR TESTING
    addPlayer(ship, username = null) {
        if (username === null) {
            if (ship === '') {
                this.socket.emit('addPlayer', {s: null})
            }
            else {
                this.socket.emit('addPlayer', {s: ship})
            }
        }
    }
}