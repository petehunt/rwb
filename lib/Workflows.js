'use strict';

var ExtractTextPlugin = require('extract-text-webpack-plugin');
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
var DEFAULT_DOM_NODE = '#.rwb-demotron';

function errGuard(err) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
}

var parseIDString = function(str, defaultStr) {
  str = str || defaultStr;
  if (!defaultStr) {
    errGuard('parseIDString expects two parameters');
  }
  var bits = str.split('#');
  if (bits.length !== 2) {
    errGuard('rwb.dom_node can only be a valid ID (e.g. `#react-stuff`)');
  }
  if (bits[1] === '') {
    errGuard('RWB DOM node cannot be blank');
  }
  if (bits[0] === '') {
    bits[0] = 'div';
  } else if (!!~['div', 'span'].indexOf(bits[0])) {
    errGuard('Element can only be a div or a span (got `'+bits[0]+'`)');
  }
  return bits;
};

var buildMountPoint = function(arr) {
  if (!Array.isArray(arr) || arr.length !== 2) {
    errGuard('buildDOMNode expects a two-element array, homie');
  }
  return '<' + arr[0] + ' id="' + arr[1] + '"></' + arr[0] + '>';
}

var Workflows = {
  init: function(args) {
    args[0] = args[0] || process.cwd();
    var packageJson = path.join(
      args[0] || process.cwd(),
      'package.json'
    );

    if (!fs.existsSync(packageJson)) {
      console.error(packageJson + ' does not exist. Did you forget to run `npm init`?');
      process.exit(1);
    }

    var packageJsonData = require(packageJson);

    packageJsonData.dependencies = packageJsonData.dependencies || {};
    packageJsonData.devDependencies = packageJsonData.devDependencies || {};
    packageJsonData.keywords = packageJsonData.keywords || [];

    if (packageJsonData.devDependencies.rwb) {
      console.error('This project has already been created.');
      process.exit(1);
    }

    packageJsonData.dependencies.react = packageJsonData.dependencies.react || myPackageJson.rwb_min_version.react;
    packageJsonData.dependencies['react-dom'] = packageJsonData.dependencies['react-dom'] || myPackageJson.rwb_min_version['react-dom'];

    packageJsonData.devDependencies.rwb = packageJsonData.devDependencies.rwb || myPackageJson.version;

    if (packageJsonData.keywords.indexOf('react') === -1) {
      packageJsonData.keywords.push('react');
    }

    packageJsonData.rwb = packageJsonData.rwb || {};
    packageJsonData.rwb.dom_node = packageJsonData.rwb.dom_node || DEFAULT_DOM_NODE;
    packageJsonData.rwb.main = packageJsonData.rwb.main || 'MyComponent.js';
    packageJsonData.rwb.static_generator = packageJsonData.rwb.static_generator || './render-static-page.js';

    packageJsonData.scripts = packageJsonData.scripts || {};
    packageJsonData.scripts.start = 'rwb serve';

    fs.writeFileSync(packageJson, JSON.stringify(packageJsonData, undefined, 2), {encoding: 'utf8'});

    ncp(path.join(__dirname, 'template'), args[0], function(err) {
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

    if (typeof packageJsonData.rwb !== 'object') {
      console.error(
        'rwb key does not exist in: ' + packageJson + '. Did you forget to run `rwb init`?'
      );
      process.exit(1);
    }

    if (!packageJsonData.rwb.static_generator) {
      console.error(
        '"rwb.static_generator" key needs to be set to a module path (in ' + packageJson + ').'
      );
      process.exit(1);
    }

    var rootComponentPath = path.join(packageRoot, packageJsonData.rwb.main);
    var mountPoint = parseIDString(packageJsonData.rwb.dom_node, DEFAULT_DOM_NODE);
    var mountPointNode = buildMountPoint(mountPoint);

    temp.track();
    temp.mkdir('rwb-serve', function(err, dirPath) {
      errGuard(err);
      fs.writeFileSync(
        path.join(dirPath, 'index.html'),
        [
          '<!doctype html>',
          '<meta charset="utf-8">',
          '<title>rwb</title>',
          mountPointNode,
          '<script src="/bundle.js" /></script>',
        ].join('\n'),
        {encoding: 'utf8'}
      );

      var config = {
        devtool: SKIP_SOURCEMAPS ? undefined : 'cheap-module-eval-source-map',
        entry: [
          require.resolve('webpack-dev-server/client') + '?' + PUBLIC_URL,
          require.resolve('webpack/hot/only-dev-server'),
          require.resolve('./entrypoint.js'),
        ],
        output: {
          path: dirPath,
          publicPath: '/',
          filename: 'bundle.js',
          devtoolModuleFilenameTemplate: '[absolute-resource-path]',
        },
        plugins: [
          new webpack.DefinePlugin({
            'RWB.DOM_NODE_ID': JSON.stringify(mountPoint[1]),
            'RWB.DOM_NODE_ELEMENT': JSON.stringify(mountPoint[0]),
            'RWB.PROJECT_ROOT': JSON.stringify(packageRoot),
          }),
          new webpack.HotModuleReplacementPlugin(),
          new webpack.NoErrorsPlugin()
        ],
        resolve: {
          alias: {
            react: path.join(packageRoot, 'node_modules', 'react'),
            'react-dom': path.join(packageRoot, 'node_modules', 'react-dom'),
            __rwb_root__: rootComponentPath,
          },
          extensions: ['.web.js', '', '.js', '.json'],
        },
        module: {
          loaders: [
            {
              test: /\.js$/,
              loader: require.resolve('react-hot-loader'),
              include: packageRoot,
              exclude: path.join(packageRoot, 'node_modules'),
            },
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
              exclude: path.join(packageRoot, 'node_modules'),
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
              loader: require.resolve('url-loader'),
              query: {
                limit: 8192,
                name: 'image-[hash].[ext]',
              },
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

    var packageJsonData = require(packageJson);

    if (typeof packageJsonData.rwb !== 'object') {
      console.error(
        'rwb key does not exist in: ' + packageJson + '. Did you forget to run `rwb init`?'
      );
      process.exit(1);
    }

    if (!packageJsonData.rwb.static_generator) {
      console.error(
        '"rwb.static_generator" key needs to be set to a module path (in ' + packageJson + ').'
      );
      process.exit(1);
    }

    var rootComponentPath = path.join(packageRoot, packageJsonData.rwb.main);
    var mountPoint = parseIDString(packageJsonData.rwb.dom_node, DEFAULT_DOM_NODE);

    if (!packageJsonData.rwb.main) {
      console.error(
        '"rwb.main" key needs to be set to a module path (in ' + packageJson + ').'
      );
      process.exit(1);
    }

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    }

    var config = {
      entry: require.resolve('./entrypoint.js'),
      output: {
        path: dirPath,
        publicPath: '/',
        filename: 'bundle-[hash].js',
      },
      resolve: {
        alias: {
          react: path.join(packageRoot, 'node_modules', 'react'),
          'react-dom': path.join(packageRoot, 'node_modules', 'react-dom'),
          __rwb_root__: rootComponentPath,
        },
        extensions: ['.web.js', '', '.js'],
      },
      plugins: [
        new webpack.DefinePlugin({
          'RWB.DOM_NODE_ID': JSON.stringify(mountPoint[1]),
          'RWB.DOM_NODE_ELEMENT': JSON.stringify(mountPoint[0]),
          'RWB.PROJECT_ROOT': JSON.stringify(packageRoot),
          'process.env.NODE_ENV': JSON.stringify('production'),
        }),
        new webpack.optimize.UglifyJsPlugin(),
        new webpack.optimize.OccurenceOrderPlugin(),
        new ExtractTextPlugin('style-[contenthash].css'),
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
            exclude: path.join(packageRoot, 'node_modules'),
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
            loader: require.resolve('url-loader'),
            query: {
              limit: 8192,
              name: 'image-[hash].[ext]',
            },
          },
        ]
      },
    };
    StandardWebpack.validate(config);

    webpack(config).run(function(err, stats) {
      errGuard(err);
      console.log(stats.toString());

      var statsObj = stats.toJson();
      var assets = {
        css: [],
        js: [],
      };

      if (statsObj.assetsByChunkName && Array.isArray(statsObj.assetsByChunkName.main)) {
        statsObj.assetsByChunkName.main.forEach(function(f) {
          var ext = path.extname(f).replace(/^\./, '');
          if (ext === '') {
            assets['misc'] = assets['misc'] || [];
            assets['misc'].push(f);
          } else {
            assets[ext] = assets[ext] || [];
            assets[ext].push(f);
          }
        });
      }

      webpackRequire(
        config,
        path.join(packageRoot, packageJsonData.rwb.static_generator),
        ['fs'],
        {
          console: console,
          RWB: {
            DOM_NODE_ID: mountPoint[1],
            DOM_NODE_ELEMENT: mountPoint[0],
            PROJECT_ROOT: packageRoot,
            STATIC_ROOT: path.join(packageRoot, dirPath),
            ASSETS: assets,
          }
        },
        function(err, factory) {
          errGuard(err);

          var generator = factory();

          // module.exports = ...
          if (typeof generator === 'function') {
            generator();
          // export default ...
        } else if (typeof generator === 'object' && typeof generator.default === 'function') {
            generator.default();
          } else {
            errGuard('Static generator (' + packageJsonData.rwb.static_generator + ') did not export a default function');
          }
        }
      );
    });
  },
};

module.exports = Workflows;
