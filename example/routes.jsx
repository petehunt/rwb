'use strict';

var React = require('react');
var {Route} = require('react-router');

//module.exports = <Route asyncHandler={'./MyComponent'} />;
// turns into: <Route handler={createAsyncRouteHandler(require('bundle!./MyComponent'))} />

module.exports = <Route handler={require('./MyComponent')} />;
