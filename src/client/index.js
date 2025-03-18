import {setCanvasDims  } from "./render"
import {io} from 'socket.io-client'
import { gamemanager } from "./gamemanager"
import { gamestate } from "./gamestate"
import { disablePlayerListener, requestUserDetails, activatePlayerListener } from "./input" 

// Get server URL from configuration or environment
const SERVER_URL = window.GAME_SERVER_URL || window.location.origin;
console.log("Connecting to game server at:", SERVER_URL);

// Enable debug mode if configured
if (window.DEBUG) {
    localStorage.debug = '*';
}

// Get Socket.IO options from configuration
const options = window.SOCKET_OPTIONS || {
    transports: ['polling'],
    upgrade: false,
    forceNew: true,
    path: '/socket.io/',
    withCredentials: false
};

console.log(`Connecting to ${SERVER_URL} with options:`, options);
const socket = io(SERVER_URL, options);

// Set up event listeners
socket.on('connect', () => {
    console.log('Connected successfully!');
    document.getElementById('error').classList.add("hidden");
    initializeSocket(socket);
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    document.getElementById('error').classList.remove("hidden");
    document.getElementById('error').innerHTML = "Failed to connect to server. Please try again later.";
});

socket.on('disconnect', (reason) => {
    console.log(`Disconnected: ${reason}`);
});

// Initialize socket event handlers
function initializeSocket(newSocket) {
    // If we're replacing the socket, update the reference
    if (newSocket) {
        socket = newSocket;
    }
    
    if (!socket) {
        console.error("Socket initialization failed");
        return;
    }

    socket.on('disconnect', (reason) => {
        console.log('Disconnected:', reason);
        // Display the disconnect reason in the UI if it's an error
        if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
            document.getElementById('error').classList.remove("hidden");
            document.getElementById('error').innerHTML = "Disconnected: " + reason;
        }
    });

    // Socket connection handler
    socket.on('connect', () => {
        console.log("Client connected successfully with ID:", socket.id);
    });

    // Ready event handler
    socket.on('ready', () => {
        console.log("Received 'ready' event - showing game interface");
        showGameInterface();
    });

    socket.on('error', (error) => {
        console.error("Received error from server:", error);
        document.getElementById('error').classList.remove("hidden");
        document.getElementById('error').innerHTML = error || "An unknown error occurred";
    });

    // Add handler for game_error events
    socket.on('game_error', (error) => {
        console.error("Received game error from server:", error);
        document.getElementById('error').classList.remove("hidden");
        document.getElementById('error').innerHTML = error || "An unknown error occurred";
    });
    
    socket.on('stars', (data) => {stars = data});
    socket.on('update', (data) => {
        if (data.me != null) {
            game.setCurrentState(new gamestate(data));
            game.renderCurrentState();
        }
    });
    socket.on('dead',() => {
        restore();
    });
    socket.on('pairError', () => {
        document.getElementById('error').classList.remove("hidden");
        document.getElementById('error').innerHTML = "Pair code does not exist";
    });
    socket.on('userError', () => {
        document.getElementById('error').classList.remove("hidden");
        document.getElementById('error').innerHTML = "Username already exists";
    });
    socket.on('timedOut', () => {
        restore();
    });
}

// Initialize the socket event handlers
initializeSocket();

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

// Initialize the game after socket is connected
let game;
export let stars = [];

// Initialize the game
function initializeGame() {
    if (!game && socket) {
        game = new gamemanager(socket);
        // Make game available globally
        window.game = game;
    }
}

// Add export for game
export { game };

// Initialize the game when the socket is ready
initializeGame();

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

// Centralized function to show the game interface
function showGameInterface() {
    try {
        const playMenu = document.getElementById('play-menu');
        const game = document.getElementById('game');
        const leaderboard = document.getElementById('leaderboard');
        
        // Apply UI changes
        if (playMenu) playMenu.classList.add("hidden");
        if (game) game.classList.remove("hidden");
        if (leaderboard) leaderboard.classList.remove("hidden");
        
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
