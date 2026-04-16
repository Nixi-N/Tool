/*
@Name：PingMe 自动化签到+视频奖励（Surge/Loon稳定修复版）
@Author：怎么肥事 + ChatGPT Upgrade
*/

const $ = new Env('PingMe');

const ckKey = 'pingme_capture_v3';
const SECRET = '0fOiukQq7jXZV2GRi9LGlO';
const MAX_VIDEO = 5;
const VIDEO_DELAY = 8000;

// =============================
// 主入口（必须包起来，否则 Surge 报 return 错）
// =============================
(async () => {

  // =====================================================
  // 1. 抓包模式（rewrite 触发）
  // =====================================================
  if (typeof $request !== 'undefined' && $request) {

    if ($request.url.includes('api.pingmeapp.net')) {

      const capture = {
        url: $request.url,
        paramsRaw: parseRawQuery($request.url),
        headers: $request.headers || {}
      };

      $.setdata(JSON.stringify(capture), ckKey);

      $.msg($.name, '✅ 参数抓取成功', 'Surge/Loon 已保存');

      console.log('CAPTURE:\n' + JSON.stringify(capture, null, 2));
    }

    $.done({});
    return;
  }

  // =====================================================
  // 2. 定时任务模式（cron）
  // =====================================================
  const raw = $.getdata(ckKey);

  if (!raw) {
    $.msg($.name, '⚠️ 未抓到参数', '请先打开 App 触发一次请求');
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

  // =============================
  // HTTP 请求封装（Surge/Loon一致）
  // =============================
  function fetchApi(path) {
    return $.http.get({
      url: buildUrl(path, capture),
      headers
    });
  }

  // =============================
  // 余额查询
  // =============================
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

  // =============================
  // 签到
  // =============================
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

  // =============================
  // 视频奖励循环
  // =============================
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
      msgs.push(`❌ 视频${i}失败`);
      break;
    }
  }

  // =============================
  // 最终余额
  // =============================
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

// =============================
// 工具函数
// =============================

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function parseRawQuery(url) {
  const q = (url.split('?')[1] || '').split('#')[0];
  const obj = {};

  q.split('&').forEach(i => {
    if (!i) return;
    const idx = i.indexOf('=');
    if (idx === -1) return;
    obj[i.slice(0, idx)] = i.slice(idx + 1);
  });

  return obj;
}

function buildHeaders(capture) {
  const h = {};

  for (let k in capture.headers || {}) {
    if (!k.startsWith(':') && k.toLowerCase() !== 'content-length') {
      h[k] = capture.headers[k];
    }
  }

  h['Host'] = 'api.pingmeapp.net';
  h['Accept'] = 'application/json';

  return h;
}

function getUTCSignDate() {
  const n = new Date();
  const p = x => String(x).padStart(2, '0');

  return `${n.getUTCFullYear()}-${p(n.getUTCMonth()+1)}-${p(n.getUTCDate())} ${p(n.getUTCHours())}:${p(n.getUTCMinutes())}:${p(n.getUTCSeconds())}`;
}

function buildUrl(path, capture) {

  const params = {};

  for (let k in capture.paramsRaw || {}) {
    if (k !== 'sign' && k !== 'signDate') {
      params[k] = capture.paramsRaw[k];
    }
  }

  params.signDate = getUTCSignDate();

  const base = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');

  params.sign = MD5(base + SECRET);

  const qs = Object.keys(params)
    .map(k => `${k}=${encodeURIComponent(params[k])}`)
    .join('&');

  return `https://api.pingmeapp.net/app/${path}?${qs}`;
}