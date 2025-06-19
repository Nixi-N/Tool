// 1hi-ad-replacer.js
// 替换广告图为透明 PNG 图像

const emptyImageBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

// 可选日志，排查是否误杀（用于 Surge 或 QuantumultX 的调试面板）
// console.log("广告图已替换为空图:", $request.url);

$done({
  status: "200",
  headers: {
    "Content-Type": "image/png",
    "Cache-Control": "no-store"
  },
  body: emptyImageBase64
});