const { app, ipcMain, dialog, shell, BrowserWindow } = require('electron');

const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { exec } = require('node:child_process');

const { serverBehavior } = require('./serverBehavior.js');

import Store from 'electron-store';
import { get } from 'node:http';
const userConfig = new Store();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const projectRoot = app.isPackaged
  ? process.resourcesPath
  : app.getAppPath();

var protocol = 'HTTP';

var outboxItems = new Map();
const inboxItems = new Map();

function addInboxItem(type, filename, url, size, buffer) {
  const uid = Math.floor(Math.random() * 1000000);

  inboxItems.set(uid, {
    buffer: buffer,
    filename: filename,
    type: type,
    mimetype: type == "url" || type == "text" ? "text/plain" : "application/octet-stream",
    size: size,
    url: url,
    savedPath: "",
  });

  let displayname = "item";
  let string = "";
  if (type === "file") {
    // displayname = filename.length > 20 ? filename.slice(0, 17) + "..." : filename;
    displayname = filename;
    string = null;
  } else if (type === "url") {
    displayname = "URL (" + URL.parse(url).hostname + ")";
    string = url;
  } else if (type === "text") {
    // displayname = "Text (" + (size > 20 ? buffer.slice(0, 17) + "..." : buffer) + ")";
    displayname = "Text (" + buffer + ")";
    string = buffer.toString('utf-8');
  }

  notifyRendererOfNewFile(BrowserWindow.getAllWindows()[0], {displayname: displayname, string: string, id: uid, size: size, type: type});

  return uid;
}

function savePendingFile(event, _id) {

  let allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length === 0) {
    return;
  }
  const window = allWindows[0];
  
  const id = JSON.parse(_id);

  console.log("Saving pending file with id: " + id);

  const file = inboxItems.get(id);
  
  console.log ("File to save: ", file);
  
  if (!file) {
    console.log("File not found in inboxItems map.");
    return;
  }

  if (!fs.existsSync(path.join(projectRoot, "uploads"))) {
    fs.mkdirSync(path.join(projectRoot, "uploads"));
  }

  let savePath = "";

  if (file.type === "file") {
    savePath = path.join(projectRoot, "uploads", id.toString() + "-" + file.filename);
  } else if (file.type === "text") {
    savePath = path.join(projectRoot, "uploads", id.toString() + "-text.txt");
  } else if (file.type === "url") {
    savePath = path.join(projectRoot, "uploads", id.toString() + "-url.txt");
  }

  fs.writeFile(savePath, file.buffer, (err) => {
    if (err) {
      console.error("Error saving file: ", err);
      window.webContents.send('savePendingFileResult', {id: id, path: ""});
      return;
    }
    
    inboxItems.get(id).savedPath = savePath;

    window.webContents.send('savePendingFileResult', {id: id, path: savePath });
  });
}

function revealPendingFile(event, _id) {
  const file = inboxItems.get(_id);

  if (!file) return;
  if (!file.savedPath || file.savedPath === "") return;
  
  shell.showItemInFolder(file.savedPath);
}

async function handleFileOpen(e, path) {
  if (path == null) {
    const { canceled, filePaths } = await dialog.showOpenDialog({});
    if (!canceled && filePaths.length > 0) {
      path = filePaths[0];
    } else {
      return [0, "null", 0];
    }
  }

  let uid = Math.floor(Math.random() * 1000000);
  outboxItems.set(uid, [path, "file"]);

  const fileSize = fs.statSync(path).size;
  return [uid, path.replace(/^.*[\\/]/, ''), fileSize]; // return to renderer
}

async function addTextToOutbox(event, text) {
  const buffer = Buffer.from(text, 'utf-8');

  let uid = Math.floor(Math.random() * 1000000);
  outboxItems.set(uid, [buffer, "text"]);
  return [uid, buffer.subarray(0, 128).toString('utf-8'), buffer.length]; // uid, filename, filesize
}

function getAnyIP() {
  const addrs = listAddrs();
  if (addrs.length > 0) {
    return addrs[0];
  } else {
    return "0.0.0.0";
  }
}

function getDefaultIP() {
  let ip = userConfig.get('lastUsedIP');

  console.log("last ip: ", ip);
  if (ip != null && listAddrs().includes(ip)) {
    console.log(ip);
    return ip;
  } else {
    console.log("ip null or not contained in ", listAddrs());
  }

  console.log("No valid saved IP, getting any available IP.");
  return getAnyIP();
}

function setIP(newIP) {
  userConfig.set('lastUsedIP', newIP);
}

function listAddrs() {
  const interfaces = os.networkInterfaces();
  let filteredAddrs = [];
  for (const name in interfaces) {
    const addrs = interfaces[name];
    for (const addr of addrs) {
      if (addr.family == 'IPv4' && !addr.internal && !addr.address.startsWith("169.254")) {
        filteredAddrs.push(addr.address);
      }
    }
  }
  return filteredAddrs;
}

function notifyRendererOfNewFile(window, file) {
  window.webContents.send('new-uploaded-file', file);
}

