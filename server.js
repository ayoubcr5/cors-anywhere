var cors_proxy = require('cors-anywhere');

// Railway uses the PORT environment variable automatically
var host = '0.0.0.0';
var port = process.env.PORT || 8080;

// Whitelist only starnhl.com
var originWhitelist = ['https://starnhl.com', 'https://www.starnhl.com'];

cors_proxy.createServer({
    originWhitelist: originWhitelist,
    requireHeader: ['origin', 'x-requested-with'],
    removeHeaders: [
        'cookie',
        'cookie2',
         'host',
        'connection',
        'x-request-start',
        'x-request-id',
        'via',
        'connect-time',
        'total-route-time'
    ],
    redirectSameOrigin: true,
    httpProxyOptions: {
        xfwd: false,
    },
}).listen(port, host, function() {
    console.log('CORS Anywhere is live for starnhl.com on port ' + port);
});
