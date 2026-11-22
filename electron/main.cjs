// Desktop shell for the site. In production it runs Next's standalone server
// (built by `npm run desktop:build`) in a utility process on a free localhost
// port and points a window at it, so routing, the locale proxy and cookies
// behave exactly as on the web. In development it loads the `next dev` URL.
const { app, BrowserWindow, Menu, shell, utilityProcess } = require("electron");
const net = require("node:net");
const path = require("node:path");

const DEV_URL = process.env.ELECTRON_START_URL; // e.g. http://localhost:3000
const HOST = "127.0.0.1";

let server = null;
let baseUrl = null;

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, HOST, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function waitForPort(port, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.connect(port, HOST);
      socket.once("connect", () => {
        socket.end();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() > deadline) reject(new Error("Next server did not start"));
        else setTimeout(attempt, 100);
      });
    };
    attempt();
  });
}

async function startServer() {
  const standaloneDir = app.isPackaged
    ? path.join(process.resourcesPath, "standalone")
    : path.join(__dirname, "..", ".next", "standalone");
  const port = await freePort();

  server = utilityProcess.fork(path.join(standaloneDir, "server.js"), [], {
    cwd: standaloneDir,
    env: { ...process.env, NODE_ENV: "production", PORT: String(port), HOSTNAME: HOST },
    stdio: "inherit",
    serviceName: "next-server",
  });
  server.on("exit", (code) => {
    server = null;
    if (code !== 0 && !app.isQuitting) {
      console.error(`Next server exited with code ${code}`);
      app.quit();
    }
  });

  await waitForPort(port);
  return `http://${HOST}:${port}`;
}

function isInternal(url) {
  try {
    return new URL(url).origin === new URL(baseUrl).origin;
  } catch {
    return false;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 360,
    minHeight: 500,
    title: "Music Learnings",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once("ready-to-show", () => win.show());

  // Links that leave the app (sources, credits, GitHub…) open in the browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isInternal(url)) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (isInternal(url)) return;
    event.preventDefault();
    shell.openExternal(url);
  });

  win.loadURL(baseUrl);
  return win;
}

function buildMenu() {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac ? [{ role: "appMenu" }] : []),
    { role: "fileMenu" },
    { role: "editMenu" },
    {
      label: "Navigate",
      submenu: [
        {
          label: "Back",
          accelerator: "CmdOrCtrl+[",
          click: (_, win) => win?.webContents.navigationHistory.goBack(),
        },
        {
          label: "Forward",
          accelerator: "CmdOrCtrl+]",
          click: (_, win) => win?.webContents.navigationHistory.goForward(),
        },
        {
          label: "Home",
          accelerator: "CmdOrCtrl+Shift+H",
          click: (_, win) => win?.loadURL(baseUrl),
        },
      ],
    },
    { role: "viewMenu" },
    { role: "windowMenu" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(async () => {
    try {
      baseUrl = DEV_URL || (await startServer());
    } catch (error) {
      console.error(error);
      app.quit();
      return;
    }
    buildMenu();
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("before-quit", () => {
    app.isQuitting = true;
    server?.kill();
  });
}
