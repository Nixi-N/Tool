// Surge MITM Script: Remove OneHai Splash Ad

// [Script]
// OneHai Remove Splash Ad = type=http-response,pattern=^https:\/\/app\.1hai\.cn\/HomeNew\/KingKongArea\/ByUserId,requires-body=1,max-size=0,script-path=onehai_splash_ad.js

// onehai_splash_ad.js
let body = {
  code: 0,
  data: [],
  message: "广告已移除"
};

$done({ body: JSON.stringify(body) });
