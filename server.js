const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({});

// Scrape off the identifying headers
proxy.on('proxyReq', function(proxyReq, req, res, options) {
    proxyReq.removeHeader('Origin');
    proxyReq.removeHeader('Referer');
    
    // Set a generic User-Agent to avoid being blocked as a bot
    proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
});

const server = http.createServer((req, res) => {
    // 1. Extract the target URL from the path (e.g., /https://startimes.com)
    // We remove the leading slash using .substring(1)
    let targetUrl = req.url.substring(1);

    // Basic validation: if no URL is provided, show a simple message
    if (!targetUrl || !targetUrl.startsWith('http')) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Usage: https://your-proxy.railway.app/https://example.com');
        return;
    }

    // 2. Handle CORS headers so you can call this from any frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // 3. Forward the request to the dynamic target
    proxy.web(req, res, {
        target: targetUrl,
        changeOrigin: true,
        prependPath: false, // Prevents the proxy from appending the path twice
        ignorePath: true    // We already have the full target URL
    }, (err) => {
        res.writeHead(500);
        res.end('Proxy Error: ' + err.message);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Dynamic Proxy running on port ${PORT}`);
});
