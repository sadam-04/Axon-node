export const handleAddText = (event, setHostedFiles, setSelectedSFile, addTextValue, setAddTextValue, protocolRef, ipRef, portRef) => {
  event.preventDefault();
  console.log("Received addtext event: ", event);

  window.electronAPI.addTextToOutbox(addTextValue).then(([uid, filename, filesize]) => {
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
  window.electronAPI.setIP(newIP);
}

// openFile() tells main proc to open a file dialog 
// openFile(filepath) tells main proc to load specific file
// 
export const openFile = (file = null, protocolRef, ipRef, portRef, setHostedFiles, setSelectedSFile) => {
  window.electronAPI.openFile(file).then(([uid, fileName, fileSize]) => {
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

export const handleDiscardPendingFile = (pendingFiles, activeRFile, setSelectedRFile, setPendingFiles) => {
  window.recvFileAPI.discardFile(pendingFiles[activeRFile].id);
  var _pendingFiles = pendingFiles.filter(f => f.id !== pendingFiles[activeRFile].id);
  if (_pendingFiles.length == 0) {
    setSelectedRFile(null);
  } else {
    setSelectedRFile(0);
  }
  setPendingFiles(_pendingFiles);
}

// updates all front-end URLs and QRs with a given protocol, ip, and port. 
export const updateURL = async (protocol, ip, port, setRecvUrl, hostedFiles, setHostedFiles) => {
    // update recv url
    setRecvUrl(`${protocol}://${ip}:${port}/send`);

    console.log(`Updated recvUrl to ${protocol}://${ip}:${port}/send`);
    if (port == "" || isNaN(port)) {
      setPort(2222);
    }

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
export const initialize = async (openFile, protocolRef, ipRef, portRef, setPort, setPresentedIp, setAddrs, setPendingFiles, setSavePaths, setProtocol, setTLSKeyPath, setTLSCertPath, setHostedFiles, setSelectedSFile) => {

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
    let ip = await window.electronAPI.getDefaultIP();
    console.log("Got default IP: ", ip);
    setPresentedIp(ip);

    // get saved protocol value from last session
    window.electronAPI.getProtocol().then((savedProtocol) => {
      setProtocol(savedProtocol);
    });

    // get all addresses available for dropdown/qrs
    let addrs = await window.electronAPI.listAddrs();
    setAddrs(addrs);

    // handler for when the main proc says we have a new inbox item
    window.recvFileAPI.onNewFile((file) => {
      setPendingFiles((prevPendingFiles) => [...prevPendingFiles, file]);
    });

    // handler for when a save result is sent from main proc.
    window.recvFileAPI.onSaveFileResult((result) => {
      const parsed = result

      const id = parsed.id;
      setSavePaths((prev) => ({ ...prev, [id]: parsed.path }));
      console.log(`Save result for file id ${id}: ${parsed.path}`);
    });

    // set recv url using current values
    // setRecvUrl(updateURL(protocol, ip, port));

    // get saved values for settings fields from last session
    let tlsKeyPath = await window.electronAPI.getTLSKeyPath();
    setTLSKeyPath(tlsKeyPath);
    let tlsCertPath = await window.electronAPI.getTLSCertPath();
    setTLSCertPath(tlsCertPath);
    let savedPort = await window.electronAPI.getPort();
    setPort(savedPort);

  }