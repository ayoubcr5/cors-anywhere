const cors_proxy = require('./lib/cors-anywhere');

const proxy = cors_proxy.createServer({
    originWhitelist: [], 
    requireHeader: [], 
    removeHeaders: ['cookie', 'cookie2'],
    redirectSameOrigin: false
});

module.exports = (req, res) => {
    // 1. Remove the leading slash
    let targetUrl = req.url.substring(1);

    // 2. Try to decode if the URL looks encoded (URI encoded or containing %3A)
    try {
        if (targetUrl.includes('%3A') || targetUrl.includes('%2F')) {
            targetUrl = decodeURIComponent(targetUrl);
        }
    } catch (e) {
        console.error("Decoding failed", e);
    }

    // 3. Fix the Vercel "single slash" issue if it still exists after decoding
    if (targetUrl.match(/^https?:\/[^/]/)) {
        targetUrl = targetUrl.replace(/^(https?:\/)/, '$1/');
    }

    // 4. Update the request URL for the proxy engine
    req.url = '/' + targetUrl;

    proxy.emit('request', req, res);
};
