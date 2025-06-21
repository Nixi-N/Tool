```javascript
let params = getParams($argument);

(async () => {
    try {
        const traffic = await httpAPI("/v1/traffic", "GET");
        const currentDate = new Date();
        const startTimestamp = Math.floor(traffic.startTime * 1000);
        const startTime = timeTransform(currentDate, startTimestamp);

        if ($trigger === "button") await httpAPI("/v1/profiles/reload");

        $done({
            title: "Surge Pro®",
            content: `启动时长: ${startTime}`,
            icon: params.icon,
            "icon-color": params.color
        });
    } catch (error) {
        console.error("Error:", error);
        $done();
    }
})();

function timeTransform(currentDate, startTimestamp) {
    const diff = currentDate - startTimestamp;
    const days = Math.floor(diff / (24 * 3600 * 1000)); // 计算天
    const hours = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000)); // 计算小时
    const minutes = Math.floor((diff % (3600 * 1000)) / (60 * 1000)); // 计算分钟
    const seconds = Math.round((diff % (60 * 1000)) / 1000); // 计算秒

    const parts = [];
    if (days) parts.push(`${days}天`);
    if (hours || days) parts.push(`${hours}时`);
    if (minutes || hours || days) parts.push(`${minutes}分`);
    parts.push(`${seconds}秒`);
    return parts.join('');
}

function httpAPI(path = "", method = "POST", body = null) {
    return new Promise((resolve, reject) => {
        $httpAPI(method, path, body, (result, error) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}
```
