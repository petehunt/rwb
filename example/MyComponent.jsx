'use strict';

var React = require('react');

require('./MyComponent.css');

var MyComponent = React.createClass({
  render: function() {
    return (
      <div className="MyComponent">Hello, world!</div>
    );
  },
});

module.exports = MyComponent;
