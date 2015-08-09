'use strict';

var MemoryFilesystem = require('memory-fs');

var assign = require('object-assign');
var contextify = require('contextify');
var path = require('path');
var webpack = require('webpack');

function webpackRequire(config, name, cb) {
  config = assign({}, config);
  config.resolve = config.resolve || {};
  config.resolve.alias = config.resolve.alias || {};
  config.resolve.alias.ENTRYPOINT = name;
  config.entry = require.resolve('./webpackRequireEntrypoint');
  config.output = {filename: 'bundle.js', path: '/'};

  var compiler = webpack(config);
  var fs = new MemoryFilesystem();
  compiler.outputFileSystem = fs;

  var done = false;
  compiler.plugin('done', function() {
    if (done) {
      return;
    }
    done = true;
    var data = fs.readFileSync(path.join(compiler.outputPath, 'bundle.js'), 'utf8');
    var script = contextify.createScript(data);
    cb(null, function() {
      var context = contextify.createContext({global: {}});
      script.runInContext(context);
      return context.getGlobal().global.entrypoint;
    });
  });

  compiler.run(function(err) {
    if (err) {
      if (done) {
        return;
      }
      done = true;
      cb(err);
    }
  });
}

module.exports = webpackRequire;
