const cors_proxy = require('./lib/cors-anywhere');

const proxy = cors_proxy.createServer({
    originWhitelist: [], // Allow all
    requireHeader: [],    // <--- THIS IS KEY: It allows requests without X-Requested-With
    removeHeaders: ['cookie', 'cookie2'],
    redirectSameOrigin: false
});

module.exports = (req, res) => {
    // 1. Fix Vercel's double-slash collapsing
    if (req.url.match(/^\/https?:\/[^/]/)) {
        req.url = req.url.replace(/^(\/https?:\/)/, '$1/');
    }

    // 2. Log it for your Vercel Dashboard logs (optional)
    console.log("Proxying request to: ", req.url);

    proxy.emit('request', req, res);
};
