'use strict';

const index = {
  main() {
    require('./main');
  },

  validate(config) {
    const validateConfig = require('./webpack/validateConfig');
    return validateConfig(config);
  },
};

module.exports = index;
