const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// 1. Configure CORS to only allow starnhl.com
const allowedOrigins = [
    'https://starnhl.com', 
    'https://www.starnhl.com'
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl) 
        // Remove "!origin" if you want to be extremely strict
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Access denied: Unauthorized Origin'));
        }
    }
};

app.use(cors(corsOptions));

// 2. Security Middleware to block non-browser/direct access
app.use((req, res, next) => {
    const origin = req.get('origin') || req.get('referer');
    
    // Check if the request is coming from your domain
    const isAllowed = allowedOrigins.some(domain => origin && origin.startsWith(domain));

    if (!isAllowed) {
        return res.status(403).send('Forbidden: Access allowed only from starnhl.com');
    }
    next();
});

/**
 * Proxy 1: ?url= style
 */
app.get('/proxy', (req, res, next) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('Missing url parameter');

    createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        pathRewrite: { '^/proxy': '' },
        onProxyRes: (proxyRes) => {
            // Ensure the response headers also reflect your specific domain
            proxyRes.headers['Access-Control-Allow-Origin'] = req.get('origin') || 'https://starnhl.com';
        }
    })(req, res, next);
});

/**
 * Proxy 2: /url style (CORS Anywhere)
 */
app.use('/:targetUrl*', (req, res, next) => {
    const targetUrl = req.params.targetUrl + req.params[0];
    if (!targetUrl || targetUrl === 'favicon.ico') return next();

    createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        pathRewrite: (path) => path.replace(/^\//, ''),
        onProxyRes: (proxyRes) => {
            proxyRes.headers['Access-Control-Allow-Origin'] = req.get('origin') || 'https://starnhl.com';
        }
    })(req, res, next);
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Secure Proxy running for starnhl.com on port ${port}`));
