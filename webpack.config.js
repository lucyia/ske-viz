/* This webpack config is based on https://github.com/krasimir/webpack-library-starter */

const webpack = require('webpack');
const UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
const path = require('path');
const env = require('yargs').argv.env; // use --env with webpack 2

let libraryName = 'ske-viz';

let plugins = [];
let outputFile;
let entryPoints;

if (env === 'build') {
  plugins.push(new UglifyJsPlugin({ minimize: true }));

  outputFile = libraryName + '.min.js';

  entryPoints = [
    __dirname + '/src/index.js'
  ];

} else {
  outputFile = libraryName + '.js';

  // for devel include demo
  entryPoints = [
    'webpack-dev-server/client?http://localhost:8080',
    __dirname + '/demo',
    __dirname + '/src/index.js'
  ];
}

const config = {
  context: __dirname,
  entry: entryPoints,
  devtool: 'source-map',
  devServer: {
    contentBase: './',
    inline: true
  },
  output: {
    path: __dirname + '/build',
    filename: outputFile,
    library: libraryName,
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    rules: [
      {
        test: /(\.js)$/,
        loader: 'babel-loader',
        exclude: /(node_modules|bower_components)/
      },
      {
        test: /(\.js)$/,
        loader: 'eslint-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    modules: [
      path.resolve('./demo'),
      path.resolve('./src'),
      path.resolve('./node_modules')
    ],
    extensions: ['.json', '.js']
  },
  plugins: plugins
};

module.exports = config;
