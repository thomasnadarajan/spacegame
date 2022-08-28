const nodeExternals = require('webpack-node-externals')
const path = require('path')
const clientConfig = {
  entry: './src/client/index.js',
  target: 'web',
  output: {
    path: path.resolve(__dirname, 'src/client/serve'),
    filename: 'client.js',
  },
}
module.exports = [clientConfig]