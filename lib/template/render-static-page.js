'use strict';

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const Root = require('__rwb_root__');

const fs = require('fs');
const path = require('path');

function renderStaticPage() {
  fs.writeFileSync(
    path.join(RWB.STATIC_ROOT, 'index.html'),
    '<!doctype html>' + ReactDOMServer.renderToStaticMarkup(
      <html>
        <head>
          <meta charSet="utf-8" />
          <title>MyComponent</title>
          {RWB.ASSETS.css.map((a, idx) => <link key={idx} rel="stylesheet" href={a} />)}
        </head>
        <body>
          <RWB.DOM_NODE_ELEMENT
            id={RWB.DOM_NODE_ID}
            dangerouslySetInnerHTML={{
              __html: ReactDOMServer.renderToString(<Root />),
            }}
          />
        {RWB.ASSETS.js.map((a, idx) => <script key={idx} src={a} />)}
        </body>
      </html>
    ),
    {encoding: 'utf8'}
  );
}

module.exports = renderStaticPage;
