const cors_proxy = require('./lib/cors-anywhere');

const proxy = cors_proxy.createServer({
  originWhitelist: [],
  requireHeader: [],
  removeHeaders: ['cookie', 'cookie2'],
  redirectSameOrigin: false
});

module.exports = (req, res) => {
  const marker = '?url=';
  const markerIndex = req.url.indexOf(marker);

  if (markerIndex === -1) {
    res.statusCode = 404;
    res.setHeader('access-control-allow-origin', '*');
    res.end('Use /proxy?url=https://example.com');
    return;
  }

  let targetUrl = req.url.substring(markerIndex + marker.length);

  // Repair Vercel normalization: https:/example.com -> https://example.com
  targetUrl = targetUrl.replace(/^(https?:)\/(?!\/)/i, '$1//');

  if (!/^https?:\/\//i.test(targetUrl)) {
    res.statusCode = 400;
    res.setHeader('access-control-allow-origin', '*');
    res.end('Invalid target URL');
    return;
  }

  // Do not decodeURIComponent here. Signed URLs must remain unchanged.
  req.url = '/' + targetUrl;
  proxy.emit('request', req, res);
};
