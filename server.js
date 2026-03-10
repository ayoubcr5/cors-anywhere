var host = process.env.HOST || '0.0.0.0';
var port = process.env.PORT || 8080;

var cors_proxy = require('./lib/cors-anywhere');

// Helper to parse environment variables for white/blacklists
function parseEnvList(env) {
  if (!env) return [];
  return env.split(',');
}

var originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
var originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);
var checkRateLimit = require('./lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);

cors_proxy.createServer({
  originBlacklist: originBlacklist,
  originWhitelist: originWhitelist,
  
  /**
   * ADAPTIVE CHANGE: 
   * Removed 'x-requested-with' requirement to make it easier for 
   * HLS players (like hls.js or Shaka) to call the license server.
   */
  requireHeader: [], 

  checkRateLimit: checkRateLimit,

  /**
   * ADAPTIVE CHANGE:
   * We only remove headers that Heroku or the browser injects 
   * that might break the Irdeto handshake. 
   * We MUST keep 'authorization' and 'content-type'.
   */
  removeHeaders: [
    'cookie',
    'cookie2',
    'x-request-start',
    'x-request-id',
    'via',
    'connect-time',
    'total-route-time'
  ],

  /**
   * ADAPTIVE CHANGE:
   * Some license servers check the User-Agent. This ensures the 
   * proxy doesn't overwrite it with a generic Node.js one.
   */
  setHeaders: {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },

  redirectSameOrigin: true,
  httpProxyOptions: {
    xfwd: false,
    // Ensure the proxy can handle the binary response from the license server
    buffer: require('stream').PassThrough(), 
  },
}).listen(port, host, function() {
  console.log('Adaptive CORS Anywhere running on ' + host + ':' + port);
});
