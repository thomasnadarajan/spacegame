
export class gamestate {
    constructor(update) {
        const data = update
        this.players = data.players
        this.me = data.me
        // a list of all the ships in the game
        this.ships = data.ships

        // a list of all the lasers in flight
        this.shiplasers = data.shiplasers
        this.playerlasers = data.playerlasers
    }

}