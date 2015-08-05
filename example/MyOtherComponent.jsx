'use strict';

var React = require('react');

require('./MyComponent.css');

var MyComponent = React.createClass({
  render: function() {
    return (
      <div className="MyComponent">Goodbye world!</div>
    );
  },
});

module.exports = MyComponent;
