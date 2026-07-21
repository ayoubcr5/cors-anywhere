function setCorsHeaders(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] || '*'
  );
  res.setHeader(
    'Access-Control-Expose-Headers',
    'Content-Type, Content-Length, Content-Range, Accept-Ranges, X-Final-Url'
  );
}

module.exports = async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const marker = '?url=';
  const markerIndex = req.url.indexOf(marker);

  if (markerIndex === -1) {
    res.statusCode = 400;
    res.end('Use /proxy?url=https://example.com');
    return;
  }

  let targetUrl = req.url.substring(markerIndex + marker.length);

  // Repair Vercel normalization without decoding signed URL components.
  targetUrl = targetUrl.replace(/^(https?:)\/(?!\/)/i, '$1//');

  let parsedTarget;

  try {
    parsedTarget = new URL(targetUrl);
  } catch {
    res.statusCode = 400;
    res.end(`Invalid target URL: ${targetUrl}`);
    return;
  }

  if (!['http:', 'https:'].includes(parsedTarget.protocol)) {
    res.statusCode = 400;
    res.end('Only HTTP and HTTPS URLs are supported');
    return;
  }

  try {
    const upstreamHeaders = {};

    for (const header of [
      'accept',
      'accept-language',
      'authorization',
      'content-type',
      'if-modified-since',
      'if-none-match',
      'range',
      'referer',
      'user-agent'
    ]) {
      if (req.headers[header]) {
        upstreamHeaders[header] = req.headers[header];
      }
    }

    const options = {
      method: req.method,
      headers: upstreamHeaders,
      redirect: 'follow'
    };

    if (!['GET', 'HEAD'].includes(req.method)) {
      const chunks = [];

      for await (const chunk of req) {
        chunks.push(chunk);
      }

      if (chunks.length) {
        options.body = Buffer.concat(chunks);
      }
    }

    const upstream = await fetch(targetUrl, options);

    const blockedHeaders = new Set([
      'access-control-allow-origin',
      'connection',
      'content-encoding',
      'content-length',
      'set-cookie',
      'transfer-encoding'
    ]);

    upstream.headers.forEach((value, name) => {
      if (!blockedHeaders.has(name.toLowerCase())) {
        res.setHeader(name, value);
      }
    });

    setCorsHeaders(req, res);
    res.setHeader('X-Final-Url', upstream.url);
    res.statusCode = upstream.status;

    if (req.method === 'HEAD' || upstream.status === 204 || upstream.status === 304) {
      res.end();
      return;
    }

    const body = Buffer.from(await upstream.arrayBuffer());
    res.end(body);
  } catch (error) {
    setCorsHeaders(req, res);
    res.statusCode = 502;
    res.end(`Proxy request failed: ${error.message}`);
  }
};
