const cors_proxy = require('./lib/cors-anywhere');

const proxy = cors_proxy.createServer({
  originWhitelist: [],
  requireHeader: [],
  removeHeaders: ['cookie', 'cookie2'],
  redirectSameOrigin: false
});

module.exports = (req, res) => {
  if (!req.url.startsWith('/proxy?url=')) {
    res.statusCode = 404;
    res.setHeader('access-control-allow-origin', '*');
    res.end('Use /proxy?url=https://example.com');
    return;
  }

  const targetUrl = req.url.substring('/proxy?url='.length);

  if (!targetUrl) {
    res.statusCode = 400;
    res.setHeader('access-control-allow-origin', '*');
    res.end('Missing url parameter');
    return;
  }

  req.url = '/' + targetUrl;
  proxy.emit('request', req, res);
};
