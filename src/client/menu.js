// all menus are client side
import {distanceCalc} from './gamemanager.js'
export class menu {
    constructor(heading) {
        // each of these 
        this.heading = heading
        this.headerHeight = innerHeight * 0.1
        this.mainHeight = innerHeight * 0.5
        this.width = innerWidth * 0.4
        this.topBoundVert = innerHeight * 0.2 
        this.topBoundHoriz = innerWidth * 0.3
        this.mainTopBound = this.topBoundVert + this.headerHeight
        this.headerTextBoundHoriz = this.topBoundHoriz * 1.1
        this.headerFontSize = Math.round(this.headerHeight * 0.6).toString()
        this.mainFontSize = Math.round(this.mainHeight * 0.1).toString()
        this.buttonFontSize = Math.round(this.mainHeight * 0.05).toString()
        this.listFontSize = Math.round(this.mainFontSize * 0.5).toString()
        this.buttonWidth = this.width * 0.15
    }
    isHover(comp, x, y) {
        if (comp.Type === 'button') {
            if (comp.Alignment === 'left') {
                if (x > comp.LeftBound && x < comp.LeftBound + comp.Width && y < comp.BotBound && y > comp.BotBound - Math.round(this.mainHeight * 0.05)) {
                    return true
                }
            }
            else if (comp.Alignment === 'center') {
                if (x > comp.LeftBound - comp.Width / 2 && x < comp.LeftBound + comp.Width / 2 && y < comp.BotBound && y > comp.BotBound - Math.round(this.mainHeight * 0.05)) {
                    return true
                }
            }
            else if (comp.Alignment === 'right') {
                if (x > comp.LeftBound - comp.Width && x < comp.LeftBound && y < comp.BotBound && y > comp.BotBound - Math.round(this.mainHeight * 0.05)) {
                    return true
                }
            }
        }
        else if (comp.Type === 'buttonList') {
            if (comp.Alignment === 'left') {
                if (x > comp.LeftBound && x < comp.LeftBound + comp.Width) {
                    for (let i = 0; i < 4; i++) {
                        if (y < comp.BotBound - i * 2 * parseInt(this.listFontSize) && y > comp.BotBound - i * 2 * parseInt(this.listFontSize) - parseInt(this.listFontSize)) {
                            return {Mouseover: true, Segment: i}
                        }
                    }
                    return {Mouseover: false, Segment: 0}
                }
            }
            else if (comp.Alignment === 'right') {
                for (let i = 0; i < 4; i++) {
                    if (y < comp.BotBound - i * 2 * parseInt(this.listFontSize) && y > comp.BotBound - i * 2 * parseInt(this.listFontSize) - parseInt(this.listFontSize)) {
                        return {Mouseover: true, Segment: i}
                    }
                }
                return {Mouseover: false, Segment: 0}
            }
        }
        return false
    }

}

export class cargomenu extends menu {
    constructor() {
        super('Cargo')
        this.components = {
            "Units Available": {
                Type: 'title',
                BotBound: 0.2 * this.mainHeight + this.mainTopBound,
                LeftBound: this.headerTextBoundHoriz
            },
            "Seconds to Complete": {
                Type: 'title',
                LeftBound: this.headerTextBoundHoriz,
                BotBound: 0.6 * this.mainHeight + this.mainTopBound
            },
            "Transport": {
                Type: 'button',
                LeftBound: this.topBoundHoriz + 0.1 * this.width,
                BotBound: this.mainTopBound + this.mainHeight - 0.1 * this.mainHeight,
                Mouseover: false
            },
            "Cancel" : {
                Type: 'button',
                LeftBound: this.topBoundHoriz + this.width / 2,
                BotBound: this.mainTopBound + this.mainHeight - 0.1 * this.mainHeight,
                Mouseover: false
            },
            "Close" : {
                Type: 'button',
                LeftBound: this.topBoundHoriz + this.width - 0.1 * this.width,
                BotBound: this.mainTopBound + this.mainHeight - 0.1 * this.mainHeight,
                Mouseover: false
            }
        }
        this.transporting = false

    }
    update(source) {
        this.units = source.cargo
        this.seconds = this.units * 4
    }
    /*
    this is going to go on the server side
    transport(source, sink) {
        sink.cargo += 1
        source.cargo -= 1
        this.transporting = true
        setTimeout(() => {this.transporting = false}, 4000)
    }
    */
}

export class transportmenu extends menu {
    constructor() {
        super('Transport')
        this.components = {
            "Crewperson": {
                Type: 'title',
                BotBound: 0.2 * this.mainHeight + this.mainTopBound,
                LeftBound: this.topBoundHoriz + 0.1 * this.width,
                Alignment: 'left'
            },
            "Destination": {
                Type: 'title',
                LeftBound: this.topBoundHoriz + this.width - 0.1 * this.width,
                BotBound: 0.2 * this.mainHeight + this.mainTopBound,
                Alignment: 'right'
            },
            "CrewList": {
                Type: 'buttonList',
                LeftBound: this.topBoundHoriz + 0.1 * this.width,
                BotBound: this.mainTopBound + this.mainHeight - 0.3 * this.mainHeight,
                Alignment: 'left',
                Mouseover: false,
                Segment: 0
            },
            "ShipList": {
                Type: 'buttonList',
                LeftBound: this.topBoundHoriz + this.width - 0.1 * this.width,
                BotBound: this.mainTopBound + this.mainHeight - 0.3 * this.mainHeight,
                Alignment: 'right',
                Mouseover: false,
                Segment: 0
            },
            "Transport": {
                Type: 'button',
                LeftBound: this.topBoundHoriz + 0.1 * this.width,
                BotBound: this.mainTopBound + this.mainHeight - 0.1 * this.mainHeight,
                Mouseover: false,
                Alignment: 'left',
                Width: this.buttonWidth
            },
            "Mode": {
                Type: 'button',
                LeftBound: this.topBoundHoriz + this.width / 2,
                BotBound: this.mainTopBound + this.mainHeight - 0.1 * this.mainHeight,
                Mouseover: false,
                Alignment: 'center',
                Width: this.buttonWidth
            },
            "Close" : {
                Type: 'button',
                LeftBound: this.topBoundHoriz + this.width - 0.1 * this.width,
                BotBound: this.mainTopBound + this.mainHeight - 0.1 * this.mainHeight,
                Mouseover: false,
                Alignment: 'right',
                Width: this.buttonWidth
            }
        }
        this.shipList = []
        this.crewList = []
        this.player = null
        this.destination = null
    }
    update(data) {
        this.shipList = []
        const myShip = data.ships[data.me.currentShip]
        let dists = {}
        for (const ship in data.ships) {
            if (ship != data.me.currentShip) {
                dists[ship] = distanceCalc(myShip, data.ships[ship])
            }
        }
        const sortedArr = Object.entries(dists).sort(([, v1], [, v2]) => v1 - v2)
        for (let i = 0; i < sortedArr.length && i < 4; i++) {
            this.shipList.push(sortedArr[i][0])
        }
        
    }
}