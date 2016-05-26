'use strict';

const index = {
  main() {
    require('./main');
  },

  validate(config) {
    const StandardWebpack = require('./webpack/validate-config');
    return StandardWebpack.validate(config);
  },
};

module.exports = index;
