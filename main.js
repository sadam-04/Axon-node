const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const http = require('http');

const path = require('node:path');
const fs = require('node:fs');

let filePath = null;

async function handleFileOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog({});
  if (!canceled && filePaths.length > 0) {
    //const data = await fs.readFile(filePaths[0], 'utf-8');
    filePath = filePaths[0];
    return filePaths[0]; // returned to renderer
  }
  return null;
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  // Menu.setApplicationMenu(null);

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  ipcMain.handle('dialog:openFile', handleFileOpen);

  // create electron UI window
  createWindow();

  //create client web server
  const server = http.createServer((req, res) => {
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
  server.listen(3000, () => {
    console.log('Server running at http://localhost:3000/');
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});