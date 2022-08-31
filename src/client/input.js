import {game} from './index'
import {throttle} from 'throttle-debounce'


const mouseMove = (e) => {
    const newdir = Math.atan2(e.x - window.innerWidth / 2, window.innerHeight / 2 - e.y)
    throttle(20, game.handleMouseInput(newdir))
}

// convert key to direciton
const directionIn = ({key}) => {
    switch (key) {
        case 'w':
            throttle(40,game.handleKeyInput('up'))
            break
        case 'a':
            throttle(40,game.handleKeyInput('left'))
            break
        case 's':
            throttle(40,game.handleKeyInput('down'))
            break
        case 'd':
            throttle(40,game.handleKeyInput('right'))
            break
        case 'q':
            game.handleKeyInput('use')
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
    
    const user = document.getElementById('username-input').value
    const pair = document.getElementById('pair-input').value
    if (pair === '') {
        game.addPlayer(user, null)
    }
    else {
        game.addPlayer(user, pair)
    }
    if (game.currentState != null) {
        
    }
}

const weaponsDirectionListener = (e) => {
    const newdir = Math.atan2(e.x - window.innerWidth / 2, window.innerHeight / 2 - e.y)
    throttle(20, game.handleWeaponsMove(newdir))
}
const playerWeaponsListener = (e) => {
    const newdir = Math.atan2(e.x - window.innerWidth / 2, window.innerHeight / 2 - e.y)
    throttle(20, game.handlePlayerWeaponsDirection(newdir))
}
const playerWeaponsFire = (e) => {
    game.handlePlayerFire()
}
export function activatePlayerListener() {
    addEventListener('keydown', directionIn)
    addEventListener('mousemove', playerWeaponsListener)
    addEventListener('mousedown', playerWeaponsFire)
}
export function disablePlayerListener() {
    removeEventListener('keydown', directionIn)
    removeEventListener('mousemove', playerWeaponsListener)
    removeEventListener('mousedown', playerWeaponsFire)
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
    addEventListener('keydown', directionIn)
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
