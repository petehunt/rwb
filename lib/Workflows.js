'use strict';

var ExtractTextPlugin = require('extract-text-webpack-plugin');
var React = require('react');
var Router = require('react-router');
var StandardWebpack = require('./StandardWebpack');
var WebpackDevServer = require('webpack-dev-server');

var fs = require('fs');
var myPackageJson = require('../package.json');
var ncp = require('ncp');
var open = require('open');
var path = require('path');
var temp = require('temp');
var webpack = require('webpack');
var webpackRequire = require('webpack-require');

// TODO: SSL?
// TODO: document these
var PORT = process.env.RWB_PORT || 3000;
var PUBLIC_URL = process.env.RWB_PUBLIC_URL || 'http://localhost:' + PORT + '/';
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
    packageJsonData.devDependencies['react-router'] = (
      packageJsonData.devDependencies['react-router'] ||
        myPackageJson.dependencies['react-router']
    );
    packageJsonData.keywords = packageJsonData.keywords || [];
    if (packageJsonData.keywords.indexOf('react') === -1) {
      packageJsonData.keywords.push('react');
    }
    packageJsonData.react = packageJsonData.react || {};
    packageJsonData.react.routes = packageJsonData.react.routes || './routes.js';
    packageJsonData.react.rwb = myPackageJson.version;

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

    if (!packageJsonData.react || !packageJsonData.react.routes) {
      console.error(
        'react.routes key does not exist in: ' + packageJson + '. Did you forget to run `rwb init`?'
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
            RWB_REACT_ROUTES: path.join(
              packageRoot,
              packageJsonData.react.routes
            ),
            react: path.dirname(require.resolve('react')),
            'react-router': path.dirname(require.resolve('react-router')),
          },
          extensions: ['.web.js', '', '.js'],
        },
        module: {
          loaders: [
            {
              test: /\.js$/,
              loader: require.resolve('react-hot-loader') + '!' + require.resolve('babel-loader') + '?stage=1',
              include: packageRoot,
            },
            {
              test: /\.css$/,
              loader: require.resolve('style-loader'),
            },
            {
              test: /\.css$/,
              loader: require.resolve('css-loader'),
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

  static: function(args) {
    if (args[0] && !args[1]) {
      args[1] = args[0];
      args[0] = undefined;
    }

    var packageRoot = path.resolve(args[0] || '.');
    var packageJson = path.join(packageRoot, 'package.json');

    if (!fs.existsSync(packageJson)) {
      console.error(packageJson + ' does not exist.');
      process.exit(1);
    }

    var dirPath = args[1] || 'dist';
    if (!dirPath) {
      console.error('You must provide a destination directory.');
      process.exit(1);
    }

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    }

    var packageJsonData = require(packageJson);

    if (!packageJsonData.react || !packageJsonData.react.routes) {
      console.error(
        'react.routes key does not exist in: ' + packageJson + '. Did you forget to run `rwb init`?'
      );
      process.exit(1);
    }

    var reactEntrypoint = path.join(
      packageRoot,
      packageJsonData.react.routes
    );

    var indexPath = path.join(dirPath, 'index.html');

    var webpackEntryPath = path.join(__dirname, 'entrypoint.js');

    var config = {
      entry: webpackEntryPath,
      output: {
        path: dirPath,
        filename: 'bundle.js', // TODO: use [hash]
      },
      resolve: {
        alias: {
          RWB_REACT_ROUTES: reactEntrypoint,
          react: path.dirname(require.resolve('react')),
          'react-router': path.dirname(require.resolve('react-router')),
        },
        extensions: ['.web.js', '', '.js'],
      },
      plugins: [
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify('production'),
          'RWB_NO_HISTORY': JSON.stringify(true),
          'RWB_DOM_NODE_ID': JSON.stringify(DOM_NODE_ID),
        }),
        new webpack.optimize.UglifyJsPlugin(),
        new webpack.optimize.OccurenceOrderPlugin(),
        new ExtractTextPlugin('styles.css'),
      ],
      module: {
        loaders: [
          {
            test: /\.js$/,
            loader: require.resolve('babel-loader') + '?stage=1',
            include: packageRoot,
          },
          {
            test: /\.css$/,
            loader: ExtractTextPlugin.extract(require.resolve('css-loader')),
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

    webpackRequire(config, require.resolve(reactEntrypoint), function(err, factory) {
      errGuard(err);

      var routes = factory();
      Router.run(routes, function(component) {
        var markup = React.renderToString(React.createElement(component));
        fs.writeFileSync(
          indexPath,
          fs.readFileSync(
            path.join(__dirname, 'index.html'),
            {encoding: 'utf8'}
          ).replace('<!-- RWB MARKUP -->', markup)
            .replace('<!-- RWB STYLES -->', '<link rel="stylesheet" type="text/css" href="styles.css" />'),
          {encoding: 'utf8'}
        );


        webpack(config).run(function(err, stats) {
          errGuard(err);
          console.log(stats.toString());
        });
      });
    });
  },
};

module.exports = Workflows;
