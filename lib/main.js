#!/usr/bin/env node
'use strict';

const packageJson = require('../package.json');

require('yargs')
  .usage('Usage: $0 <command> [options]')
  .command(require('./options/init.js'))
  .command(require('./options/serve.js'))
  .command(require('./options/static.js'))
  .command(require('./options/validate.js'))
  .epilogue(`See ${packageJson.homepage} for help.`)
  .demand(1)
  .strict().argv;
