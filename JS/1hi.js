// 1hi.js - 高级版：仅替换超大图（疑似广告）为空白图

if (!$response.body) {
  $done({});
} else {
  const maxAdSize = 200 * 1024; // 超过200KB就认为是广告图

  if ($response.body.length > maxAdSize) {
    const emptyImageBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

    console.log(`🚫 拦截广告图：${$request.url}，大小：${$response.body.length}B`);

    $done({
      status: "200",
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store"
      },
      body: emptyImageBase64
    });
  } else {
    // 图片不大，不认为是广告
    $done({});
  }
}