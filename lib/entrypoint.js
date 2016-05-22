const React = require('react')
const ReactDOM = require('react-dom')
const Root = require('__rwb_root__')
const {AppContainer} = require('react-hot-loader')

const reactRoot = document.getElementById(RWB.DOM_NODE_ID)

ReactDOM.render(<AppContainer><Root /></AppContainer>, reactRoot)

if (module.hot) {
  module.hot.accept('__rwb_root__', () => {
    const NewRoot = require('__rwb_root__')
    ReactDOM.render(<AppContainer><NewRoot /></AppContainer>, reactRoot)
  })
}
