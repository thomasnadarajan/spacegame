export class leaderboard {
    constructor() {
        this.leaderboard = []
    }

    addPair(pair, score) {
        // Remove any existing entry for this pair
        this.leaderboard = this.leaderboard.filter(entry => entry.pair !== pair)
        // Add the new entry
        this.leaderboard.push({ pair: pair, score: score })
        // Sort by score in descending order
        this.leaderboard.sort((a, b) => b.score - a.score)
        // Keep only top 5
        if (this.leaderboard.length > 5) {
            this.leaderboard = this.leaderboard.slice(0, 5)
        }
    }

    toJSON() {
        return {
            leaderboard: this.leaderboard
        }
    }
}