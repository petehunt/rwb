'use strict';

var React = require('react');
var RWB = require('./RWB');

global.RWB = RWB;

RWB.getRouter().run(function(Root) {
  React.render(
    React.createElement(Root),
    document.getElementById(RWB_DOM_NODE_ID)
  );
});
