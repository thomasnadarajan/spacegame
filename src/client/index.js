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
var lastUpdate = null
socket.on('update', (data) => {
    if (data.me != null) {
        game.setCurrentState(new gamestate(data))
        game.renderCurrentState()
    }
    else {
        if (lastUpdate === null) {
            lastUpdate = data.ships
            console.log(data.ships)
        }
        else {
            for (const ship in data.ships) {
                if (!(ship in lastUpdate)) {
                    lastUpdate = data.ships
                    console.log(data.ships)
                    break
                }
            }
        }
    }
})

setCanvasDims()
activateEventListener()
