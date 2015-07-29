#!/usr/bin/env node
'use strict';

var Workflows = require('./Workflows');

var argv = require('yargs').argv;
var invariant = require('invariant');

var command = argv._[0];
invariant(command, 'A command was not provided');
invariant(
  Workflows.hasOwnProperty(command),
  'Invalid command: %s (acceptable commands: %s)',
  command,
  Object.keys(Workflows).join(', ')
);

Workflows[command](argv._.slice(1));
