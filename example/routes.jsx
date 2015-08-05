'use strict';

var React = require('react');
var {DefaultRoute, Route} = require('react-router');

module.exports = (
  <Route>
    <DefaultRoute asyncHandler="./MyComponent" />
    <Route path="/one" asyncHandler="./MyComponent" />
    <Route path="/two" asyncHandler="./MyOtherComponent" />
  </Route>
);
