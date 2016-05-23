'use strict';

const index = {
  main() {
    require('./main');
  },

  validate(config) {
    const StandardWebpack = require('./StandardWebpack');
    return StandardWebpack.validate(config);
  },
};

module.exports = index;
