'use strict';

var React = require('react');

var getRouter = require('RWB_GET_ROUTER');

getRouter().run(function(Root) {
  React.render(
    React.createElement(Root),
    document.getElementById(RWB_DOM_NODE_ID)
  );
});
