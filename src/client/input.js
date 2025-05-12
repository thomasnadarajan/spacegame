import {game, socket} from './index'
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
    console.log('==== WEAPONS CLICK DETECTED ====');
    console.log('Click coordinates:', {x: e.x, y: e.y, button: e.button});
    console.log('Listeners active:', window.weaponsListenersActive);
    console.log('Game object available:', !!game);
    console.log('handleWeaponsClick method available:', game && typeof game.handleWeaponsClick === 'function');
    
    // Call directly to avoid any scope issues
    try {
        if (game && typeof game.handleWeaponsClick === 'function') {
            game.handleWeaponsClick();
        } else {
            console.error('game object or handleWeaponsClick method not available:', game);
        }
    } catch (error) {
        console.error('Error in weaponsClickListener:', error);
    }
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
    console.log('Play button clicked - checking game state');
    console.log('Game object available:', !!game);
    console.log('Socket available:', socket?.connected);
    
    const userMulti = document.getElementById('username-input').value;
    const userSolo = document.getElementById('username-input-solo').value;
    const pair = document.getElementById('pair-input').value;
    
    console.log('User inputs:', { userMulti, userSolo, pair });
    
    if (pair === '' && userSolo !== '') {
        console.log('Attempting to add solo player:', userSolo);
        if (game && typeof game.addPlayer === 'function') {
            console.log('Game object exists, calling game.addPlayer with socket:', socket?.id);
            game.addPlayer(socket, userSolo, null);
        } else {
            console.error('Game object is not available or addPlayer method is missing!', game);
            document.getElementById('error').classList.remove("hidden");
            document.getElementById('error').innerHTML = "Game initialization incomplete. Please wait or refresh.";
        }
    }
    else if (pair !== '' && userMulti !== '') {
        console.log('Attempting to add multiplayer player:', userMulti, 'with pair:', pair);
        if (game && typeof game.addPlayer === 'function') {
            console.log('Game object exists, calling game.addPlayer with socket:', socket?.id);
            game.addPlayer(socket, userMulti, pair);
        } else {
             console.error('Game object is not available or addPlayer method is missing!', game);
            document.getElementById('error').classList.remove("hidden");
            document.getElementById('error').innerHTML = "Game initialization incomplete. Please wait or refresh.";
        }
    } else {
        console.log('Invalid input combination');
    }
}

const weaponsDirectionListener = (e) => {
    const newdir = Math.atan2(e.x - window.innerWidth / 2, window.innerHeight / 2 - e.y)
    throttle(20, game.handleWeaponsMove(newdir))
}
const playerWeaponsListener = (e) => {
    // Check if game.currentState and game.currentState.me exist
    if (!game.currentState || !game.currentState.me) {
        console.warn('Cannot calculate weapons direction: game state or player not available');
        return;
    }
    
    const newdir = Math.atan2(
        e.x - (window.innerWidth / 2 - (5 * ship.block) + game.currentState.me.worldPosition.x), 
        (window.innerHeight / 2 - (5 * ship.block) + game.currentState.me.worldPosition.y) - e.y
    );
    throttle(20, game.handlePlayerWeaponsDirection(newdir));
}
const playerWeaponsFire = (e) => {
    console.log('Player weapon fire triggered', {
        eventType: e.type,
        button: e.button,
        game: !!game,
        handleFireMethod: game && typeof game.handlePlayerFire === 'function'
    });
    
    // Make sure game exists and the handlePlayerFire method is available
    if (game && typeof game.handlePlayerFire === 'function') {
        try {
            console.log('Calling game.handlePlayerFire()');
            game.handlePlayerFire();
            console.log('game.handlePlayerFire() completed');
        } catch (error) {
            console.error('Error in handlePlayerFire:', error);
        }
    } else {
        console.warn('Cannot fire: game not ready or handlePlayerFire not available');
    }
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
    console.log('Activating menu listener')
    addEventListener('mousemove', highlight)
    addEventListener('mousedown', menuclick)
    disablePlayerListener()
}
export function disableMenuListener() {
    console.log('Disabling menu listener')
    removeEventListener('mousemove', highlight)
    removeEventListener('mousedown', menuclick)
    activatePlayerListener()
}
export function enableWeaponsListeners() {
    console.log('==== ENABLING WEAPONS LISTENERS ====');
    console.log('Current window.weaponsListenersActive:', window.weaponsListenersActive);
    console.log('Current game object:', game ? 'Available' : 'Not available');
    
    disablePlayerListener();
    
    // Add listeners
    try {
        addEventListener('mousemove', weaponsDirectionListener);
        addEventListener('mousedown', weaponsClickListener);
        addEventListener('keydown', weaponsUse);
        console.log('Successfully added weapons listeners');
    } catch (error) {
        console.error('Error adding weapons listeners:', error);
    }
    
    console.log('Weapons listeners enabled and ready');
    
    // Schedule a delayed test fire to check if the system is working
    setTimeout(() => {
        console.log('Performing auto-test of weapons click system...');
        if (window.testWeaponsClick) window.testWeaponsClick();
    }, 3000);
}
export function disableWeaponsListeners() {
    console.log('Disabling weapons listeners')
    removeEventListener('mousemove', weaponsDirectionListener)
    removeEventListener('mousedown', weaponsClickListener)
    removeEventListener('keydown', weaponsUse)
    activatePlayerListener()
}
