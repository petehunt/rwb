'use strict';

var invariant = require('invariant');

var REQUIRED_EXTENSIONS = ['css', 'jpg', 'png', 'svg'];

function doesLoaderMatch(loaders, extension) {
  for (var i = 0; i < loaders.length; i++) {
    if (loaders[i].test.test('a.' + extension)) {
      return true;
    }
  }
  return false;
}

function noopRequire(module, filename) {
  module._compile('', filename);
}

var StandardWebpack = {
  validate: function(webpackConfig) {
    // throw an exception if the correct loader extensions aren't configured
    invariant(webpackConfig.hasOwnProperty('module'), 'webpackConfig is mising a module field');
    invariant(Array.isArray(webpackConfig.module.loaders), 'module.loaders is not an array');
    REQUIRED_EXTENSIONS.forEach(function(extension) {
      var loaders = webpackConfig.module.loaders;
      invariant(
        doesLoaderMatch(webpackConfig.module.loaders, extension),
        'You do not have a loader that handles files with the extension: %s',
        extension
      );
    });
  },

  create: function(entry) {
    // create and validate a minimal webpack config
    return {
      entry: entry,
      output: {
        filename: 'admin.js'
      },
      module: {
        loaders: [
          { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'},
          { test: /\.css$/, loader: 'style-loader!css-loader!autoprefixer-loader' },
          { test: /\.(png|jpg|svg)$/, loader: 'url-loader?limit=8192'},
        ]
      },
    };
  },

  shim: function() {
    require('babel/register');
    REQUIRED_EXTENSIONS.forEach(function(extension) {
      require.extensions['.' + extension] = noopRequire;
    });
  },
};

module.exports = StandardWebpack;
