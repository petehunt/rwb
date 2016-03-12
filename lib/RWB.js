'use strict';

var React = require('react');
var Router = require('react-router');

var router = null;

var RWB = {
  getRouter: function() {
    if (!router) {
      // Lazily require() the routes because there may be circular dependencies.
      // TODO: RWB_NO_HISTORY
      var history = RWB_NO_HISTORY ? Router.createMemoryHistory('/') : Router.browserHistory;
      router = React.createElement(Router.Router, {history: history}, require('RWB_REACT_ROUTES'));
    }
    return router;
  },
};

module.exports = RWB;
