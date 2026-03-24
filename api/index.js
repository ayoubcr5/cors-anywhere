const urlObj = new URL(targetUrl);
        const client = urlObj.protocol === 'https:' ? https : http;

        // 1. Create a clean copy of the incoming headers
        const requestHeaders = { ...req.headers };

        // 2. DELETE the headers that cause issues (don't set to undefined)
        delete requestHeaders['host'];
        delete requestHeaders['origin'];
        delete requestHeaders['referer'];
        delete requestHeaders['connection'];
        delete requestHeaders['content-length'];

        const options = {
            method: req.method,
            headers: {
                ...requestHeaders,
                'host': urlObj.host, // Set host to the destination site
                'user-agent': req.headers['user-agent'] || 'Mozilla/5.0',
            }
        };

        const proxyReq = client.request(targetUrl, options, (proxyRes) => {
            const headersToForward = { ...proxyRes.headers };
            
            // Scrub target's CORS headers
            Object.keys(headersToForward).forEach(h => {
                if (h.toLowerCase().startsWith('access-control-')) {
                    delete headersToForward[h];
                }
            });

            delete headersToForward['content-security-policy'];
            delete headersToForward['x-frame-options'];

            res.writeHead(proxyRes.statusCode, headersToForward);
            proxyRes.pipe(res);
        });
