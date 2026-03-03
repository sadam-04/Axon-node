export const handleAddText = (event, setHostedFiles, setSelectedSFile, addTextValue, setAddTextValue, protocolRef, ipRef, portRef) => {
  event.preventDefault();
  console.log("Received addtext event: ", event);

  outboxAPI.addText(addTextValue).then(([uid, filename, filesize]) => {
    var url = `${protocolRef.current}://${ipRef.current}:${portRef.current}/get/${uid}`;

    setHostedFiles(prev => {
      const updated = [...prev, { id: uid, full: filename, friendly: filename.slice(0, 128), url: url, size: filesize, type: "2" }]
      setSelectedSFile(updated.length - 1);
      return updated;
    });
  });

  setAddTextValue("");
}

export function handleChangedIP(newIP, setPresentedIp) {
  setPresentedIp(newIP);
  // Save ip to config for next launch
  configAPI.setIP(newIP);
}

// openFile() tells main proc to open a file dialog 
// openFile(filepath) tells main proc to load specific file
// 
export const openFile = (file = null, protocolRef, ipRef, portRef, setHostedFiles, setSelectedSFile) => {
  outboxAPI.openFile(file).then(([uid, fileName, fileSize]) => {
    if (uid == "" || fileName == "null") {
    return;
    }
    var url = `${protocolRef.current}://${ipRef.current}:${portRef.current}/get/${uid}`;
    
    setHostedFiles(prev => {
      const updated = [...prev, { id: uid, full: fileName, friendly: fileName.replace(/^.*[\\/]/, ''), url: url, size: fileSize, type: "1" }]
      setSelectedSFile(updated.length - 1);
      return updated;
    });
  });
}

export const handleDiscardPendingFile = (inboxItems, activeRFile, setSelectedRFile, setinboxItems) => {
  inboxAPI.discard(inboxItems[activeRFile].id);
  var _inboxItems = inboxItems.filter(f => f.id !== inboxItems[activeRFile].id);
  if (_inboxItems.length == 0) {
    setSelectedRFile(null);
  } else {
    setSelectedRFile(0);
  }
  setinboxItems(_inboxItems);
}

// updates all front-end URLs and QRs with a given protocol, ip, and port. 
export const updateURL = async (protocol, ip, port, setInboxUrl, hostedFiles, setHostedFiles) => {
    if (port == "" || isNaN(port)) {
      port = 2222;
      setPort(port);
    }

    let newUrl = `${protocol}://${ip}:${port}/send`;
  
    // update inbox url
    setInboxUrl(newUrl);
    console.log(`Updated inboxUrl to ${newUrl}`);

    // also update all urls of hosted files
    let newHostedFiles = hostedFiles.map((file) => {
      let urlObj = new URL(file.url);
      urlObj.protocol = protocol.toLowerCase();
      urlObj.hostname = ip;
      urlObj.port = port.toString();
      return { ...file, url: urlObj.toString() };
    });
    setHostedFiles(newHostedFiles);
}

// perform various initialization tasks
export const initialize = async (openFile, protocolRef, ipRef, portRef, setPort, setPresentedIp, setAddrs, setinboxItems, setSavePaths, setProtocol, setTLSKeyPath, setTLSCertPath, setHostedFiles, setSelectedSFile) => {

    // prevent drag and dropping other urls
    window.addEventListener("dragover", event => {
      event.preventDefault();
    });

    // handle file drops as outbox items
    window.addEventListener("drop", event => {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      console.log("File dropped: ", file);
      openFile(file, protocolRef, ipRef, portRef, setHostedFiles, setSelectedSFile);
    });

    // get saved IP from last session
    let ip = await configAPI.getDefaultIP();
    console.log("Got default IP: ", ip);
    setPresentedIp(ip);

    // get saved protocol value from last session
    configAPI.getProtocol().then((savedProtocol) => {
      setProtocol(savedProtocol);
    });

    // get all addresses available for dropdown/qrs
    let addrs = await configAPI.listAddrs();
    setAddrs(addrs);

    // handler for when the main proc says we have a new inbox item
    inboxAPI.onNewFile((file) => {
      setinboxItems((previnboxItems) => [...previnboxItems, file]);
    });

    // handler for when a save result is sent from main proc.
    inboxAPI.onSaveFileResult((result) => {
      const parsed = result

      const id = parsed.id;
      setSavePaths((prev) => ({ ...prev, [id]: parsed.path }));
      console.log(`Save result for file id ${id}: ${parsed.path}`);
    });

    // set recv url using current values
    // setinboxUrl(updateURL(protocol, ip, port));

    // get saved values for settings fields from last session
    let tlsKeyPath = await configAPI.getTLSKeyPath();
    setTLSKeyPath(tlsKeyPath);
    let tlsCertPath = await configAPI.getTLSCertPath();
    setTLSCertPath(tlsCertPath);
    let savedPort = await configAPI.getPort();
    setPort(savedPort);

  }