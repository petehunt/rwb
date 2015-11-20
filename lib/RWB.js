'use strict';

var React = require('react');
var ReactRouter = require('react-router').Router;
var createBrowserHistory = require('history/lib/createBrowserHistory');

var router = null;

var RWB = {
  getRouter: function() {
    if (!router) {
      // Lazily require() the routes because there may be circular dependencies.
      router = require('RWB_REACT_ROUTES');
    }

    return React.createElement(ReactRouter, {
      history: createBrowserHistory(),
    }, router);
  },
};

module.exports = RWB;
