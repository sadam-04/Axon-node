const { app, ipcMain, dialog, BrowserWindow } = require('electron');
const path = require('node:path');
const http = require('node:http');
const url = require('node:url');
const fs = require('node:fs');
const os = require('node:os');
const multer = require('multer');
const QRCode = require('qrcode');

// red: #FF4a51

const projectRoot = app.isPackaged
  ? process.resourcesPath
  : path.join(app.getAppPath(), 'src');

var urlPathMappings = {};

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
    const uurl = `http://localhost:3030/get/${uid}`;
    urlPathMappings[uid] = [filePaths[0], true];
    const fileSize = fs.statSync(filePaths[0]).size;
    return [uurl, filePaths[0], fileSize]; // return to renderer
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
  console.log("listAddrs called");
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
  console.log("listAddrs returning:", filteredAddrs);
  return filteredAddrs;
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
    ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {})
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Specify the directory to save files
    },
    filename: function (req, file, cb) {
        // Customize filename to avoid conflicts
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  ipcMain.handle('openFile', handleFileOpen);
  ipcMain.handle('setServing', toggleSpecificItem);

  ipcMain.handle('getDefaultIP', getDefaultIP);
  ipcMain.handle('listAddrs', listAddrs);

  createWindow();

  //create client web server
  const server = http.createServer((req, res) => {

    const parsedUrl = url.parse(req.url, true);
    const urlFilter = /^\/get\/(\d+)$/;

    if (parsedUrl.pathname == "/send") {
      if (req.method == 'POST') {
        upload.single('file')(req, res, function (err) {
          if (err) {
            res.statusCode = 500;
            res.end("Error uploading file");
            return;
          }
          console.log(req.file);
        });
      }
      
      const filePath = path.join(projectRoot, 'clientSend.html');
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
      const filePath = path.join(projectRoot, 'clientSend.css');
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
  });

  server.listen(3030, () => {
    console.log('Server running at http://localhost:3030/');
  });

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
// code. You can also put them in separate files and import them here.
