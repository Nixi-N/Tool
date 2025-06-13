/*
#!name=No Splash Ad
#!desc=Replaces specific splash screen ad images with a transparent GIF.
#!script-path=no_splash_ad.js  // 请确保此路径与您实际存放的路径一致
#!type=http-response
#!pattern=https://externalimage.1hai.cn/512/8bc961b2179845adbdf66254a25b1b52.png // 精确匹配开屏广告图片URL
#!requires-body=true // 需要访问和修改响应体
*/

function http_response(request, response) {
    // 1x1 像素的透明 GIF 图片的 Base64 编码数据
    const transparentGifBase64 = "R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
    const transparentGifData = Uint8Array.from(atob(transparentGifBase64), c => c.charCodeAt(0));

    // 检查请求的URL是否是我们想要替换的广告图片
    // 这里的 pattern 已经匹配了，但为了严谨性，可以在脚本内部再次确认
    if (request.url.includes("externalimage.1hai.cn/512/8bc961b2179845adbdf66254a25b1b52.png")) {
        console.log("Intercepted splash ad image: " + request.url);

        // 修改响应的 Content-Type 为 image/gif
        response.headers['Content-Type'] = 'image/gif';
        // 替换响应体为透明 GIF 数据
        response.body = transparentGifData;
        // 更新 Content-Length
        response.headers['Content-Length'] = transparentGifData.length.toString();
        
        console.log("Replaced with transparent GIF.");
    }
    
    return response;
}
