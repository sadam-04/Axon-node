const { app, ipcMain, dialog, BrowserWindow } = require('electron');
const path = require('node:path');
const http = require('node:http');
const url = require('node:url');
const fs = require('node:fs');
const QRCode = require('qrcode');

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
    let id = Math.floor(Math.random() * 1000000);
    urlPathMappings[id] = [filePaths[0], true];
    return [id, filePaths[0]]; // returned to renderer
  }
  return [0, "null"];
}

async function handleSetServing(event, shouldServe, id) {
  console.log(`Set checkbox ${id} to ${shouldServe}`);
  if (!(id in urlPathMappings)) {
    return false;
  }
  urlPathMappings[id][1] = shouldServe ? true : false;
  return true;
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      devTools: true,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  ipcMain.handle('openFile', handleFileOpen);
  ipcMain.handle('setServing', handleSetServing);

  createWindow();

  //create client web server
  const server = http.createServer((req, res) => {

    const parsedUrl = url.parse(req.url, true);
    const urlFilter = /^\/get\/(\d+)$/;

    let filePath = null;
    let index = null;

    if (urlFilter.test(parsedUrl.pathname)) {
      const match = parsedUrl.pathname.match(urlFilter);

      index = match[1];
      filePath = urlPathMappings[index][0];

      if (urlPathMappings[index][1] == false) {
        res.statusCode = 404;
        res.end("File not found");
        return;
      }
    }

    if (filePath == null) {
      res.statusCode = 500;
      res.end("No file specified.")
      return;
    }

    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        res.statusCode = 404;
        res.end("File not found");
      }

      fs.stat(filePath, (err, stats) => {
        if (err) {
          res.statusCode = 500;
          res.end("Error reading file metadata");
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
            res.end("Error reading file");
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
