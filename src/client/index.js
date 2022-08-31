import {setCanvasDims  } from "./render"
import {io} from 'socket.io-client'
import { gamemanager } from "./gamemanager"
import { gamestate } from "./gamestate"
import { disablePlayerListener, requestUserDetails, activatePlayerListener } from "./input" 
const socket = io()
document.getElementById('play-button').addEventListener('click', requestUserDetails)
socket.on('connect', () => {
    console.log("client connected")
})
export const game = new gamemanager(socket)
var lastUpdate = null
socket.on('update', (data) => {
    if (data.me != null) {
        game.setCurrentState(new gamestate(data))
        game.renderCurrentState()
    }
})
socket.on('dead',() => {
    game.currentState = null
    game.cancelAnimationFrame()
    disablePlayerListener()
    document.getElementById('play-menu').classList.remove("hidden")
    document.getElementById('game').classList.add("hidden")
})
socket.on('ready', () => {
    document.getElementById('play-menu').classList.add("hidden")
    document.getElementById('game').classList.remove("hidden")
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
const disconnect = () => {
    socket.emit('disconnect')
}

setCanvasDims()
addEventListener('beforeunload', disconnect)
