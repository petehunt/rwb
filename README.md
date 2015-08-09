# react-cli

**NOTE: this is not ready for prime-time just yet.**

React-CLI has two goals.

  * Reduce "build tool bullshit" to 0
  * Enable sharing of components in npm

## Reducing build tool bullshit

  * **No codegen:** all configs are built inside of `react-cli`. There's a single entry in `package.json` that tells `react-cli` where your `Routes` are. When `react-cli` is updated, you'll get the latest webpack config for free.
  * **Designed for composable components:** there isn't anything specific to single-page-apps in here. Full single-page-apps are just larger components. This can be used for tiny components or huge apps.
  * **Best-in-class developer experience:** the developer experience is (dare I say) as good as it gets, with source maps, babel and hot reloading working out-of-the-box.

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

You can change the port by setting the REACT_CLI_PORT environment variable: `REACT_CLI_PORT=3001 react-cli serve`

## Build a static site

```
react-cli static
```

This will create `dist/index.html`, `dist/bundle.js` and `dist/styles.css`. These files are optimized and suitable for production, though if you have a large, complicated single-page app you'll want to roll your own multi-bundle setup (`react-cli` will solve this soon).

## Going to production

When you go to production you'll have your own webpack config. `react-cli validate` will ensure that your config will work with components created with `react-cli`.

```
react-cli validate ./path/to/webpack.config.js
```

## Open issues

  * Did we pick the right loaders?
  * Is this going to fragment the npm community? (yes, but that's the price of progress, and we should try to minimize this as much as possible)
  * `react-cli static` should do an opinionated production build.

## FAQ

  * **It's not modular and the code sucks.** Yep, this was hacked out over the course of a few days on Caltrain, but the design is sane