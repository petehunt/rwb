'use strict';

var StandardWebpack = require('./StandardWebpack');
var WebpackDevServer = require('webpack-dev-server');

var assign = require('object-assign');
var fs = require('fs');
var ncp = require('ncp');
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
    packageJsonData.react = packageJsonData.react || {};
    packageJsonData.react.entrypoint = packageJsonData.react.entrypoint || './MyComponent.jsx';

    fs.writeFileSync(packageJson, JSON.stringify(packageJsonData, undefined, 2), {encoding: 'utf8'});

    ncp(path.join(__dirname, 'template'), process.cwd(), function(err) {
      errGuard(err);
      console.log('Project created. Don\'t forget to run `npm install`, since some dependencies may have changed.');
    });
  },

  serve: function(args) {
    var packageRoot = args[0] || process.cwd();
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
          'webpack-dev-server/client?http://localhost:3000',
          'webpack/hot/only-dev-server',
          webpackEntryPath,
        ],
        output: {
          path: dirPath,
          filename: 'bundle.js',
          publicPath: '/static/'
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
          },
          extensions: ['', '.js', '.jsx'],
        },
        module: {
          loaders: [
            {
              test: /\.jsx?$/,
              loader: 'react-hot-loader!babel-loader',
              include: packageRoot,
            },
            {
              test: /\.css$/,
              loader: 'style-loader!css-loader!autoprefixer-loader',
            },
            {
              test: /\.(png|jpg|svg)$/,
              loader: 'url-loader?limit=8192'
            },
          ]
        },
      };

      new WebpackDevServer(webpack(config), {
        contentBase: dirPath,
        publicPath: config.output.publicPath,
        hot: true,
        historyApiFallback: true
      }).listen(3000, 'localhost', function (err, result) {
        errGuard(err);
        console.log('Serving ' + dirPath + ' at localhost:3000');
      });
    });
  },
};

module.exports = Workflows;
