const http = require('http');
const https = require('https');

const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 3000;

// Parse env lists (same style as CORS Anywhere)
function parseEnvList(env) {
    if (!env) return [];
    return env.split(',');
}

const originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
const originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);

// Optional: require headers like CORS Anywhere
const requireHeaders = ['origin', 'x-requested-with'];

const server = http.createServer((req, res) => {
    const origin = req.headers.origin;

    // 🔒 Origin filtering
    if (originBlacklist.includes(origin)) {
        res.writeHead(403);
        return res.end('Forbidden: Origin blacklisted');
    }

    if (originWhitelist.length && !originWhitelist.includes(origin)) {
        res.writeHead(403);
        return res.end('Forbidden: Origin not whitelisted');
    }

    // 🔒 Require certain headers
    for (const header of requireHeaders) {
        if (!req.headers[header]) {
            res.writeHead(400);
            return res.end(`Missing required header: ${header}`);
        }
    }

    // 🌍 CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        return res.end();
    }

    // 🧭 Extract target
    const targetPath = req.url.replace(/^\/proxy\/?/, '');
    const initialUrl = 'https://' + targetPath;

    console.log(`Forwarding to: ${initialUrl}`);

    function fetchUrl(currentUrl, redirectCount = 0) {
        if (redirectCount > 5) {
            res.writeHead(500);
            return res.end('Proxy Error: Too many redirects');
        }

        https.get(currentUrl, (proxyRes) => {
            // 🔁 Handle redirects
            if (
                [301, 302, 303, 307, 308].includes(proxyRes.statusCode) &&
                proxyRes.headers.location
            ) {
                const nextUrl = new URL(proxyRes.headers.location, currentUrl).href;
                console.log(`[Redirect ${proxyRes.statusCode}] → ${nextUrl}`);
                return fetchUrl(nextUrl, redirectCount + 1);
            }

            // 📦 Clone headers
            const headersToForward = { ...proxyRes.headers };

            // ❌ Remove problematic headers (your addition)
            delete headersToForward['host'];
            delete headersToForward['connection'];

            // Optional: mimic CORS Anywhere cleanup
            delete headersToForward['content-length']; // safer when streaming

            res.writeHead(proxyRes.statusCode, headersToForward);

            proxyRes.pipe(res);
        }).on('error', (err) => {
            res.writeHead(500);
            res.end('Proxy Error: ' + err.message);
        });
    }

    fetchUrl(initialUrl);
});

server.listen(port, host, () => {
    console.log(`Custom CORS Proxy running on http://${host}:${port}`);
});
