import React from 'react';
import ReactDOMServer from 'react-dom/server';
import MyComponent from './MyComponent';

import fs from 'fs';
import path from 'path';

const renderMyComponent = function() {
  const markup = ReactDOMServer.renderToString(<MyComponent />);
  const fileName = path.join(__rwbStaticRoot, 'index.html');
  fs.writeFileSync(fileName,
`<!doctype html>
<html>

<head>
<title>MyComponent</title>
${__rwbAssets.css.map((a) => `<link rel="stylesheet" type="text/css" href="/${a}" />`).join('\n')}
</head>

<body>
<div id=".react-root">${markup}</div>
${__rwbAssets.js.map((a) => `<script src="/${a}"></script>`).join('\n')}
</body>

</html>`,
    {encoding: 'utf8'}
  );
};

export default renderMyComponent;
``
