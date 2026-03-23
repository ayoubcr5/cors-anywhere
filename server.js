const http = require('http');
const httpProxy = require('http-proxy');

// Create the proxy server instance
const proxy = httpProxy.createProxyServer({});

// Intercept the request to modify headers
proxy.on('proxyReq', function(proxyReq, req, res, options) {
  proxyReq.removeHeader('Origin');
  proxyReq.removeHeader('Referer');
  
  // Optional: Set a custom User-Agent if the target blocks empty referers
  proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
});

const server = http.createServer((req, res) => {
  // You can pass the target URL via a query param or environment variable
  // For Railway, it's best to use an environment variable for the target
  const target = process.env.TARGET_URL || 'https://api.example.com';

  proxy.web(req, res, {
    target: target,
    changeOrigin: true, // Necessary to change the host header to the target's host
  }, (err) => {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Proxy Error: ' + err.message);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Proxy server scrubbing headers on port ${PORT}`);
});
