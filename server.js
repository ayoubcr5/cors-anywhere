var cors_proxy = require('cors-anywhere');

var host = '0.0.0.0';
var port = process.env.PORT || 8080;

var originWhitelist = ['https://starnhl.com', 'https://www.starnhl.com'];

cors_proxy.createServer({
    originWhitelist: originWhitelist,
    requireHeader: ['origin', 'x-requested-with'],
    // This cleans the response headers back to starnhl.com
    removeHeaders: ['cookie', 'cookie2', 'set-cookie'],
    
    httpProxyOptions: {
        xfwd: false,
        changeOrigin: true, // This updates the Host header to api-proxad.dc2.oqee.net
        prependPath: false,
    },

    handleInitialRequest: function(req, res, location) {
        // 1. Remove identifying headers
        delete req.headers['origin'];
        delete req.headers['referer'];
        delete req.headers['x-forwarded-for'];
        
        // 2. Add a realistic User-Agent for OQEE
        req.headers['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        
        // 3. Ensure the Host header is exactly what the destination expects
        req.headers['host'] = location.host;

        return false;
    }
}).listen(port, host, function() {
    console.log('Proxy active on port ' + port);
});
