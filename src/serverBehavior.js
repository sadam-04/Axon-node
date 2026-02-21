const multer = require('multer');
const url = require('node:url');
const path = require('node:path');
const fs = require('node:fs');

const upload = multer({ storage: multer.memoryStorage() });

async function urlWrapper(text) {
  let page = fs.readFileSync("src/url-wrapper-2.html", "utf-8");
  page = page.replace(/{{url}}/g, text);
  console.log("Returning wrapped URL page of length ", page.length);
  return page;
}

module.exports = {
  serverBehavior: (projectRoot, addInboxItem, outboxItems) => { return async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const urlFilter = /^\/get\/(\d+)$/;

    console.log(`HTTP Server: Received request for ${parsedUrl.pathname}`);

    if (parsedUrl.pathname == "/intake") {
      if (req.method == 'POST') {
        // collect and parse post data
        await upload.single('file')(req, res, (err) => {
          // process uploaded file if present
          if (req.file) {
            if (err) {
              console.log("Post handler: Error uploading file - ", err);
              res.statusCode = 500;
              res.end("Error uploading file");
              return;
            }
            
            let file = req.file;
            addInboxItem("file", file.originalname, null, file.size, file.buffer);
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
    } else if (parsedUrl.pathname == "/send") {
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
    let payload = null;

    // Check if the url matches the pattern for a file request (send mode)
    if (urlFilter.test(parsedUrl.pathname)) {
      // get the numeric id from the url
      const match = parsedUrl.pathname.match(urlFilter);
      index = parseInt(match[1]);

      if (outboxItems.has(index) == false) {
        res.statusCode = 404;
        res.end("Not found (index not contained in outbox)");
        console.log("List of outbox keys: ", Array.from(outboxItems.keys()));
        return;
      }

      if (outboxItems.get(index) == null) {
        res.statusCode = 404;
        res.end("Not found (null entry)");
        return;
      }

      payload = outboxItems.get(index)[0];

      if (payload == null) {
        res.statusCode = 500;
        res.end("Not found (null payload)");
        return;
      }

      if (outboxItems.get(index)[1] == "file") { // if this is a file object
        fs.access(payload, fs.constants.F_OK, (err) => {
          if (err) {
            res.statusCode = 404;
            res.end("Not found (can't open file)");
            return;
          }

          fs.stat(payload, (err, stats) => {
            if (err) {
              res.statusCode = 500;
              res.end("Server error");
              return;
            }

            res.setHeader('Content-Length', stats.size);
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename=${path.basename(payload)}`);

            const stream = fs.createReadStream(payload);

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
      } else if (outboxItems.get(index)[1] == "text") { // else if this is a text object
        //check if its a url
        let dataAsUrl = null;
        try {
          dataAsUrl = url.parse(payload.toString(), true);
        } catch (e) {
          console.log("Error parsing URL: ", e);
          dataAsUrl = null;
        }
        if (dataAsUrl && dataAsUrl.protocol && dataAsUrl.host) {
          // it's a URL
          let page = await urlWrapper(payload);
          console.log("is a url. Sending wrapped page of length ", page.length);
          
          res.setHeader('Content-Length', page.length);
          res.setHeader('Content-Type', 'text/html');
          res.statusCode = 200;

          res.end(page);
          return;
        } else {
          console.log("is not a url");
        }
        res.setHeader('Content-Length', payload.length);
        res.setHeader('Content-Type', 'text/plain');
        res.end(payload);
        res.statusCode = 200;
        return;
      }
    }}
  }
};