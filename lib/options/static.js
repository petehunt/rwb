'use strict';

const StandardWebpack = require('../webpack/validate-config');

const fs = require('fs-extra');
const path = require('path');
const readlineSync = require('readline-sync');
const webpack = require('webpack');
const webpackRequire = require('webpack-require');

const utils = require('../utils');

function staticHandler(argv) {
  const projectRoot = process.cwd();
  const fileDest = path.resolve(argv.destination);
  const pkg = utils.loadPkg(projectRoot);

  if (!pkg.data.rwb.static_generator) {
    console.info('Looks like this is your first time running `rwb static`.');
    const doIt = readlineSync.question('Copy static generator to your project folder? [Y/n]: ', {defaultInput: 'y'}) === 'y';
    if (doIt) {
      fs.copySync(
        path.resolve(__dirname, '..', 'template/render-static-page.js'),
        path.join(projectRoot, 'render-static-page.js'),
        {clobber: false}
      );
      pkg.data.rwb = pkg.data.rwb || {};
      pkg.data.rwb.static_generator = './render-static-page.js';

      // Update package.json
      fs.writeJsonSync(pkg.file, pkg.data);

      console.info('Copied render-static-page.js to project folder.');

      process.exit(0);
    } else {
      console.error(`'rwb.static_generator' key is not set in ${pkg.file}.`);
      process.exit(1);
    }
  }

  const mountPoint = utils.parseIDString(pkg.data.rwb.dom_node);

  if (!fs.existsSync(fileDest)) {
    fs.mkdirSync(fileDest);
  }

  let assetPath = '/';
  if (process.env.RWB_PUBLIC_PATH) {
    // webpack assumes output.publicPath has a trailing slash
    assetPath = path.join(path.resolve('/', process.env.RWB_PUBLIC_PATH), '/');
  }

  const config = require('../webpack/generate-config')('server');
  config.output.path = path.join(fileDest, assetPath);
  config.output.publicPath = assetPath;

  StandardWebpack.validate(config);

  webpack(config).run(function(err, stats) {
    utils.errGuard(err);
    console.info(stats.toString());

    const statsObj = stats.toJson();
    const assets = {
      css: [],
      js: [],
    };

    if (statsObj.assetsByChunkName && Array.isArray(statsObj.assetsByChunkName.main)) {
      statsObj.assetsByChunkName.main.forEach(function(f) {
        const ext = path.extname(f).replace(/^\./, '');
        const asset = path.join(statsObj.publicPath || '/', f);
        if (ext === '') {
          assets['misc'] = assets['misc'] || [];
          assets['misc'].push(asset);
        } else {
          assets[ext] = assets[ext] || [];
          assets[ext].push(asset);
        }
      });
    }

    webpackRequire(
      config,
      path.join(projectRoot, pkg.data.rwb.static_generator),
      ['fs'],
      {
        console,
        RWB: {
          DOM_NODE_ID: mountPoint[1],
          DOM_NODE_ELEMENT: mountPoint[0],
          PROJECT_ROOT: projectRoot,
          STATIC_ROOT: path.resolve(projectRoot, fileDest),
          ASSETS: assets,
          STATS: statsObj,
        },
      },
      function(err, factory) {
        utils.errGuard(err);
        factory()();
      }
    );
  });
}

module.exports = {
  command: 'static [destination]',
  describe: 'Static render React component to provided directory',
  builder: {
    destination: {
      default: 'dist',
    },
  },
  handler: staticHandler,
};
