const cors_proxy = require('cors-anywhere');

// Create the proxy server with your specific NHL whitelist
const proxy = cors_proxy.createServer({
  originWhitelist: ['https://starnhl.com', 'https://www.starnhl.com'],
  requireHeader: ['origin', 'x-requested-with'],
  removeHeaders: ['cookie', 'cookie2', 'connection', 'host'],
});

// Vercel serverless function handler
module.exports = (req, res) => {
  // Extract the target URL from the path (e.g., /https://google.com)
  req.url = req.url.replace('/api', ''); 
  
  proxy.emit('request', req, res);
};
