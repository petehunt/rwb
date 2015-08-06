'use strict';

var ExtractTextPlugin = require('extract-text-webpack-plugin');
var React = require('react');
var Router = require('react-router');
var StandardWebpack = require('./StandardWebpack');
var WebpackDevServer = require('webpack-dev-server');

var babel = require('babel');
var fs = require('fs');
var getAsyncBundles = require('./getAsyncBundles');
var invariant = require('invariant');
var myPackageJson = require('../package.json');
var ncp = require('ncp');
var open = require('open');
var path = require('path');
var stripAsyncRoutes = require('./stripAsyncRoutes');
var temp = require('temp');
var webpack = require('webpack');

var PORT = process.env.REACT_CLI_PORT || 3000;

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
    packageJsonData.react.routes = packageJsonData.react.routes || './routes.jsx';

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
        'react.routes key does not exist in: ' + packageJson + '. Did you forget to run `react-cli init`?'
      );
      process.exit(1);
    }

    temp.track();
    temp.mkdir('react-cli-serve', function(err, dirPath) {
      errGuard(err);
      fs.writeFileSync(
        path.join(dirPath, 'index.html'),
        fs.readFileSync(
          path.join(__dirname, 'index.html'),
          {encoding: 'utf8'}
        ).replace('<!-- REACT-CLI SCRIPTS -->', '<script src="./bundle.js"></script>'),
        {encoding: 'utf8'}
      );

      var webpackEntryPath = path.join(__dirname, 'entrypoint.js');

      var config = {
        devtool: 'cheap-module-eval-source-map',
        entry: [
          require.resolve('webpack-dev-server/client') + '??http://localhost:' + PORT,
          require.resolve('webpack/hot/only-dev-server'),
          webpackEntryPath,
        ],
        output: {
          path: dirPath,
          filename: 'bundle.js',
          devtoolModuleFilenameTemplate: '[absolute-resource-path]',
        },
        plugins: [
          new webpack.HotModuleReplacementPlugin(),
          new webpack.NoErrorsPlugin()
        ],
        resolve: {
          alias: {
            REACT_ROUTES: path.join(
              packageRoot,
              packageJsonData.react.routes
            ),
            react: path.dirname(require.resolve('react')),
            'react-router': path.dirname(require.resolve('react-router')),
          },
          extensions: ['', '.js', '.jsx'],
        },
        module: {
          loaders: [
            {
              test: /\.jsx$/,
              loader: require.resolve('react-hot-loader') + '!' + require.resolve('babel-loader') + '?stage=1',
              include: packageRoot,
            },
            {
              test: /\.js$/,
              loader: require.resolve('react-hot-loader'),
              include: packageRoot,
            },
            {
              test: /\.css$/,
              loader: ['style-loader', 'css-loader', 'autoprefixer-loader'].map(require.resolve.bind(require)).join('!'),
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
        historyApiFallback: true
      }).listen(PORT, 'localhost', function (err, result) {
        errGuard(err);
        console.log('Serving ' + dirPath + ' at localhost:' + PORT);
      });

      var opened = false;
      compiler.plugin('done', function() {
        if (!opened) {
          open('http://localhost:' + PORT + '/');
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
        'react.routes key does not exist in: ' + packageJson + '. Did you forget to run `react-cli init`?'
      );
      process.exit(1);
    }

    var reactEntrypoint = path.join(
      packageRoot,
      packageJsonData.react.routes
    );

    // Server render the component
    StandardWebpack.shim();
    var reactEntrypointFilename = require.resolve(reactEntrypoint);

    var Module = module.constructor;
    var newModule = new Module();
    newModule.paths = module.paths;
    newModule._compile(
      stripAsyncRoutes(
        babel.transform(
          fs.readFileSync(reactEntrypointFilename, {encoding: 'utf8'}),
          {stage: 1}
        ).code,
        reactEntrypointFilename
      ),
      reactEntrypointFilename
    );
    var routes = newModule.exports;

    Router.run(routes, function(component) {
      var webpackEntryPath = path.join(__dirname, 'entrypoint.js');

      var config = {
        entry: getAsyncBundles(
          webpackEntryPath,
          require(reactEntrypointFilename)
        ),
        output: {
          path: dirPath,
          filename: '[chunkhash].entry.js',
          chunkFilename: '[chunkhash].chunk.js',
        },
        resolve: {
          alias: {
            REACT_ROUTES: reactEntrypoint,
            react: path.dirname(require.resolve('react')),
            'react-router': path.dirname(require.resolve('react-router')),
          },
          extensions: ['', '.js', '.jsx'],
        },
        plugins: [
          new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production'),
          }),
          new webpack.optimize.UglifyJsPlugin(),
          new webpack.optimize.OccurenceOrderPlugin(),
          new webpack.optimize.CommonsChunkPlugin('[chunkhash].share.js'),
          new ExtractTextPlugin('[chunkhash].style.css'),
        ],
        module: {
          loaders: [
            {
              test: /\.jsx$/,
              loader: require.resolve('babel-loader') + '?stage=1',
              include: packageRoot,
            },
            {
              test: /\.css$/,
              loader: ExtractTextPlugin.extract(
                ['css-loader', 'autoprefixer-loader'].map(require.resolve.bind(require)).join('!')
              ),
            },
            {
              test: /\.(png|jpg|svg)$/,
              loader: require.resolve('url-loader') + '?limit=8192'
            },
          ]
        },
      };

      StandardWebpack.validate(config);
      webpack(config).run(function(err, stats) {
        errGuard(err);
        console.log(stats.toString());
        var markup = React.renderToString(React.createElement(component));
        // Generate a friendly route map for people who want to drive this from a dynamic web app.
        var serverSideConfig = {
          common: {
            styles: [],
            scripts: [],
          },
          routes: {},
        };

        stats.toJson().chunks.forEach(function(chunk) {
          if (!chunk.initial) {
            return;
          }

          var container;
          if (chunk.entry) {
            container = serverSideConfig.common;
          } else {
            if (chunk.names.length > 1 || chunk.names[0].slice(0, 5) !== 'path:') {
              return;
            }
            invariant(
              !serverSideConfig.routes.hasOwnProperty(chunk.names[0].slice(5)),
              'Duplicate chunks: %s',
              chunk.names[0]
            );
            container = serverSideConfig.routes[chunk.names[0].slice(5)] = {
              styles: [],
              scripts: [],
            };
          }
          chunk.files.forEach(function(file) {
            if (file.slice(-3) === '.js') {
              container.scripts.push(file);
            } else if (file.slice(-4) === '.css') {
              container.styles.push(file);
            } else {
              invariant(false, 'Unknown asset type: %s', file);
            }
          });
        });

        var indexPath = path.join(dirPath, 'index.html');
        fs.writeFileSync(
          indexPath,
          fs.readFileSync(
            path.join(__dirname, 'index.html'),
            {encoding: 'utf8'}
          ).replace('<!-- REACT-CLI MARKUP -->', markup)
            .replace(
              '<!-- REACT-CLI STYLES -->',
              serverSideConfig.common.styles.concat(serverSideConfig.routes['/'].styles).map(function(file) {
                return '<link rel="stylesheet" type="text/css" href="' + file + '" />';
              }).join('\n')
            )
            .replace(
              '<!-- REACT-CLI SCRIPTS -->',
              serverSideConfig.common.scripts.concat(serverSideConfig.routes['/'].scripts).map(function(file) {
                return '<script src="' + file + '"></script>';
              }).join('\n')
            ),
          {encoding: 'utf8'}
        );

        fs.writeFileSync(
          path.join(dirPath, 'serverConfig.json'),
          JSON.stringify(serverSideConfig, undefined, 2),
          {encoding: 'utf8'}
        );
      });
    });
  },
};

module.exports = Workflows;
