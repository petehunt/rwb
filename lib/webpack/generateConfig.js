'use strict';

const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const utils = require('../utils');

const projectRoot = process.cwd();
const rwbRoot = path.resolve(__dirname, '../../');
const projectModuleDir = path.join(projectRoot, 'node_modules');
const rwbModuleDir = path.join(rwbRoot, 'node_modules');

const pkg = utils.loadProjectPkg();
const rootComponentPath = path.join(projectRoot, pkg.data.rwb.main);
const mountPoint = utils.parseIDString(pkg.data.rwb.dom_node);

const NODE_ENV = process.env.NODE_ENV || 'development';
const RWB_PORT = process.env.RWB_PORT || 3000;
const RWB_PUBLIC_URL = process.env.RWB_PUBLIC_URL || `http://localhost:${RWB_PORT}/`;
const RWB_SKIP_SOURCEMAPS = !!JSON.parse(process.env.RWB_SKIP_SOURCEMAPS || 'false');
const RWB_DISABLE_CACHEBUSTER = !!JSON.parse(process.env.RWB_DISABLE_CACHEBUSTER || 'false');

const moduleRequireRoots = [
  // Prefer project node_modules, fall back to rwb modules
  projectModuleDir,
  rwbModuleDir,
];

const entrypoint = require.resolve('../entrypoint.js');

const commonConfig = {
  entry: [entrypoint],
  output: {},
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
      'RWB.DOM_NODE_ID': JSON.stringify(mountPoint[1]),
      'RWB.DOM_NODE_ELEMENT': JSON.stringify(mountPoint[0]),
      'RWB.PROJECT_ROOT': JSON.stringify(projectRoot),
    }),
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
            require.resolve('babel-plugin-add-module-exports'),
            require.resolve('babel-plugin-transform-object-rest-spread'),
          ],
        },
        include: function(absPath) {
          return (
            absPath === entrypoint ||
            (!!~absPath.indexOf(rwbRoot) && !~absPath.indexOf(rwbModuleDir)) ||
            (!!~absPath.indexOf(projectRoot) && !~absPath.indexOf(projectModuleDir))
          );
        },
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
      },
      {
        test: /\.(png|jpg)$/,
        loader: 'url-loader',
        query: {
          limit: 8192,
          name: RWB_DISABLE_CACHEBUSTER ? '[path][name].[ext]' : 'image-[hash].[ext]',
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
            {convertPathData: false},
          ],
        },
      },
    ],
  },
  postcss() {
    return [
      require('autoprefixer'),
    ];
  },
};

function generateConfig(dest) {
  if (dest === 'client') {
    commonConfig.output = {
      // path: dirPath,
      // publicPath: '/',
      filename: 'bundle.js',
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    };

    commonConfig.devtool = RWB_SKIP_SOURCEMAPS ? undefined : 'cheap-module-eval-source-map';

    commonConfig.plugins.push(
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoErrorsPlugin()
    );

    commonConfig.entry.unshift(
      require.resolve('react-hot-loader/patch'),
      require.resolve('webpack-dev-server/client') + `?${RWB_PUBLIC_URL}`,
      require.resolve('webpack/hot/only-dev-server')
    );

    commonConfig.module.loaders[0].query.plugins.unshift(
      require.resolve('react-hot-loader/babel')
    );

    commonConfig.module.loaders.push(
      {
        test: /\.css$/,
        loader: 'style-loader',
      },
      {
        test: /\.css$/,
        loader: 'css-loader',
        query: {
          localIdentName: '[name]__[local]___[hash:base64:5]',
          sourceMap: !RWB_SKIP_SOURCEMAPS,
        },
      },
      {
        test: /\.css$/,
        loader: 'postcss-loader',
      }
    );
  } else if (dest === 'server') {
    commonConfig.output = {
      // path: path.join(fileDest, assetPath),
      // publicPath: assetPath,
      filename: RWB_DISABLE_CACHEBUSTER ? 'bundle.js' : 'bundle-[hash].js',
    };

    if (NODE_ENV === 'production') {
      commonConfig.plugins.push(new webpack.optimize.UglifyJsPlugin());
      commonConfig.plugins.push(new webpack.optimize.OccurenceOrderPlugin());
    }

    commonConfig.plugins.push(
      new ExtractTextPlugin(RWB_DISABLE_CACHEBUSTER ? 'style.css' : 'style-[contenthash].css')
    );

    commonConfig.module.loaders.push(
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('css-loader'),
      },
      {
        test: /\.css$/,
        loader: 'postcss-loader',
      }
    );
  } else {
    throw new Error('generateConfig only supports `client` and `server` values.');
  }

  return commonConfig;
}

module.exports = generateConfig;
