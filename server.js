var host = process.env.PORT ? '0.0.0.0' : '127.0.0.1';
var port = process.env.PORT || 8080;

var cors_proxy = require('./lib/cors-anywhere');

// Helper to parse environment variables
function parseEnvList(env) {
  if (!env) {
    return [];
  }
  return env.split(',');
}

var originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
var originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);
var checkRateLimit = require('./lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);

var server = cors_proxy.createServer({
  originBlacklist: originBlacklist,
  originWhitelist: ['https://starnhl.com'], // Allow your domain
  
  /** * DEBUG TIP: If HEAD still fails, comment out the line below. 
   * Many HEAD requests from simple scripts forget 'x-requested-with'.
   */
  requireHeader: ['origin', 'x-requested-with'],
  
  checkRateLimit: checkRateLimit,
  removeHeaders: [
    'cookie',
    'cookie2',
    'x-heroku-queue-wait-time',
    'x-heroku-queue-depth',
    'x-heroku-dynos-in-use',
    'x-request-start',
  ],
  redirectSameOrigin: true,
  httpProxyOptions: {
    xfwd: false,
  },

  // This function intercepts the request before it is proxied
  handleInitialRequest: function(req, res, location) {
    console.log(`--> Incoming ${req.method} request for: ${location.href}`);
    
    // If the target server blocks HEAD, we can force the proxy 
    // to use GET but the client will still only see the headers.
    if (req.method === 'HEAD') {
      console.log('Detected HEAD request. Forwarding to target...');
    }
    return false; // Standard proxy behavior continues
  }
});

/**
 * Event listener to catch errors specifically from the target server
 */
server.on('proxyRes', function (proxyRes, req, res) {
    if (req.method === 'HEAD' && proxyRes.statusCode >= 400) {
        console.log(`[!] Target server rejected HEAD with status: ${proxyRes.statusCode}`);
    }
});

server.listen(port, host, function() {
  console.log('Running CORS Anywhere on ' + host + ':' + port);
});
