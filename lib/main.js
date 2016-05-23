#!/usr/bin/env node
'use strict';

const Workflows = require('./Workflows');
const packageJson = require('../package.json');
const {argv} = require('yargs');

const command = argv._[0];
if (!command) {
  console.error(`No command provided.\nSee ${packageJson.homepage} for help.`);
  process.exit(1);
}

if (!Workflows.hasOwnProperty(command)) {
  console.error(
    `Invalid command: ${command} (acceptable commands: ${Object.keys(Workflows).join(', ')})` +
    `\nSee ${packageJson.homepage} for help.`
  );
  process.exit(1);
}

Workflows[command](argv._.slice(1));
