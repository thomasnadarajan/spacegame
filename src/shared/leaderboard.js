export class leaderboard {
    constructor() {
        this.leaderboard = []
    }

    addPair(pair, score) {
        this.leaderboard.push( { pair: pair, score: score } )
    }
}