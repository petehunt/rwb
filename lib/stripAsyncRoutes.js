'use strict';

var recast = require('recast');

var invariant = require('invariant');

function stripAsyncRoutes(source, resourcePath) {
  var ast = recast.parse(source);

  recast.visit(ast, {
    visitCallExpression: function(path) {
      if (path.node.callee.type === 'MemberExpression' &&
          path.node.callee.object.type === 'Identifier' &&
          path.node.callee.object.name === 'React' &&
          path.node.callee.property.type === 'Identifier' &&
          path.node.callee.property.name === 'createElement' &&
          path.node.arguments.length > 1 &&
          path.node.arguments[0].type === 'Identifier' &&
          (path.node.arguments[0].name === 'Route' || path.node.arguments[0].name === 'DefaultRoute') &&
          path.node.arguments[1].type === 'ObjectExpression') {
        // This is <Route />. Check for an asyncHandler prop and rewrite.
        // TODO: support loading states
        var foundPropertyIndex = -1;
        var handlerPropertyIndex = -1;

        path.node.arguments[1].properties.forEach(function(property, i) {
          if (property.type !== 'Property' ||
              property.key.type !== 'Identifier') {
            return;
          }

          if (property.key.name === 'handler') {
            handlerPropertyIndex = i;
            return;
          }

          if (property.key.name !== 'asyncHandler') {
            return;
          }


          invariant(
            property.value.type === 'Literal' &&
              typeof property.value.value === 'string',
            'asyncHandler prop must be a literal string '
          );

          foundPropertyIndex = i;
        });

        if (foundPropertyIndex === -1) {
          this.traverse(path);
          return;
        }

        if (handlerPropertyIndex > -1) {
          invariant(
            false,
            '%s: You cannot have a handler and an asyncHandler prop on a Route',
            resourcePath
          );
        }

        var newAst = recast.parse(
          'require(' + JSON.stringify(path.node.arguments[1].properties[foundPropertyIndex].value.value) + ')'
        );
        path.node.arguments[1].properties[foundPropertyIndex].key.name = 'handler';
        path.node.arguments[1].properties[foundPropertyIndex].value = newAst;
      }

      this.traverse(path);
    }
  });

  return recast.print(ast).code;
}

module.exports = stripAsyncRoutes;
