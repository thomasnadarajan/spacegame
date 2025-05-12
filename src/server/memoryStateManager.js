import { player } from '../shared/player';
import { ship } from '../shared/ship';
import { cargo } from '../shared/cargo';
import { leaderboard } from '../shared/leaderboard';
import EventEmitter from 'events';

export class MemoryStateManager extends EventEmitter {
    constructor() {
        super();
        
        // Initialize local storage
        this.state = {
            players: {},
            ships: {},
            cargo: [],
            leaderboard: { leaderboard: [] },
            pair_instances: {}
        };
        
        // Generate a unique instance ID for this server
        this.instanceId = Math.random().toString(36).substring(7);
        console.log('Memory State Manager initialized with instance ID:', this.instanceId);
    }

    // Game state methods
    async getGameState() {
        return {
            players: { ...this.state.players },
            ships: { ...this.state.ships },
            cargo: [...this.state.cargo],
            leaderboard: this.state.leaderboard
        };
    }

    async updateGameState(state) {
        try {
            // Update the state in memory
            if (state.players) {
                this.state.players = { ...state.players };
            }
            
            if (state.ships) {
                this.state.ships = { ...state.ships };
            }
            
            if (state.cargo) {
                this.state.cargo = [...state.cargo];
            }
            
            if (state.leaderboard) {
                this.state.leaderboard = { ...state.leaderboard };
            }

            // Emit event for other parts of the code to react to
            this.emit('stateUpdated', state);
            
            return true;
        } catch (err) {
            console.error('Error updating game state:', err);
            return false;
        }
    }

    // Player methods
    async addPlayer(playerId, playerData) {
        try {
            // Create a new object with only the data we want to store
            const cleanPlayerData = {
                username: playerData.username,
                position: {
                    x: playerData.position.x,
                    y: playerData.position.y
                },
                worldPosition: playerData.worldPosition ? {
                    x: playerData.worldPosition.x,
                    y: playerData.worldPosition.y
                } : null,
                health: playerData.health,
                currentShip: playerData.currentShip,
                playerView: playerData.playerView,
                pair: playerData.pair,
                keys: playerData.keys || {}
            };
            
            // Store the clean data in memory
            this.state.players[playerId] = cleanPlayerData;
            
            // Emit an event for this change
            this.emit('playerJoined', playerId, cleanPlayerData);
            
            return true;
        } catch (err) {
            console.error('Error adding player:', err);
            return false;
        }
    }

    async removePlayer(playerId) {
        try {
            delete this.state.players[playerId];
            this.emit('playerLeft', playerId);
            return true;
        } catch (err) {
            console.error('Error removing player:', err);
            return false;
        }
    }

    async updatePlayerPosition(playerId, position) {
        try {
            if (this.state.players[playerId]) {
                this.state.players[playerId].position = position;
                this.emit('playerMoved', playerId, position);
                return true;
            }
            return false;
        } catch (err) {
            console.error('Error updating player position:', err);
            return false;
        }
    }

    // Ship methods
    async updateShipState(shipId, state) {
        try {
            this.state.ships[shipId] = state;
            this.emit('shipUpdated', shipId, state);
            return true;
        } catch (err) {
            console.error('Error updating ship state:', err);
            return false;
        }
    }

    // Leaderboard methods
    async updateLeaderboard(leaderboardData) {
        try {
            // Ensure we're storing the complete leaderboard data structure
            const cleanLeaderboard = {
                leaderboard: leaderboardData.leaderboard ? leaderboardData.leaderboard.map(entry => ({
                    pair: entry.pair,
                    score: entry.score
                })) : []
            };
            
            this.state.leaderboard = cleanLeaderboard;
            this.emit('leaderboardUpdated', cleanLeaderboard);
            return true;
        } catch (err) {
            console.error('Error updating leaderboard:', err);
            return false;
        }
    }

    // Cleanup method
    async cleanup() {
        // Clear our event listeners
        this.removeAllListeners();
        return true;
    }

    // State reset method
    async clearState() {
        try {
            this.state = {
                players: {},
                ships: {},
                cargo: [],
                leaderboard: { leaderboard: [] },
                pair_instances: {}
            };
            console.log('Memory state cleared successfully');
            return true;
        } catch (err) {
            console.error('Error clearing memory state:', err);
            return false;
        }
    }

    // Pair code management
    async registerPairCode(pairCode) {
        try {
            this.state.pair_instances[pairCode] = this.instanceId;
            return true;
        } catch (err) {
            console.error('Error registering pair code:', err);
            return false;
        }
    }

    async removePairCode(pairCode) {
        try {
            delete this.state.pair_instances[pairCode];
            return true;
        } catch (err) {
            console.error('Error removing pair code:', err);
            return false;
        }
    }

    async getPairInstance(pairCode) {
        try {
            return this.state.pair_instances[pairCode] || null;
        } catch (err) {
            console.error('Error getting pair instance:', err);
            return null;
        }
    }

    async isPairCodeRegistered(pairCode) {
        try {
            return !!this.state.pair_instances[pairCode];
        } catch (err) {
            console.error('Error checking if pair code exists:', err);
            return false;
        }
    }
} 