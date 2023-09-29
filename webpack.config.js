const path = require('path');

module.exports = {
  mode: 'development',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, './dist'),

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
  // TODO: remove hardcoded path to global node modules
  resolve: {
    modules: [path.resolve(__dirname, './node_modules'), '/usr/local/lib/node_modules'],
  },
  

};
