let body = $response.body;

try {

let obj = JSON.parse(body);

function removeAds(o){
    for (let k in o){
        if (
            k.toLowerCase().includes("ad") ||
            k.toLowerCase().includes("advert") ||
            k.toLowerCase().includes("banner") ||
            k.toLowerCase().includes("insert")
        ){
            o[k] = [];
        }
        if (typeof o[k] === "object"){
            removeAds(o[k]);
        }
    }
}

removeAds(obj);

body = JSON.stringify(obj);

}catch(e){}

$done({body});