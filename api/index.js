const { URL } = require('url');
const https = require('https');
const http = require('http');

export default function handler(req, res) {
    const origin = req.headers.origin || '*';

    // Set CORS headers immediately for EVERY response
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Get URL from query string: ?url=https://...
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).send('Missing "url" parameter.');
    }

    try {
        const urlObj = new URL(targetUrl);
        const client = urlObj.protocol === 'https:' ? https : http;

        const proxyReq = client.request(targetUrl, {
            method: req.method,
            headers: { 
                ...req.headers, 
                host: urlObj.host,
                origin: undefined, // Scrub origin to trick the target
                referer: undefined 
            }
        }, (proxyRes) => {
            // Scrub target's CORS headers to avoid "Multiple allow-origin" error
            const headers = { ...proxyRes.headers };
            delete headers['access-control-allow-origin'];
            delete headers['content-security-policy'];

            res.writeHead(proxyRes.statusCode, headers);
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (e) => res.status(500).send(e.message));
        req.pipe(proxyReq);
    } catch (e) {
        res.status(400).send('Invalid URL');
    }
}
