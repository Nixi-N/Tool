// ===== 启动日志（关键）=====
console.log("✅ WeTalk 脚本启动");

// ===== Env 兼容（已修复 fetch）=====
const Env = (() => {
  const isQX = typeof $task !== "undefined";
  const isSurge = typeof $httpClient !== "undefined";

  const getdata = (key) => isQX ? $prefs.valueForKey(key) : $persistentStore.read(key);
  const setdata = (val, key) => isQX ? $prefs.setValueForKey(val, key) : $persistentStore.write(val, key);

  const msg = (title, subtitle, body) => {
    if (isQX) $notify(title, subtitle, body);
    else $notification.post(title, subtitle, body);
  };

  const fetch = (options) => {
    if (isQX) return $task.fetch(options);

    return new Promise((resolve, reject) => {
      const method = (options.method || "GET").toLowerCase();
      const req = { url: options.url, headers: options.headers };

      $httpClient[method](req, (err, resp, body) => {
        if (err) reject(err);
        else resolve({ statusCode: resp.status, headers: resp.headers, body });
      });
    });
  };

  return { getdata, setdata, msg, fetch };
})();

// ===== 配置 =====
const scriptName = "WeTalk";
const storeKey = "wetalk_accounts_v1";
const SECRET = "0fOiukQq7jXZV2GRi9LGlO";
const API_HOST = "api.wetalkapp.com";

// ===== ⚠️ 必须替换成你原始MD5 =====
function MD5(string) {
  return string; // ❗这里只是占位！你必须换回原MD5
}

// ===== 工具 =====
function parseRawQuery(url) {
  const q = (url.split("?")[1] || "").split("#")[0];
  const map = {};
  q.split("&").forEach(p => {
    const i = p.indexOf("=");
    if (i > -1) map[p.slice(0, i)] = p.slice(i + 1);
  });
  return map;
}

function getUTCSignDate() {
  const d = new Date();
  const p = n => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth()+1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}

function loadStore() {
  const raw = Env.getdata(storeKey);
  if (!raw) return { accounts:{}, order:[] };
  try { return JSON.parse(raw); } catch { return { accounts:{}, order:[] }; }
}

function saveStore(s) {
  Env.setdata(JSON.stringify(s), storeKey);
}

function buildParams(capture) {
  const p = {};
  Object.keys(capture.paramsRaw).forEach(k=>{
    if(k!=="sign" && k!=="signDate") p[k]=capture.paramsRaw[k];
  });
  p.signDate = getUTCSignDate();
  const base = Object.keys(p).sort().map(k=>`${k}=${p[k]}`).join("&");
  p.sign = MD5(base + SECRET);
  return p;
}

function buildUrl(path, capture) {
  const p = buildParams(capture);
  const qs = Object.keys(p).map(k=>`${k}=${encodeURIComponent(p[k])}`).join("&");
  return `https://${API_HOST}/app/${path}?${qs}`;
}

// ===== 核心 =====
function run(acc) {
  console.log("🚀 开始执行账号");

  const headers = acc.capture.headers;

  const req = (path)=>Env.fetch({
    url: buildUrl(path, acc.capture),
    headers
  });

  return req("queryBalanceAndBonus")
  .then(r=>{
    console.log("余额返回", r.body);
    return req("checkIn");
  })
  .then(r=>{
    console.log("签到返回", r.body);
    Env.msg("WeTalk","签到返回",r.body);
  })
  .catch(e=>{
    console.log("❌ 错误", e);
  });
}

// ===== 抓包 =====
if (typeof $request !== "undefined") {

  console.log("📥 捕获请求");

  const store = loadStore();
  const id = Date.now().toString();

  store.accounts[id] = {
    capture: {
      url: $request.url,
      paramsRaw: parseRawQuery($request.url),
      headers: $request.headers
    }
  };

  store.order.push(id);
  saveStore(store);

  Env.msg("WeTalk","抓取成功",`账号数:${store.order.length}`);

} else {

  console.log("⏰ 进入定时任务");

  const store = loadStore();
  const ids = store.order;

  if (!ids.length) {
    Env.msg("WeTalk","错误","没有账号");
    return;
  }

  run(store.accounts[ids[0]]);
}