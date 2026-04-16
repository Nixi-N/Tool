// ===== PingMe Surge 完整稳定版 =====

const scriptName = "PingMe";
const ckKey = "pingme_capture_v3";
const SECRET = "0fOiukQq7jXZV2GRi9LGlO";
const MAX_VIDEO = 5;
const VIDEO_DELAY = 3000;

// ===== MD5（内置，避免依赖CryptoJS）=====
function md5(str) {
  function d(n, t) { return (n << t) | (n >>> (32 - t)); }
  function f(x, y, z) { return (x & y) | (~x & z); }
  function g(x, y, z) { return (x & z) | (y & ~z); }
  function h(x, y, z) { return x ^ y ^ z; }
  function i(x, y, z) { return y ^ (x | ~z); }

  function u(x, y) {
    let l = (x & 0xffff) + (y & 0xffff);
    let m = (x >> 16) + (y >> 16) + (l >> 16);
    return (m << 16) | (l & 0xffff);
  }

  function k(q, a, b, x, s, t) {
    return u(d(u(u(a, q), u(x, t)), s), b);
  }

  function convert(str) {
    let n = str.length;
    let arr = [];
    for (let i = 0; i < n; i++) {
      arr[i >> 2] |= str.charCodeAt(i) << ((i % 4) * 8);
    }
    arr[n >> 2] |= 0x80 << ((n % 4) * 8);
    arr[(((n + 8) >> 6) + 1) * 16 - 2] = n * 8;
    return arr;
  }

  let x = convert(str);
  let a = 1732584193, b = -271733879, c = -1732584194, d0 = 271733878;

  for (let j = 0; j < x.length; j += 16) {
    let aa = a, bb = b, cc = c, dd = d0;

    a = k(f(b, c, d0), a, b, x[j+0], 7, -680876936);
    d0 = k(f(a, b, c), d0, a, x[j+1], 12, -389564586);
    c = k(f(d0, a, b), c, d0, x[j+2], 17, 606105819);
    b = k(f(c, d0, a), b, c, x[j+3], 22, -1044525330);

    a = k(g(b, c, d0), a, b, x[j+1], 5, -165796510);
    d0 = k(g(a, b, c), d0, a, x[j+6], 9, -1069501632);
    c = k(g(d0, a, b), c, d0, x[j+11], 14, 643717713);
    b = k(g(c, d0, a), b, c, x[j+0], 20, -373897302);

    a = k(h(b, c, d0), a, b, x[j+5], 4, -378558);
    d0 = k(h(a, b, c), d0, a, x[j+8], 11, -2022574463);
    c = k(h(d0, a, b), c, d0, x[j+11], 16, 1839030562);
    b = k(h(c, d0, a), b, c, x[j+14], 23, -35309556);

    a = k(i(b, c, d0), a, b, x[j+0], 6, -198630844);
    d0 = k(i(a, b, c), d0, a, x[j+7], 10, 1126891415);
    c = k(i(d0, a, b), c, d0, x[j+14], 15, -1416354905);
    b = k(i(c, d0, a), b, c, x[j+5], 21, -57434055);

    a = u(a, aa);
    b = u(b, bb);
    c = u(c, cc);
    d0 = u(d0, dd);
  }

  return [a, b, c, d0].map(n => {
    let s = "";
    for (let j = 0; j < 4; j++) {
      s += ("0" + ((n >> (j * 8)) & 255).toString(16)).slice(-2);
    }
    return s;
  }).join("");
}

// ===== 工具 =====
function getUTCSignDate() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth()+1)}-${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;
}

function parseQuery(url) {
  let q = url.split("?")[1] || "";
  let obj = {};
  q.split("&").forEach(i=>{
    let [k,v]=i.split("=");
    if(k) obj[k]=v;
  });
  return obj;
}

// ===== 主入口 =====
(async () => {

try {

// ===== 抓取 =====
if (typeof $request !== "undefined") {

  const data = {
    url: $request.url,
    params: parseQuery($request.url),
    headers: $request.headers
  };

  $persistentStore.write(JSON.stringify(data), ckKey);
  $notification.post(scriptName, "✅ 抓取成功", "参数已保存");
  $done();
  return;
}

// ===== 执行 =====
const raw = $persistentStore.read(ckKey);

if (!raw) {
  $notification.post(scriptName, "❌ 未抓到参数", "先打开App");
  $done();
  return;
}

const capture = JSON.parse(raw);

function buildParams() {
  let params = {};
  Object.keys(capture.params).forEach(k=>{
    if(k !== "sign" && k !== "signDate") params[k]=capture.params[k];
  });

  params.signDate = getUTCSignDate();
  let base = Object.keys(params).sort().map(k=>`${k}=${params[k]}`).join("&");
  params.sign = md5(base + SECRET);

  return params;
}

function buildUrl(path) {
  let p = buildParams();
  let qs = Object.keys(p).map(k=>`${k}=${encodeURIComponent(p[k])}`).join("&");
  return `https://api.pingmeapp.net/app/${path}?${qs}`;
}

function request(path) {
  return new Promise((resolve,reject)=>{
    $httpClient.get({
      url: buildUrl(path),
      headers: capture.headers
    }, (err,res,data)=>{
      if(err) reject(err);
      else {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          reject("解析失败");
        }
      }
    });
  });
}

let msg = [];

// 查询余额
let d1 = await request("queryBalanceAndBonus");
msg.push(`💰余额: ${d1.result.balance}`);

// 签到
let d2 = await request("checkIn");
msg.push(`✅签到: ${d2.retmsg}`);

// 视频任务
for (let i=1;i<=MAX_VIDEO;i++){
  await new Promise(r=>setTimeout(r, VIDEO_DELAY));
  let v = await request("videoBonus");
  msg.push(`🎬视频${i}: +${v.result?.bonus || "?"}`);
}

// 最新余额
let d3 = await request("queryBalanceAndBonus");
msg.push(`💰最新: ${d3.result.balance}`);

$notification.post(scriptName,"🎉完成",msg.join("\n"));

} catch (e) {
  $notification.post(scriptName,"❌错误",String(e));
}

$done();

})();