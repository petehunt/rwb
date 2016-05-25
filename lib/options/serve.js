'use strict';

const StandardWebpack = require('../StandardWebpack');

const WebpackDevServer = require('webpack-dev-server');
const fs = require('fs-extra');
const path = require('path');
const temp = require('temp');
const webpack = require('webpack');

const utils = require('../utils');

const NODE_ENV = process.env.NODE_ENV || 'development';

const postCSSPlugins = [
  require('autoprefixer'),
];

function serveHandler(argv) {
  const RWB_PORT = parseInt(argv.port) || process.env.RWB_PORT || 3000;
  const RWB_PUBLIC_URL = process.env.RWB_PUBLIC_URL || `http://localhost:${RWB_PORT}/`;
  const SKIP_SOURCEMAPS = !!JSON.parse(process.env.RWB_SKIP_SOURCEMAPS || 'false');

  const projectRoot = process.cwd();
  const packageJson = path.join(projectRoot, 'package.json');
  const packageJsonData = require(packageJson);

  if (typeof packageJsonData.rwb !== 'object') {
    console.error(
      `rwb key does not exist in: ${packageJson}.`,
      'Did you forget to run `rwb init`?'
    );
    process.exit(1);
  }

  const rootComponentPath = path.join(projectRoot, packageJsonData.rwb.main);
  const mountPoint = utils.parseIDString(packageJsonData.rwb.dom_node);

  const moduleRequireRoots = [
    // Prefer project node_modules, fall back to rwb modules
    path.join(projectRoot, 'node_modules'),
    path.resolve(__dirname, '../node_modules'),
  ];

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

    const config = {
      devtool: SKIP_SOURCEMAPS ? undefined : 'cheap-module-eval-source-map',
      entry: [
        require.resolve('react-hot-loader/patch'),
        require.resolve('webpack-dev-server/client') + `?${RWB_PUBLIC_URL}`,
        require.resolve('webpack/hot/only-dev-server'),
        require.resolve('../entrypoint.js'),
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
          'RWB.PROJECT_ROOT': JSON.stringify(projectRoot),
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
            loader: require.resolve('json-loader'),
          },
          {
            test: /\.css$/,
            loader: require.resolve('style-loader'),
          },
          {
            test: /\.css$/,
            loader: require.resolve('css-loader'),
            query: {
              localIdentName: '[name]__[local]___[hash:base64:5]',
              sourceMap: !SKIP_SOURCEMAPS,
            },
          },
          {
            test: /\.css$/,
            loader: require.resolve('postcss-loader'),
          },
          {
            test: /\.(png|jpg)$/,
            loader: require.resolve('url-loader'),
            query: {
              limit: 8192,
              name: '[path][name].[ext]',
            },
          },
          {
            test: /\.svg$/,
            loader: require.resolve('raw-loader'),
          },
          {
            test: /\.svg$/,
            loader: require.resolve('svgo-loader'),
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
