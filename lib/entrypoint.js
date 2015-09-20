'use strict';

var Routes = require('RWB_REACT_ROUTES');
var React = require('react');
var Router = require('react-router');

Router.run(Routes, Router.HistoryLocation, function(Root) {
  React.render(
    React.createElement(Root),
    document.getElementById(RWB_DOM_NODE_ID)
  );
});
