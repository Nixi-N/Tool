// ===== PingMe Surge 修复版 =====

const scriptName = "PingMe";
const ckKey = "pingme_capture_v3";
const SECRET = "0fOiukQq7jXZV2GRi9LGlO";

function md5(str) {
  return CryptoJS.MD5(str).toString();
}

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

// ===== 主入口（修复点）=====
(async () => {

try {

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

// ===== 执行任务 =====
const raw = $persistentStore.read(ckKey);

if (!raw) {
  $notification.post(scriptName, "❌ 未抓到参数", "先打开App触发一次");
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

const a = await request("queryBalanceAndBonus");
msg.push(`💰余额: ${a.result.balance}`);

const b = await request("checkIn");
msg.push(`✅签到: ${b.retmsg}`);

const c = await request("videoBonus");
msg.push(`🎬视频: +${c.result?.bonus || "?"}`);

const d = await request("queryBalanceAndBonus");
msg.push(`💰最新: ${d.result.balance}`);

$notification.post(scriptName,"🎉完成",msg.join("\n"));

} catch (e) {
  $notification.post(scriptName,"❌错误",String(e));
}

$done();

})();