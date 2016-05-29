'use strict';

const fs = require('fs-extra');
const path = require('path');

function errGuard(err) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
}

function parseIDString(str) {
  str = str || '#.rwb';

  const bits = str.split('#');
  if (bits.length !== 2 || bits[1] === '') {
    errGuard('rwb.dom_node can only be a valid ID (e.g. `#react-stuff`)');
  }

  if (bits[0] === '') {
    bits[0] = 'div';
  } else if (~['div', 'span'].indexOf(bits[0])) {
    errGuard(`Element can only be a div or a span (got ${bits[0]})`);
  }

  return bits;
}

function buildMountPoint(arr) {
  if (!Array.isArray(arr) || arr.length !== 2) {
    errGuard('buildMountPoint expects a two-element array, homie');
  }
  return `<${arr[0]} id="${arr[1]}"></${arr[0]}>`;
}

function loadProjectPkg() {
  const projectRoot = process.cwd();
  const packageJsonFile = path.join(projectRoot, 'package.json');

  if (!fs.existsSync(packageJsonFile)) {
    throw new Error(packageJsonFile, 'does not exist.');
  }

  const packageJsonData = fs.readJsonSync(packageJsonFile);

  if (typeof packageJsonData.rwb !== 'object') {
    throw new Error(
      `rwb key does not exist in ${packageJsonFile}. ` +
      'Did you forget to run `rwb init`?'
    );
  }

  if (!packageJsonData.rwb.main) {
    throw new Error(
      `'rwb.main' key needs to be set to a module path (in ${packageJsonFile}). ` +
      'Have you run `rwb init` yet?'
    );
  }

  return {
    file: packageJsonFile,
    data: packageJsonData,
  };
}

module.exports = {
  errGuard: errGuard,
  parseIDString: parseIDString,
  buildMountPoint: buildMountPoint,
  loadProjectPkg: loadProjectPkg,
};
