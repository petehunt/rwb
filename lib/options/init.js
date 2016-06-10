'use strict';

const fs = require('fs-extra');
const path = require('path');
const readlineSync = require('readline-sync');

const rwbPackageJson = require('../../package.json');

exports.command = 'init [destination]';
exports.describe = 'Create a new minimally configured project';

exports.builder = function(yargs) {
  return yargs
    .default('destination', process.cwd());
};

exports.handler = function initHandler(argv) {
  const fileDest = path.resolve(argv.destination);
  const packageJsonFile = path.join(fileDest, 'package.json');

  if (!fs.existsSync(packageJsonFile)) {
    console.error(packageJsonFile, 'does not exist. Did you forget to run `npm init`?');
    process.exit(1);
  }

  const packageJsonData = fs.readJsonSync(packageJsonFile);

  packageJsonData.dependencies = packageJsonData.dependencies || {};
  packageJsonData.devDependencies = packageJsonData.devDependencies || {};
  packageJsonData.keywords = packageJsonData.keywords || [];

  packageJsonData.dependencies.react = packageJsonData.dependencies.react || rwbPackageJson.dependencies.react;
  packageJsonData.dependencies['react-dom'] = packageJsonData.dependencies['react-dom'] || rwbPackageJson.dependencies['react-dom'];

  packageJsonData.devDependencies.rwb = packageJsonData.devDependencies.rwb || rwbPackageJson.version;

  if (packageJsonData.keywords.indexOf('react') === -1) {
    packageJsonData.keywords.push('react');
  }

  packageJsonData.scripts = packageJsonData.scripts || {};
  if (!packageJsonData.scripts.start) {
    packageJsonData.scripts.start = 'rwb serve';
  }

  const demoComponent = path.resolve(__dirname, '..', 'template/MyComponent.js');
  const demoCSS = path.resolve(__dirname, '..', 'template/MyComponent.css');

  const copyFiles = readlineSync.question('Copy demo component to your project folder? [Y/n]: ', {defaultInput: 'y'}) === 'y';
  if (copyFiles) {
    try {
      fs.copySync(demoComponent, path.join(fileDest, 'MyComponent.js'), {clobber: false});
      fs.copySync(demoCSS, path.join(fileDest, 'MyComponent.css'), {clobber: false});

      packageJsonData.rwb = packageJsonData.rwb || {};
      packageJsonData.rwb.main = packageJsonData.rwb.main || './MyComponent.js';
    } catch (err) {
      console.error('Error copying files.');
    }
  }

  fs.writeJsonSync(packageJsonFile, packageJsonData);

  console.info('Project created. Don\u2019t forget to run `npm install` since some dependencies may have changed.');
};
