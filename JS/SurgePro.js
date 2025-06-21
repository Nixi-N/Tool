javascript
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
    let remainingTime = diff;
    
    const days = Math.floor(remainingTime / (24 * 3600 * 1000));
    remainingTime %= 24 * 3600 * 1000;
    
    const hours = Math.floor(remainingTime / (3600 * 1000));
    remainingTime %= 3600 * 1000;
    
    const minutes = Math.floor(remainingTime / (60 * 1000));
    remainingTime %= 60 * 1000;
    
    const seconds = Math.round(remainingTime / 1000);

    const parts = [];
    if (days) parts.push(`${days}天`);
    if (hours) parts.push(`${hours}时`);
    if (minutes) parts.push(`${minutes}分`);
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