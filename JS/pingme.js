/*
@Name：PingMe 自动化 (Surge 深度适配版)
@Author：怎么肥事
@Modified: Nixi-N
*/

const $ = new Env('PingMe');
const ckKey = 'pingme_capture_v3';
const SECRET = '0fOiukQq7jXZV2GRi9LGlO';

if (typeof $request !== 'undefined' && $request) {
  // --- 抓包逻辑 ---
  if ($request.url.indexOf('api.pingmeapp.net') > -1 && $request.url.indexOf('userId=') > -1) {
    const capture = {
      url: $request.url,
      paramsRaw: parseRawQuery($request.url),
      headers: $request.headers
    };
    $.setdata(JSON.stringify(capture), ckKey);
    $.msg($.name, '✅ 真正参数抓取成功', '有效的用户参数已保存，可以开始签到');
  }
  $.done({}); 
} else {
  // --- 执行逻辑 ---
  const raw = $.getdata(ckKey);
  if (!raw) {
    $.msg($.name, '⚠️ 未抓到参数', '请先进入 PingMe -> Coins 页面刷新');
    $.done();
  } else {
    let capture = JSON.parse(raw);
    // 如果发现是之前误抓的 apple 数据，自动清理
    if (!capture.paramsRaw.userId) {
      $.setdata('', ckKey);
      $.msg($.name, '🧹 发现无效数据', '已自动清理，请重新打开 App 抓取');
      $.done();
    } else {
      executeTasks(capture);
    }
  }
}

async function executeTasks(capture) {
  const headers = {
    'User-Agent': capture.headers['User-Agent'] || capture.headers['user-agent'] || 'PingMe/1.1.0 (iPhone; iOS 15.0; Scale/3.00)',
    'Accept': '*/*',
    'Host': 'api.pingmeapp.net'
  };
  const msgs = [];

  try {
    // 1. 签到
    let res = await fetchApi('checkIn', capture, headers);
    let d = JSON.parse(res.body);
    msgs.push(d.retcode === 0 ? `✅ 签到：${d.result?.bonusHint || '成功'}` : `⚠️ 签到：${d.retmsg}`);

    // 2. 视频奖励 (执行3次)
    for (let i = 1; i <= 3; i++) {
      await $.wait(5000);
      let vRes = await fetchApi('videoBonus', capture, headers);
      let vd = JSON.parse(vRes.body);
      if (vd.retcode === 0) msgs.push(`🎬 视频${i}：+${vd.result?.bonus} Coins`);
      else { msgs.push(`⏸ 视频${i}：已达上限`); break; }
    }
  } catch (e) {
    msgs.push('❌ 请求发生异常，请检查网络');
  }

  $.msg($.name, '任务结果', msgs.join('\n'));
  $.done();
}

// --- 核心算法：必须严格遵守 PingMe 的排序规则 ---
function buildUrl(path, c) {
  const p = {};
  // 提取原始参数，排除旧签名
  Object.keys(c.paramsRaw).forEach(k => {
    if (k !== 'sign' && k !== 'signDate') p[k] = c.paramsRaw[k];
  });
  
  // 生成标准 UTC 时间戳: YYYY-MM-DD HH:mm:ss
  const now = new Date();
  const f = (n) => String(n).padStart(2, '0');
  p.signDate = `${now.getUTCFullYear()}-${f(now.getUTCMonth()+1)}-${f(now.getUTCDate())} ${f(now.getUTCHours())}:${f(now.getUTCMinutes())}:${f(now.getUTCSeconds())}`;
  
  // 1. 参数按 Key 字母排序
  const sortedKeys = Object.keys(p).sort();
  // 2. 拼接字符串用于 MD5
  const signStr = sortedKeys.map(k => `${k}=${p[k]}`).join('&') + SECRET;
  p.sign = MD5(signStr);
  
  // 3. 最终生成 URL
  const qs = Object.keys(p).map(k => `${k}=${encodeURIComponent(p[k])}`).join('&');
  return `https://api.pingmeapp.net/app/${path}?${qs}`;
}

async function fetchApi(path, c, h) {
  return await $.http.get({ url: buildUrl(path, c), headers: h });
}

