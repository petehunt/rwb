'use strict';

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import Root from '__rwb_root__';

import fs from 'fs';
import path from 'path';

export default function() {
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
