const cors_proxy = require('./lib/cors-anywhere');

// Create the proxy instance
const proxy = cors_proxy.createServer({
    originWhitelist: [], // Allow all
    requireHeader: [],    // Set to [] to stop the "Missing Header" error
    removeHeaders: ['cookie', 'cookie2'],
    redirectSameOrigin: false // Prevents the redirect loop you saw earlier
});

// Vercel expects a function export
module.exports = (req, res) => {
    // Fix the protocol doubling/collapsing issue (https:/ -> https://)
    if (req.url.match(/^\/https?:\/[^/]/)) {
        req.url = req.url.replace(/^(\/https?:\/)/, '$1/');
    }

    // Pass the request to the proxy
    proxy.emit('request', req, res);
};
