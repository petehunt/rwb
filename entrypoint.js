'use strict';

var ComponentEntrypoint = require({{ entrypoint }});
var React = require('react');

React.render(
  React.createElement(ComponentEntrypoint),
  document.getElementById('.react-root')
);
