/**
 * DragonRead 阅读页广告清理脚本
 * 兼容 Surge / Loon
 * 功能：删除章节 JSON 内的广告字段，包括 insertAd、banner、ads 等
 */

let body = $response.body;

try {
    let obj = JSON.parse(body);

    function removeAds(o) {
        for (let k in o) {
            if (k.toLowerCase().includes("ad") || 
                k.toLowerCase().includes("advert") || 
                k.toLowerCase().includes("banner") || 
                k.toLowerCase().includes("insert")) {
                if (Array.isArray(o[k])) {
                    o[k] = [];
                } else if (typeof o[k] === "object") {
                    for (let sub in o[k]) delete o[k][sub];
                } else {
                    o[k] = null;
                }
            }
            if (typeof o[k] === "object" && o[k] !== null) {
                removeAds(o[k]);
            }
        }
    }

    removeAds(obj);

    body = JSON.stringify(obj);

} catch (e) {
    console.log("DragonRead Remove Ads Script Error:", e);
}

$done({ body });