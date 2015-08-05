'use strict';

var recast = require('recast');

function asyncRouteLoader(source) {
  this.cacheable();
  return source;
}

module.exports = asyncRouteLoader;
