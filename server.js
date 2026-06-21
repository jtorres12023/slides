const http = require('http');
const fs = require('fs');
const os = require('os');
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

const remoteClients = new Set();
let remoteState = {
  deckId: null,
  deckTitle: 'Slideshow',
  slide: 1,
  totalSlides: 0,
  updatedAt: null
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

function sendJson(response, statusCode, value) {
  sendResponse(response, statusCode, JSON.stringify(value), {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
}

function readJsonBody(request, callback) {
  let body = '';

  request.on('data', chunk => {
    body += chunk;
    if (body.length > 16_384) {
      request.destroy();
    }
  });

  request.on('end', () => {
    try {
      callback(null, body ? JSON.parse(body) : {});
    } catch (error) {
      callback(error);
    }
  });
}

function broadcastRemoteEvent(eventName, payload) {
  const message = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  remoteClients.forEach(client => client.write(message));
}

function openRemoteEventStream(request, response) {
  response.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive'
  });
  response.write(`event: state\ndata: ${JSON.stringify(remoteState)}\n\n`);
  remoteClients.add(response);

  const heartbeat = setInterval(() => {
    response.write(': keep-alive\n\n');
  }, 20_000);

  request.on('close', () => {
    clearInterval(heartbeat);
    remoteClients.delete(response);
  });
}

function getLanAddresses() {
  const addresses = [];
  const interfaces = os.networkInterfaces();

  Object.values(interfaces).forEach(entries => {
    (entries || []).forEach(entry => {
      if (entry.family === 'IPv4' && !entry.internal) {
        addresses.push(entry.address);
      }
    });
  });

  return addresses;
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const pathname = requestUrl.pathname;

  if (pathname === '/' || pathname === '/slideshow') {
    sendFile(response, path.join(rootDir, 'slideshow.html'));
    return;
  }

  if (pathname === '/remote') {
    sendFile(response, path.join(rootDir, 'remote.html'));
    return;
  }

  if (pathname === '/api/remote/events' && request.method === 'GET') {
    openRemoteEventStream(request, response);
    return;
  }

  if (pathname === '/api/remote/state' && request.method === 'GET') {
    sendJson(response, 200, remoteState);
    return;
  }

  if (pathname === '/api/remote/state' && request.method === 'POST') {
    readJsonBody(request, (error, body) => {
      if (error) {
        sendJson(response, 400, { error: 'Invalid JSON body' });
        return;
      }

      remoteState = {
        deckId: typeof body.deckId === 'string' ? body.deckId : remoteState.deckId,
        deckTitle: typeof body.deckTitle === 'string' ? body.deckTitle : remoteState.deckTitle,
        slide: Number.isInteger(body.slide) ? body.slide : remoteState.slide,
        totalSlides: Number.isInteger(body.totalSlides) ? body.totalSlides : remoteState.totalSlides,
        updatedAt: new Date().toISOString()
      };
      broadcastRemoteEvent('state', remoteState);
      sendJson(response, 200, remoteState);
    });
    return;
  }

  if (pathname === '/api/remote/command' && request.method === 'POST') {
    readJsonBody(request, (error, body) => {
      const allowedCommands = new Set(['previous', 'next', 'first', 'last', 'goto']);
      if (error || !allowedCommands.has(body.command)) {
        sendJson(response, 400, { error: 'Invalid remote command' });
        return;
      }

      const command = {
        command: body.command,
        slide: Number.isInteger(body.slide) ? body.slide : null,
        sentAt: new Date().toISOString()
      };
      broadcastRemoteEvent('command', command);
      sendJson(response, 200, { ok: true, command });
    });
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
  getLanAddresses().forEach(address => {
    console.log(`Phone remote: http://${address}:${port}/remote`);
  });
});
