'use strict';

var React = require('react');
var Router = require('react-router');

function accumulate(route, parents, state) {
  if (route.props.asyncHandler) {
    parents = parents.concat([route.props.asyncHandler]);
  }

  if (React.Children.count(route.props.children) === 0) {
    var name = route.props.name;
    if (!name) {
      name = '_anonymous_' + state.numAnonymousRoutes;
      state.numAnonymousRoutes++;
    }
    state.entrypoints[name] = parents;
  } else {
    React.Children.forEach(route.props.children, function(nextRoute) {
      accumulate(nextRoute, parents, state);
    });
  }
}

function getAsyncBundles(routerModule, routes) {
  var state = {
    entrypoints: {},
    numAnonymousRoutes: 0,
  };
  accumulate(routes, [routerModule], state);
  return state.entrypoints;
}

module.exports = getAsyncBundles;
