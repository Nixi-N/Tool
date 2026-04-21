// ===== Env 兼容 =====
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
      $httpClient.get(options, (err, resp, body) => {
        if (err) reject(err);
        else resolve({ statusCode: resp.status, headers: resp.headers, body });
      });
    });
  };

  const done = () => $done();

  return { getdata, setdata, msg, fetch, done };
})();

// ===== 基础配置 =====
const scriptName = 'WeTalk';
const storeKey = 'wetalk_accounts_v1';
const SECRET = '0fOiukQq7jXZV2GRi9LGlO';
const API_HOST = 'api.wetalkapp.com';

const MAX_VIDEO = 5;
const VIDEO_DELAY = 8000;
const ACCOUNT_GAP = 3000;

// ===== MD5（完整版）=====
function MD5(string){
  function RotateLeft(lValue, iShiftBits){return (lValue<<iShiftBits)|(lValue>>>(32-iShiftBits));}
  function AddUnsigned(lX,lY){
    const lX4=lX&0x40000000,lY4=lY&0x40000000,lX8=lX&0x80000000,lY8=lY&0x80000000;
    const lResult=(lX&0x3FFFFFFF)+(lY&0x3FFFFFFF);
    if(lX4&lY4)return lResult^0x80000000^lX8^lY8;
    if(lX4|lY4)return(lResult&0x40000000)?(lResult^0xC0000000^lX8^lY8):(lResult^0x40000000^lX8^lY8);
    return lResult^lX8^lY8;
  }
  function F(x,y,z){return(x&y)|((~x)&z);}
  function G(x,y,z){return(x&z)|(y&(~z));}
  function H(x,y,z){return x^y^z;}
  function I(x,y,z){return y^(x|(~z));}
  function FF(a,b,c,d,x,s,ac){a=AddUnsigned(a,AddUnsigned(AddUnsigned(F(b,c,d),x),ac));return AddUnsigned(RotateLeft(a,s),b);}
  function GG(a,b,c,d,x,s,ac){a=AddUnsigned(a,AddUnsigned(AddUnsigned(G(b,c,d),x),ac));return AddUnsigned(RotateLeft(a,s),b);}
  function HH(a,b,c,d,x,s,ac){a=AddUnsigned(a,AddUnsigned(AddUnsigned(H(b,c,d),x),ac));return AddUnsigned(RotateLeft(a,s),b);}
  function II(a,b,c,d,x,s,ac){a=AddUnsigned(a,AddUnsigned(AddUnsigned(I(b,c,d),x),ac));return AddUnsigned(RotateLeft(a,s),b);}
  function ConvertToWordArray(str){
    const l=str.length,n=((l+8-(l+8)%64)/64+1)*16,a=Array(n-1).fill(0);
    let i=0,b=0;
    while(b<l){a[(b-(b%4))/4]|=str.charCodeAt(b)<<(b%4*8);b++;}
    a[(b-(b%4))/4]|=0x80<<(b%4*8);
    a[n-2]=l<<3;a[n-1]=l>>>29;
    return a;
  }
  function WordToHex(l){
    let v='',t;
    for(let i=0;i<=3;i++){t=(l>>>(i*8))&255;v+=('0'+t.toString(16)).slice(-2);}
    return v;
  }
  const x=ConvertToWordArray(string);
  let a=0x67452301,b=0xEFCDAB89,c=0x98BADCFE,d=0x10325476;
  for(let k=0;k<x.length;k+=16){
    const AA=a,BB=b,CC=c,DD=d;
    a=FF(a,b,c,d,x[k+0],7,0xD76AA478);d=FF(d,a,b,c,x[k+1],12,0xE8C7B756);
    c=FF(c,d,a,b,x[k+2],17,0x242070DB);b=FF(b,c,d,a,x[k+3],22,0xC1BDCEEE);
    a=AddUnsigned(a,AA);b=AddUnsigned(b,BB);c=AddUnsigned(c,CC);d=AddUnsigned(d,DD);
  }
  return (WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d)).toLowerCase();
}

