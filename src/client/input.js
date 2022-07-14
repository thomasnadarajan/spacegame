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
/*
addEventListener('resize', () => {
    console.log('gets here: resize')
    setCanvasDims()
})
*/

export function activateEventListener() {
    //addEventListener('mousemove', mouseMove)
    addEventListener('keydown', directionIn)
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
}

export function disableMenuListener() {
    removeEventListener('mousemove', highlight)
    removeEventListener('mousedown', menuclick)
}