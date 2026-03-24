const cors_proxy = require('../lib/cors-anywhere');

const proxy = cors_proxy.createServer({
    originWhitelist: process.env.CORSANYWHERE_WHITELIST ? process.env.CORSANYWHERE_WHITELIST.split(',') : [],
    requireHeader: ['origin', 'x-requested-with'],
    removeHeaders: ['cookie', 'cookie2']
});

module.exports = (req, res) => {
    // This allows the proxy to handle the request/response cycle
    proxy.emit('request', req, res);
};
