import {setCanvasDims  } from "./render"
import {io} from 'socket.io-client'
import { gamemanager } from "./gamemanager"
import { gamestate } from "./gamestate"
import { activateEventListener } from "./input"
const socket = io("http://localhost:3000", { transports: ['websocket', 'polling', 'flashsocket'] })
socket.on('connect', () => {
    console.log("client connected")
})
export const game = new gamemanager(socket)
socket.on('update', (data) => {
    game.setCurrentState(new gamestate(data))
    game.renderCurrentState()
})

setCanvasDims()
activateEventListener()
