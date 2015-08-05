'use strict';

var MyComponent = require('bundle!./MyComponent');
var React = require('react');
var {Route} = require('react-router');
var createAsyncRouteHandler = require('../lib/createAsyncRouteHandler');

module.exports = <Route handler={createAsyncRouteHandler(MyComponent)} />;
