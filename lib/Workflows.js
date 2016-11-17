'use strict';

var ReactDOMServer = require('react-dom/server');
var StandardWebpack = require('./StandardWebpack');
var WebpackDevServer = require('webpack-dev-server');

var fs = require('fs');
var myPackageJson = require('../package.json');
var ncp = require('ncp');
var open = require('open');
var path = require('path');
var temp = require('temp');
var webpack = require('webpack');

// TODO: document these
var PORT = process.env.RWB_PORT || 3000;
var PUBLIC_URL = process.env.RWB_PUBLIC_URL || 'https://localhost:' + PORT + '/';
var SKIP_SOURCEMAPS = !!JSON.parse(process.env.RWB_SKIP_SOURCEMAPS || 'false');
var DOM_NODE_ID = process.env.RWB_DOM_NODE_ID || '.react-root';

function errGuard(err) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
}

var Workflows = {
  init: function(args) {
    var packageJson = path.join(
      args[0] || process.cwd(),
      'package.json'
    );

    if (!fs.existsSync(packageJson)) {
      console.error(packageJson + ' does not exist. Did you forget to run `npm init`?');
      process.exit(1);
    }

    var packageJsonData = require(packageJson);

    if (packageJsonData.react) {
      console.error('This project has already been created.');
      process.exit(1);
    }

    packageJsonData.dependencies = packageJsonData.dependencies || {};
    packageJsonData.dependencies.react = packageJsonData.dependencies.react || myPackageJson.dependencies.react;

    packageJsonData.devDependencies = packageJsonData.devDependencies || {};
    packageJsonData.keywords = packageJsonData.keywords || [];
    if (packageJsonData.keywords.indexOf('react') === -1) {
      packageJsonData.keywords.push('react');
    }
    packageJsonData.react = packageJsonData.react || {};
    packageJsonData.react.main = packageJsonData.react.main || './main.js';
    packageJsonData.react.rwb = myPackageJson.version;

    packageJsonData.scripts = packageJsonData.scripts || {};
    packageJsonData.scripts.start = 'rwb serve';

    fs.writeFileSync(packageJson, JSON.stringify(packageJsonData, undefined, 2), {encoding: 'utf8'});

    ncp(path.join(__dirname, 'template'), process.cwd(), function(err) {
      errGuard(err);
      console.log('Project created. Don\'t forget to run `npm install`, since some dependencies may have changed.');
    });
  },

  serve: function(args) {
    args[0] = args[0] || '.';
    var packageRoot = path.resolve(args[0]);
    var packageJson = path.join(packageRoot, 'package.json');

    if (!fs.existsSync(packageJson)) {
      console.error(packageJson + ' does not exist.');
      process.exit(1);
    }

    var packageJsonData = require(packageJson);

    if (!packageJsonData.react || !packageJsonData.react.main) {
      console.error(
        'react.main key does not exist in: ' + packageJson + '. Did you forget to run `rwb init`?'
      );
      process.exit(1);
    }

    temp.track();
    temp.mkdir('rwb-serve', function(err, dirPath) {
      errGuard(err);
      fs.writeFileSync(
        path.join(dirPath, 'index.html'),
        fs.readFileSync(
          path.join(__dirname, 'index.html')
        )
      );

      var webpackEntryPath = path.join(__dirname, 'entrypoint.js');

      var config = {
        devtool: SKIP_SOURCEMAPS ? undefined : 'cheap-module-eval-source-map',
        entry: [
          require.resolve('webpack-dev-server/client') + '?' + PUBLIC_URL,
          require.resolve('webpack/hot/only-dev-server'),
          webpackEntryPath,
          'react-hot-loader/patch',
        ],
        output: {
          path: dirPath,
          publicPath: PUBLIC_URL,
          filename: 'bundle.js',
          devtoolModuleFilenameTemplate: '[absolute-resource-path]',
        },
        plugins: [
          new webpack.DefinePlugin({
            'RWB_DOM_NODE_ID': JSON.stringify(DOM_NODE_ID),
            'RWB_NO_HISTORY': JSON.stringify(false),
          }),
          new webpack.HotModuleReplacementPlugin(),
          new webpack.NoErrorsPlugin()
        ],
        resolve: {
          alias: {
            RWB_REACT_MAIN: path.join(
              packageRoot,
              packageJsonData.react.main
            ),
            react: path.dirname(require.resolve('react')),
            'react-dom': path.dirname(require.resolve('react-dom')),
          },
          extensions: ['.web.js', '', '.js', '.json'],
        },
        module: {
          loaders: [
            {
              test: /\.js$/,
              loader: require.resolve('babel-loader'),
              query: {
                presets: ['es2015', 'react', 'stage-3']
              },
              include: packageRoot,
            },
            {
              test: /\.json$/,
              loader: require.resolve('json-loader'),
            },
            {
              test: /\.css$/,
              loader: require.resolve('style-loader'),
            },
            {
              test: /\.css$/,
              loader: require.resolve('css-loader') + '?safe',
            },
            {
              test: /\.css$/,
              loader: require.resolve('autoprefixer-loader'),
            },
            {
              test: /\.(png|jpg|svg)$/,
              loader: require.resolve('url-loader') + '?limit=8192'
            },
          ]
        },
      };

      StandardWebpack.validate(config);

      var compiler = webpack(config);
      new WebpackDevServer(compiler, {
        contentBase: dirPath,
        publicPath: config.output.publicPath,
        hot: true,
        historyApiFallback: true,
        https: { // enable HTTPS, default to webpack-dev-server's key/cert/ca
          key: false,
          cert: false,
          ca: false,
        },
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }).listen(PORT, function (err, result) {
        errGuard(err);
        console.log('Serving ' + dirPath + ' at ' + PUBLIC_URL);
      });

      var opened = false;
      compiler.plugin('done', function() {
        if (!opened) {
          open(PUBLIC_URL);
          opened = true;
        }
      });
    });
  },

  validate: function(args) {
    if (!args[0]) {
      console.error('You must pass a path to a webpack config module');
      process.exit(1);
    }
    if (!fs.existsSync(args[0])) {
      console.error(args[0] + ' does not exist.');
      process.exit(1);
    }
    StandardWebpack.validate(require(path.resolve(args[0])));
  },
};

module.exports = Workflows;
