var cors_proxy = require('cors-anywhere');

var host = '0.0.0.0';
var port = process.env.PORT || 8080;

var originWhitelist = ['https://starnhl.com', 'https://www.starnhl.com'];

cors_proxy.createServer({
    originWhitelist: originWhitelist,
    requireHeader: ['origin', 'x-requested-with'],
    // This removes headers from the RESPONSE back to your browser
    removeHeaders: ['cookie', 'cookie2'], 
    
    // This modifies the REQUEST before it hits the target server
    httpProxyOptions: {
        xfwd: false,
        // This is the magic part: it forces the 'Origin' and 'Referer' 
        // headers to be deleted or changed before the target sees them.
        changeOrigin: true, 
    },
    
    // Advanced: Manually strip the Origin header entirely
    handleInitialRequest: function(req, res, location) {
        delete req.headers['origin'];
        delete req.headers['referer'];
        return false; // Continue processing the request
    }
}).listen(port, host, function() {
    console.log('CORS Anywhere live: Origin stripping enabled.');
});
