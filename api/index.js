const https = require('https');
const http = require('http');

export default function handler(req, res) {
    // 1. Force CORS headers for every single response
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 2. Advanced URL Extraction
    // This looks at the 'url' query parameter, then the full path
    let targetUrl = req.query.url || req.url.substring(req.url.indexOf('http'));

    if (!targetUrl || targetUrl === 'undefined' || !targetUrl.startsWith('http')) {
        return res.status(400).json({
            error: "Invalid URL provided",
            received: targetUrl,
            usage: "/?url=https://example.com/video.mpd"
        });
    }

    try {
        // Clean the URL (remove extra spaces or quotes if they exist)
        targetUrl = decodeURIComponent(targetUrl).trim();
        const urlObj = new URL(targetUrl);
        
        const client = urlObj.protocol === 'https:' ? https : http;

        const options = {
            method: req.method,
            headers: {
                ...req.headers,
                host: urlObj.host, // Crucial: Set host to the target site
                origin: undefined, // Remove your origin so the target doesn't block you
                referer: undefined
            }
        };

        const proxyReq = client.request(targetUrl, options, (proxyRes) => {
            // 3. Clean headers from the target site
            const headersToForward = { ...proxyRes.headers };
            
            // Delete any existing CORS headers from the target to avoid conflicts
            Object.keys(headersToForward).forEach(h => {
                if (h.toLowerCase().startsWith('access-control-')) {
                    delete headersToForward[h];
                }
            });

            // Prevent security blocks on your own domain
            delete headersToForward['content-security-policy'];
            delete headersToForward['x-frame-options'];

            res.writeHead(proxyRes.statusCode, headersToForward);
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (e) => {
            res.status(500).send("Proxy Request Error: " + e.message);
        });

        req.pipe(proxyReq);

    } catch (err) {
        res.status(400).json({
            error: "URL Parsing Failed",
            message: err.message,
            attempted: targetUrl
        });
    }
}
