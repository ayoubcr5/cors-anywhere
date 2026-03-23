const http = require('http');
const https = require('https');

const PORT = 3000;

const server = http.createServer((req, res) => {
    // 1. Manually handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // 2. Define target (Safely removing the proxy prefix to avoid 'https:///' issues)
    const targetPath = req.url.replace(/^\/proxy\/?/, '');
    const initialUrl = 'https://' + targetPath;

    console.log(`Forwarding to: ${initialUrl}`);

    // 3. Function to perform the request and follow redirects automatically
    function fetchUrl(currentUrl, redirectCount = 0) {
        // Prevent infinite redirect loops
        if (redirectCount > 5) {
            res.writeHead(500);
            return res.end('Proxy Error: Too many redirects');
        }

        https.get(currentUrl, (proxyRes) => {
            // Check if the server responded with a redirect
            if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode) && proxyRes.headers.location) {
                // Safely resolve the new URL (handles both relative and absolute redirect paths)
                const nextUrl = new URL(proxyRes.headers.location, currentUrl).href;
                console.log(`[Redirect ${proxyRes.statusCode}] Following to: ${nextUrl}`);
                
                // Recursively call the function with the new URL
                return fetchUrl(nextUrl, redirectCount + 1);
            }

            // If it's not a redirect, prepare to send the data back to the browser
            // It's best practice to forward all safe headers, not just Content-Type
            const headersToForward = { ...proxyRes.headers };
            
            // Remove headers that shouldn't be proxied blindly
            delete headersToForward['host'];
            delete headersToForward['connection'];

            res.writeHead(proxyRes.statusCode, headersToForward);

            // Pipe the data directly
            proxyRes.pipe(res);
            
        }).on('error', (e) => {
            res.writeHead(500);
            res.end('Proxy Error: ' + e.message);
        });
    }

    // Start the initial fetch
    fetchUrl(initialUrl);
});

server.listen(PORT, () => {
    console.log(`Legacy Proxy running on http://localhost:${PORT}`);
});
