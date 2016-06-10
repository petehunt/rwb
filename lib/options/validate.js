'use strict';

const path = require('path');
const fs = require('fs');

const validateConfig = require('../webpack/validateConfig');

exports.command = 'validate <config>',
exports.describe = 'Validate a webpack config file',

exports.builder = function builder(yargs) {
  return yargs.demand(2, 'You must specify a path to the webpack config file you want to validate.');
};

exports.handler = function validateHandler(argv) {
  const configFile = path.resolve(argv.config);

  if (!fs.existsSync(configFile)) {
    console.error(configFile, 'does not exist.');
    process.exit(1);
  }

  validateConfig(require(configFile));
};
