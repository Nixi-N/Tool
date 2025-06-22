let params = getParams($argument);

(async () => {
    // 获取流量信息并计算启动时间
    const traffic = await httpAPI("/v1/traffic", "GET");
    const currentDate = new Date();
    const startTimestamp = Math.floor(traffic.startTime * 1000);
    const startTime = timeTransform(currentDate, startTimestamp);

    if ($trigger === "button") {
        await httpAPI("/v1/profiles/reload");
    }

    $done({
        title: "Surge Pro",
        content: `启动时长: ${startTime}`,
        icon: params.icon,
        "icon-color": params.color
    });
})();

function timeTransform(currentDate, startTimestamp) {
    const diff = currentDate - startTimestamp;
    const days = Math.floor(diff / (24 * 3600 * 1000));
    const hours = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000));
    const minutes = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
    const seconds = Math.round((diff % (60 * 1000)) / 1000);

    if (days > 0) return `${days}天${hours}时${minutes}分`;
    if (hours > 0) return `${hours}时${minutes}分${seconds}秒`;
    if (minutes > 0) return `${minutes}分${seconds}秒`;
    return `${seconds}秒`;
}

function httpAPI(path, method = "POST", body = null) {
    return new Promise(resolve => {
        $httpAPI(method, path, body, resolve);
    });
}

function getParams(param) {
    return Object.fromEntries(
        param.split("&").map(item => {
            const [key, value] = item.split("=");
            return [key, decodeURIComponent(value)];
        })
    );
}