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

// Test event to verify Socket.io is working
socket.on('test_event', (data) => {
    console.log('TEST EVENT RECEIVED:', data);
    // If we receive this, Socket.io is working
    document.getElementById('error').classList.remove("hidden");
    document.getElementById('error').innerHTML = "Socket.io is working! Test event received.";
})

// Enhanced debugging for socket connection
socket.on('connect', () => {
    console.log("Client connected successfully with ID:", socket.id);
    
    // For testing purposes, log the current state of UI elements
    console.log("UI state at connection:", {
        playMenuHidden: document.getElementById('play-menu')?.classList.contains('hidden'),
        gameHidden: document.getElementById('game')?.classList.contains('hidden'),
        leaderboardHidden: document.getElementById('leaderboard')?.classList.contains('hidden')
    });
    
    // Create emergency button
    setTimeout(createEmergencyButton, 1000);
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
    
    showGameInterface();
})

// Add handler for the broadcast playerReady event
socket.on('playerReady', (data) => {
    console.log(`Received playerReady broadcast for socket: ${data.socketId}`);
    
    // Only handle if it's for our socket
    if (data.socketId === socket.id) {
        console.log(`This playerReady is for us! Showing game interface.`);
        showGameInterface();
    } else {
        console.log(`Ignoring playerReady for different socket: ${data.socketId}`);
    }
})

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

// Remove the problematic socket.on override that broke event handling
// const originalOn = socket.on;
// socket.on = function(event, callback) {
//     if (event !== 'update') { // Skip logging update events as they're frequent
//         const wrappedCallback = function(...args) {
//             console.log(`Socket event received: ${event}`, args.length > 0 ? args : '');
//             return callback.apply(this, args);
//         };
//         return originalOn.call(this, event, wrappedCallback);
//     } else {
//         return originalOn.call(this, event, callback);
//     }
// };

// Add simple console logs to debug events without overriding
socket.onAny((event, ...args) => {
    if (event !== 'update') {
        console.log(`Event received: ${event}`, args.length > 0 ? args : '');
    }
});

// Add fallback ready event listener from DOM
document.addEventListener('socket:ready', () => {
    console.log("Received custom 'socket:ready' event from DOM");
    showGameInterface();
});

// Create emergency button dynamically
const createEmergencyButton = () => {
    // Check if button already exists
    if (document.getElementById('manual-ready')) return;
    
    // Create container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.bottom = '10px';
    container.style.right = '10px';
    container.style.zIndex = '1000';
    container.style.background = 'rgba(0,0,0,0.7)';
    container.style.padding = '10px';
    container.style.borderRadius = '5px';
    
    // Create button
    const button = document.createElement('button');
    button.id = 'manual-ready';
    button.innerText = 'Show Game';
    button.style.cursor = 'pointer';
    button.style.padding = '5px 10px';
    
    // Add click event
    button.addEventListener('click', () => {
        console.log("Manual show game button clicked");
        showGameInterface();
    });
    
    // Append to DOM
    container.appendChild(button);
    document.body.appendChild(container);
    console.log("Emergency button created and added to DOM");
};

// Centralized function to show the game interface
function showGameInterface() {
    try {
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
        console.log("UI after manual ready:", {
            playMenuHidden: playMenu?.classList.contains('hidden'),
            gameHidden: game?.classList.contains('hidden'),
            leaderboardHidden: leaderboard?.classList.contains('hidden')
        });
        
        // Activate player listener
        activatePlayerListener();
    } catch (error) {
        console.error("Error showing game interface:", error);
    }
}

// Add event listeners for username inputs
document.addEventListener('DOMContentLoaded', () => {
    // For solo mode
    const soloUsernameInput = document.getElementById('username-input-solo');
    const soloPlayButton = document.getElementById('play-button-single');
    
    if (soloUsernameInput && soloPlayButton) {
        soloUsernameInput.addEventListener('input', () => {
            if (soloUsernameInput.value.trim() !== '') {
                soloPlayButton.style.display = 'block';
            } else {
                soloPlayButton.style.display = 'none';
            }
        });
    }
    
    // For multiplayer mode
    const multiUsernameInput = document.getElementById('username-input');
    const pairCodeInput = document.getElementById('pair-input');
    const multiPlayButton = document.getElementById('play-button-multi');
    
    if (multiUsernameInput && multiPlayButton) {
        multiUsernameInput.addEventListener('input', () => {
            if (multiUsernameInput.value.trim() !== '') {
                multiPlayButton.style.display = 'block';
            } else {
                multiPlayButton.style.display = 'none';
            }
        });
    }
});
