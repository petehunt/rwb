'use strict';

const index = {
  main() {
    require('./main');
  },

  validate(config) {
    const validateConfig = require('./webpack/validate-config');
    return validateConfig(config);
  },
};

module.exports = index;
