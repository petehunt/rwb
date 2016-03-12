'use strict';

var React = require('react');
var Router = require('react-router');

var history = null;
var router = null;

var RWB = {
  getHistory: function() {
    if (!history) {
      history = RWB_NO_HISTORY ? Router.createMemoryHistory('/') : Router.browserHistory;
    }
    return history;
  },

  getRouter: function() {
    if (!router) {
      // Lazily require() the routes because there may be circular dependencies.
      router = React.createElement(Router.Router, {history: RWB.getHistory()}, require('RWB_REACT_ROUTES'));
    }
    return router;
  },
};

module.exports = RWB;
