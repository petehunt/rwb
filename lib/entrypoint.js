'use strict';

var Routes = require('./asyncRouteLoader!REACT_ROUTES');
var React = require('react');
var Router = require('react-router');

Router.run(Routes, function(Root) {
  React.render(
    React.createElement(Root),
    document.getElementById('.react-root')
  );
});
