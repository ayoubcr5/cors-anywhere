const http = require('http');
const https = require('https');
const { URL } = require('url');

export default function handler(req, res) {
    // 1. Precise Origin Handling
    const origin = req.headers.origin || '*';

    // Set CORS headers immediately
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 2. Extract and Validate Target URL
    let targetPath = req.url.split('/?url=')[1] || req.url.substring(1);
    if (!targetPath || targetPath === 'api') {
        return res.status(200).send('Proxy active. Usage: /https://example.com');
    }

    const targetUrl = targetPath.startsWith('http') ? targetPath : 'https://' + targetPath;

    try {
        const urlObj = new URL(targetUrl);
        const client = urlObj.protocol === 'https:' ? https : http;

        const requestHeaders = { ...req.headers };
        delete requestHeaders['host'];
        delete requestHeaders['origin'];
        delete requestHeaders['referer'];

        const proxyReq = client.request(targetUrl, {
            method: req.method,
            headers: { ...requestHeaders, host: urlObj.host }
        }, (proxyRes) => {
            
            // 3. THE FIX: Filter out the target's own CORS headers
            const headersToForward = { ...proxyRes.headers };
            Object.keys(headersToForward).forEach(header => {
                if (header.toLowerCase().startsWith('access-control-')) {
                    delete headersToForward[header];
                }
            });

            // Remove security blocks
            delete headersToForward['content-security-policy'];
            delete headersToForward['x-frame-options'];

            res.writeHead(proxyRes.statusCode, headersToForward);
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (e) => res.status(500).send('Proxy Error: ' + e.message));
        req.pipe(proxyReq);

    } catch (err) {
        res.status(400).send('Invalid URL');
    }
}
