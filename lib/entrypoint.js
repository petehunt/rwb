'use strict';

var React = require('react');
var ReactDOM = require('react-dom');
var RWB = require('./RWB');

global.RWB = RWB;

ReactDOM.render(
  RWB.getRouter(),
  document.getElementById(RWB_DOM_NODE_ID)
);
