import {game} from './index'
import {throttle} from 'throttle-debounce'
import { ship } from '../shared/ship'


const mouseMove = (e) => {
    const newdir = Math.atan2(e.x - window.innerWidth / 2, window.innerHeight / 2 - e.y)
    throttle(20, game.handleMouseInput(newdir))
}

// convert key to direciton
const directionIn = (e) => {
    if (e.repeat) {
        return
    }
    switch (e.key) {
        case 'w':
            game.handleKeyInput('up')
            break
        case 'a':
            game.handleKeyInput('left')
            break
        case 's':
            game.handleKeyInput('down')
            break
        case 'd':
            game.handleKeyInput('right')
            break
        case 'q':
            game.handleKeyInput('use')
            break
    }
}
const stopDirection = (e) => {
    if (e.repeat) {
        console.log('gets here')
        return
    }
    switch (e.key) {
        case 'w':
            game.handleStopDirection('up')
            break
        case 'a':
            game.handleStopDirection('left')
            break
        case 's':
            game.handleStopDirection('down')
            break
        case 'd':
            game.handleStopDirection('right')
            break
        case 'q':
            game.handleStopDirection('use')
            break
    }
}

const highlight = (e) => {
    const canvas = document.querySelector('canvas')
    let rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left 
    let y = e.clientY - rect.top
    game.updateMousePosition(x,y)
}

const menuclick = (e) => {
    game.updateMouseClick()
}

const weaponsClickListener = (e) => {
    game.handleWeaponsClick()
}
const weaponsUse = ({key}) => {
    if (key === 'q') {
        game.handleKeyInput('use')
    }
}
/*
addEventListener('resize', () => {
    console.log('gets here: resize')
    setCanvasDims()
})
*/

export const requestUserDetails = () => {
    
    const userMulti = document.getElementById('username-input').value
    const userSolo = document.getElementById('username-input-solo').value
    const pair = document.getElementById('pair-input').value
    if (pair === '' && userSolo !== '') {
        game.addPlayer(userSolo, null)
    }
    else if (pair !== '' && userMulti !== '') {
        game.addPlayer(userMulti, pair)
    }
}

const weaponsDirectionListener = (e) => {
    const newdir = Math.atan2(e.x - window.innerWidth / 2, window.innerHeight / 2 - e.y)
    throttle(20, game.handleWeaponsMove(newdir))
}
const playerWeaponsListener = (e) => {
    const newdir = Math.atan2(e.x - (window.innerWidth / 2 - (5 * ship.block) + game.currentState.me.worldPosition.x), (window.innerHeight / 2 - (5 * ship.block) + game.currentState.me.worldPosition.y)- e.y)
    throttle(20, game.handlePlayerWeaponsDirection(newdir))
}
const playerWeaponsFire = (e) => {
    game.handlePlayerFire()
}
export function activatePlayerListener() {
    addEventListener('keydown', directionIn)
    addEventListener('mousemove', playerWeaponsListener)
    addEventListener('mousedown', playerWeaponsFire)
    addEventListener('keyup', stopDirection)
}
export function disablePlayerListener() {
    removeEventListener('keydown', directionIn)
    removeEventListener('mousemove', playerWeaponsListener)
    removeEventListener('mousedown', playerWeaponsFire)
    removeEventListener('keyup', stopDirection)
}
export function disableMouseDirection() {
    removeEventListener('mousemove', mouseMove)
}
export function enableMouseDirection() {
    addEventListener('mousemove', mouseMove)
}
export function activateMenuListener() {
    addEventListener('mousemove', highlight)
    addEventListener('mousedown', menuclick)
    disablePlayerListener()
}
export function disableMenuListener() {
    removeEventListener('mousemove', highlight)
    removeEventListener('mousedown', menuclick)
    activatePlayerListener()
}
export function enableWeaponsListeners() {
    addEventListener('mousemove', weaponsDirectionListener)
    addEventListener('mousedown', weaponsClickListener)
    addEventListener('keydown', weaponsUse)
    disablePlayerListener()
}
export function disableWeaponsListeners() {
    removeEventListener('mousemove', weaponsDirectionListener)
    removeEventListener('mousedown', weaponsClickListener)
    removeEventListener('keydown', weaponsUse)
    activatePlayerListener()
}
