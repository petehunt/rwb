'use strict';

var Router = require('react-router');

var router = null;

var RWB = {
  getRouter: function() {
    if (!router) {
      // Lazily require() the routes because there may be circular dependencies.
      router = Router.create({
        routes: require('RWB_REACT_ROUTES'),
        location: RWB_NO_HISTORY ? undefined : Router.HistoryLocation,
      });
    }
    return router;
  },
};

module.exports = RWB;
