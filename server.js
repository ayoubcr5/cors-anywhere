const cors_proxy = require('./lib/cors-anywhere');

const proxy = cors_proxy.createServer({
    originWhitelist: [], 
    requireHeader: [], 
    removeHeaders: ['cookie', 'cookie2'],
    redirectSameOrigin: false
});

// Set the base URL of your stream provider here
const STREAM_BASE = "https://fastlylive.stan.video/out/v1/live/live-6314476C/CENCxHD/";

module.exports = (req, res) => {
    let targetUrl = req.url.substring(1);

    // 1. Check if the request is a relative segment (doesn't start with http)
    if (!targetUrl.startsWith('http') && !targetUrl.includes('%3A')) {
        // Automatically attach the base provider URL to the segment name
        targetUrl = STREAM_BASE + targetUrl;
        console.log("Redirecting relative segment to:", targetUrl);
    } else {
        // 2. Handle Encoded or standard Full URLs
        try {
            if (targetUrl.includes('%3A')) {
                targetUrl = decodeURIComponent(targetUrl);
            }
        } catch (e) { console.error(e); }

        if (targetUrl.match(/^https?:\/[^/]/)) {
            targetUrl = targetUrl.replace(/^(https?:\/)/, '$1/');
        }
    }

    req.url = '/' + targetUrl;
    proxy.emit('request', req, res);
};
