/*
FQNovel Deep Clean Ultimate JS
适配 Surge v12 模块
作者: GPT + Nixi-N
功能: 清理阅读页广告
*/

let body = $response.body;

function cleanAds(obj) {
    if (!obj) return obj;

    // 如果是数组，递归清理每一项
    if (Array.isArray(obj)) {
        return obj
            .map(cleanAds)
            .filter(item => {
                if (!item) return false;
                let str = JSON.stringify(item).toLowerCase();
                // 包含常见广告字段则删除
                return !(
                    str.includes("ad") ||
                    str.includes("advert") ||
                    str.includes("banner") ||
                    str.includes("promotion") ||
                    str.includes("pangolin") ||
                    str.includes("commercial") ||
                    str.includes("insert") ||
                    str.includes("popup")
                );
            });
    }

    // 如果是对象，递归清理每个 key
    if (typeof obj === "object") {
        for (let key in obj) {
            if (!obj.hasOwnProperty(key)) continue;
            let k = key.toLowerCase();
            if (
                k.includes("ad") ||
                k.includes("advert") ||
                k.includes("banner") ||
                k.includes("promotion") ||
                k.includes("insert") ||
                k.includes("popup")
            ) {
                delete obj[key];
                continue;
            }
            obj[key] = cleanAds(obj[key]);
        }
    }

    return obj;
}

try {
    let json = JSON.parse(body);
    json = cleanAds(json);
    body = JSON.stringify(json);
} catch (e) {
    // 如果不是 JSON 格式，直接返回原 body
}

$done({ body });