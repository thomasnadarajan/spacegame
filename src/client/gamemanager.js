import {animate} from './render'
import { enableMouseDirection, disableMouseDirection, activateMenuListener } from './input'
import { menustack } from './render'
import {transportmenu, cargomenu} from './menu'

export function distanceCalc(ship1, ship2) {
    return Math.sqrt(Math.pow(ship1.position.x - ship2.position.x, 2) + Math.pow(ship1.position.y - ship2.position.y, 2))
}

export class gamemanager {
    constructor(socket) {
        this.currentState = null
        this.animationFrameRequest = null
        this.socket = socket
        this.currentMousePosition = {x: 0, y: 0}
    }
    setCurrentState(state) {
        this.currentState = state
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
                currentMenu.components[comp].Mouseover = currentMenu.isHover(currentMenu.components[comp], x, y)
            }
            else if (currentMenu.components[comp].Type === 'buttonList'){
                const check = currentMenu.isHover(currentMenu.components[comp], x, y)
                currentMenu.components[comp].Mouseover = check.Mouseover
                currentMenu.components[comp].Segment = check.Segment
            }
        }
    }
    updateMouseClick() {

    }
    renderCurrentState() {
        this.animationFrameRequest = requestAnimationFrame(animate.bind(this.currentState))
    }
    handleMouseInput(input) {
        this.socket.emit('mouseInput', input)
    }
    handleKeyInput(input) {
        if (input === 'use') {
            if (this.currentState.me.position.x === 8 && this.currentState.me.position.y === 2) {
                console.log('tactical')
            }
            else if (this.currentState.me.position.x === 8 && this.currentState.me.position.y === 6) {
                console.log('transport')
                menustack.push(new transportmenu())
            }
            else if (this.currentState.me.position.x === 3 && this.currentState.me.position.y === 6) {
                console.log('cargo')
                menustack.push(new cargomenu())
            }
            else {
                this.socket.emit('keyInput', input)
            }
            activateMenuListener()
        }
        else {
            this.socket.emit('keyInput', input)
        }
    }
}