'use strict';

var React = require('react');
var StandardWebpack = require('./StandardWebpack');
var WebpackDevServer = require('webpack-dev-server');

var fs = require('fs');
var ncp = require('ncp');
var open = require('open');
var path = require('path');
var temp = require('temp');
var webpack = require('webpack');

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
    packageJsonData.dependencies.react = packageJsonData.dependencies.react || '0.13.3';
    packageJsonData.keywords = packageJsonData.keywords || [];
    if (packageJsonData.keywords.indexOf('react') === -1) {
      packageJsonData.keywords.push('react');
    }
    packageJsonData.react = packageJsonData.react || {};
    packageJsonData.react.entrypoint = packageJsonData.react.entrypoint || './MyComponent.jsx';

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

    if (!packageJsonData.react || !packageJsonData.react.entrypoint) {
      console.error(
        'react.entrypoint key does not exist in: ' + packageJson + '. Did you forget to run `react-cli init`?'
      );
      process.exit(1);
    }

    temp.track();
    temp.mkdir('react-cli-serve', function(err, dirPath) {
      errGuard(err);
      fs.writeFileSync(
        path.join(dirPath, 'index.html'),
        fs.readFileSync(
          path.join(__dirname, 'index.html')
        )
      );

      var webpackEntryPath = path.join(__dirname, 'entrypoint.js');

      var config = {
        devtool: 'eval',
        entry: [
          require.resolve('webpack-dev-server/client') + '??http://localhost:3000',
          require.resolve('webpack/hot/only-dev-server'),
          webpackEntryPath,
        ],
        output: {
          path: dirPath,
          filename: 'bundle.js',
        },
        plugins: [
          new webpack.HotModuleReplacementPlugin(),
          new webpack.NoErrorsPlugin()
        ],
        resolve: {
          alias: {
            REACT_ENTRYPOINT: path.join(
              packageRoot,
              packageJsonData.react.entrypoint
            ),
            react: path.dirname(require.resolve('react')),
          },
          extensions: ['', '.js', '.jsx'],
        },
        module: {
          loaders: [
            {
              test: /\.jsx$/,
              loader: ['react-hot-loader', 'babel-loader'].map(require.resolve.bind(require)).join('!'),
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
      }).listen(3000, 'localhost', function (err, result) {
        errGuard(err);
        console.log('Serving ' + dirPath + ' at localhost:3000');
      });

      var opened = false;
      compiler.plugin('done', function() {
        if (!opened) {
          open('http://localhost:3000/');
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
    args[0] = args[0] || '.';
    var packageRoot = path.resolve(args[0]);
    var packageJson = path.join(packageRoot, 'package.json');

    if (!fs.existsSync(packageJson)) {
      console.error(packageJson + ' does not exist.');
      process.exit(1);
    }

    var dirPath = args[1];
    if (!dirPath) {
      console.error('You must provide a destination directory.');
      process.exit(1);
    }

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    }

    var packageJsonData = require(packageJson);

    if (!packageJsonData.react || !packageJsonData.react.entrypoint) {
      console.error(
        'react.entrypoint key does not exist in: ' + packageJson + '. Did you forget to run `react-cli init`?'
      );
      process.exit(1);
    }

    var reactEntrypoint = path.join(
      packageRoot,
      packageJsonData.react.entrypoint
    );

    var indexPath = path.join(dirPath, 'index.html');

    // Server render the component
    StandardWebpack.shim();
    var component = require(reactEntrypoint);
    var markup = React.renderToString(React.createElement(component));
    fs.writeFileSync(
      indexPath,
      fs.readFileSync(
        path.join(__dirname, 'index.html'),
        {encoding: 'utf8'}
      ).replace('<!-- REACT-CLI MARKUP -->', markup),
      {encoding: 'utf8'}
    );

    var webpackEntryPath = path.join(__dirname, 'entrypoint.js');

    var config = {
      entry: webpackEntryPath,
      output: {
        path: dirPath,
        filename: 'bundle.js', // TODO: use [hash]
      },
      resolve: {
        alias: {
          REACT_ENTRYPOINT: reactEntrypoint,
          react: path.dirname(require.resolve('react')),
        },
        extensions: ['', '.js', '.jsx'],
      },
      plugins: [
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify('production'),
        }),
        new webpack.optimize.UglifyJsPlugin(),
        new webpack.optimize.OccurenceOrderPlugin(),
      ],
      module: {
        loaders: [
          {
            test: /\.jsx$/,
            loader: ['react-hot-loader', 'babel-loader'].map(require.resolve.bind(require)).join('!'),
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
    webpack(config).run(function(err, stats) {
      errGuard(err);
      console.log(stats.toString());
    });
  },
};

module.exports = Workflows;
