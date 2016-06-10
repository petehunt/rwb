'use strict';

const index = {
  main() {
    require('./main');
  },

  validate(config) {
    return require('./webpack/validateConfig')(config);
  },
};

module.exports = index;
