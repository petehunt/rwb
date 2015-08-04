'use strict';

var invariant = require('invariant');

var REQUIRED_EXTENSIONS = ['css', 'jpg', 'png', 'svg', 'jsx'];

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
    invariant(webpackConfig.hasOwnProperty('module'), 'Mising `module` field');
    invariant(Array.isArray(webpackConfig.module.loaders), '`module.loaders` is not an array');
    invariant(webpackConfig.hasOwnProperty('resolve'), 'Missing `resolve` field');
    invariant(webpackConfig.resolve.hasOwnProperty('alias'), 'Missing `alias` field');
    invariant(webpackConfig.resolve.alias.hasOwnProperty('react'), 'You must add a `resolve.alias.react` field');
    REQUIRED_EXTENSIONS.forEach(function(extension) {
      var loaders = webpackConfig.module.loaders;
      invariant(
        doesLoaderMatch(webpackConfig.module.loaders, extension),
        'You do not have a loader that handles files with the extension: %s',
        extension
      );
    });
  },

  shim: function() {
    require('babel/register')({
      stage: 1,
    });
    REQUIRED_EXTENSIONS.forEach(function(extension) {
      var key = '.' + extension;
      require.extensions[key] = require.extensions[key] || noopRequire;
    });
  },
};

module.exports = StandardWebpack;
