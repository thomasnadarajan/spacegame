import Redis from 'ioredis';
import { player } from '../shared/player';
import { ship } from '../shared/ship';
import { cargo } from '../shared/cargo';
import { leaderboard } from '../shared/leaderboard';
import fs from 'fs';
import path from 'path';

export class RedisManager {
    constructor() {
        try {
            // Load environment variables from .env file
            this.loadEnvFromFile();
            
            // Debug logging
            console.log('Initializing Redis Manager...');
            console.log('Environment variables:', {
                REDIS_ENDPOINT: process.env.REDIS_ENDPOINT,
                REDIS_PORT: process.env.REDIS_PORT,
                NODE_ENV: process.env.NODE_ENV
            });
            
            // Use environment variables - no hardcoded fallback
            const redisConfig = {
                host: process.env.REDIS_ENDPOINT,
                port: parseInt(process.env.REDIS_PORT || '6379'),
                connectTimeout: 30000,
                commandTimeout: 10000,
                retryStrategy: (times) => {
                    console.log(`Redis retry attempt ${times}`);
                    return Math.min(times * 500, 15000);
                },
                maxRetriesPerRequest: 10,
                enableOfflineQueue: true,
                reconnectOnError: (err) => {
                    const targetError = 'READONLY';
                    if (err.message.includes(targetError)) {
                        return true;
                    }
                    return false;
                }
            };
            
            console.log('Connecting to Redis with config:', JSON.stringify(redisConfig, null, 2));
            
            // Create Redis connections
            this.redis = new Redis(redisConfig);
            this.pubsub = new Redis(redisConfig);
            
            // Handle connection events
            this.redis.on('error', (err) => {
                console.error('Redis connection error:', err);
            });
            
            this.redis.on('connect', () => {
                console.log('Successfully connected to Redis');
            });
            
            this.redis.on('ready', () => {
                console.log('Redis client is ready');
            });
            
            // Generate a unique instance ID
            this.instanceId = Math.random().toString(36).substring(7);
            console.log('Redis Manager initialized with instance ID:', this.instanceId);
        } catch (error) {
            console.error('Error initializing Redis Manager:', error);
        }
    }

    async handleMessage(channel, message) {
        if (channel === 'game:state:update') {
            try {
                const update = JSON.parse(message);
                switch (update.type) {
                    case 'player:move':
                        await this.updatePlayerPosition(update.playerId, update.position);
                        break;
                    case 'ship:update':
                        await this.updateShipState(update.shipId, update.state);
                        break;
                    case 'game:sync':
                        await this.handleGameSync(update.state);
                        break;
                }
            } catch (err) {
                console.error('Error handling Redis message:', err);
            }
        }
    }

    async handleGameSync(state) {
        try {
            // Convert objects to Redis-compatible format
            const playerPromises = Object.entries(state.players).map(([id, data]) => 
                this.redis.hset('players', id, JSON.stringify(data))
            );
            
            const shipPromises = Object.entries(state.ships).map(([id, data]) => 
                this.redis.hset('ships', id, JSON.stringify(data))
            );

            await Promise.all([
                ...playerPromises,
                ...shipPromises,
                this.redis.set('cargo', JSON.stringify(state.cargo)),
                this.redis.set('leaderboard', JSON.stringify(state.leaderboard))
            ]);
        } catch (err) {
            console.error('Error syncing game state:', err);
        }
    }

    async getGameState() {
        try {
            const [players, ships, cargo, leaderboardData] = await Promise.all([
                this.redis.hgetall('players') || {},
                this.redis.hgetall('ships') || {},
                this.redis.get('cargo').then(data => JSON.parse(data || '[]')),
                this.redis.get('leaderboard').then(data => JSON.parse(data || '{}'))
            ]);

            return {
                players: Object.entries(players).reduce((acc, [id, data]) => {
                    try {
                        acc[id] = JSON.parse(data);
                    } catch (e) {
                        console.error('Error parsing player data:', e);
                        acc[id] = {};
                    }
                    return acc;
                }, {}),
                ships: Object.entries(ships).reduce((acc, [id, data]) => {
                    try {
                        acc[id] = JSON.parse(data);
                    } catch (e) {
                        console.error('Error parsing ship data:', e);
                        acc[id] = {};
                    }
                    return acc;
                }, {}),
                cargo,
                leaderboard: leaderboardData
            };
        } catch (err) {
            console.error('Error getting game state:', err);
            return {
                players: {},
                ships: {},
                cargo: [],
                leaderboard: {}
            };
        }
    }

