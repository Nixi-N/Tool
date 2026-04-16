/*
@Name：PingMe 自动化签到+视频奖励 (Loon/Surge稳定增强版)
@Author：怎么肥事
@Fix：ChatGPT Upgrade
*/

const $ = new Env('PingMe');

const ckKey = 'pingme_capture_v3';
const SECRET = '0fOiukQq7jXZV2GRi9LGlO';
const MAX_VIDEO = 5;
const VIDEO_DELAY = 8000;

// =====================
// 1. REQUEST CAPTURE
// =====================
if (typeof $request !== 'undefined' && $request) {

  if ($request.url.includes('api.pingmeapp.net')) {

    const capture = {
      url: $request.url,
      paramsRaw: parseRawQuery($request.url),
      headers: normalizeHeaders($request.headers || {})
    };

    $.setdata(JSON.stringify(capture), ckKey);

    $.msg($.name, '✅ 抓包成功', 'Loon/Surge 参数已保存');

    console.log(`CAPTURE:\n${JSON.stringify(capture, null, 2)}`);
  }

  $.done({});
  return;
}

// =====================
// 2. MAIN FLOW
// =====================
(async () => {

  const raw = $.getdata(ckKey);

  if (!raw) {
    $.msg($.name, '⚠️ 未抓到参数', '请先打开 App 触发请求');
    $.done();
    return;
  }

  let capture;
  try {
    capture = JSON.parse(raw);
  } catch (e) {
    $.msg($.name, '⚠️ 参数损坏', '请重新抓包');
    $.done();
    return;
  }

  const headers = buildHeaders(capture);
  const msgs = [];

  // ---------------------
  // API WRAPPER（关键升级）
  // ---------------------
  function fetchApi(path) {
    return new Promise((resolve, reject) => {
      $.http.get({
        url: buildUrl(path, capture),
        headers
      }).then(res => {
        resolve(res); // ⭐ 不再裁剪 response
      }).catch(reject);
    });
  }

  // ---------------------
  // 余额
  // ---------------------
  try {
    const res = await fetchApi('queryBalanceAndBonus');
    const d = JSON.parse(res.body || '{}');
    if (d.retcode === 0) {
      msgs.push(`💰 余额：${d.result.balance} Coins`);
    } else {
      msgs.push(`⚠️ 余额：${d.retmsg}`);
    }
  } catch (e) {
    msgs.push('❌ 余额请求失败');
  }

  // ---------------------
  // 签到
  // ---------------------
  try {
    const res = await fetchApi('checkIn');
    const d = JSON.parse(res.body || '{}');
    if (d.retcode === 0) {
      msgs.push(`✅ 签到：${(d.result?.bonusHint || d.retmsg || '').replace(/\n/g,' ')}`);
    } else {
      msgs.push(`⚠️ 签到：${d.retmsg}`);
    }
  } catch (e) {
    msgs.push('❌ 签到失败');
  }

  // ---------------------
  // 视频奖励（强化版稳定循环）
  // ---------------------
  for (let i = 1; i <= MAX_VIDEO; i++) {

    await wait(i === 1 ? 1500 : VIDEO_DELAY);

    try {
      const res = await fetchApi('videoBonus');
      const d = JSON.parse(res.body || '{}');

      if (d.retcode === 0) {
        msgs.push(`🎬 视频${i}：+${d.result?.bonus || 0} Coins`);
      } else {
        msgs.push(`⏸ 视频${i}：${d.retmsg}`);
        break;
      }

    } catch (e) {
      msgs.push(`❌ 视频${i} 请求失败`);
      break;
    }
  }

  // ---------------------
  // 最终余额
  // ---------------------
  try {
    const res = await fetchApi('queryBalanceAndBonus');
    const d = JSON.parse(res.body || '{}');
    if (d.retcode === 0) {
      msgs.push(`💰 最新余额：${d.result.balance} Coins`);
    }
  } catch (e) {}

  $.msg($.name, '🎉 完成', msgs.join('\n'));
  $.done();

})();

// =====================
// HELPERS（增强版）
// =====================

function normalizeHeaders(h) {
  const out = {};
  Object.keys(h || {}).forEach(k => {
    const key = k.toLowerCase();
    if (!key.startsWith(':') && key !== 'content-length') {
      out[k] = h[k];
    }
  });
  return out;
}

function buildHeaders(capture) {
  const h = normalizeHeaders(capture.headers);

  h['Host'] = 'api.pingmeapp.net';
  h['Accept'] = 'application/json';

  return h;
}

function parseRawQuery(url) {
  const q = (url.split('?')[1] || '').split('#')[0];
  const obj = {};

  q.split('&').forEach(i => {
    if (!i) return;
    const idx = i.indexOf('=');
    if (idx > -1) obj[i.slice(0, idx)] = i.slice(idx + 1);
  });

  return obj;
}

function getUTCSignDate() {
  const n = new Date();
  const p = x => String(x).padStart(2, '0');
  return `${n.getUTCFullYear()}-${p(n.getUTCMonth()+1)}-${p(n.getUTCDate())} ${p(n.getUTCHours())}:${p(n.getUTCMinutes())}:${p(n.getUTCSeconds())}`;
}

function buildUrl(path, capture) {

  const p = {};

  Object.keys(capture.paramsRaw || {}).forEach(k => {
    if (k !== 'sign' && k !== 'signDate') {
      p[k] = capture.paramsRaw[k];
    }
  });

  p.signDate = getUTCSignDate();

  const base = Object.keys(p)
    .sort()
    .map(k => `${k}=${p[k]}`)
    .join('&');

  p.sign = MD5(base + SECRET);

  const qs = Object.keys(p)
    .map(k => `${k}=${encodeURIComponent(p[k])}`)
    .join('&');

  return `https://api.pingmeapp.net/app/${path}?${qs}`;
}

// =====================
// SAFE WAIT
// =====================
function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// =====================
// Env (保留你原版)
// =====================
function Env(name) {
  this.name = name;
  this.isSurge = typeof $surge !== "undefined";
  this.isLoon  = typeof $loon !== "undefined";

  this.setdata = (v,k)=> $persistentStore.write(v,k);
  this.getdata = (k)=> $persistentStore.read(k);

  this.msg = (t,s,b)=> $notification.post(t,s,b);

  this.http = {
    get: (opt) => new Promise((resolve, reject) => {
      $httpClient.get(opt, (err, res, body) => {
        if (err) reject(err);
        else resolve(res); // ⭐关键修复：不裁剪
      });
    })
  };

  this.done = ()=> $done();
}