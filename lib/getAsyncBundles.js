'use strict';

var React = require('react');

function accumulate(route, path, parentHandlers, entrypoints) {
  if (route.props.asyncHandler) {
    parentHandlers = parentHandlers.concat([route.props.asyncHandler]);
  }
  if (route.props.path) {
    path += (route.props.path[0] === '/' ? '' : '/') + route.props.path;
  }

  if (route.type.name === 'DefaultRoute') {
    path += '/';
  }

  if (React.Children.count(route.props.children) === 0) {
    var name = route.props.name || path;
    entrypoints['route:' + name] = parentHandlers;
  } else {
    React.Children.forEach(route.props.children, function(nextRoute) {
      accumulate(nextRoute, path, parentHandlers, entrypoints);
    });
  }
}

function getAsyncBundles(routerModule, routes) {
  var entrypoints = {};
  accumulate(routes, '', [routerModule], entrypoints);
  return entrypoints;
}

module.exports = getAsyncBundles;
