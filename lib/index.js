'use strict';

var index = {
  main: function() {
    require('./main');
  },

  validate: function(config) {
    var StandardWebpack = require('./StandardWebpack');

    return StandardWebpack.validate(config);
  },
};

module.exports = index;
