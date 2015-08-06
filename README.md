# react-cli

**NOTE: this is not ready for prime-time just yet.**

React-CLI has two goals.

  * Reduce "build tool bullshit" to 0
  * Enable sharing of components in npm

## Reducing build tool bullshit

  * **No codegen:** all configs are built inside of `react-cli`. There's a single entry in `package.json` that tells `react-cli` where your `Routes` are. When `react-cli` is updated, you'll get the latest webpack config for free.
  * **Designed for composable components:** there isn't anything specific to single-page-apps in here. Full single-page-apps are just larger components. This can be used for tiny components or huge apps.
  * **Best-in-class developer experience:** the developer experience is (dare I say) as good as it gets, with source maps, babel and hot reloading working out-of-the-box.
  * **Best practices for production builds:** `react-cli` statically analyzes your `react-router` routes and generates optimal bundles for a single-page app with code splitting, lazy loading, chunk optimization, minifcation, long-term-cacheable filenames, static CSS extraction and `NODE_ENV` all set up correctly. It also publishes a `.json` metadata file that lets you use `react-cli` in your existing web stack.

## Enable sharing of components in npm

This is a lofty goal.

  * It's hard to share components in `npm` because there's no standard way to include assets like images, fonts, and CSS.
  * If you build a component with `react-cli` you can assume that loaders are configured for CSS and images.
  * If you want to use a `react-cli`-authored component in your existing app, run `react-cli validate ./path/to/webpack.config.js` to validate that your webpack config has all the loaders that `react-cli` assumes are there.

The great developer experience of `react-cli` is a trojan horse designed to increase adoption of this "standard".

## How to develop

```
mkdir myapp
cd myapp
npm init
react-cli init
react-cli serve
```

## Going to production

```
react-cli static build/
```

This will build a static site for you in `build/`, complete with pre-rendered static markup.

If you have a dynamic server-rendered web app with lots of routing, you can use the generated `serverConfig.json` file to choose which JS and CSS files should be included for each route.

## Key insights

  * webpack needs to know the structure of your routes in order to know which entrypoints to create. There should be one entrypoint per route.
  * Removing codegen is a big productivity boost and makes generating one entrypoint per route a lot easier.

## Open issues

  * Did we pick the right loaders?
  * Is this going to fragment the npm community? (yes, but that's the price of progress, and we should try to minimize this as much as possible)
  * When `react-router` 1.0 comes out, we should support lazy-loading the route config itself to reduce cache busting.

## FAQ

  * **It's not modular and the code sucks.** Yep, this was hacked out over the course of a few days on Caltrain, but the design is sane