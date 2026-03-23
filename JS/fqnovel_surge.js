/*
FQNovel Smart Clean JS (Stable)
适配 Surge v18.1
重点：阅读页广告 + 10页插入广告
*/

let body = $response.body;

function clean(obj) {
    if (!obj) return obj;

    // 处理数组
    if (Array.isArray(obj)) {
        return obj.map(clean).filter(item => {
            if (!item) return false;

            let str = JSON.stringify(item).toLowerCase();

            // 🚫 精准过滤广告块（避免误删正文）
            if (
                str.includes("ad") ||
                str.includes("advert") ||
                str.includes("banner") ||
                str.includes("promotion") ||
                str.includes("commercial") ||
                str.includes("pangolin") ||
                str.includes("insertad") ||
                str.includes("flow_ad") ||
                str.includes("reader_ad") ||
                str.includes("chapter_ad")
            ) {
                return false;
            }

            return true;
        });
    }

    // 处理对象
    if (typeof obj === "object") {
        for (let key in obj) {
            if (!obj.hasOwnProperty(key)) continue;

            let k = key.toLowerCase();

            // 🚫 删除广告字段（核心）
            if (
                k.includes("ad") ||
                k.includes("advert") ||
                k.includes("banner") ||
                k.includes("promotion") ||
                k.includes("insertad") ||
                k.includes("flow_ad") ||
                k.includes("reader_ad") ||
                k.includes("chapter_ad")
            ) {
                delete obj[key];
                continue;
            }

            // 🚫 特殊字段（番茄插页广告关键）
            if (
                k === "ads" ||
                k === "ad_list" ||
                k === "ad_info" ||
                k === "flow_ad_list"
            ) {
                delete obj[key];
                continue;
            }

            obj[key] = clean(obj[key]);
        }
    }

    return obj;
}

try {
    let json = JSON.parse(body);

    // 🔥 关键：处理顶层常见广告结构
    if (json.data) {
        json.data = clean(json.data);
    } else {
        json = clean(json);
    }

    body = JSON.stringify(json);

} catch (e) {
    // 非JSON直接返回
}

$done({ body });