'use strict';

var React = require('react');
var ReactDOM = require('react-dom');
var RWB = require('./RWB');

global.RWB = RWB;

RWB.getRouter().run(function(Root) {
  ReactDOM.render(
    React.createElement(Root),
    document.getElementById(RWB_DOM_NODE_ID)
  );
});
