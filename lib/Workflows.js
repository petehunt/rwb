'use strict';

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const StandardWebpack = require('./StandardWebpack');
const WebpackDevServer = require('webpack-dev-server');

const fs = require('fs');
const myPackageJson = require('../package.json');
const ncp = require('ncp');
const path = require('path');
const temp = require('temp');
const webpack = require('webpack');
const webpackRequire = require('webpack-require');

const postCSSPlugins = [
  require('autoprefixer'),
];

// TODO: SSL?
// TODO: document these
const PORT = process.env.RWB_PORT || 3000;
const PUBLIC_URL = process.env.RWB_PUBLIC_URL || `http://localhost:${PORT}/`;
const SKIP_SOURCEMAPS = !!JSON.parse(process.env.RWB_SKIP_SOURCEMAPS || 'false');
const DISABLE_CACHEBUSTER = !!JSON.parse(process.env.RWB_DISABLE_CACHEBUSTER || 'false');

const DEFAULT_DOM_NODE = '#.rwb-demotron';

const NODE_ENV = process.env.NODE_ENV || 'production';

function errGuard(err) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
}

function parseIDString(str, defaultStr) {
  str = str || defaultStr;
  if (!defaultStr) {
    errGuard('parseIDString expects two parameters');
  }

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

const Workflows = {
  init(args) {
    args[0] = args[0] || process.cwd();
    const packageJson = path.join(
      args[0] || process.cwd(),
      'package.json'
    );

    if (!fs.existsSync(packageJson)) {
      console.error(packageJson, 'does not exist. Did you forget to run `npm init`?');
      process.exit(1);
    }

    const packageJsonData = require(packageJson);

    packageJsonData.dependencies = packageJsonData.dependencies || {};
    packageJsonData.devDependencies = packageJsonData.devDependencies || {};
    packageJsonData.keywords = packageJsonData.keywords || [];

    if (packageJsonData.devDependencies.rwb) {
      console.error('This project has already been created.');
      process.exit(1);
    }

    packageJsonData.dependencies.react = packageJsonData.dependencies.react || myPackageJson.dependencies.react;
    packageJsonData.dependencies['react-dom'] = packageJsonData.dependencies['react-dom'] || myPackageJson.dependencies['react-dom'];

    packageJsonData.devDependencies.rwb = packageJsonData.devDependencies.rwb || myPackageJson.version;

    if (packageJsonData.keywords.indexOf('react') === -1) {
      packageJsonData.keywords.push('react');
    }

    packageJsonData.rwb = packageJsonData.rwb || {};
    packageJsonData.rwb.dom_node = packageJsonData.rwb.dom_node || DEFAULT_DOM_NODE;
    packageJsonData.rwb.main = packageJsonData.rwb.main || './MyComponent.js';
    packageJsonData.rwb.static_generator = packageJsonData.rwb.static_generator || './render-static-page.js';

    packageJsonData.scripts = packageJsonData.scripts || {};
    if (!packageJsonData.scripts.start) {
      packageJsonData.scripts.start = 'rwb serve';
    }

    fs.writeFileSync(packageJson, JSON.stringify(packageJsonData, undefined, 2), {encoding: 'utf8'});

    ncp(path.join(__dirname, 'template'), args[0], function(err) {
      errGuard(err);
      console.info('Project created. Don\u2019t forget to run `npm install` since some dependencies may have changed.');
    });
  },

  serve(args) {
    args[0] = args[0] || '.';
    const packageRoot = path.resolve(args[0]);
    const packageJson = path.join(packageRoot, 'package.json');
    const packageJsonData = require(packageJson);

    if (typeof packageJsonData.rwb !== 'object') {
      console.error(
        `rwb key does not exist in: ${packageJson}.`,
        'Did you forget to run `rwb init`?'
      );
      process.exit(1);
    }

    if (!packageJsonData.rwb.static_generator) {
      console.error(
        `'rwb.static_generator' key needs to be set to a module path (in '${packageJson}').`
      );
      process.exit(1);
    }

    const rootComponentPath = path.join(packageRoot, packageJsonData.rwb.main);
    const mountPoint = parseIDString(packageJsonData.rwb.dom_node, DEFAULT_DOM_NODE);

    const moduleRequireRoots = [
      // Prefer project node_modules, fall back to rwb modules
      path.join(packageRoot, 'node_modules'),
      path.resolve(__dirname, '../node_modules'),
    ];

    temp.track();
    temp.mkdir('rwb-serve', function(err, dirPath) {
      errGuard(err);

      const documentContents = [
        '<!doctype html>',
        '<meta charset="utf-8">',
        '<title>rwb</title>',
        buildMountPoint(mountPoint),
        '<script src="/bundle.js"></script>',
      ].join('\n');

      fs.writeFileSync(
        path.join(dirPath, 'index.html'),
        documentContents,
        {encoding: 'utf8'}
      );

      const config = {
        devtool: SKIP_SOURCEMAPS ? undefined : 'cheap-module-eval-source-map',
        entry: [
          require.resolve('react-hot-loader/patch'),
          require.resolve('webpack-dev-server/client') + `?${PUBLIC_URL}`,
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
            'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
            'RWB.DOM_NODE_ID': JSON.stringify(mountPoint[1]),
            'RWB.DOM_NODE_ELEMENT': JSON.stringify(mountPoint[0]),
            'RWB.PROJECT_ROOT': JSON.stringify(packageRoot),
          }),
          new webpack.HotModuleReplacementPlugin(),
          new webpack.NoErrorsPlugin(),
        ],
        resolve: {
          root: moduleRequireRoots,
          alias: {
            __rwb_root__: rootComponentPath,
          },
          extensions: ['.web.js', '', '.js', '.json'],
        },
        resolveLoader: {
          root: moduleRequireRoots,
        },
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
                  require.resolve('react-hot-loader/babel'),
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
              loader: 'style-loader',
            },
            {
              test: /\.css$/,
              loader: 'css-loader',
              query: {
                localIdentName: '[name]__[local]___[hash:base64:5]',
                sourceMap: !SKIP_SOURCEMAPS,
              },
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

      const compiler = webpack(config);
      new WebpackDevServer(compiler, {
        contentBase: dirPath,
        publicPath: config.output.publicPath,
        hot: true,
        historyApiFallback: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }).listen(PORT, function (err) {
        errGuard(err);
        console.info('Serving', dirPath, 'at', PUBLIC_URL);
      });
    });
  },

  validate(args) {
    if (!args[0]) {
      console.error('You must pass a path to a webpack config module');
      process.exit(1);
    }
    if (!fs.existsSync(args[0])) {
      console.error(args[0], 'does not exist.');
      process.exit(1);
    }
    StandardWebpack.validate(require(path.resolve(args[0])));
  },

  static(args) {
    if (args[0] && !args[1]) {
      args[1] = args[0];
      args[0] = undefined;
    }

    const packageRoot = path.resolve(args[0] || '.');
    const packageJson = path.join(packageRoot, 'package.json');

    if (!fs.existsSync(packageJson)) {
      console.error(packageJson, 'does not exist.');
      process.exit(1);
    }

    const dirPath = args[1] || 'dist';
    if (!dirPath) {
      console.error('You must provide a destination directory.');
      process.exit(1);
    }

    const packageJsonData = require(packageJson);

    if (typeof packageJsonData.rwb !== 'object') {
      console.error(
        `rwb key does not exist in ${packageJson}.`,
        'Did you forget to run `rwb init`?'
      );
      process.exit(1);
    }

    if (!packageJsonData.rwb.static_generator) {
      console.error(
        `'rwb.static_generator' key needs to be set to a module path (in ${packageJson}).`
      );
      process.exit(1);
    }

    const rootComponentPath = path.join(packageRoot, packageJsonData.rwb.main);
    const mountPoint = parseIDString(packageJsonData.rwb.dom_node, DEFAULT_DOM_NODE);

    if (!packageJsonData.rwb.main) {
      console.error(
        `'rwb.main' key needs to be set to a module path (in ${packageJson}).`
      );
      process.exit(1);
    }

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    }

    const moduleRequireRoots = [
      path.join(packageRoot, 'node_modules'),
      path.resolve(__dirname, '../node_modules'),
    ];

    let assetPath = '/';
    if (process.env.RWB_PUBLIC_PATH) {
      // webpack assumes output.publicPath has a trailing slash
      assetPath = path.join(path.resolve('/', process.env.RWB_PUBLIC_PATH), '/');
    }

    const config = {
      entry: require.resolve('./entrypoint.js'),
      output: {
        path: path.join(dirPath, assetPath),
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
          'RWB.PROJECT_ROOT': JSON.stringify(packageRoot),
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
      errGuard(err);
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
        path.join(packageRoot, packageJsonData.rwb.static_generator),
        ['fs'],
        {
          console,
          RWB: {
            DOM_NODE_ID: mountPoint[1],
            DOM_NODE_ELEMENT: mountPoint[0],
            PROJECT_ROOT: packageRoot,
            STATIC_ROOT: path.resolve(packageRoot, dirPath),
            ASSETS: assets,
            STATS: statsObj,
          },
        },
        function(err, factory) {
          errGuard(err);
          factory()();
        }
      );
    });
  },
};

module.exports = Workflows;
