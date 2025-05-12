import {animate} from './render'
import { enableMouseDirection, disableMouseDirection, activateMenuListener, disableMenuListener, enableWeaponsListeners, disableWeaponsListeners } from './input'
import { menustack } from './render'
import {transportmenu, cargomenu, tacticalmenu} from './menu'
import io from 'socket.io-client'

export class gamemanager {
    constructor(socket) {
        this.currentState = null
        this.animationFrameRequest = null
        this.socket = socket
        this.currentMousePosition = {x: 0, y: 0}
        this.weaponsAngle = 0
        this.weaponsMode = false

        // Listen for redirect events
        this.socket.on('redirect', (data) => {
            // Store current connection info
            const currentPairCode = data.pairCode;
            
            // Disconnect from current instance
            this.socket.disconnect();
            
            // Connect to new instance with explicit origin
            const newSocket = io(`${window.location.origin}/${data.instanceId}`, {
                transports: ['websocket', 'polling'],
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 10000
            });
            
            // When connected to new instance, try to join with the pair code
            newSocket.on('connect', () => {
                console.log('Connected to new instance');
                this.socket = newSocket;
                this.addPlayer(this.socket, this.currentState?.me?.user || 'Player', currentPairCode);
            });
            
            // Add error handler
            newSocket.on('connect_error', (error) => {
                console.error('Connection error:', error);
            });
        });

    }
    setCurrentState(state) {
        // Log received player lasers for debugging
        if (state.playerlasers && state.playerlasers.length > 0) {
            console.log(`===== RECEIVED ${state.playerlasers.length} PLAYER LASERS IN UPDATE =====`);
            state.playerlasers.forEach((laser, index) => {
                console.log(`Server laser ${index}:`, {
                    x: laser.x,
                    y: laser.y,
                    rotation: laser.rotation,
                    ship: laser.ship,
                    player: laser.player,
                    destroyed: laser.destroyed
                });
            });
        }
        
        this.currentState = {...this.currentState, ...state}
        this.currentState['weaponsAngle'] = this.weaponsAngle
        this.currentState['weaponsMode'] = this.weaponsMode
        if (this.currentState.me.playerView) {
            disableMouseDirection()
        }
        else {
            enableMouseDirection()
        }
        
        // Update leaderboard display
        const rows = document.querySelectorAll('#leaderboard table tr')
        const data = this.currentState.leaderboard.leaderboard || []
        
        // Clear existing rows
        for (let i = 1; i < rows.length; i++) {
            rows[i].innerHTML = '<td>-</td><td>-</td>'
        }
        
        // Update with new data
        for (let i = 0; i < data.length && i < 5; i++) {
            const entry = data[i]
            if (entry && entry.pair) {
                rows[i + 1].innerHTML = `<td>${entry.pair}</td><td>${entry.score || 0}</td>`
            }
        }
        
        this.renderCurrentState()
    }
    updateMousePosition(x, y) {
        const currentMenu = menustack[menustack.length - 1]
        for (const comp in currentMenu.components) {
            if (currentMenu.components[comp].Type === 'button') {
                currentMenu.components[comp].Mouseover = currentMenu.isHover(currentMenu.components[comp], x, y).Mouseover
            }
            else if (currentMenu.components[comp].Type === 'buttonList'){
                const check = currentMenu.isHover(currentMenu.components[comp], x, y)
                currentMenu.components[comp].Mouseover = check.Mouseover
                currentMenu.components[comp].Segment = check.Segment
            }
            else if (currentMenu.components[comp].Type === 'shifter'){
                const check = currentMenu.isHover(currentMenu.components[comp], x, y)
                currentMenu.components[comp].Mouseover = check.Mouseover
                currentMenu.components[comp].Segment = check.Segment
            }
        }
    }
    handleWeaponsMove(input) {
        this.weaponsAngle = input
    }

