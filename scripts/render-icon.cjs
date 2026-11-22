// Renders desktop/icon.svg to desktop/icon.png (1024×1024) with Electron's
// Chromium, so no extra image tooling is needed. electron-builder derives the
// .icns/.ico from the PNG. Run: npx electron scripts/render-icon.cjs
const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const dir = path.join(__dirname, "..", "desktop");
const svg = fs.readFileSync(path.join(dir, "icon.svg"), "utf8");

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1024,
    height: 1024,
    show: false,
    frame: false,
    transparent: true,
    useContentSize: true,
    webPreferences: { offscreen: true, zoomFactor: 1 },
  });
  const html = `<html><body style="margin:0;background:transparent">${svg}</body></html>`;
  await win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));
  await new Promise((r) => setTimeout(r, 300));
  const image = await win.webContents.capturePage({ x: 0, y: 0, width: 1024, height: 1024 });
  const png = image.resize({ width: 1024, height: 1024 }).toPNG();
  fs.writeFileSync(path.join(dir, "icon.png"), png);
  console.log("wrote desktop/icon.png", image.getSize());
  app.quit();
});