// ===== 工具 =====
function parseRawQuery(url){
  const q=(url.split('?')[1]||'').split('#')[0];
  const m={};
  q.split('&').forEach(p=>{
    const i=p.indexOf('=');
    if(i>0)m[p.slice(0,i)]=p.slice(i+1);
  });
  return m;
}

function getUTCSignDate(){
  const d=new Date();
  const p=n=>String(n).padStart(2,'0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth()+1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}

function loadStore(){
  const raw=Env.getdata(storeKey);
  if(!raw)return {accounts:{},order:[]};
  try{return JSON.parse(raw)}catch{return {accounts:{},order:[]}};
}

function saveStore(s){Env.setdata(JSON.stringify(s),storeKey);}

// ===== UA =====
function buildUA(){
  const ios=['17.6','17.5','16.7'];
  const model=['iPhone14,3','iPhone15,3'];
  return `WeTalk/30.6.0 (iOS ${ios[Math.random()*ios.length|0]}; ${model[Math.random()*model.length|0]})`;
}

// ===== 请求 =====
function buildParams(c){
  const p={};
  Object.keys(c.paramsRaw).forEach(k=>{
    if(k!=='sign'&&k!=='signDate')p[k]=c.paramsRaw[k];
  });
  p.signDate=getUTCSignDate();
  const base=Object.keys(p).sort().map(k=>`${k}=${p[k]}`).join('&');
  p.sign=MD5(base+SECRET);
  return p;
}

function buildUrl(path,c){
  const p=buildParams(c);
  return `https://${API_HOST}/app/${path}?`+
    Object.keys(p).map(k=>`${k}=${encodeURIComponent(p[k])}`).join('&');
}

// ===== 核心 =====
function run(acc,i,total){
  const headers=Object.assign({},acc.capture.headers);
  headers['User-Agent']=buildUA();

  const req=(path)=>Env.fetch({url:buildUrl(path,acc.capture),headers});

  let msg=[`账号${i+1}/${total}`];

  return req('queryBalanceAndBonus')
  .then(r=>{
    const d=JSON.parse(r.body);
    msg.push(`余额:${d.result?.balance}`);
    return req('checkIn');
  })
  .then(r=>{
    const d=JSON.parse(r.body);
    msg.push(`签到:${d.retmsg}`);

    let i=0;
    function loop(){
      if(i>=MAX_VIDEO)return Promise.resolve();
      i++;
      return new Promise(res=>setTimeout(res,VIDEO_DELAY))
      .then(()=>req('videoBonus'))
      .then(r=>{
        const d=JSON.parse(r.body);
        msg.push(`视频${i}:${d.retmsg}`);
        return loop();
      });
    }
    return loop();
  })
  .then(()=>Env.msg(scriptName,'完成',msg.join('\n')));
}

// ===== 主逻辑 =====
(function(){

  if(typeof $request!=='undefined'){
    const store=loadStore();
    const id=Date.now().toString();

    store.accounts[id]={
      capture:{
        url:$request.url,
        paramsRaw:parseRawQuery($request.url),
        headers:$request.headers
      }
    };

    store.order.push(id);
    saveStore(store);

    Env.msg(scriptName,'抓取成功',`账号数:${store.order.length}`);
    Env.done();
    return;
  }

  const store=loadStore();
  const ids=store.order||[];

  if(!ids.length){
    Env.msg(scriptName,'错误','未抓到账号');
    Env.done();
    return;
  }

  let chain=Promise.resolve();

  ids.forEach((id,i)=>{
    chain=chain.then(()=>run(store.accounts[id],i,ids.length))
      .then(()=>new Promise(r=>setTimeout(r,ACCOUNT_GAP)));
  });

  chain.then(()=>Env.done());

})();