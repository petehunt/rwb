'use strict';

var Router = require('react-router');

var router = null;

function getRouter() {
  if (!router) {
    // Lazily require() the routes because there may be circular dependencies.
    router = Router.create({
      routes: require('RWB_REACT_ROUTES'),
      location: Router.HistoryLocation,
    });
  }
  return router;
}

module.exports = getRouter;
