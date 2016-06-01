'use strict';

const validateConfig = require('../webpack/validateConfig');

const WebpackDevServer = require('webpack-dev-server');
const fs = require('fs-extra');
const path = require('path');
const temp = require('temp');
const webpack = require('webpack');

const utils = require('../utils');

exports.command = 'serve [port]';
exports.describe = 'Serve React component in a hot-reloading environment';

exports.builder = function(yargs) {
  return yargs
    .default('port', 3000)
    .default('entrypoint', null);
};

exports.handler = function serveHandler(argv) {
  const pkg = utils.loadProjectPkg();

  const RWB_PORT = process.env.RWB_PORT || parseInt(argv.port) || 3000;
  const RWB_PUBLIC_URL = process.env.RWB_PUBLIC_URL || `http://localhost:${RWB_PORT}/`;

  if (typeof pkg.data.rwb !== 'object') {
    console.error(
      `rwb key does not exist in: ${pkg.file}.`,
      'Did you forget to run `rwb init`?'
    );
    process.exit(1);
  }

  const mountPoint = utils.parseIDString(pkg.data.rwb.dom_node);

  temp.track();
  temp.mkdir('rwb-serve', function(err, dirPath) {
    utils.errGuard(err);

    const documentContents = [
      '<!doctype html>',
      '<meta charset="utf-8">',
      '<title>rwb</title>',
      utils.buildMountPoint(mountPoint),
      '<script src="/bundle.js"></script>',
    ].join('\n');

    fs.writeFileSync(
      path.join(dirPath, 'index.html'),
      documentContents,
      {encoding: 'utf8'}
    );

    const config = require('../webpack/generateConfig')('client');
    config.output.path = dirPath;
    config.output.publicPath = '/';

    validateConfig(config);

    const compiler = webpack(config);
    new WebpackDevServer(compiler, {
      contentBase: dirPath,
      publicPath: config.output.publicPath,
      hot: true,
      historyApiFallback: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    }).listen(RWB_PORT, function (err) {
      utils.errGuard(err);
      console.info('Serving', dirPath, 'at', RWB_PUBLIC_URL);
    });
  });
};
