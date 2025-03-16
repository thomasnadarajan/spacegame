module.exports = {
  apps: [{
    name: 'spacegame',
    script: './src/server/server.js',
    interpreter: 'node',
    interpreter_args: '-r esm',
    env: {
      NODE_ENV: 'production',
      PORT: 8081
    }
  }]
} 