# react-cli

  * Getting started building a React app requires a lot of boilerplate and analysis paralysis.
  * This is React. Any tool should be for composable components, not a top-down full app.
  * If we're building composable components, we need a solution for static assets in npm

## How to use

```
mkdir myapp
cd myapp
npm init
react-cli init
react-cli serve
```

This will open a browser window. Hot loading, sourcemaps, and a default set of loaders are all set up for you. There's no codegen, so anytime you update `react-cli` you'll get the latest version of the config for free.

See `package.json`'s `react.entrypoint` key for how to change which component `react-cli` renders.

## Generating a static site

Want a static site with a production optimized bundle?

```
react-cli static build/
```

This does everything correctly, inculuding `NODE_ENV` and minification.

## Using it in production

`react-cli` is designed for building small reusable components and prototypes. When you go to production you'll want to eventually own your own webpack config for custom loaders, code splitting etc.

Use `react-cli validate path/to/webpack.config.js` to validate your webpack config. If your config validates successfully, you can be guaranteed that any components created with `react-cli` will work in your project.
