'use strict';

var fs = require('fs');
var path = require('path');

var Workflows = {
  init: function() {
    var packageJson = path.join(process.cwd(), 'package.json');

    if (!fs.existsSync(packageJson)) {
      console.error(packageJson + ' does not exist.');
      process.exit(-1);
    }

    var packageJsonData = require(packageJson);
    packageJsonData.dependencies = packageJsonData.dependencies || {};
    packageJsonData.dependencies.react = packageJsonData.dependencies.react || '0.13.3';
    packageJsonData.react = packageJsonData.react || {};
    packageJsonData.react.entrypoint = packageJsonData.react.entrypoint || './MyComponent.jsx';

    fs.writeFileSync(packageJson, JSON.stringify(packageJsonData, undefined, 2), {encoding: 'utf8'});
  },
};

module.exports = Workflows;