function attemptToggleProtocol(initServer){
  return function (){
    var res;
    if (protocol === 'HTTP') {
      //attempt switching to HTTPS
      res = initServer('HTTPS');
      console.log("Attempted to switch to HTTPS, success: " + res);
      if (res == false) {
        console.log("Failed to switch to HTTPS, keeping HTTP.");
        initServer('HTTP');
        // inform UI of failure
      } else {
        // succeeded, update protocol
        protocol = 'HTTPS';
      }
    } else {
      // switch from HTTPS to HTTP
      protocol = 'HTTP';
      res = initServer(protocol);
    }
    console.log("Protocol updated to " + protocol);
    userConfig.set('useHTTPS', protocol === 'HTTPS' ? true : false);
    return [protocol, res];
  }
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 450,
    minWidth: 800,
    minHeight: 310,
    frame: true,
    icon: path.join(projectRoot, 'static/clear.ico'),
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      devTools: true,
      sandbox: true,
    },
    ...(process.platform !== 'darwin' ? { titleBarOverlay: {
      color: '#202020ff',
      symbolColor: '#686868ff',
      height: 34
    }} : {})
  });

  const wc = mainWindow.webContents;
  const allowedPrefix = MAIN_WINDOW_WEBPACK_ENTRY;

  wc.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  wc.on("will-navigate", (event, url) => {
    if (!url.startsWith(allowedPrefix)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  wc.on("will-redirect", (event, url) => {
    if (!url.startsWith(allowedPrefix)) {
      event.preventDefault();
    }
  });

  wc.setWindowOpenHandler(() => ({ action: "deny" }));
  
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  console.log("Loading default view: " + MAIN_WINDOW_WEBPACK_ENTRY);

  return mainWindow;
};

app.whenReady().then(() => {
  ipcMain.handle('openFile', handleFileOpen);
  ipcMain.handle('addTextToOutbox', addTextToOutbox);
  ipcMain.handle('getDefaultIP', getDefaultIP);
  ipcMain.handle('setIP', (event, newIP) => {setIP(newIP); console.log("Set new IP to: ", newIP);});
  ipcMain.handle('listAddrs', listAddrs);
  ipcMain.handle('savePendingFile', savePendingFile);
  ipcMain.handle('revealPendingFile', revealPendingFile);
  ipcMain.handle('discardPendingFile', (event, id) => {inboxItems.delete(id)});
  ipcMain.handle('discardOutboxItem', (event, id) => {outboxItems.delete(id)});
  ipcMain.handle('attemptToggleProtocol', attemptToggleProtocol(initServer));
  ipcMain.handle('setPort', (event, newPort) => {userConfig.set('port', newPort); initServer(protocol);});
  ipcMain.handle('getPort', () => {
    return userConfig.get('port');
  });
  ipcMain.handle('getProtocol', () => {
    return protocol;
  });
  ipcMain.handle('setTLSKeyPath', (event, path) => {console.log("received tlsKeyPath: ", path); userConfig.set('tlsKeyPath', path);});
  ipcMain.handle('getTLSKeyPath', () => {
    return userConfig.get('tlsKeyPath');
  });
  ipcMain.handle('setTLSCertPath', (event, path) => {console.log("received tlsCertPath: ", path); userConfig.set('tlsCertPath', path);});
  ipcMain.handle('getTLSCertPath', () => {
    return userConfig.get('tlsCertPath');
  });

  let server = null;

  console.log("Protocol: " + protocol);

  createWindow();

  function initServer(proto) {
    console.log("Initializing server with protocol: " + proto);
    if (server != null) {
      server.close();
    }
    if (proto == 'HTTPS') {
      try {
        let tlsKeyPath = userConfig.get('tlsKeyPath');
        let tlsCertPath = userConfig.get('tlsCertPath');
        console.log("Loaded tlsKeyPath: " + tlsKeyPath);
        console.log("Loaded tlsCertPath: " + tlsCertPath);
        if (!tlsKeyPath || tlsKeyPath === "" || !fs.existsSync(tlsKeyPath)) {
          tlsKeyPath = path.join(projectRoot, "key.pem");
        }
        if (!tlsCertPath || tlsCertPath === "" || !fs.existsSync(tlsCertPath)) {
          tlsCertPath = path.join(projectRoot, "cert.pem");
        }

        var key = fs.readFileSync(tlsKeyPath);
        var cert = fs.readFileSync(tlsCertPath);
        console.log("Loaded SSL key and cert.");

        if (!key || !cert) {
          console.log("SSL key or cert not found.");
          throw("Unable to load SSL key/cert");
        }

        const SSLOptions = {
          key: key,
          cert: cert,
        };
      
        server = require('https').createServer(SSLOptions, serverBehavior(projectRoot, addInboxItem, outboxItems));
      } catch (e) {
        console.log("Error initializing HTTPS server: ", e);
        return false;
      }
    } else {
      server = require('http').createServer(serverBehavior(projectRoot, addInboxItem, outboxItems));
    }
    let p = userConfig.get('port');
    if (!p || isNaN(p)) {
      p = 2222;
      userConfig.set('port', p);
    }
    server.listen(userConfig.get('port'), () => {
      console.log(`Server listening at ${protocol.toLowerCase()}://*:${userConfig.get('port')}/`);
    });

    return true;
  }

  initServer(protocol);

  // protocol is initialized to HTTP. If userconfig says it should be HTTPS, attempt a switch now
  if (userConfig.get('useHTTPS') == true) {
    attemptToggleProtocol(initServer)();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});