const path = require('path');

module.exports = {
  mode: 'development',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, './dist'),

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
