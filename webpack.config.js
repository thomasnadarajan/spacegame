const nodeExternals = require('webpack-node-externals')
const path = require('path')
const serverConfig = {
  entry: './src/server/server.js',
  externals: [nodeExternals()],
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'server.js',
  },
}
const clientConfig = {
  entry: './src/client/index.js',
  target: 'web',
  output: {
    path: path.resolve(__dirname, 'dist/client'),
    filename: 'client.js',
  },
}
module.exports = [serverConfig, clientConfig]