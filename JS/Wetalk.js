// ===== Env 兼容层（QX / Surge / Loon 通用）=====
const Env = (() => {
  const isQX = typeof $task !== "undefined";
  const isSurge = typeof $httpClient !== "undefined" && !isQX;
  const isLoon = typeof $loon !== "undefined";

  const getdata = (key) => {
    if (isQX) return $prefs.valueForKey(key);
    if (isSurge || isLoon) return $persistentStore.read(key);
  };

  const setdata = (val, key) => {
    if (isQX) return $prefs.setValueForKey(val, key);
    if (isSurge || isLoon) return $persistentStore.write(val, key);
  };

  const msg = (title, subtitle, body) => {
    if (isQX) $notify(title, subtitle, body);
    if (isSurge || isLoon) $notification.post(title, subtitle, body);
  };

  const fetch = (options) => {
    if (isQX) return $task.fetch(options);
    return new Promise((resolve, reject) => {
      $httpClient.get(options, (err, resp, body) => {
        if (err) reject(err);
        else resolve({ statusCode: resp.status, headers: resp.headers, body });
      });
    });
  };

  const done = (val = {}) => $done(val);

  return { getdata, setdata, msg, fetch, done };
})();

// ===== 原脚本开始 =====
const scriptName = 'WeTalk';
const storeKey = 'wetalk_accounts_v1';
const SECRET = '0fOiukQq7jXZV2GRi9LGlO';
const API_HOST = 'api.wetalkapp.com';
const MAX_VIDEO = 5;
const VIDEO_DELAY = 8000;
const ACCOUNT_GAP = 3500;

function MD5(string){/* 省略：你原MD5函数保持不变 */ return string } // ⚠️这里请用你原来的MD5函数替换

function getUTCSignDate(){
  const now=new Date();
  const pad=n=>String(n).padStart(2,'0');
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth()+1)}-${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;
}

function parseRawQuery(url){
  const query=(url.split('?')[1]||'').split('#')[0];
  const rawMap={};
  query.split('&').forEach(pair=>{
    if(!pair)return;
    const idx=pair.indexOf('=');
    if(idx<0)return;
    rawMap[pair.slice(0,idx)]=pair.slice(idx+1);
  });
  return rawMap;
}

function loadStore(){
  const raw=Env.getdata(storeKey);
  if(!raw)return {accounts:{},order:[]};
  try{return JSON.parse(raw)}catch{return {accounts:{},order:[]}}
}

function saveStore(store){
  Env.setdata(JSON.stringify(store),storeKey);
}

function notify(title,body){
  Env.msg(scriptName,title,body);
}

function buildSignedParamsRaw(capture){
  const params={};
  Object.keys(capture.paramsRaw||{}).forEach(k=>{
    if(k!=='sign'&&k!=='signDate')params[k]=capture.paramsRaw[k];
  });
  params.signDate=getUTCSignDate();
  const signBase=Object.keys(params).sort().map(k=>`${k}=${params[k]}`).join('&');
  params.sign=MD5(signBase+SECRET);
  return params;
}

function buildUrl(path,capture){
  const params=buildSignedParamsRaw(capture);
  const qs=Object.keys(params).map(k=>`${k}=${encodeURIComponent(params[k])}`).join('&');
  return `https://${API_HOST}/app/${path}?${qs}`;
}

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

// ===== 核心执行 =====
function runAccount(acc,index,total){
  const tag=`[账号${index+1}/${total}]`;
  const headers=acc.capture.headers;

  function fetchApi(path){
    return Env.fetch({
      url:buildUrl(path,acc.capture),
      method:'GET',
      headers
    });
  }

  let msgs=[tag];

  return fetchApi('queryBalanceAndBonus').then(res=>{
    const d=JSON.parse(res.body);
    msgs.push(`余额：${d.result?.balance||'?'}`);
    return fetchApi('checkIn');
  }).then(res=>{
    const d=JSON.parse(res.body);
    msgs.push(`签到：${d.retmsg}`);
    return fetchApi('queryBalanceAndBonus');
  }).then(res=>{
    const d=JSON.parse(res.body);
    msgs.push(`最新余额：${d.result?.balance||'?'}`);
    return msgs.join('\n');
  }).catch(e=>{
    msgs.push('异常:'+e);
    return msgs.join('\n');
  });
}

// ===== 抓包 =====
if(typeof $request!=='undefined'){
  const store=loadStore();
  const paramsRaw=parseRawQuery($request.url);
  const id=Date.now().toString();

  store.accounts[id]={
    id,
    capture:{
      url:$request.url,
      paramsRaw,
      headers:$request.headers
    }
  };

  store.order.push(id);
  saveStore(store);

  notify('抓取成功',`当前账号数：${store.order.length}`);
  Env.done();

}else{
// ===== 任务执行 =====
  const store=loadStore();
  const ids=store.order||[];

  if(!ids.length){
    notify('错误','没有账号');
    Env.done();
  }

  let results=[];
  let chain=Promise.resolve();

  ids.forEach((id,idx)=>{
    chain=chain.then(()=>runAccount(store.accounts[id],idx,ids.length))
      .then(r=>results.push(r))
      .then(()=>idx<ids.length-1?sleep(ACCOUNT_GAP):null);
  });

  chain.then(()=>{
    notify('完成',results.join('\n\n'));
    Env.done();
  });
}