const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(cors()); // This enables CORS for all routes

// This route will take the target from a query parameter: ?url=...
app.use('/proxy', (req, res, next) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('Missing url parameter');

    createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        ignorePath: true, // Crucial: prevents the proxy from appending '/proxy' to the target
        onProxyRes: (proxyRes) => {
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        }
    })(req, res, next);
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Proxy running on port ${port}`));
