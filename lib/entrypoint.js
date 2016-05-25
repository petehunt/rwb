'use strict';
/* global RWB */
/* eslint-env browser */

const React = require('react');
const ReactDOM = require('react-dom');
const Root = require('__rwb_root__');
const AppContainer = require('react-hot-loader').AppContainer;

const reactRoot = document.getElementById(RWB.DOM_NODE_ID);

ReactDOM.render(React.createElement(AppContainer, null, React.createElement(Root)), reactRoot);

if (module.hot) {
  module.hot.accept('__rwb_root__', () => {
    const NewRoot = require('__rwb_root__');
    ReactDOM.render(React.createElement(AppContainer, null, React.createElement(NewRoot)), reactRoot);
  });
}
