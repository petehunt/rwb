#!/usr/bin/env node
'use strict';

const packageJson = require('../package.json');
const Workflows = require('./Workflows');
const workflowCommands = Object.keys(Workflows);
const yargs = require('yargs');

const argv = yargs
  .usage('Usage: $0 <command> [options]')
  .demand(1, 'Available commands: ' + Object.keys(Workflows).join(', '))
  .epilogue(`See ${packageJson.homepage} for help.`)
  .check(function(_argv) {
    if (_argv._[0] && !!~workflowCommands.indexOf(_argv._[0])) {
      return true;
    }
    throw new Error(`'${_argv._[0]}' is not a valid option! Available commands: ${workflowCommands.join(', ')}`);
  })
  .argv;

Workflows[argv._[0]](argv._.slice(1));
