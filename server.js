var cors_proxy = require('cors-anywhere');

var host = '0.0.0.0';
var port = process.env.PORT || 8080;

var originWhitelist = ['https://starnhl.com', 'https://www.starnhl.com'];

cors_proxy.createServer({
    originWhitelist: originWhitelist,
    requireHeader: ['origin', 'x-requested-with'],
    
    // 1. Force the headers the target server wants to see
    setHeaders: {
        'User-Agent': 'OQEE/1.0 (Linux; Android 10)', // Pretend to be the OQEE app
        'Accept': '*/*',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Connection': 'keep-alive'
    },

    // 2. Remove the headers that might get you blocked
    handleInitialRequest: function(req, res, location) {
        // Strip out the Origin/Referer so they don't see starnhl.com
        delete req.headers['origin'];
        delete req.headers['referer'];
        
        // Ensure the host header matches the target (OQEE)
        req.headers['host'] = location.host; 
        
        return false;
    },

    httpProxyOptions: {
        xfwd: false,
        changeOrigin: true, // Crucial for OQEE/Proximus/Free APIs
    },
}).listen(port, host, function() {
    console.log('CORS Proxy tuned for OQEE is running.');
});
