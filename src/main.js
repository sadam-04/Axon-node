const { app, ipcMain, dialog, BrowserWindow } = require('electron');
const path = require('node:path');
// const https = require('node:https');
const url = require('node:url');
const fs = require('node:fs');
const os = require('node:os');
// const Store = require('electron-store');
const { exec } = require('node:child_process');
const multer = require('multer');

import Store from 'electron-store';
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

  const filePath = path.join(projectRoot, "uploads", id.toString() + "-" + file.originalname);
  console.log("File found, saving as " + filePath);

  fs.writeFile(filePath, file.buffer, (err) => {
    if (err) {
      console.error("Error saving file: ", err);
      window.webContents.send('savePendingFileResult', {id: id, path: ""});
      return;
    }
    
    pendingFiles.get(_id).savedPath = filePath;
    
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

async function handleFileOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog({});
  if (!canceled && filePaths.length > 0) {
    //const data = await fs.readFile(filePaths[0], 'utf-8');
    let uid = Math.floor(Math.random() * 1000000);
    // const uurl = `${protocol}://localhost:3030/get/${uid}`;
    urlPathMappings[uid] = [filePaths[0], true];
    const fileSize = fs.statSync(filePaths[0]).size;
    return [uid, filePaths[0], fileSize]; // return to renderer
  }
  return [0, "null", 0];
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

function getDefaultIP() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    const addrs = interfaces[name];
    for (const addr of addrs) {
      if (addr.family == 'IPv4' && !addr.internal && !addr.address.startsWith("169.254")) {
        return addr.address;
      }
    }
  }
  return null;
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

function setTLSFilePath(event, path) {
  console.log("received tlsPath: ", path)
  userConfig.set('tlsFilePath', path);
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
} {

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
    },
    ...(process.platform !== 'darwin' ? { titleBarOverlay: {
      color: '#202020ff',
      symbolColor: '#686868ff',
      height: 34
    }} : {})
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

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

const upload = multer({ storage: multer.memoryStorage() });

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  ipcMain.handle('openFile', handleFileOpen);
  ipcMain.handle('setServing', toggleSpecificItem);
  ipcMain.handle('getDefaultIP', getDefaultIP);
  ipcMain.handle('listAddrs', listAddrs);
  ipcMain.handle('savePendingFile', savePendingFile);
  ipcMain.handle('revealPendingFile', revealPendingFile);
  ipcMain.handle('discardPendingFile', discardPendingFile);
  ipcMain.handle('setTLSFilePath', setTLSFilePath);
  ipcMain.handle('attemptToggleProtocol', attemptToggleProtocol(initServer));
  ipcMain.handle('getProtocol', () => {
    return protocol;
  });
  ipcMain.handle('getTLSFilePath', () => {
    return userConfig.get('tlsFilePath');
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
        let tlsPath = userConfig.get('tlsFilePath');
        console.log("Loaded tlsPath: " + tlsPath);
        if (!tlsPath || tlsPath === "" || !fs.existsSync(tlsPath)) {
          tlsPath = projectRoot;
        }

        var key = fs.readFileSync(path.join(tlsPath, 'key.pem'));
        var cert = fs.readFileSync(path.join(tlsPath, 'cert.pem'));
        console.log("Loaded SSL key and cert.");

        if (!key || !cert) {
          console.log("SSL key or cert not found.");
          throw("Unable to load SSL key/cert");
        }

        const SSLOptions = {
          key: key,
          cert: cert,
        };
      
        server = require('https').createServer(SSLOptions, serverBehavior);
      } catch (e) {
        console.log("Error initializing HTTPS server: ", e);
        return false;
      }
    } else {
      server = require('http').createServer(serverBehavior);
    }
    server.listen(3030, () => {
      console.log(`Server listening at ${protocol.toLowerCase()}://*:3030/`);
    });

    return true;
  }



  const serverBehavior = (req, res) => {

    const parsedUrl = url.parse(req.url, true);
    const urlFilter = /^\/get\/(\d+)$/;

    if (parsedUrl.pathname == "/send") {
      if (req.method == 'POST') {
        upload.single('file')(req, res, function (err) {
          if (!req.file) {
            return;
          }
          
          if (err) {
            res.statusCode = 500;
            res.end("Error uploading file");
            return;
          }
          // console.log(req.file.buffer);

          const file = req.file;
          const uid = addPendingFile(file);
          notifyRendererOfNewFile(mainWindow, {filename: file.originalname, id: uid, size: file.size, savedAt: ""});
        });
      }
      
      const filePath = path.join(projectRoot, 'src', 'clientSend.html');
      fs.readFile(filePath, (err, data) => {
          if (err) {
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end('Server Error: ' + err);
              return;
          }

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
      });

      // res.statusCode = 200;
      // res.end("send endpoint");
      // console.log("returning...");
      return;
    }

    if (parsedUrl.pathname == "/clientSend.css") {
      const filePath = path.join(projectRoot, 'src', 'clientSend.css');
      fs.readFile(filePath, (err, data) => {
          if (err) {
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end('Server Error: ' + err);
              return;
          }

          res.writeHead(200, { 'Content-Type': 'text/css' });
          res.end(data);
      });

      return;
    }

    let filePath = null;
    let index = null;

    if (urlFilter.test(parsedUrl.pathname)) {
      const match = parsedUrl.pathname.match(urlFilter);

      index = match[1];
      filePath = urlPathMappings[index][0];

      if (urlPathMappings[index][1] == false) {
        res.statusCode = 404;
        res.end("Not found");
        return;
      }
    }

    if (filePath == null) {
      res.statusCode = 500;
      res.end("Unknown request")
      return;
    }

    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        res.statusCode = 404;
        res.end("Not found");
      }

      fs.stat(filePath, (err, stats) => {
        if (err) {
          res.statusCode = 500;
          res.end("Server error");
          return;
        }

        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename=${path.basename(filePath)}`);

        const stream = fs.createReadStream(filePath);

        stream.on('error', (err) => {
          console.error('Error reading file: ', err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.end("Server error");
          }
        });

        stream.pipe(res);
      });
    });
  };

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