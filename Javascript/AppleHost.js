const originalHost = "iosapps.itunes.apple.com";
const newHost = "iosapps.itunes.apple.com.download.ks-cdn.com";
if ($request.headers.Host === originalHost) {
  $request.headers.Host = newHost;
  console.log(`[CDN Override] Host header rewritten from ${originalHost} to ${newHost}`);
}

$done({});