    async updateGameState(state) {
        try {
            // Publish the update to all instances
            await this.redis.publish('game:state:update', JSON.stringify({
                type: 'game:sync',
                state
            }));

            // Update the state in Redis
            await this.handleGameSync(state);
        } catch (err) {
            console.error('Error updating game state:', err);
        }
    }

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
            
            // Store the clean data in Redis
            await this.redis.hset('players', playerId, JSON.stringify(cleanPlayerData));
            
            // Publish the clean data
            await this.redis.publish('game:state:update', JSON.stringify({
                type: 'player:join',
                playerId,
                playerData: cleanPlayerData
            }));
        } catch (err) {
            console.error('Error adding player:', err);
            throw err;
        }
    }

    async removePlayer(playerId) {
        try {
            await this.redis.hdel('players', playerId);
            await this.redis.publish('game:state:update', JSON.stringify({
                type: 'player:leave',
                playerId
            }));
        } catch (err) {
            console.error('Error removing player:', err);
        }
    }

    async updatePlayerPosition(playerId, position) {
        try {
            const playerData = await this.redis.hget('players', playerId);
            if (playerData) {
                const player = JSON.parse(playerData);
                player.position = position;
                await this.redis.hset('players', playerId, JSON.stringify(player));
                
                // Notify other instances about the position update
                await this.redis.publish('game:state:update', JSON.stringify({
                    type: 'player:move',
                    playerId,
                    position
                }));
            }
        } catch (err) {
            console.error('Error updating player position:', err);
        }
    }

    async updateShipState(shipId, state) {
        await this.redis.hset('ships', shipId, JSON.stringify(state));
    }

    async updateLeaderboard(leaderboardData) {
        try {
            // Ensure we're storing the complete leaderboard data structure
            const cleanLeaderboard = {
                leaderboard: leaderboardData.leaderboard ? leaderboardData.leaderboard.map(entry => ({
                    pair: entry.pair,
                    score: entry.score
                })) : []
            };
            
            await this.redis.set('leaderboard', JSON.stringify(cleanLeaderboard));
            
            // Publish leaderboard update
            await this.redis.publish('game:state:update', JSON.stringify({
                type: 'leaderboard:update',
                data: cleanLeaderboard
            }));
        } catch (err) {
            console.error('Error updating leaderboard:', err);
        }
    }

    async cleanup() {
        try {
            await this.redis.quit();
            await this.pubsub.quit();
        } catch (err) {
            console.error('Error cleaning up Redis connections:', err);
        }
    }

    async clearState() {
        try {
            // Clear all game-related keys
            await Promise.all([
                this.redis.del('players'),
                this.redis.del('ships'),
                this.redis.del('cargo'),
                this.redis.del('leaderboard'),
                this.redis.del('pair_instances')  // Add this to clear pair mappings
            ]);
            console.log('Redis state cleared successfully');
        } catch (err) {
            console.error('Error clearing Redis state:', err);
        }
    }

    // Add new methods for pair code management
    async registerPairCode(pairCode) {
        try {
            await this.redis.hset('pair_instances', pairCode, this.instanceId);
        } catch (err) {
            console.error('Error registering pair code:', err);
        }
    }

    async removePairCode(pairCode) {
        try {
            await this.redis.hdel('pair_instances', pairCode);
        } catch (err) {
            console.error('Error removing pair code:', err);
        }
    }

    async getPairInstance(pairCode) {
        try {
            return await this.redis.hget('pair_instances', pairCode);
        } catch (err) {
            console.error('Error getting pair instance:', err);
            return null;
        }
    }

    loadEnvFromFile() {
        try {
            // Check for .env file in current directory
            const envPath = path.resolve(process.cwd(), '.env');
            if (fs.existsSync(envPath)) {
                console.log(`Found .env file at ${envPath}`);
                const envContent = fs.readFileSync(envPath, 'utf8');
                const envVars = envContent.split('\n');
                
                envVars.forEach(line => {
                    const parts = line.split('=');
                    if (parts.length === 2) {
                        const key = parts[0].trim();
                        const value = parts[1].trim();
                        if (!process.env[key]) {
                            process.env[key] = value;
                            console.log(`Set environment variable from .env: ${key}=${value}`);
                        }
                    }
                });
            } else {
                console.log('No .env file found');
            }
        } catch (error) {
            console.error('Error loading .env file:', error);
        }
    }
} 