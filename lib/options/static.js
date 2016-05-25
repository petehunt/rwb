'use strict';

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const StandardWebpack = require('../StandardWebpack');

const fs = require('fs-extra');
const path = require('path');
const readlineSync = require('readline-sync');
const webpack = require('webpack');
const webpackRequire = require('webpack-require');

const utils = require('../utils');

const NODE_ENV = process.env.NODE_ENV || 'production';

const postCSSPlugins = [
  require('autoprefixer'),
];

function staticHandler(argv) {
  const DISABLE_CACHEBUSTER = !!JSON.parse(process.env.RWB_DISABLE_CACHEBUSTER || 'false');

  const projectRoot = process.cwd();
  const packageJsonFile = path.join(projectRoot, 'package.json');

  if (!fs.existsSync(packageJsonFile)) {
    console.error(packageJsonFile, 'does not exist.');
    process.exit(1);
  }

  if (!argv.destination) {
    console.error('You must provide a destination directory.');
    process.exit(1);
  }

  const fileDest = path.resolve(argv.destination);

  const packageJsonData = fs.readJsonSync(packageJsonFile);

  if (typeof packageJsonData.rwb !== 'object') {
    console.error(
      `rwb key does not exist in ${packageJsonFile}.`,
      'Did you forget to run `rwb init`?'
    );
    process.exit(1);
  }

  if (!packageJsonData.rwb.static_generator) {
    console.info('Looks like this is your first time running `rwb static`.');
    const doIt = readlineSync.question('Copy static generator to your project folder? [Y/n]: ', {defaultInput: 'y'}) === 'y';
    if (doIt) {
      fs.copySync(
        path.resolve(__dirname, '..', 'template/render-static-page.js'),
        path.join(projectRoot, 'render-static-page.js'),
        {clobber: false}
      );
      packageJsonData.rwb = packageJsonData.rwb || {};
      packageJsonData.rwb.static_generator = './render-static-page.js';

      // Update package.json
      fs.writeJsonSync(packageJsonFile, packageJsonData);

      console.info('Copied render-static-page.js to project folder.');

      process.exit(0);
    } else {
      console.error(`'rwb.static_generator' key is not set in ${packageJsonFile}.`);
      process.exit(1);
    }
  }

  const rootComponentPath = path.join(projectRoot, packageJsonData.rwb.main);
  const mountPoint = utils.parseIDString(packageJsonData.rwb.dom_node);

  if (!packageJsonData.rwb.main) {
    console.error(
      `'rwb.main' key needs to be set to a module path (in ${packageJsonFile}).`
    );
    process.exit(1);
  }

  if (!fs.existsSync(fileDest)) {
    fs.mkdirSync(fileDest);
  }

  const moduleRequireRoots = [
    path.join(projectRoot, 'node_modules'),
    path.resolve(__dirname, '../../node_modules'),
  ];

  let assetPath = '/';
  if (process.env.RWB_PUBLIC_PATH) {
    // webpack assumes output.publicPath has a trailing slash
    assetPath = path.join(path.resolve('/', process.env.RWB_PUBLIC_PATH), '/');
  }

  const config = {
    entry: require.resolve('../entrypoint.js'),
    output: {
      path: path.join(fileDest, assetPath),
      publicPath: assetPath,
      filename: DISABLE_CACHEBUSTER ? 'bundle.js' : 'bundle-[hash].js',
    },
    resolve: {
      root: moduleRequireRoots,
      alias: {
        __rwb_root__: rootComponentPath,
      },
      extensions: ['.web.js', '', '.js'],
    },
    resolveLoader: {
      root: moduleRequireRoots,
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
        'RWB.DOM_NODE_ID': JSON.stringify(mountPoint[1]),
        'RWB.DOM_NODE_ELEMENT': JSON.stringify(mountPoint[0]),
        'RWB.PROJECT_ROOT': JSON.stringify(projectRoot),
      }),
      NODE_ENV === 'production' && new webpack.optimize.UglifyJsPlugin(),
      NODE_ENV === 'production' && new webpack.optimize.OccurenceOrderPlugin(),
      new ExtractTextPlugin(DISABLE_CACHEBUSTER ? 'style.css' : 'style-[contenthash].css'),
    ].filter(function(r) {return r;}),
    module: {
      loaders: [
        {
          // seems Babel freaks out unless everything is absolute
          test: /\.js$/,
          loader: require.resolve('babel-loader'),
          query: {
            presets: [
              require.resolve('babel-preset-react'),
              require.resolve('babel-preset-es2015'),
            ],
            plugins: [
              require.resolve('babel-plugin-add-module-exports'),
              require.resolve('babel-plugin-transform-object-rest-spread'),
            ],
          },
          exclude: moduleRequireRoots,
        },
        {
          test: /\.json$/,
          loader: 'json-loader',
        },
        {
          test: /\.css$/,
          loader: ExtractTextPlugin.extract('css-loader'),
        },
        {
          test: /\.css$/,
          loader: 'postcss-loader',
        },
        {
          test: /\.(png|jpg)$/,
          loader: 'url-loader',
          query: {
            limit: 8192,
            name: DISABLE_CACHEBUSTER ? '[path][name].[ext]' : 'image-[hash].[ext]',
          },
        },
        {
          test: /\.svg$/,
          loader: 'raw-loader',
        },
        {
          test: /\.svg$/,
          loader: 'svgo-loader',
          query: {
            plugins: [
              {removeTitle: true},
              {convertColors: {shorthex: false}},
              {convertPathData: false},
            ],
          },
        },
      ],
    },
    postcss() {
      return postCSSPlugins;
    },
  };
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
      path.join(projectRoot, packageJsonData.rwb.static_generator),
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
