const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Global CORS - allows your proxy to be accessed from other domains
app.use(cors());

/**
 * PROXY 1: Query Param Style
 * Access via: /proxy?url=https://example.com
 */
app.get('/proxy', (req, res, next) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('Missing url parameter');

    createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        // ignorePath is set to true so it doesn't try to send '/proxy' to the target
        pathRewrite: { '^/proxy': '' }, 
        onProxyRes: (proxyRes) => {
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        }
    })(req, res, next);
});

/**
 * PROXY 2: Path-based Style (CORS Anywhere style)
 * Access via: /anywhere/https://example.com
 */
app.use('/anywhere/:targetUrl*', (req, res, next) => {
    // Extracts the full URL after /anywhere/
    const targetUrl = req.params.targetUrl + req.params[0];
    
    if (!targetUrl) return res.status(400).send('No target URL provided');

    createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        pathRewrite: (path) => path.replace(/^\/anywhere\//, ''),
        onProxyRes: (proxyRes) => {
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        }
    })(req, res, next);
});

// Default Home Route
app.get('/', (req, res) => {
    res.send('Proxy Server is Active. Use /proxy?url= or /anywhere/URL');
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Unified Proxy running on port ${port}`));
