'use strict';

var ExtractTextPlugin = require('extract-text-webpack-plugin');
var React = require('react');
var StandardWebpack = require('./StandardWebpack');
var WebpackDevServer = require('webpack-dev-server');

var fs = require('fs-extra');
var myPackageJson = require('../package.json');
var ncp = require('ncp');
var open = require('open');
var path = require('path');
var temp = require('temp');
var webpack = require('webpack');
var webpackRequire = require('webpack-require');

var indexFile = path.join(__dirname, 'index.html');

// TODO: SSL?
// TODO: document these
var PORT = process.env.RWB_PORT || 3000;
var PUBLIC_URL = process.env.RWB_PUBLIC_URL || 'http://localhost:' + PORT + '/';
var SKIP_SOURCEMAPS = !!JSON.parse(process.env.RWB_SKIP_SOURCEMAPS || 'false');

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
    packageJsonData.react.rwb_entrypoint = packageJsonData.react.rwb_entrypoint || './rwb-entrypoint.js';
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

    // TODO: minimal default entrypoint
    if (!packageJsonData.react || !packageJsonData.react.rwb_entrypoint) {
      console.error(
        'react.rwb_entrypoint key does not exist in: ' + packageJson + '. Did you forget to run `rwb init`?'
      );
      process.exit(1);
    }

    if (packageJsonData.react.rwb_index) {
      indexFile = path.join(packageRoot, packageJsonData.react.rwb_index);
    }

    temp.track();
    temp.mkdir('rwb-serve', function(err, dirPath) {
      errGuard(err);
      fs.writeFileSync(
        path.join(dirPath, 'index.html'),
        fs.readFileSync(indexFile)
      );

      var webpackEntryPath = path.join(packageRoot, packageJsonData.react.rwb_entrypoint);

      var config = {
        devtool: SKIP_SOURCEMAPS ? undefined : 'cheap-module-eval-source-map',
        target: 'web',
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
          new webpack.HotModuleReplacementPlugin(),
          new webpack.NoErrorsPlugin()
        ],
        resolve: {
          alias: {
            react: path.dirname(require.resolve('react')),
          },
          extensions: ['.web.js', '', '.js', '.json'],
        },
        module: {
          loaders: [
            {
              test: /\.js$/,
              loader: require.resolve('react-hot-loader'),
              include: packageRoot,
            },
            {
              test: /\.js$/,
              loader: require.resolve('babel-loader'),
              query: {
                // presets: ['react', 'es2015']
                presets: [
                  require.resolve('babel-preset-react'),
                  require.resolve('babel-preset-es2015'),
                ],
                plugins: [
                  require.resolve('babel-plugin-transform-object-rest-spread'),
                ]
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

    // TODO: minimal default static generator
    if (!packageJsonData.react || !packageJsonData.react.rwb_static) {
      console.error(
        'react.rwb_static key does not exist in: ' + packageJson + '. Did you forget to run `rwb init`?'
      );
      process.exit(1);
    }

    var webpackEntryPath = path.join(packageRoot, packageJsonData.react.rwb_entrypoint);

    var config = {
      entry: webpackEntryPath,
      // uncommenting this enables `fs` but outputs a cryptic error: 'ReferenceError: global is not defined'
      // target: 'node',
      node: {
        fs: 'empty',
      },
      output: {
        path: dirPath,
        filename: 'bundle.js', // TODO: use [hash]
      },
      resolve: {
        alias: {
          react: path.dirname(require.resolve('react')),
        },
        extensions: ['.web.js', '', '.js'],
      },
      plugins: [
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify('production'),
        }),
        new webpack.optimize.UglifyJsPlugin(),
        new webpack.optimize.OccurenceOrderPlugin(),
        new ExtractTextPlugin('styles.css'),
      ],
      module: {
        loaders: [
          {
            test: /\.js$/,
            loader: require.resolve('babel-loader'),
            query: {
              presets: [
                require.resolve('babel-preset-react'),
                require.resolve('babel-preset-es2015'),
              ],
              plugins: [
                require.resolve('babel-plugin-transform-object-rest-spread'),
              ]
            },
            include: packageRoot,
          },
          {
            test: /\.json$/,
            loader: require.resolve('json-loader'),
          },
          {
            test: /\.css$/,
            loader: ExtractTextPlugin.extract(require.resolve('css-loader') + '?safe'),
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

    webpackRequire(config, path.join(packageRoot, packageJsonData.react.rwb_static), function(err, factory){
      errGuard(err);
      var getPageContents = factory().default;
      getPageContents().then(function(pages){
        var htmlTemplate = fs.readFileSync(indexFile, {encoding: 'utf8'});

        pages.forEach(function(pageObj){
          var pageDir = path.join(packageRoot, dirPath, pageObj.path);
          var pagePath = path.join(pageDir, 'index.html');

          console.log('Write file to', pagePath);

          fs.mkdirsSync(pageDir);

          fs.writeFileSync(
            pagePath,
            htmlTemplate
              .replace('<title>rwb</title>', '<title>' + pageObj.metadata.title + '</title>')
              .replace('<!-- RWB STYLES -->', '<link rel="stylesheet" type="text/css" href="/styles.css" />')
              .replace('<!-- RWB MARKUP -->', pageObj.markup),
            {encoding: 'utf8'}
          );

        });
      });

      webpack(config).run(function(err, stats) {
        errGuard(err);
        console.log(stats.toString());
      });
    });
  },
};

module.exports = Workflows;
