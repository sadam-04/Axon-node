const { app } = require('electron');

const multer = require('multer');
const url = require('node:url');
const path = require('node:path');
const fs = require('node:fs');

const mime = require('mime-types');

const upload = multer({ storage: multer.memoryStorage() }).array("files", 20);

const projectRoot = app.isPackaged
  ? process.resourcesPath
  : app.getAppPath();

async function urlWrapper(text) {
  let page = fs.readFileSync(path.join(projectRoot, "static", "url-wrapper-2.html"), "utf-8");
  page = page.replace(/{{url}}/g, text);
  console.log("Returning wrapped URL page of length ", page.length);
  return page;
}

async function buildFileLandingPage(filename) {
  let page = fs.readFileSync(path.join(projectRoot, "static", "file-wrapper.html"), "utf-8");
  page = page.replace(/{{filename}}/g, filename);
  return page;
}

function mime_lookup(ext) {
  if (ext == ".avif") return "image/avif";
  else if (ext == ".avi") return "video/x-msvideo";
  else if (ext == ".bmp") return "image/bmp";
  else if (ext == ".csv") return "text/csv";
  else if (ext == ".doc") return "application/msword";
  else if (ext == ".docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  else if (ext == ".gif") return "image/gif";
  else if (ext == ".ico") return "image/vnd.microsoft.icon";
  else if (ext == ".ics") return "";
  else if (ext == ".") return "";
  else if (ext == ".") return "";
  
  else if (ext == ".avi") return "video/x-msvideo";
  else return "application/octet-stream";
}

module.exports = {
  serverBehavior: (projectRoot, addInboxItem, outboxItems) => { return async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const urlFilter = /^\/get\/(\d+)$/i;
    const urlFilter2 = /^\/get\/(\d+)\/(\w+)\/[\w_\-\s.]+$/i; // format: /get/123456/inline/filename.png

    parsedUrl.pathname = decodeURIComponent(parsedUrl.pathname);

    console.log(`HTTP Server: Received request for ${parsedUrl.pathname}`);

    if (parsedUrl.pathname == "/intake") {
      if (req.method == 'POST') {
        // collect and parse post data
        await upload(req, res, function (err) {
          // process uploaded file if present
          if (err) {
            console.log("Post handler: Error uploading file - ", err);
            res.statusCode = 500;
            res.end("Error uploading file");
            return;
          }
          if (req.files) {
            console.log(req.files);
            for (f of req.files) {
              addInboxItem("file", f.originalname, null, f.size, f.buffer);
            }
          }

          //process text if present
          let text = req.body.text;
          if (text) {
            console.log("Received text: ", text);
            // check if its a url or general text
            let uid = null;
            if (URL.canParse(text)) {
              console.log("Text is a URL");
              uid = addInboxItem("url", "url", text, text.length, Buffer.from(text));
            } else {
              console.log("Text is general text");
              uid = addInboxItem("text", "text", null, text.length, Buffer.from(text));
            }
          }

          res.statusCode = 200;
          res.end("OK");
          return;
        });
      }
    } else if (parsedUrl.pathname == "/send" || parsedUrl.pathname == "/SEND") {
      console.log("Received request for /send endpoint");

      const filePath = path.join(projectRoot, 'static', 'clientSend.html');
      let data = fs.readFileSync(filePath);

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);

      return;
    } else if (parsedUrl.pathname == "/clientSend.css") {
      const filePath = path.join(projectRoot, 'static', 'clientSend.css');
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

    let index = null;

    // file landing page
    if (urlFilter.test(parsedUrl.pathname)) {
      const match = parsedUrl.pathname.match(urlFilter);
      index = parseInt(match[1]);
      console.log(`match: ${match}`);

      if (outboxItems.has(index) == false) {
        res.statusCode = 404;
        res.end("Not found (index not contained in outbox)");
        return;
      }

      if (outboxItems.get(index) == null) {
        res.statusCode = 404;
        res.end("Not found (null entry)");
        return;
      }

      // TODO handle file landing page requests
      if (outboxItems.get(index)[1] == "file") {
        let filename = path.basename(outboxItems.get(index)[0]);
        let landingPage = await buildFileLandingPage(filename);
        res.statusCode = 200;
        // res.end(`<div><div onclick="(function(){window.location.href = window.location.href + '/inline/file.pdf';})();">Inline</div><div onclick="(function(){window.location.href = window.location.href + '/attachment/file.pdf';})();">Attachment</div></div>`);
        res.end(landingPage);
      } else if (outboxItems.get(index)[1] == "text") { // else if this is a text object (text/url)

        let text = outboxItems.get(index)[0];

        if (text == null) {
          res.statusCode = 500;
          res.end("Not found (null payload)");
          return;
        }

        //check if its a url
        let dataAsUrl = null;
        try {
          dataAsUrl = url.parse(text.toString(), true);
        } catch (e) {
          console.log("Error parsing URL: ", e);
          dataAsUrl = null;
        }
        if (dataAsUrl && dataAsUrl.protocol && dataAsUrl.host) {
          // it's a URL
          let page = await urlWrapper(text);
          
          res.setHeader('Content-Length', page.length);
          res.setHeader('Content-Type', 'text/html');
          res.statusCode = 200;

          res.end(page);
          return;
        }
        res.setHeader('Content-Length', text.length);
        res.setHeader('Content-Type', 'text/plain');
        res.end(text);
        res.statusCode = 200;
        return;
      }
    }

    // file download request (inline or attachment)
    else if (urlFilter2.test(parsedUrl.pathname)) {
      // get the numeric id from the url
      const match = parsedUrl.pathname.match(urlFilter2);
      index = parseInt(match[1]);
      let dlMode = match[2];
      // let cFilename = match[3]; // client filename (filename contained in client's request)

      if (dlMode != "inline" && dlMode != "attachment") {
        res.statusCode = 400;
        res.end("Bad request");
        return;
      }

      console.log(`match: ${match}`);

      if (outboxItems.has(index) == false) {
        res.statusCode = 404;
        res.end("Not found (index not contained in outbox)");
        return;
      }

      if (outboxItems.get(index) == null) {
        res.statusCode = 404;
        res.end("Not found (null entry)");
        return;
      }

      if (outboxItems.get(index)[1] == "file") { // if this is a file object

        let filepath = outboxItems.get(index)[0];

        if (filepath == null) {
          res.statusCode = 500;
          res.end("Not found (null payload)");
          return;
        }

        fs.access(filepath, fs.constants.F_OK, (err) => {
          if (err) {
            res.statusCode = 500;
            res.end("Server error");
            return;
          }

          fs.stat(filepath, (err, stats) => {
            if (err) {
              res.statusCode = 500;
              res.end("Server error");
              return;
            }

            let type = mime.lookup(path.extname(filepath));
            
            if (type == false) {
              type = 'application/octet-stream';
            }
            
            res.setHeader('Content-Length', stats.size);
            res.setHeader('Content-Type', type);
            res.setHeader('Content-Disposition', `${dlMode}; filename=${path.basename(filepath)}`);

            // if (type == false) {
            //   res.setHeader('Content-Type', 'application/octet-stream');
            //   res.setHeader('Content-Disposition', `attachment; filename=${path.basename(filepath)}`);
            // } else {
            //   res.setHeader('Content-Type', type);
            //   res.setHeader('Content-Disposition', `inline; filename=${path.basename(filepath)}`); // setting filename here doesn't seem to work but keeping it because I think it is technically http-supported
            // }
            
            const stream = fs.createReadStream(filepath);

            stream.on('error', (err) => {
              console.error('Error reading file: ', err);
              if (!res.headersSent) {
                res.statusCode = 500;
                res.end("Server error");
                return;
              }
            });

            stream.pipe(res);
          });
        });
      } else {
        res.statusCode = 400;
        res.end("Bad request");
        return;
      }
    }
  }}
};