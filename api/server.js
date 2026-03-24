const cors_proxy = require('../lib/cors-anywhere');

const proxy = cors_proxy.createServer({
    originWhitelist: [], // Allow all or add your domain
    requireHeader: [],    // Remove this if you don't want to send X-Requested-With
    removeHeaders: ['cookie', 'cookie2'],
    redirectSameOrigin: false // CRITICAL: This stops the /api redirection loop
});

module.exports = (req, res) => {
    // 1. Manually strip the /api prefix if Vercel adds it
    req.url = req.url.replace(/^\/api/, '');

    // 2. Fix the "single slash" issue
    // This ensures that /https:/example.com becomes /https://example.com
    if (req.url.match(/^\/https?:\/[^/]/)) {
        req.url = req.url.replace(/^(\/https?:\/)/, '$1/');
    }

    proxy.emit('request', req, res);
};
