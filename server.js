const cors_proxy = require('./lib/cors-anywhere');

const proxy = cors_proxy.createServer({
  originWhitelist: [],
  requireHeader: [],
  removeHeaders: ['cookie', 'cookie2'],
  redirectSameOrigin: false
});

module.exports = (req, res) => {
  const requestUrl = new URL(req.url, `https://${req.headers.host}`);
  let targetUrl = requestUrl.searchParams.get('url');

  if (!targetUrl) {
    res.statusCode = 400;
    res.setHeader('access-control-allow-origin', '*');
    res.end('Missing url. Use /proxy?url=https://example.com');
    return;
  }

  req.url = '/' + targetUrl;
  proxy.emit('request', req, res);
};
