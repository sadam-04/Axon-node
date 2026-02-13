const { app, ipcMain, dialog, shell, BrowserWindow } = require('electron');

// const https = require('node:https');

const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
// const Store = require('electron-store');
const { exec } = require('node:child_process');

const { serverBehavior } = require('./serverBehavior.js');

import Store from 'electron-store';
import { get } from 'node:http';
const userConfig = new Store();

// red: #FF4a51

const projectRoot = app.isPackaged
  ? process.resourcesPath
  : app.getAppPath();

// send mode url paths
var urlPathMappings = {};

// var protocol = userConfig.get('useHTTPS') == true ? 'HTTPS' : 'HTTP';
var protocol = 'HTTP';

//recv mode pending file buffers
const pendingFiles = new Map();
function addPendingFile(file) {
  const uid = Math.floor(Math.random() * 1000000);

  pendingFiles.set(uid, {
    buffer: file.buffer,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    savedPath: "",
  });
  console.log("Added pending file with id: " + uid);
  return uid;
}

function savePendingFile(event, _id, callback=null) {

  let allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length === 0) {
    return;
  }
  const window = allWindows[0];
  

  const id = JSON.parse(_id);

  console.log("Saving pending file with id: " + id);

  const file = pendingFiles.get(id);
  
  
  if (!file) {
    console.log("File not found in pendingFiles map.");
    return;
  }

  if (!fs.existsSync(path.join(projectRoot, "uploads"))) {
    fs.mkdirSync(path.join(projectRoot, "uploads"));
  }

  let filePath = path.join(projectRoot, "uploads", id.toString() + "-" + file.originalname);
  if (file.originalname == "text") {
    filePath = filePath + ".txt";
  }

  console.log("File found, saving as " + filePath);

  fs.writeFile(filePath, file.buffer, (err) => {
    if (err) {
      console.error("Error saving file: ", err);
      window.webContents.send('savePendingFileResult', {id: id, path: ""});
      return;
    }
    
    pendingFiles.get(id).savedPath = filePath;
    
    if (callback) {
      callback();
    }

    // pendingFiles.delete(id);
    window.webContents.send('savePendingFileResult', {id: id, path: filePath });
    // console.log("File saved and removed from pendingFiles map.");
  });
}

function revealPendingFile(event, _id) {
  const file = pendingFiles.get(_id);
  if (!file) return;

  if (!file.savedPath || file.savedPath === "") return;

  const filePath = file.savedPath;

  exec(`explorer.exe "${path.dirname(filePath)}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
  });

  // savePendingFile(event, _id, () => {
  //   if (file) {
  //     // const filePath = path.join(projectRoot, "uploads", file.originalname);
  //     const filePath = file.savedPath;

  //     exec(`explorer.exe "${path.dirname(filePath)}"`, (error, stdout, stderr) => {
  //       if (error) {
  //         console.error(`exec error: ${error}`);
  //         return;
  //       }
  //       console.log(`stdout: ${stdout}`);
  //       console.error(`stderr: ${stderr}`);
  //     });
  //   }
  // });

  // console.log("Opening saved file with id: " + _id);

}

function discardPendingFile(event, _id) {
  // const id = JSON.parse(_id);
  pendingFiles.delete(_id);
}

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

async function handleFileOpen(e, path) {
  if (path == null) {
    console.log("openFile called with no specified path. Opening file dialog.");
    const { canceled, filePaths } = await dialog.showOpenDialog({});
    if (!canceled && filePaths.length > 0) {
      path = filePaths[0];
    } else {
      return [0, "null", 0];
    }
  } else {
    console.log("openFile(" + path + ") called.");
  }

  let uid = Math.floor(Math.random() * 1000000);
  urlPathMappings[uid] = [path, true, 1]; // 1 indicates this is a file path, not a text buffer
  const fileSize = fs.statSync(path).size;
  return [uid, path.replace(/^.*[\\/]/, ''), fileSize]; // return to renderer
}

async function addTextToOutbox(event, text) {
  console.log("Adding text to outbox: ", text);
  const buffer = Buffer.from(text, 'utf-8');

  let uid = Math.floor(Math.random() * 1000000);
  urlPathMappings[uid] = [buffer, true, 2]; // 2 indicates this is a text buffer, not a file path
  return [uid, buffer.subarray(0, 128).toString('utf-8'), buffer.length]; // uid, filename, filesize
}

// toggle a file on/off
async function toggleSpecificItem(event, shouldServe, id) {
  console.log(`Set checkbox ${id} to ${shouldServe}`);
  if (!(id in urlPathMappings)) {
    return false;
  }
  urlPathMappings[id][1] = shouldServe ? true : false;
  return true;
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
  // console.log("listAddrs called");
  const interfaces = os.networkInterfaces();
  let filteredAddrs = [];
  for (const name in interfaces) {
    const addrs = interfaces[name];
    for (const addr of addrs) {
      // console.log(addr.address);
      if (addr.family == 'IPv4' && !addr.internal && !addr.address.startsWith("169.254")) {
        // return addr.address;
        filteredAddrs.push(addr.address);
      }
    }
  }
  // console.log("listAddrs returning:", filteredAddrs);
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
    // initServer();
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
  const allowedPrefix = MAIN_WINDOW_WEBPACK_ENTRY; // whatever you load first

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
  
  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);


  
  console.log("Loading default view: " + MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  return mainWindow;
};

// const multerDisk = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'uploads/'); // Specify the directory to save files
//     },
//     filename: function (req, file, cb) {
//         // Customize filename to avoid conflicts
//         cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
//     }
// });



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  ipcMain.handle('openFile', handleFileOpen);
  ipcMain.handle('addTextToOutbox', addTextToOutbox);
  ipcMain.handle('setServing', toggleSpecificItem);
  ipcMain.handle('getDefaultIP', getDefaultIP);
  ipcMain.handle('setIP', (event, newIP) => {setIP(newIP); console.log("Set new IP to: ", newIP);});
  ipcMain.handle('listAddrs', listAddrs);
  ipcMain.handle('savePendingFile', savePendingFile);
  ipcMain.handle('revealPendingFile', revealPendingFile);
  ipcMain.handle('discardPendingFile', discardPendingFile);
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

  const mainWindow = createWindow();

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
      
        server = require('https').createServer(SSLOptions, serverBehavior(projectRoot, addPendingFile, notifyRendererOfNewFile, urlPathMappings, mainWindow));
      } catch (e) {
        console.log("Error initializing HTTPS server: ", e);
        return false;
      }
    } else {
      server = require('http').createServer(serverBehavior(projectRoot, addPendingFile, notifyRendererOfNewFile, urlPathMappings, mainWindow));
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


  //create client web server


  // if (userConfig.get('useHTTPS') == true) {
  //   server = require('https').createServer(SSLOptions, serverBehavior);
  // } else {
  //   server = require('http').createServer(serverBehavior);
  // }
  
  // server.listen(3030, () => {
  //   console.log('Server running at http://localhost:3030/');
  // });

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.}