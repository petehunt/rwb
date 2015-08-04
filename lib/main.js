#!/usr/bin/env node
'use strict';

var Workflows = require('./Workflows');

var argv = require('yargs').argv;

var command = argv._[0];
if (!command) {
  console.error('No command provided.\nSee https://github.com/petehunt/react-cli for help.');
  process.exit(1);
}
if (!Workflows.hasOwnProperty(command)) {
  console.error(
    'Invalid command: ' + command + ' (acceptable commands: ' + Object.keys(Workflows).join(', ') + ')' +
      '\nSee https://github.com/petehunt/react-cli for help.'
  );
  process.exit(1);
}

Workflows[command](argv._.slice(1));
