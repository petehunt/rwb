'use strict';

const validateConfig = require('../webpack/validate-config');

const WebpackDevServer = require('webpack-dev-server');
const fs = require('fs-extra');
const path = require('path');
const temp = require('temp');
const webpack = require('webpack');

const utils = require('../utils');

function serveHandler(argv) {
  const projectRoot = process.cwd();
  const pkg = utils.loadPkg(projectRoot);

  const RWB_PORT = parseInt(argv.port) || process.env.RWB_PORT || 3000;
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

    const config = require('../webpack/generate-config')('client');
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
}

module.exports = {
  command: 'serve [port]',
  describe: 'Serve React component in a hot-reloading environment',
  builder: {},
  handler: serveHandler,
};
