'use strict';

require('react-hot-loader/patch');

var ReactHotLoader = require('react-hot-loader');
var React = require('react');
var ReactDOM = require('react-dom');

ReactDOM.render(
  React.createElement(ReactHotLoader.AppContainer, null, React.createElement(require('RWB_REACT_MAIN'))),
  document.getElementById(RWB_DOM_NODE_ID)
);

if (module.hot) {
  module.hot.accept('RWB_REACT_MAIN', function() {
    ReactDOM.render(
      React.createElement(ReactHotLoader.AppContainer, null, React.createElement(require('RWB_REACT_MAIN'))),
      document.getElementById(RWB_DOM_NODE_ID)
    );
  });
}
