'use strict';

const path = require('path');
const fs = require('fs');

const validateConfig = require('../webpack/validate-config');

function validateHandler(argv) {
  const configFile = path.resolve(argv.config);

  if (!fs.existsSync(configFile)) {
    console.error(configFile, 'does not exist.');
    process.exit(1);
  }

  validateConfig(require(configFile));
}

module.exports = {
  command: 'validate <config>',
  describe: 'Validate a webpack config file',
  builder: function(yargs) {
    return yargs.demand(2, 'You must specify a path to the webpack config file you want to validate.');
  },
  handler: validateHandler,
};
