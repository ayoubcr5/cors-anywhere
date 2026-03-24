const https = require('https');
const http = require('http');
const { URL } = require('url');

export default function handler(req, res) {
    // 1. Setup CORS - Allow your domain to talk to this proxy
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 2. Extract the Target URL
    // Supports ?url=https://...
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).send('Usage: /api?url=https://example.com/file.mpd');
    }

    try {
        const urlObj = new URL(targetUrl);
        const client = urlObj.protocol === 'https:' ? https : http;

        // 3. Prepare Clean Headers
        // We copy incoming headers but MUST delete the ones that cause conflicts
        const requestHeaders = { ...req.headers };
        
        delete requestHeaders['host'];
        delete requestHeaders['origin'];
        delete requestHeaders['referer'];
        delete requestHeaders['connection'];
        delete requestHeaders['content-length'];

        const options = {
            method: req.method,
            headers: {
                ...requestHeaders,
                'host': urlObj.host, // Crucial: The target server needs its own host header
                'user-agent': req.headers['user-agent'] || 'Mozilla/5.0'
            },
            timeout: 8000 // Vercel free limit is ~10s, we set 8s to be safe
        };

        const proxyReq = client.request(targetUrl, options, (proxyRes) => {
            // 4. Clean the Response Headers
            const headersToForward = { ...proxyRes.headers };
            
            // Remove the target's CORS and Security headers to avoid browser clashes
            Object.keys(headersToForward).forEach(h => {
                const lowKey = h.toLowerCase();
                if (lowKey.startsWith('access-control-') || 
                    lowKey === 'content-security-policy' || 
                    lowKey === 'x-frame-options') {
                    delete headersToForward[h];
                }
            });

            // Send the cleaned headers back to the browser
            res.writeHead(proxyRes.statusCode, headersToForward);
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (e) => {
            console.error(e);
            res.status(500).send('Proxy Request Failed: ' + e.message);
        });

        // Forward the request body (important for POST)
        req.pipe(proxyReq);

    } catch (err) {
        res.status(400).send('Invalid URL format: ' + err.message);
    }
}
