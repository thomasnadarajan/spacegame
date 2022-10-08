import {setCanvasDims  } from "./render"
import {io} from 'socket.io-client'
import { gamemanager } from "./gamemanager"
import { gamestate } from "./gamestate"
import { disablePlayerListener, requestUserDetails, activatePlayerListener } from "./input" 
const socket = io()

const showMulti = () => {
    document.getElementById('play-menu-buttons').classList.add('hidden')
    document.getElementById('multiplayer-buttons').classList.remove('hidden')
    document.getElementById('multiplayer-buttons').classList.add('show')
}
const showSingle = () => {
    document.getElementById('play-menu-buttons').classList.add('hidden')
    document.getElementById('single-buttons').classList.remove('hidden')
    document.getElementById('single-buttons').classList.add('show')
}
document.getElementById('play-button-single').addEventListener('click', requestUserDetails)
document.getElementById('play-button-multi').addEventListener('click', requestUserDetails)
document.getElementById('solo-button').addEventListener('click', showSingle)
document.getElementById('join-button').addEventListener('click', showMulti)
socket.on('connect', () => {
    console.log("client connected")
})
export const game = new gamemanager(socket)
export var stars = []
const restore = () => {
    game.currentState = null
    game.cancelAnimationFrame()
    disablePlayerListener()
    document.getElementById('play-menu').classList.remove("hidden")
    document.getElementById('game').classList.add("hidden")
    document.getElementById('leaderboard').classList.add("hidden")
}
socket.on('stars', (data) => {stars = data})
socket.on('update', (data) => {
    if (data.me != null) {
        game.setCurrentState(new gamestate(data))
        game.renderCurrentState()
    }
})
socket.on('dead',() => {
    restore()
})
socket.on('ready', () => {
    console.log('gets here')
    document.getElementById('play-menu').classList.add("hidden")
    document.getElementById('game').classList.remove("hidden")
    document.getElementById('leaderboard').classList.remove("hidden")
    activatePlayerListener()
})
socket.on('pairError', () => {
    document.getElementById('error').classList.remove("hidden")
    document.getElementById('error').innerHTML = "Pair code does not exist"
})
socket.on('userError', () => {
    document.getElementById('error').classList.remove("hidden")
    document.getElementById('error').innerHTML = "Username already exists"
})
socket.on('timedOut', () => {
    restore()
})
const disconnect = () => {
    socket.emit('disconnect')
}

setCanvasDims()
addEventListener('beforeunload', disconnect)
addEventListener('visibilitychange', () => {
    if (document.hidden) {
        socket.emit('timeout')
    }
    else {
        socket.emit('cancelTimeout')
    }
})
