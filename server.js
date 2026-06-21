const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const port = Number(process.env.PORT || 3000);

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

function sendResponse(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, headers);
  response.end(body);
}

function sendFile(response, filePath) {
  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      sendResponse(response, 404, 'Not found', {
        'Content-Type': 'text/plain; charset=utf-8'
      });
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[extension] || 'application/octet-stream';
    response.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size
    });
    fs.createReadStream(filePath).pipe(response);
  });
}

function resolveStaticPath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath);
  const relativePath = decodedPath.replace(/^\/+/, '');
  const filePath = path.resolve(rootDir, relativePath);

  if (!filePath.startsWith(rootDir + path.sep)) {
    return null;
  }

  return filePath;
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const pathname = requestUrl.pathname;

  if (pathname === '/' || pathname === '/slideshow') {
    sendFile(response, path.join(rootDir, 'slideshow.html'));
    return;
  }

  if (pathname.startsWith('/deck/')) {
    const deckId = pathname.slice('/deck/'.length);
    const target = new URL('/slideshow', `http://${request.headers.host || 'localhost'}`);
    target.searchParams.set('deck', deckId);
    sendResponse(response, 302, '', {
      Location: `${target.pathname}${target.search}`
    });
    return;
  }

  const filePath = resolveStaticPath(pathname);
  if (!filePath) {
    sendResponse(response, 403, 'Forbidden', {
      'Content-Type': 'text/plain; charset=utf-8'
    });
    return;
  }

  sendFile(response, filePath);
});

server.listen(port, () => {
  console.log(`Slideshow server running at http://localhost:${port}`);
});
