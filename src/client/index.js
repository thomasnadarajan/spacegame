import {setCanvasDims  } from "./render"
import {io} from 'socket.io-client'
import { gamemanager } from "./gamemanager"
import { gamestate } from "./gamestate"
import { disablePlayerListener, requestUserDetails, activatePlayerListener } from "./input" 

// Connect to the Elastic Beanstalk endpoint explicitly
const socket = io(window.location.origin, {
    transports: ['polling', 'websocket'],  // Try polling first, fall back to websocket
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000
})

// Add connection status logging
socket.on('connect_error', (err) => {
    console.error('Connection error:', err);
})

socket.on('disconnect', (reason) => {
    console.log('Disconnected:', reason);
})

// Add debugging for all socket events
const originalOn = socket.on;
socket.on = function(event, callback) {
    const wrappedCallback = function(...args) {
        console.log(`[DEBUG] Received event '${event}'`, args);
        return callback.apply(this, args);
    };
    return originalOn.call(this, event, wrappedCallback);
};

const originalEmit = socket.emit;
socket.emit = function(event, ...args) {
    console.log(`[DEBUG] Emitting event '${event}'`, args);
    return originalEmit.apply(this, event, args);
};

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
document.getElementById("back-button").addEventListener("click", () => {
    document.getElementById("multiplayer-buttons").classList.remove('show')
  document.getElementById("multiplayer-buttons").classList.add('hidden')
  document.getElementById('play-menu-buttons').classList.remove('hidden')
  document.getElementById('play-menu-buttons').classList.add('show')
})
document.getElementById("back-button-solo").addEventListener("click", () => {
    document.getElementById("single-buttons").classList.remove('show')
  document.getElementById("single-buttons").classList.add('hidden')
  document.getElementById('play-menu-buttons').classList.remove('hidden')
  document.getElementById('play-menu-buttons').classList.add('show')
})
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
