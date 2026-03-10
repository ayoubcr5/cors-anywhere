var host = process.env.HOST || '0.0.0.0';
var port = process.env.PORT || 8080;

var cors_proxy = require('./lib/cors-anywhere');

// Helper to parse environment variables
function parseEnvList(env) {
  if (!env) return [];
  return env.split(',');
}

var originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
var originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);

var server = cors_proxy.createServer({
  originBlacklist: originBlacklist,
  originWhitelist: originWhitelist,
  requireHeader: [], // Removed for easier debugging
  removeHeaders: [
    'cookie',
    'cookie2',
    'x-request-start',
    'x-request-id',
    'via',
    'connect-time',
    'total-route-time'
  ],
  redirectSameOrigin: true,
  httpProxyOptions: {
    xfwd: false,
  },
});

/**
 * DEBUGGING LOGS:
 * This middle layer intercepts the request before the proxy 
 * logic to show us what URL is being requested.
 */
server.on('request', (req, res) => {
  // This will show in 'heroku logs --tail'
  console.log(`[DEBUG] Incoming Request URL: ${req.url}`);
  
  // Extracting the target manually to see if it's valid
  const target = req.url.slice(1); 
  console.log(`[DEBUG] Attempting to proxy to: ${target}`);

  if (!target.startsWith('http')) {
    console.error(`[ERROR] Target URL does not start with http/https. This causes the 404!`);
  }
});

server.listen(port, host, function() {
  console.log('Running CORS Anywhere with Debug Logs on ' + host + ':' + port);
});
