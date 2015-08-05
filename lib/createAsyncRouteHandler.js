'use strict';

var assign = require('object-assign');

var React = require('react');
var Router = require('react-router');

var RouteHandler = Router.RouteHandler;

function createAsyncRouteHandler(bundle, loadingHandler) {
  return React.createClass({
    loadedComponentClass: null,

    render: function() {
      // TODO: this is so dumb
      var props = assign({}, this.props, {
        activeRoute: React.createElement(RouteHandler)
      });

      return React.createElement(
        this.constructor.loadedComponentClass || loadingHandler || 'noscript',
        props
      );
    },

    componentDidMount: function() {
      if (!this.constructor.loadedComponentClass) {
        bundle(function(componentClass) {
          this.constructor.loadedComponentClass = componentClass;
          this.forceUpdate();
        }.bind(this));
      }
    },
  });
}

module.exports = createAsyncRouteHandler;
