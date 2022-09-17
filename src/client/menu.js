import {distanceCalc} from '../shared/distance'
import {game} from './index'
import {ship} from '../shared/ship.js'
export class menu {
    constructor(heading, ship) {
        // each of these 
        this.ship = ship
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
        this.shifterHeight = this.mainHeight * 0.1
        this.shifterFontSize = Math.round(this.mainHeight * 0.1 * 0.5).toString()
    }
    isHover(comp, x, y) {
        if (comp.Type === 'button') {
            if (comp.Alignment === 'left') {
                if (x > comp.LeftBound && x < comp.LeftBound + comp.Width && y < comp.BotBound && y > comp.BotBound - Math.round(this.mainHeight * 0.05)) {
                    return {Mouseover: true, Segment: 0}
                }
            }
            else if (comp.Alignment === 'center') {
                if (x > comp.LeftBound - comp.Width / 2 && x < comp.LeftBound + comp.Width / 2 && y < comp.BotBound && y > comp.BotBound - Math.round(this.mainHeight * 0.05)) {
                    return {Mouseover: true, Segment: 0}
                }
            }
            else if (comp.Alignment === 'right') {
                if (x > comp.LeftBound - comp.Width && x < comp.LeftBound && y < comp.BotBound && y > comp.BotBound - Math.round(this.mainHeight * 0.05)) {
                    return {Mouseover: true, Segment: 0}
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
                if (x < comp.LeftBound && x > comp.LeftBound - comp.Width) {
                    for (let i = 0; i < 4; i++) {
                        if (y < comp.BotBound - i * 2 * parseInt(this.listFontSize) && y > comp.BotBound - i * 2 * parseInt(this.listFontSize) - parseInt(this.listFontSize)) {
                            return {Mouseover: true, Segment: i}
                        }
                    }
                    return {Mouseover: false, Segment: 0}
                }
            }
        }

        else if (comp.Type === 'shifter') {
            if (comp.Alignment === 'left') {
                if (x > comp.LeftBound && x < comp.LeftBound + comp.Width) {
                    for (let i = 0; i < 5; i++) {
                        if (y > comp.BotBound - ((i + 1) * this.shifterHeight) && y < comp.BotBound - ((i) * this.shifterHeight)) {
                            return {Mouseover: true, Segment: i}
                        }
                    }
                    return {Mouseover: false, Segment: 0}
                }
            }
            else if (comp.Alignment === 'right') {
                if (x < comp.LeftBound && x > comp.LeftBound - comp.Width) {
                    for (let i = 0; i < 5; i++) {
                        if (y > comp.BotBound - ((i + 1) * this.shifterHeight) && y < comp.BotBound - ((i) * this.shifterHeight)) {
                            return {Mouseover: true, Segment: i}
                        }
                    }
                    return {Mouseover: false, Segment: 0}
                }
            }
            else if (comp.Alignment === 'center') {
                if (x > comp.LeftBound - comp.Width / 2 && x < comp.LeftBound + comp.Width / 2) {
                    for (let i = 0; i < 5; i++) {
                        if (y > comp.BotBound - ((i + 1) * this.shifterHeight) && y < comp.BotBound - ((i) * this.shifterHeight)) {
                            return {Mouseover: true, Segment: i}
                        }
                    }
                    return {Mouseover: false, Segment: 0}
                }
            }
        }
        return {Mouseover: false, Segment: 0}
    }

}

export class cargomenu extends menu {
    constructor(ship, own) {
        super('Cargo', ship)
        this.units = ship.cargo
        this.own = own
        this.components = {
            "Units Available": {
                Type: 'title',
                BotBound: 0.2 * this.mainHeight + this.mainTopBound,
                LeftBound: this.headerTextBoundHoriz,
                Alternative: false,
                AlternativeText: 'You have '.concat("units of cargo in storage.")
            },
            "Transport": {
                Type: 'button',
                LeftBound: this.topBoundHoriz + 0.1 * this.width,
                BotBound: this.mainTopBound + this.mainHeight - 0.1 * this.mainHeight,
                Mouseover: false,
                Alignment: 'left',
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
        if (own) {
            this.components["Units Available"].Alternative = true
        }

    }
    clicked(comp) {
        if (comp === 'Close') {
            return 'close'
        }
        // change this to happen in the menu handler on the gamemanger side
        if (!this.own) {
            if (comp === 'Transport') {
                game.startCargoTransport(this.ship)

            }
            else {
                game.cancelCargoTransport(this.ship)
            }
        }
    }
    update(source) {
        this.units = source.cargo
        this.components['Units Available'].AlternativeText = 'You have '.concat(this.units.toString().concat(" units of cargo in storage."))
    }
}

export class transportmenu extends menu {
    constructor(ship) {
        super('Transport', ship)
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
                Alignment: 'right',
                Alternative: false,
                AlternativeText: 'Retrieve From'
            },
            "CrewList": {
                Type: 'buttonList',
                LeftBound: this.topBoundHoriz + 0.1 * this.width,
                BotBound: this.mainTopBound + this.mainHeight - 0.3 * this.mainHeight,
                Alignment: 'left',
                Mouseover: false,
                Segment: 0,
                Width: this.buttonWidth
            },
            "ShipList": {
                Type: 'buttonList',
                LeftBound: this.topBoundHoriz + this.width - 0.1 * this.width,
                BotBound: this.mainTopBound + this.mainHeight - 0.3 * this.mainHeight,
                Alignment: 'right',
                Mouseover: false,
                Segment: 0,
                Width: this.buttonWidth
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
        this.selectedPlayer = null
        this.selectedShip = null
        this.selectedPlayerSend = null
        this.mode = 'send'
    }
    update(data) {
        this.shipList = []
        this.crewList = []
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
        var found = false
        for (const ship of this.shipList) {
            if (ship === this.selectedShip) {
                found = true
                break
            }
        }
        if (!found) {
            this.selectedShip = null
            this.selectedPlayer = null
        }
        
        if (this.mode === 'send') {
            found = false

            for (const player of myShip.players) {
                for (const position of ship.type['transport']) {
                    if (position.x === data.players[player].position.x && position.y === data.players[player].position.y) {
                        if (this.selectedPlayer === data.players[player].user) {
                            found = true
                        }
                        this.crewList.push(data.players[player].user)
                    }
                }
            }
            if (!found) {
                this.selectedPlayer = null
            }
        }
        else {
            if (this.selectedShip != null) {
                console.log(data.ships[this.selectedShip])
                for (const player of data.ships[this.selectedShip].players) {
                    for (const position of ship.type['transport']) {
                        if (position.x === data.players[player].position.x && position.y === data.players[player].position.y) {
                            this.crewList.push(data.players[player].user)
                        }
                    }
                }
            }
        }
    }

    clicked(comp, data) {
        const component = this.components[comp]
        if (comp === 'Close') {
            return 'close'
        }
        else if (comp === 'Mode') {
            this.mode = this.mode === 'send' ? 'retrieve' : 'send'
            for (const comp in this.components) {
                if (comp === 'Destination') {
                    this.components[comp].Alternative = !this.components[comp].Alternative
                }
            }
            return null
        }
        else if (comp === 'Transport') {
            game.handleTransportRequest()
            return 'close'
        }

        if (component.Type === 'buttonList') {
            if (comp === 'ShipList') {
                this.selectedShip = this.shipList[component.Segment]
            }
            else {
                for (const p in data.players) {
                    if (data.players[p].user === this.crewList[component.Segment]) {
                        this.selectedPlayerSend = p
                        break
                    }
                }
                this.selectedPlayer = this.crewList[component.Segment]
            }
        }
    }
}

export class tacticalmenu extends menu {
    constructor(ship) {
        super('Tactical', ship)
        this.components = {
            "Weapons Power": {
                Type: 'title',
                BotBound: 0.1 * this.mainHeight + this.mainTopBound,
                LeftBound: this.topBoundHoriz + 0.1 * this.width,
                Alignment: 'left'
            },
            "Shields Power": {
                Type: 'title',
                BotBound: 0.1 * this.mainHeight + this.mainTopBound,
                LeftBound: this.topBoundHoriz + this.width / 2,
                Alignment: 'center'
            },
            "Engines Power": {
                Type: 'title',
                LeftBound: this.topBoundHoriz + this.width - 0.1 * this.width,
                BotBound: 0.1 * this.mainHeight + this.mainTopBound,
                Alignment: 'right',
            },
            "Weapons": {
                Type: 'button',
                LeftBound: this.topBoundHoriz + 0.1 * this.width,
                BotBound: this.mainTopBound + this.mainHeight - 0.1 * this.mainHeight,
                Mouseover: false,
                Alignment: 'left',
                Width: this.buttonWidth
            },
            "Available Power: " : {
                Type: 'title',
                BotBound: this.mainTopBound + this.mainHeight - 0.2 * this.mainHeight,
                LeftBound: this.topBoundHoriz + this.width / 2,
                Alignment: 'center'
            },
            "Close" : {
                Type: 'button',
                LeftBound: this.topBoundHoriz + this.width - 0.1 * this.width,
                BotBound: this.mainTopBound + this.mainHeight - 0.1 * this.mainHeight,
                Mouseover: false,
                Alignment: 'right',
                Width: this.buttonWidth
            },
            "WeaponsShifter": {
                Type: 'shifter',
                LeftBound: this.topBoundHoriz + 0.1 * this.width,
                BotBound: this.mainTopBound + this.mainHeight - 0.3 * this.mainHeight,
                Mouseover: false,
                Alignment: 'left',
                Width: this.buttonWidth,
                Segments: 0,
                Level: 0
            },
            "ShieldsShifter": {
                Type: 'shifter',
                LeftBound: this.topBoundHoriz + this.width / 2,
                BotBound: this.mainTopBound + this.mainHeight - 0.3 * this.mainHeight,
                Mouseover: false,
                Alignment: 'center',
                Width: this.buttonWidth,
                Segments: 0,
                Level: 0
            },
            "EnginesShifter": {
                Type: 'shifter',
                LeftBound: this.topBoundHoriz + this.width - 0.1 * this.width,
                BotBound: this.mainTopBound + this.mainHeight - 0.3 * this.mainHeight,
                Mouseover: false,
                Alignment: 'right',
                Width: this.buttonWidth,
                Segments: 0,
                Level: 0
            }
            

        }
        this.availablePower = 0
    }
    update(data) {
        this.availablePower = data.availablePower
        for (const comp in this.components) {
            if (comp === 'WeaponsShifter') {
                this.components[comp].Level = data.systems.weapons - 1
            }
            else if (comp === 'ShieldsShifter') {
                this.components[comp].Level = data.systems.shields - 1
            }
            else if (comp === 'EnginesShifter') {
                this.components[comp].Level = data.systems.engines - 1
            }
        }
    }
    clicked(comp) {
        const component = this.components[comp]
        if (comp === 'Close') {
            return 'close'
        }
        else if (comp === 'Weapons') {
            return 'weapons'
        }
        if (component.Type === 'shifter') {
            if (component.Segment - component.Level <= this.availablePower) {
                this.components[comp].Level = component.Segment
                game.handlePowerUpdate(comp, this.components[comp].Level, this.ship)
            }
        }
    }
}