const path = require('path');

module.exports = {
  mode: 'development',
  output: {
    filename: 'index.js',
  },
  resolve: {
    fallback: {
      path: require.resolve('path-browserify'),
    },
  },  
  node: {
    __dirname:false
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [
          path.resolve(__dirname, './src/parser.js'),
          path.resolve(__dirname, './src/grammar.pegjs'),
          path.resolve(__dirname, './src/compiler.js'),
          path.resolve(__dirname, './compile.js')
        ]
      }
    ]
  },

};