// --- 以下为通用的 MD5 和 Env 逻辑 (保持不变) ---
function parseRawQuery(u){const q=(u.split('?')[1]||'').split('#')[0];const m={};q.split('&').forEach(p=>{const i=p.indexOf('=');if(i>0)m[p.slice(0,i)]=p.slice(i+1)});return m}
function MD5(s){function L(v,s){return(v<<s)|(v>>>(32-s))}function A(x,y){const x4=x&0x40000000,y4=y&0x40000000,x8=x&0x80000000,y8=y&0x80000000,r=(x&0x3FFFFFFF)+(y&0x3FFFFFFF);if(x4&y4)return r^0x80000000^x8^y8;if(x4|y4)return(r&0x40000000)?(r^0xC0000000^x8^y8):(r^0x40000000^x8^y8);return r^x8^y8}function F(x,y,z){return(x&y)|((~x)&z)}function G(x,y,z){return(x&z)|(y&(~z))}function H(x,y,z){return x^y^z}function I(x,y,z){return y^(x|(~z))}function FF(a,b,c,d,x,s,ac){return A(L(A(a,A(A(F(b,c,d),x),ac)),s),b)}function GG(a,b,c,d,x,s,ac){return A(L(A(a,A(A(G(b,c,d),x),ac)),s),b)}function HH(a,b,c,d,x,s,ac){return A(L(A(a,A(A(H(b,c,d),x),ac)),s),b)}function II(a,b,c,d,x,s,ac){return A(L(A(a,A(A(I(b,c,d),x),ac)),s),b)}const x=function(s){const l=s.length,n=((l+8-((l+8)%64))/64+1)*16,w=Array(n).fill(0);for(let i=0;i<l;i++)w[i>>2]|=s.charCodeAt(i)<<((i%4)*8);w[n-2]=l<<3;w[n-1]=l>>>29;return w}(s);let a=0x67452301,b=0xEFCDAB89,c=0x98BADCFE,d=0x10325476;for(let k=0;k<x.length;k+=16){let AA=a,BB=b,CC=c,DD=d;a=FF(a,b,c,d,x[k+0],7,0xD76AA478);d=FF(d,a,b,c,x[k+1],12,0xE8C7B756);c=FF(c,d,a,b,x[k+2],17,0x242070DB);b=FF(b,c,d,a,x[k+3],22,0xC1BDCEEE);a=FF(a,b,c,d,x[k+4],7,0xF57C0FAF);d=FF(d,a,b,c,x[k+5],12,0x4787C62A);c=FF(c,d,a,b,x[k+6],17,0xA8304613);b=FF(b,c,d,a,x[k+7],22,0xFD469501);a=FF(a,b,c,d,x[k+8],7,0x698098D8);d=FF(d,a,b,c,x[k+9],12,0x8B44F7AF);c=FF(c,d,a,b,x[k+10],17,0xFFFF5BB1);b=FF(b,c,d,a,x[k+11],22,0x895CD7BE);a=FF(a,b,c,d,x[k+12],7,0x6B901122);d=FF(d,a,b,c,x[k+13],12,0xFD987193);c=FF(c,d,a,b,x[k+14],17,0xA679438E);b=FF(b,c,d,a,x[k+15],22,0x49B40821);a=GG(a,b,c,d,x[k+1],5,0xF61E2562);d=GG(d,a,b,c,x[k+6],9,0xC040B340);c=GG(c,d,a,b,x[k+11],14,0x265E5A51);b=GG(b,c,d,a,x[k+0],20,0xE9B6C7AA);a=GG(a,b,c,d,x[k+5],5,0xD62F105D);d=GG(d,a,b,c,x[k+10],9,0x02441453);c=GG(c,d,a,b,x[k+15],14,0xD8A1E681);b=GG(b,c,d,a,x[k+4],20,0xE7D3FBC8);a=GG(a,b,c,d,x[k+9],5,0x21E1CDE6);d=GG(d,a,b,c,x[k+14],9,0xC33707D6);c=GG(c,d,a,b,x[k+3],14,0xF4D50D87);b=GG(b,c,d,a,x[k+8],20,0x455A14ED);a=GG(a,b,c,d,x[k+13],5,0xA9E3E905);d=GG(d,a,b,c,x[k+2],9,0xFCEFA3F8);c=GG(c,d,a,b,x[k+7],14,0x676F02D9);b=GG(b,c,d,a,x[k+12],20,0x8D2A4C8A);a=HH(a,b,c,d,x[k+5],4,0xFFFA3942);d=HH(d,a,b,c,x[k+8],11,0x8771F681);c=HH(c,d,a,b,x[k+11],16,0x6D9D6122);b=HH(b,c,d,a,x[k+14],23,0xFDE5380C);a=HH(a,b,c,d,x[k+1],4,0xA4BEEA44);d=HH(d,a,b,c,x[k+4],11,0x4BDECFA9);c=HH(c,d,a,b,x[k+7],16,0xF6BB4B60);b=HH(b,c,d,a,x[k+10],23,0xBEBFBC70);a=HH(a,b,c,d,x[k+13],4,0x289B7EC6);d=HH(d,a,b,c,x[k+0],11,0xEAA127FA);c=HH(c,d,a,b,x[k+3],16,0xD4EF3085);b=HH(b,c,d,a,x[k+6],23,0x04881D05);a=HH(a,b,c,d,x[k+9],4,0xD9D4D039);d=HH(d,a,b,c,x[k+12],11,0xE6DB99E5);c=HH(c,d,a,b,x[k+15],16,0x1FA27CF8);b=HH(b,c,d,a,x[k+2],23,0xC4AC5665);a=II(a,b,c,d,x[k+0],6,0xF4292244);d=II(d,a,b,c,x[k+7],10,0x432AFF97);c=II(c,d,a,b,x[k+14],15,0xAB9423A7);b=II(b,c,d,a,x[k+5],21,0xFC93A039);a=II(a,b,c,d,x[k+12],6,0x655B59C3);d=II(d,a,b,c,x[k+3],10,0x8F0CCC92);c=II(c,d,a,b,x[k+10],15,0xFFEFF47D);b=II(b,c,d,a,x[k+1],21,0x85845DD1);a=II(a,b,c,d,x[k+8],6,0x6FA87E4F);d=II(d,a,b,c,x[k+15],10,0xFE2CE6E0);c=II(c,d,a,b,x[k+6],15,0xA3014314);b=II(b,c,d,a,x[k+13],21,0x4E0811A1);a=II(a,b,c,d,x[k+4],6,0xF7537E82);d=II(d,a,b,c,x[k+11],10,0xBD3AF235);c=II(c,d,a,b,x[k+2],15,0x2AD7D2BB);b=II(b,c,d,a,x[k+9],21,0xEB86D391);a=A(a,AA);b=A(b,BB);c=A(c,CC);d=A(d,DD)}return(function(v){let h='';for(let i=0;i<=3;i++){let b=(v>>>(i*8))&255,t='0'+b.toString(16);h+=t.substr(t.length-2,2)}return h}(a)+function(v){let h='';for(let i=0;i<=3;i++){let b=(v>>>(i*8))&255,t='0'+b.toString(16);h+=t.substr(t.length-2,2)}return h}(b)+function(v){let h='';for(let i=0;i<=3;i++){let b=(v>>>(i*8))&255,t='0'+b.toString(16);h+=t.substr(t.length-2,2)}return h}(c)+function(v){let h='';for(let i=0;i<=3;i++){let b=(v>>>(i*8))&255,t='0'+b.toString(16);h+=t.substr(t.length-2,2)}return h}(d)).toLowerCase()}
function Env(n){this.name=n;this.isLoon=typeof $loon!=="undefined";this.isSurge=typeof $network!=="undefined"&&!this.isLoon;this.isQX=typeof $task!=="undefined";this.setdata=(v,k)=>this.isQX?$prefs.setValueForKey(v,k):(this.isLoon||this.isSurge?$persistentStore.write(v,k):null);this.getdata=(k)=>this.isQX?$prefs.valueForKey(k):(this.isLoon||this.isSurge?$persistentStore.read(k):null);this.msg=(t,s,b)=>this.isQX?$notify(t,s,b):(this.isLoon||this.isSurge?$notification.post(t,s,b):null);this.wait=(ms)=>new Promise(r=>setTimeout(r,ms));this.http={get:(o)=>new Promise((r,j)=>{let client=this.isQX?$task:((this.isLoon||this.isSurge)?$httpClient:null);client.get(o,(e,res,b)=>e?j(e):r({body:b}))})};this.done=(o={})=>$done(o)}
