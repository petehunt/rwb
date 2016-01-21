'use strict';

import React from 'react';

import styles from './MyComponent.css';

const MyComponent = React.createClass({
  getInitialState: () => ({
    timesClicked: 0,
  }),

  handleClick: function() {
    this.setState({timesClicked: this.state.timesClicked + 1});
  },

  render: function(){
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
  }
});

export default MyComponent;
