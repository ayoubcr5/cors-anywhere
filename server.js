// 1. Import the library
var cors_proxy = require('cors-anywhere');

// 2. Set up network variables
var host = '0.0.0.0';
var port = process.env.PORT || 8080;

// 3. Define the whitelist (Ensure no typos here)
var originWhitelist = ['https://starnhl.com', 'https://www.starnhl.com'];

// 4. Create and start the server
cors_proxy.createServer({
    originWhitelist: originWhitelist, // Allows only starnhl.com
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
    console.log('Running CORS Anywhere on ' + host + ':' + port);
});
