'use strict';

const React = require('react');

const styles = require('./MyComponent.css');

const MyComponent = React.createClass({
  getInitialState() {
    return {timesClicked: 0};
  },

  handleClick() {
    this.setState({timesClicked: this.state.timesClicked + 1});
  },

  render(){
    const colors = [
      'red', 'green', 'blue', 'violet',
    ];

    return (
      <button
        style={{
          color: colors[this.state.timesClicked % colors.length],
        }}
        onClick={this.handleClick}
        className={styles.MyComponent}>Hello, world!</button>
    );
  },
});

module.exports = MyComponent;
