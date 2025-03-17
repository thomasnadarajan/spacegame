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

// Enhanced debugging for socket connection
socket.on('connect', () => {
    console.log("Client connected successfully with ID:", socket.id);
    
    // For testing purposes, log the current state of UI elements
    console.log("UI state at connection:", {
        playMenuHidden: document.getElementById('play-menu').classList.contains('hidden'),
        gameHidden: document.getElementById('game').classList.contains('hidden'),
        leaderboardHidden: document.getElementById('leaderboard').classList.contains('hidden')
    });
})

// Add debugging for specific events
socket.on('ready', () => {
    console.log("Received 'ready' event - should show play button");
    
    // Log before UI changes
    console.log("UI before ready event:", {
        playMenuHidden: document.getElementById('play-menu')?.classList.contains('hidden'),
        gameHidden: document.getElementById('game')?.classList.contains('hidden'),
        leaderboardHidden: document.getElementById('leaderboard')?.classList.contains('hidden')
    });
    
    try {
        // Get elements with error handling
        const playMenu = document.getElementById('play-menu');
        const game = document.getElementById('game');
        const leaderboard = document.getElementById('leaderboard');
        
        if (!playMenu || !game || !leaderboard) {
            console.error('Missing UI elements:', {
                playMenu: !!playMenu,
                game: !!game,
                leaderboard: !!leaderboard
            });
        }
        
        // Apply UI changes safely
        if (playMenu) playMenu.classList.add("hidden");
        if (game) game.classList.remove("hidden");
        if (leaderboard) leaderboard.classList.remove("hidden");
        
        // Log after UI changes to confirm they took effect
        console.log("UI after ready event:", {
            playMenuHidden: playMenu?.classList.contains('hidden'),
            gameHidden: game?.classList.contains('hidden'),
            leaderboardHidden: leaderboard?.classList.contains('hidden')
        });
        
        // Activate player listener
        activatePlayerListener();
    } catch (error) {
        console.error("Error in ready event handler:", error);
    }
})

// Log all incoming socket events for debugging
const originalOn = socket.on;
socket.on = function(event, callback) {
    if (event !== 'update') { // Skip logging update events as they're frequent
        const wrappedCallback = function(...args) {
            console.log(`Socket event received: ${event}`, args.length > 0 ? args : '');
            return callback.apply(this, args);
        };
        return originalOn.call(this, event, wrappedCallback);
    } else {
        return originalOn.call(this, event, callback);
    }
};

socket.on('error', (error) => {
    console.error("Received error from server:", error);
    document.getElementById('error').classList.remove("hidden");
    document.getElementById('error').innerHTML = error || "An unknown error occurred";
});

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
