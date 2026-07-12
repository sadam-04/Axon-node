export const handleAddText = (event, setHostedFiles, setSelectedSFile, addTextValue, setAddTextValue, protocolRef, ipRef, portRef) => {
  event.preventDefault();
  console.log("Received addtext event: ", event);

  if (addTextValue == undefined || addTextValue == "" || addTextValue == null) {
    return;
  }

  outboxAPI.addText(addTextValue).then(() => {
    // setSelectedSFile(updated.length - 1);
  });

  setAddTextValue("");
}

export function handleChangedIP(newIP, setPresentedIp) {
  setPresentedIp(newIP);
  // Save ip to config for next launch
  configAPI.setIP(newIP);
}

// updates all front-end URLs and QRs with a given protocol, ip, and port. 
// export const updateURL = async (protocol, ip, port, setInboxUrl, hostedFiles, setHostedFiles) => {
//     if (port == "" || isNaN(port)) {
//       port = 2222;
//       setPort(port);
//     }

//     protocol = protocol.toLowerCase();

//     let newUrl = `${protocol}://${ip}:${port}/send`;
  
//     // update inbox url
//     setInboxUrl(newUrl);

//     // // also update all urls of hosted files
//     // let newHostedFiles = hostedFiles.map((file) => {
//     //   let urlObj = new URL(file.url);
//     //   urlObj.protocol = protocol;
//     //   urlObj.hostname = ip;
//     //   urlObj.port = port.toString();
//     //   return { ...file, url: urlObj.toString() };
//     // });
//     // setHostedFiles(newHostedFiles);
// }

// perform various initialization tasks
export const initialize = async (setUserPort, setRealPort, setPresentedIp, setSaveDir, setAddrs, setinboxItems, setSavePaths, setProtocol, setTLSKeyPath, setTLSCertPath, setHostedFiles, setSelectedSFile, setSelectedRFile, setSelectedNavPage, setProtocolMessage) => {

    // prevent drag and dropping other urls
    window.addEventListener("dragover", event => {
      event.preventDefault();
    });

    // handle file drops as outbox items
    window.addEventListener("drop", event => {
      event.preventDefault();
      const files = event.dataTransfer.files;
      for (const f of files) {
        outboxAPI.openFile(f);
      }
      setSelectedNavPage(0);
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

    configAPI.onRealPortUpdate((val) => {
      if (val == -1) {
        setProtocolMessage("Failed to bind port!");  
      } else {
        setProtocolMessage("");
        setRealPort(val);
      }
    });

    outboxAPI.onUpdate((items, ctx) => {
      setHostedFiles(items);
      if (ctx != null) {
        if (ctx.newIdx != null) {
          console.log(ctx);
          setSelectedSFile(ctx.newIdx);
        } else if (ctx.selIdx != null) {
          if (ctx.delIdx == ctx.selIdx) {
            setSelectedSFile(null);
          } else if (ctx.delIdx < ctx.selIdx) {
            setSelectedSFile((old)=>{
              return old - 1;
            });
          }
        }
      }
    });

    inboxAPI.onUpdate((items, ctx) => {
      setinboxItems(items);
      if (ctx != null && ctx.selIdx != null) {
        if (ctx.delIdx == ctx.selIdx) {
          setSelectedRFile(null);
        } else if (ctx.delIdx < ctx.selIdx) {
          setSelectedRFile((old)=>{
            return old - 1;
          })
        }
      }
    });

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

    // get saved values for settings fields from last session
    let tlsKeyPath = await configAPI.getTLSKeyPath();
    setTLSKeyPath(tlsKeyPath);
    
    let tlsCertPath = await configAPI.getTLSCertPath();
    setTLSCertPath(tlsCertPath);
    
    let savedUserPort = await configAPI.getUserPort();
    setUserPort(savedUserPort);
    
    let savedRealPort = await configAPI.getRealPort();
    if (savedRealPort == -1) {setProtocolMessage("Failed to bind port!");}
    setRealPort(savedRealPort);
    
    let savedSaveDir = await configAPI.getSaveDir();
    setSaveDir(savedSaveDir);
  }