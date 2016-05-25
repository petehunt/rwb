'use strict';

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

module.exports = {
  errGuard: errGuard,
  parseIDString: parseIDString,
  buildMountPoint: buildMountPoint,
};
