'use strict';

var MyComponent = require('./MyComponent');
var React = require('react');
var {Route} = require('react-router');

module.exports = <Route path="/" component={MyComponent} />;
