const http = require('http');
const https = require('https');

// Railway uses the PORT environment variable
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    // 1. Manually handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // 2. Extract the target URL from the path
    // This handles: /https://startimes.com or /startimes.com
    let targetPath = req.url.substring(1); 
    
    if (!targetPath) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        return res.end('Proxy is active. Usage: /https://example.com');
    }

    // Ensure the protocol is present
    const initialUrl = targetPath.startsWith('http') ? targetPath : 'https://' + targetPath;

    // 3. Recursive fetch function to handle redirects and header scrubbing
    function fetchUrl(currentUrl, redirectCount = 0) {
        if (redirectCount > 5) {
            res.writeHead(500);
            return res.end('Proxy Error: Too many redirects');
        }

        try {
            const urlObj = new URL(currentUrl);
            const client = urlObj.protocol === 'https:' ? https : http;

            // --- HEADER SCRUBBING LOGIC ---
            // We clone the incoming headers but specifically exclude Origin and Referer
            const requestHeaders = { ...req.headers };
            delete requestHeaders['origin'];
            delete requestHeaders['referer'];
            
            // Set the host to match the target site
            requestHeaders['host'] = urlObj.host;

            const options = {
                method: req.method,
                headers: requestHeaders
            };

            const proxyReq = client.request(currentUrl, options, (proxyRes) => {
                // Handle Redirects
                if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode) && proxyRes.headers.location) {
                    const nextUrl = new URL(proxyRes.headers.location, currentUrl).href;
                    return fetchUrl(nextUrl, redirectCount + 1);
                }

                // Prepare response headers for the browser
                const headersToForward = { ...proxyRes.headers };
                delete headersToForward['content-security-policy']; // Avoid CSP blocking on your domain

                res.writeHead(proxyRes.statusCode, headersToForward);
                proxyRes.pipe(res);
            });

            proxyReq.on('error', (e) => {
                res.writeHead(500);
                res.end('Proxy Error: ' + e.message);
            });

            // Pipe the original request body (useful for POST requests)
            req.pipe(proxyReq);

        } catch (err) {
            res.writeHead(400);
            res.end('Invalid URL provided');
        }
    }

    fetchUrl(initialUrl);
});

server.listen(PORT, () => {
    console.log(`Proxy running on port ${PORT}`);
});
