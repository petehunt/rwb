'use strict';

const invariant = require('invariant');

const REQUIRED_EXTENSIONS = ['css', 'jpg', 'png', 'svg', 'js', 'json'];

function doesLoaderMatch(loaders, extension) {
  for (let i = 0; i < loaders.length; i++) {
    if (loaders[i].test.test('a.' + extension)) {
      return true;
    }
  }
  return false;
}

function validateConfig(webpackConfig) {
  // throw an exception if the correct loader extensions aren't configured
  invariant(webpackConfig.hasOwnProperty('module'), 'Missing `module` field');
  invariant(Array.isArray(webpackConfig.module.loaders), '`module.loaders` is not an array');
  invariant(webpackConfig.hasOwnProperty('resolve'), 'Missing `resolve` field');
  invariant(webpackConfig.resolve.hasOwnProperty('alias'), 'Missing `resolve.alias` field');
  invariant(webpackConfig.resolve.hasOwnProperty('extensions'), 'Missing `resolve.extensions` field');
  invariant(webpackConfig.resolve.extensions.indexOf('.js') > -1, '.js missing from `resolve.extensions`');
  invariant(webpackConfig.resolve.extensions.indexOf('.web.js') > -1, '.web.js missing from `resolve.extensions`');
  REQUIRED_EXTENSIONS.forEach(function(extension) {
    invariant(
      doesLoaderMatch(webpackConfig.module.loaders, extension),
      'You do not have a loader that handles files with the extension: %s',
      extension
    );
  });
}

module.exports = validateConfig;