    handleWeaponsClick() {
        console.log('Attempting to fire weapon, angle:', this.weaponsAngle, 'mode:', this.weaponsMode)
        console.log('Current player position:', this.currentState.me.position, 'stationActive:', this.currentState.me.stationActive)
        console.log('Emitting fire event to server with angle:', this.weaponsAngle, 'ship:', this.currentState.me.currentShip)
        console.log(this.socket)
        this.socket.emit('fire', {
            angle: this.weaponsAngle, 
            ship: this.currentState.me.currentShip,
        })
        console.log('Fire event emitted')
       
    }
    handlePlayerFire() {
        this.socket.emit('pfire')
    }
    updateMouseClick() {
        const currentMenu = menustack[menustack.length - 1]
        console.log('Menu click detected, menu:', currentMenu.constructor.name)
        for (const comp in currentMenu.components) {
            const check = currentMenu.components[comp].Mouseover
            if (check) {
                console.log('Clicked component:', comp, 'type:', currentMenu.components[comp].Type)
                const ret = currentMenu.clicked(comp, this.currentState)
                if (ret != null && ret === 'close') {
                    console.log('Closing menu')
                    menustack.pop()
                    disableMenuListener()
                    // Tell the server to deactivate the station
                    this.socket.emit('toggleStation', false);
                }
                else if (ret != null && ret === 'weapons') {
                    console.log('Entering weapons mode')
                    menustack.pop()
                    disableMenuListener()
                    this.weaponsMode = true
                    
                    enableWeaponsListeners()
                    // Keep station active during weapons mode
                    this.socket.emit('toggleStation', true);
                    
                    // Trigger a test fire after 1 second to make sure everything is working
                    setTimeout(() => {
                        console.log('Auto-testing weapons system...');
                        if (window.testWeaponsClick) window.testWeaponsClick();
                    }, 1000);
                }
            }
        }
    }
    renderCurrentState() {
        this.animationFrameRequest = requestAnimationFrame(animate.bind(this.currentState))
    }
    cancelAnimationFrame() {
        cancelAnimationFrame(this.animationFrameRequest)
    }
    handleMouseInput(input) {
        this.socket.emit('update', input)
    }

    handlePowerUpdate(comp, level, ship) {
        const data = {system: comp, level: level, ship: ship}
        this.socket.emit('power', data)
    }
    handleKeyInput(input) {
        if (input === 'use') {
            if (this.weaponsMode) {
                console.log('Exiting weapons mode')
                this.weaponsMode = false
                disableWeaponsListeners()
                // Tell the server to deactivate the station
                this.socket.emit('toggleStation', false);
            }
            else if (this.currentState.me.position.x === 8 && this.currentState.me.position.y === 2) {
                console.log('Opening tactical menu')
                menustack.push(new tacticalmenu(this.currentState.me.currentShip))
                activateMenuListener()
                // Tell the server to activate the station
                this.socket.emit('toggleStation', true);
            }
            else if (this.currentState.me.position.x === 8 && this.currentState.me.position.y === 6) {
                menustack.push(new transportmenu(this.currentState.me.currentShip))
                activateMenuListener()
                // Tell the server to activate the station
                this.socket.emit('toggleStation', true);
            }
            else if (this.currentState.me.position.x === 3 && this.currentState.me.position.y === 6) {
                if (this.currentState.me.currentShip !== this.currentState.me.parentShip) {
                    menustack.push(new cargomenu(this.currentState.me.currentShip, false))
                }
                else {
                    menustack.push(new cargomenu(this.currentState.me.currentShip, true))
                }
                activateMenuListener()
                // Tell the server to activate the station
                this.socket.emit('toggleStation', true);
            }
            else {
                this.socket.emit('direction', input)
            }
        }
        else {
            this.socket.emit('direction', input)
        }
    }
    handleStopDirection(input) {
        this.socket.emit('stopDirection', input)
    }
    handlePlayerWeaponsDirection(data) {
        this.socket.emit('playerDirection', data)
    }
    handleTransportRequest() {
        const currentMenu = menustack[menustack.length - 1]
        if (currentMenu.mode === 'send') {
            this.socket.emit('transport', {
                player: currentMenu.selectedPlayerSend,
                ship: currentMenu.selectedShip
            })
        }
        else {
            this.socket.emit('transport', {
                player: currentMenu.selectedPlayerSend,
                ship: currentMenu.ship
            })
        }
    }

    addPlayer(socket, user, pair) {
        try {
            console.log(`Emitting 'join' event for user: ${user}, pair: ${pair} using socket: ${socket.id}`);
            socket.emit('join', { user, pair });
            console.log('Join event emitted successfully');
        } catch (error) {
            console.error('Error emitting join event:', error);
        }
    }

    startCargoTransport(ship) {
        this.socket.emit('startCargoTransport', {source: ship, sink: this.currentState.me.parentShip})
    }
    cancelCargoTransport(ship) {
        this.socket.emit('cancelCargoTransport', {source: ship})
    }
}