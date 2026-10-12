import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { iphoneScreens } from "../apps/web/src/lib/app/ios-startup.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const requireWeb = createRequire(resolve(root, "apps/web/package.json"));
const requireNext = createRequire(requireWeb.resolve("next/package.json"));
const sharp = requireNext("sharp");
const symbol = readFileSync(resolve(root, "apps/web/public/icons/brand-symbol-192.png"));
const output = resolve(root, "apps/web/public/icons/startup");
mkdirSync(output, { recursive: true });
// These backgrounds are the existing B theme colors in lib/app/theme.mjs.
for (const [cssWidth, cssHeight, scale] of iphoneScreens) {
  for (const orientation of ["portrait", "landscape"]) {
    const width = (orientation === "portrait" ? cssWidth : cssHeight) * scale;
    const height = (orientation === "portrait" ? cssHeight : cssWidth) * scale;
    const size = 64 * scale;
    // Match the existing loading logo's 16px radius; do not leave a white square
    // around its rounded shape on the dark launch background.
    const mask = Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${16 * scale}" fill="white"/></svg>`);
    const logo = await sharp(symbol).resize(size, size).ensureAlpha()
      .composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
    for (const [theme, background] of [["light", "#eaf0f8"], ["dark", "#0b1220"]]) {
      await sharp({ create: { width, height, channels: 3, background } })
        .composite([{ input: logo, left: Math.round((width - size) / 2), top: Math.round((height - size) / 2) }])
        .png({ compressionLevel: 9, palette: true })
        .toFile(resolve(output, `${cssWidth}-${cssHeight}-${scale}-${orientation}-${theme}.png`));
    }
  }
}
console.log(`Generated ${iphoneScreens.length * 4} static, data-free iOS startup images.`);
// Only this public, data-free error document may be cached by the service worker.
// No external stylesheet/font/script is needed to render an offline launch.
writeFileSync(resolve(root, "apps/web/public/offline.html"), `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mất kết nối · Quản Lý Vay</title>
<style>:root{color-scheme:light dark;--bg:#eaf0f8;--fg:#142238;--muted:#52647c;--button:#1d4ed8;--on:#fff}@media(prefers-color-scheme:dark){:root{--bg:#0b1220;--fg:#f1f5fc;--muted:#b3c2d7;--button:#93c5fd;--on:#111827}}*{box-sizing:border-box}body{margin:0;min-height:100vh;min-height:100dvh;display:grid;place-content:center;padding:24px;text-align:center;background:var(--bg);color:var(--fg);font-family:Inter,system-ui,sans-serif}main{max-width:360px}img{width:64px;height:64px;border-radius:16px}h1{font-size:20px;font-weight:600;margin:24px 0 12px}p{color:var(--muted);font-size:16px;line-height:1.5;text-wrap:pretty;margin:0 0 24px}a{display:inline-flex;min-height:44px;align-items:center;justify-content:center;padding:12px 24px;border-radius:12px;background:var(--button);color:var(--on);font-size:16px;text-decoration:none}a:focus-visible{outline:3px solid var(--fg);outline-offset:4px}</style></head>
<body><main role="alert"><img alt="" width="64" height="64" src="data:image/png;base64,${symbol.toString("base64")}"><h1>Đang mất kết nối</h1><p>Kết nối Internet để tải dữ liệu mới.</p><a href="">Thử lại</a></main></body></html>\n`);
