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
    document.getElementById('play-menu').classList.add("hidden")
    document.getElementById('game').classList.remove("hidden")
    activatePlayerListener()
}

const weaponsDirectionListener = (e) => {
    const newdir = Math.atan2(e.x - window.innerWidth / 2, window.innerHeight / 2 - e.y)
    throttle(20, game.handleWeaponsMove(newdir))
}

export function activatePlayerListener() {
    addEventListener('keydown', directionIn)
}
export function disablePlayerListener() {
    removeEventListener('keydown', directionIn)
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
    removeEventListener('keydown', directionIn)
}
export function enableWeaponsListeners() {
    addEventListener('mousemove', weaponsDirectionListener)
    addEventListener('mousedown', weaponsClickListener)
}
export function disableMenuListener() {
    removeEventListener('mousemove', highlight)
    removeEventListener('mousedown', menuclick)
    addEventListener('keydown', directionIn)
}