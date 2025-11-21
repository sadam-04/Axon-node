import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import QRCode from 'qrcode';

// const root = createRoot(document.body);
const root = createRoot(document.getElementById("root"));
root.render(<App />);

function App() {
  const [hostedFiles, setHostedFiles] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);

  // const [guiMode, setGuiMode] = useState("send"); // "send" or "recv"
  const [addrs, setAddrs] = useState([]);

  const [presentedIp, setPresentedIp] = useState("");
  const [protocol, setProtocol] = useState("");

  const [protocolMessage, setProtocolMessage] = useState("");

  const [recvUrl, setRecvUrl] = useState("");

  const [savePaths, setSavePaths] = useState({});

  const [selectedNavPage, setSelectedNavPage] = useState(0);

  const [buttons, setButtons] = useState([
    {id: 1, label: "Outbox", action: () => setSelectedNavPage(0)},
    {id: 2, label: "Inbox", action: () => setSelectedNavPage(1)},
  ]);

  const [activeSFile, setSelectedSFile] = useState(null);
  const [activeRFile, setSelectedRFile] = useState(null);


  //TODO :GET RID OF THIS!!!
  function handleFileOpenClick() {
      window.electronAPI.openFile().then(([uid, fileName, fileSize]) => {
          if (uid == "" || fileName == "null") {
            return;
          }
          var url = `${protocol}://${presentedIp}:3030/get/${uid}`;
          setHostedFiles([...hostedFiles, { id: Date.now(), fileName: fileName, url: url, size: fileSize }]);
      });
  }

  function discardPendingFile() {
    window.recvFileAPI.discardFile(pendingFiles[activeRFile].id);
    var _pendingFiles = pendingFiles.filter(f => f.id !== pendingFiles[activeRFile].id);
    if (_pendingFiles.length == 0) {
      setSelectedRFile(null);
    } else {
      setSelectedRFile(0);
    }
    setPendingFiles(_pendingFiles);
  }

  //TODO GET RID OF THESE!!!
  // function sendMode() {
  //   let sendPanel = document.getElementById("send-panel");
  //   let recvPanel = document.getElementById("recv-panel");
    
  //   sendPanel.style.display = "block";
  //   recvPanel.style.display = "none";

  //   setGuiMode("send");

    
  // }

  // function recvMode() {
  //   let sendPanel = document.getElementById("send-panel");
  //   let recvPanel = document.getElementById("recv-panel");
    
  //   sendPanel.style.display = "none";
  //   recvPanel.style.display = "block";

  //   setGuiMode("recv");
  // }

  // function setAndPropagatePresentedIp(addr) {
  //   setPresentedIp(addr);
    
  //   // update url for recv mode
  //   setRecvUrl(`${protocol}://${addr}:3030/send`);
  //   // also update all urls of hosted files
  //   let newHostedFiles = hostedFiles.map((file) => {
  //     return { ...file, presentedHost: addr };
  //   });
  //   setHostedFiles(newHostedFiles);
  // }

  // function updateURLsWithProtocol(newProtocol) {
  //   setRecvUrl(`${newProtocol}://${presentedIp}:3030/send`);

  //   let newHostedFiles = hostedFiles.map((file) => {
  //     let urlObj = new URL(file.url);
  //     urlObj.protocol = newProtocol.toLowerCase();
  //     return { ...file, url: urlObj.toString() };
  //   });
  //   setHostedFiles(newHostedFiles);
  // }

  // initialization
  useEffect(() => {
    async function getIP() {
      var ip = await window.electronAPI.getDefaultIP();
      setRecvUrl(`${protocol}://${ip}:3030/send`);
    }
    getIP();
    // console.log("calling listAddrs");
    async function getAddrs() {
      let addrs = await window.electronAPI.listAddrs();
      setAddrs(addrs);
      // setAndPropagatePresentedIp(addrs[0]);
      setPresentedIp(addrs[0]);
      console.log("Propagated ip: " + addrs[0]);
    }
    getAddrs();

    async function listenForNewUploads() {
      window.recvFileAPI.onNewFile((file) => {
        //Call this when a new file is received by the main process
        setPendingFiles((prevPendingFiles) => [...prevPendingFiles, file]);
      });
    }
    listenForNewUploads();

    async function listenForSaveResults() {
      window.recvFileAPI.onSaveFileResult((result) => {
        console.log("Received save file result: ", result);
        const parsed = result

        const id = parsed.id;
        setSavePaths((prev) => ({ ...prev, [id]: parsed.path }));
        // console.log("SAVE PATH: " + parsed.path);
        console.log(`Save result for file id ${id}: ${parsed.path}`);
        if (parsed.path != null) {
          // setPendingFiles((prevPendingFiles) => prevPendingFiles.filter((file) => file.id !== id));
        }
      });
    }
    listenForSaveResults();

    window.electronAPI.getProtocolFromMain().then((savedProtocol) => {
      setProtocol(savedProtocol);
    });
  }, []);

  //update all URLs when protocol or presentedIp changes
  useEffect(() => {
    // update recv url
    setRecvUrl(`${protocol}://${presentedIp}:3030/send`);

    // also update all urls of hosted files
    let newHostedFiles = hostedFiles.map((file) => {
      let urlObj = new URL(file.url);
      urlObj.protocol = protocol.toLowerCase();
      urlObj.hostname = presentedIp;
      return { ...file, url: urlObj.toString() };
    });
    setHostedFiles(newHostedFiles);
  }, [protocol, presentedIp]);

  console.log("App rendering");

  // const [activeS, setSelectedS] = useState(true);
  // const [activeR, setSelectedR] = useState(false);

  // function handleSelectSend() {
  //   setSelectedS(true);
  //   setSelectedR(false);
  //   sendMode();
  // }

  // function handleSelectRecv() {
  //   setSelectedR(true);
  //   setSelectedS(false);
  //   recvMode();
  // }

  // function addButton() {
  //   setButtons(prev => [...prev, { id: Date.now(), label: `Btn ${prev.length + 1}` }]);
  // }

  // const [saveMessage, setSaveMessage] = useState("");
  // useEffect(() => {
  //   if (savePaths.get(pendingFiles[activeRFile].id) == "") {
  //     // setSaveMessage("");
  //   }
  //   else {
  //     // setSaveMessage(`File saved to: ${savePath}`);
  //   }
  // }, [savePath]);

  function hasCurrentFileBeenSaved() {
    let tmp = pendingFiles[activeRFile];
    console.log("Active rfile:" + activeRFile);
    return savePaths[tmp.id] != null;
  }

  const footerHeight = "24px";

  return (
    <div className="outer-wrapper" style={{
      display: "flex",
      flexDirection: "column",
      margin: 0,
      padding: 0,
      height: "100%",
    }}>
      <div style={{display: "flex", flexDirection: "row", width: "100%", height: "200px", flexGrow: 1}}>
        <div id="nav-sidebar" style={{
          display: "flex",
          marginLeft: "0",
          marginTop: "0",
          marginRight: "0",
          height: "auto",
          padding: "0 4px 0 4px",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "45px",
          flexGrow: 0,
        }}>
          <div style={{display: "flex", flexDirection: "column"}}>
            {buttons.map((btn, i) => (
              <ResponsiveButton
                key={btn.id}
                label={btn.label}
                buttonAction={() => {}}
                selected={selectedNavPage === i}
                setSelected={() => setSelectedNavPage(i)}
                enabled={true}
                customStyle={{display: "flex", width: "100%",  height: "45px", fontWeight: "regular", fontSize: "0.6rem", marginBottom: "3px",borderRadius: "4px", justifyContent: "center", alignItems: "center"}}
                shadeA={"#202020"}
                shadeB={"#282828"}
                shadeC={"#2c2c2c"}
              />
            ))}
          </div>

          <ResponsiveButton
            key={-1}
            label={"Settings"}
            buttonAction={() => setSelectedNavPage(-1)}
            selected={selectedNavPage === -1}
            setSelected={() => setSelectedNavPage(-1)}
            enabled={true}
            customStyle={{display: "flex", width: "100%",  height: "45px", fontWeight: "regular", fontSize: "0.6rem", marginBottom: "3px",borderRadius: "4px", justifyContent: "center", alignItems: "center"}}
            shadeA={"#202020"}
            shadeB={"#282828"}
            shadeC={"#2c2c2c"}
          />
        </div>
        <div className="content-wrapper" style={{height: "100%", width: "300px", flexGrow: 1}}>
          {selectedNavPage == 0 ? (
            <div style={{display: "flex", flexDirection: "row", height: "100%", width: "100%"}}>
              <div id="left-summary-panel">
                <div id="send-panel">
                  <div className="left-send-header" style={{ display: "flex", justifyItems: "space-between", flexDirection: "column", marginBottom: "0", borderBottom: "1px solid #383838", paddingBottom: "4px" }}>
                    <h4 style={{marginBottom: "5px", marginTop: "5px", marginLeft: "12px"}}>Outbox</h4>
                    <div style={{display: "flex", flexDirection: "row", alignItems: "space-between", height: "25px"}}>
                      <span className="simple-text" style={{margin: "auto", marginLeft: "13px", fontSize: "0.8rem", height: "fit-content"}}>{hostedFiles.length} file{hostedFiles.length !== 1 ? "s" : ""}</span>
                      <div className="plus-btn" onClick={handleFileOpenClick} />
                    </div>
                  </div>
                  <div style={{marginLeft: "0", marginRight: "0"}}>
                    {hostedFiles.map((file, i) => (

                      <ResponsiveButton
                        key={file.id}
                        label={<SummaryListItem fileName={file.fileName.replace(/^.*[\\/]/, '')} onCloseClick={() => {var fileID = new URL(file.url).pathname.split("/").filter(Boolean).pop(); window.electronAPI.setServing(false, fileID); var _hostedFiles = hostedFiles.filter(f => f.id !== file.id); if (_hostedFiles.length == 0) {setSelectedSFile(null);} else {setSelectedSFile(0);} setHostedFiles(_hostedFiles);}} />}
                        buttonAction={() => {}}
                        selected={activeSFile === i}
                        setSelected={() => setSelectedSFile(i)}
                        enabled={true}
                        customStyle={{}}
                        shadeA={"#282828"}
                        shadeB={"#303030"}
                        shadeC={"#343434"}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {activeSFile !== null ? (
                <div id="right-detail-panel" style={{
                verticalAlign: "top",
                backgroundColor: "#303030",
                borderRadius: "10px",
                marginRight: "10px",
                width: "calc(100% - 263px - 10px)",
                marginTop: "10px",
                marginBottom: "10px",
                height: "calc(100% - 20px)",
              }}>
                <ServedItem key={hostedFiles[activeSFile]?.id} filename={hostedFiles[activeSFile]?.fileName} url={hostedFiles[activeSFile]?.url} size={hostedFiles[activeSFile]?.size} />
              </div>
              ) : null}
            </div>
          ) : selectedNavPage == 1 ? (
            <div style={{display: "flex", flexDirection: "row", height: "100%", width: "100%"}}>
              <div id="left-summary-panel">
                <div id="recv-panel">
                  <div className="left-recv-header" style={{ display: "flex", justifyItems: "space-between", flexDirection: "column", marginBottom: "0", borderBottom: "1px solid #383838", paddingBottom: "4px" }}>
                    <h4 style={{marginBottom: "5px", marginTop: "5px", marginLeft: "12px" }}>Inbox</h4>
                    <div style={{display: "flex", flexDirection: "row", alignItems: "space-between", height: "25px"}}>
                      <span className="simple-text" style={{margin: "auto", marginLeft: "13px", fontSize: "0.8rem", height: "fit-content"}}>{pendingFiles.length} file{pendingFiles.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  <div style={{marginLeft: "0", marginRight: "0"}}>
                    {pendingFiles.map((file, i) => (

                      <ResponsiveButton
                        key={file.id}
                        label={<SummaryListItem fileName={file.filename.replace(/^.*[\\/]/, '')} onCloseClick={discardPendingFile} />}
                        buttonAction={() => {}}
                        selected={activeRFile === i}
                        setSelected={() => setSelectedRFile(i)}
                        enabled={true}
                        customStyle={{transition: "background-color 100ms linear", paddingLeft: activeRFile == i ? "0px" : "3px", borderLeft: activeRFile == i ? "3px solid white" : "none"}}
                        shadeA={"#282828"}
                        shadeB={"#303030"}
                        shadeC={"#383838"}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {activeRFile === null ? (
                <div id="right-blank-panel">
                  <div style={{color: "white", margin: "0 auto", width: "100%", textAlign: "center"}}>Share this QR code to allow others to send you files:</div>
                  <div style={{width: "fit-content", margin: "0 auto", marginTop: "20px"}}>
                    {recvUrl ? <QrComponent url={recvUrl} /> : <p>Loading QR...</p>}
                  </div>
                </div>
              ) : (
                <div id="right-detail-panel" style={{
                  verticalAlign: "top",
                  backgroundColor: "#303030",
                  borderRadius: "10px 0 0 0",
                  marginRight: "15px",
                  width: "calc(100% - 263px - 15px)",
                  marginTop: "10px",
                  marginBottom: "10px",
                  height: "calc(100% - 20px)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "start",
                  alignItems: "center",
                }}>
                  <div style={{display: "flex", flexDirection: "row", width: "calc(100% - 10px)", marginRight: "10px"}}>
                    <div style={{display: "flex", flexGrow: 1, margin: "10px", width: "calc(100% - 270px - 20px)"}}>
                      <SimpleTextHeader primaryText={pendingFiles[activeRFile]?.filename} secondaryText={`Size: ${pendingFiles[activeRFile]?.size < 1024 ? `${pendingFiles[activeRFile]?.size} B` : pendingFiles[activeRFile]?.size < 1048576 ? `${(pendingFiles[activeRFile]?.size / 1024).toFixed(2)} KB` : `${(pendingFiles[activeRFile]?.size / 1048576).toFixed(2)} MB`}`} />
                    </div>

                    <div style={{width: "270px", display: "flex", flexDirection: "row", alignItems: "start", justifyContent: "space-around", fontSize: "13px"}}>

                      <ResponsiveButton
                        label={hasCurrentFileBeenSaved() ? "Saved" : "Save"}
                        buttonAction={() => {window.recvFileAPI.saveFile(pendingFiles[activeRFile].id, ()=>{console.log("TESTING")});}}
                        selected={false}
                        setSelected={() => {}}
                        enabled={!hasCurrentFileBeenSaved()}
                        disabledStyle={{color: "#808080"}}
                        customStyle={{display: "flex", width: "80px", height: "35px", borderRadius: "5px", justifyContent: "center", alignItems: "center", marginTop: "20px", marginLeft: "10px"}}
                        shadeA={"#303030"}
                        shadeB={"#383838"}
                        shadeC={"#404040"}
                      />

                      <ResponsiveButton
                        label={"Go to folder"}
                        buttonAction={() => {window.recvFileAPI.revealFile(pendingFiles[activeRFile].id);}}
                        selected={false}
                        setSelected={() => {}}
                        enabled={hasCurrentFileBeenSaved()}
                        customStyle={{display: "flex", width: "80px", height: "35px", borderRadius: "5px", justifyContent: "center", alignItems: "center", marginTop: "20px", marginLeft: "10px"}}
                        disabledStyle={{color: "#808080"}}
                        shadeA={"#303030"}
                        shadeB={"#383838"}
                        shadeC={"#404040"}
                      />

                      <ResponsiveButton
                        label={"Discard"}
                        buttonAction={discardPendingFile}
                        selected={false}
                        setSelected={() => {}}
                        enabled={true}
                        customStyle={{display: "flex", width: "80px", height: "35px", borderRadius: "5px", justifyContent: "center", alignItems: "center", marginTop: "20px", marginLeft: "10px"}}
                        shadeA={"#303030"}
                        shadeB={"#983838"}
                        shadeC={"#c04040"}
                      />
                    </div>
                  </div>
                  <div>{savePaths[pendingFiles[activeRFile].id]}</div>
                </div>
              )}
            </div>
          ) : selectedNavPage == -1 ? (
            <div style={{display: "flex", flexDirection: "column", height: "100%", width: "100%", fontSize: "0.8rem", marginLeft: "12px"}}>
              <h4 style={{marginBottom: "10px", marginTop: "13px"}}>Preferences</h4>
              <div style={{flexDirection: "row", display: "flex"}}>
                <input type="checkbox" style={{marginRight: "8px"}} />
                <div style={{flexDirection: "column", display: "flex"}}>
                  <strong>Prefer HTTPS</strong>
                  <span>This setting requires valid TLS key and certificate files to be present in the application directory.</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div style={{display: "flex", flexDirection: "row", height: footerHeight, flexGrow: 0, width: "100%", backgroundColor: "#202020", lineHeight: "16px", color: "#606060", overflow: "hidden"}}>
        <div className="ip-selector" style={{padding: "0", margin: "0", width: "115px", height: footerHeight, overflow: "hidden"}}>
          <select style={{height: "100%", fontSize: "12px", color: "#a0a0a0"}} onChange={(e) => setPresentedIp(e.target.value)} value={presentedIp}>
            {addrs.map((addr, index) => (
              <option key={index} value={addr}>{addr}</option>
            ))}
          </select>
        </div>

        <div style={{margin: "0 2px", width: "50px", height: footerHeight, overflow: "hidden"}}>
            <ResponsiveButton
              label={protocol}
              buttonAction={async () => {
                // var newProtocol = (protocol === "HTTP" ? "HTTPS" : "HTTP");
                // setProtocol(newProtocol);
                window.electronAPI.attemptToggleProtocol().then(([newProtocol, toggleSuccess]) => {
                  setProtocol(newProtocol);
                  if (newProtocol == "HTTP" && !toggleSuccess) {
                    setProtocolMessage("Unable to switch to HTTPS. Make sure key and cert files are present.");
                  } else {
                    setProtocolMessage("");
                  }
                  // updateURLsWithProtocol(newProtocol);
                  // console.log("Protocol toggled to " + newProtocol + " in main process");
                });
                // applyProtocolToUrls(newProtocol);
              }}
              selected={false}
              setSelected={() => {}}
              enabled={true}
              customStyle={{height: footerHeight, fontSize: "12px", fontWeight: "regular", color: "#a0a0a0"}}
              shadeA={"#202020"}
              shadeB={"#282828"}
              shadeC={"#303030"}
            />
        </div>
        <div style={{display: "flex", alignItems: "center", padding: "0 2px 0 2px", margin: "0", height: footerHeight, overflow: "hidden"}}>
          {protocolMessage ? <span style={{height: "wrap-content", fontSize: "12px", color: "#a04040"}}>{protocolMessage}</span> : null}
        </div>
      </div>
    </div>
  );
}

function SummaryListItem({fileName, onCloseClick}) {
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseEnter(event) {
    setIsHovered(true);
  }

  function handleMouseLeave(event) {
    setIsHovered(false);
  }
  
  var _width = "260px";

  return (
    <div
      onMouseEnter={(event) => {handleMouseEnter(event);}}
      onMouseLeave={(event) => {handleMouseLeave(event);}}
      style={{
        padding: "6px 0 6px 10px",
        display: "flex",
        justifyContent: "space-between",
        flexDirection: "row",
        alignItems: "center",
        width: `calc(${_width} - 20px)`,
        height: "18px",
      }}
    >
        <div style={{display: "block", fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{fileName}</div>
        {isHovered ? <div onClick={onCloseClick} className="outboxItemCloseBttn" style={{display: "block", width: "10px", height: "19px", marginRight: "9.5px"}}>✖</div> : null}
    </div>
  )
}

// function ResponsiveButtonSet({buttonData}) {

//   const [activeStates, setSelectedStates] = useState([]);

//   for (let i = 0; i < buttonData.length; i++) {
//     <ResponsiveButton activeState={buttonData[i].activeState} activeStateSetter={buttonData[i].activeStateSetter} />
//   }
// }>

function ResponsiveButton({selected, setSelected, enabled, buttonAction, onHover = null, label, customStyle = null, disabledStyle = null, shadeA, shadeB, shadeC}) {
  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
  <div onMouseEnter={() => {setHovered(true); if (onHover) onHover();}} onMouseLeave={() => {setHovered(false); setClicked(false);}} onMouseDown={() => {setClicked(true)}} onMouseUp={() => {setSelected(); if (enabled) {buttonAction();} setClicked(false);}}>
    <ShadedButton selected={selected} hovered={hovered} pressed={clicked} enabled={enabled} icon={label} customStyle={customStyle} disabledStyle={disabledStyle} shadeA={shadeA} shadeB={shadeB} shadeC={shadeC} />
  </div>
  );
}

function QrComponent({url}) {
  const [src, setSrc] = useState("");
  const [qrHoverMsg, setQrHoverMsg] = useState("Click to copy URL to clipboard");

  // var combinedUrl = url ? url.replace("localhost", presentedHost ? presentedHost : "localhost") : "";

  useEffect(() => {
    (async () => {
      try {
        //var combinedUrl = url.replace("localhost", presentedHost ? presentedHost : "localhost");
        console.log("Generating QR for url: " + url);
        const dataUrl = await QRCode.toDataURL(url, {margin: 4});
        setSrc(dataUrl);
      } catch (err) {
        console.error("Failed to generate QR code", err);
      }
    })();
  }, [url]);

  const handleQRClick = async (e) => {
    window.focus();
    navigator.clipboard.writeText(url).then(() => {
      setQrHoverMsg("Copied!");
    })
  }

  return (
    <div className="qr-wrapper" onClick={handleQRClick} onMouseLeave={() => setQrHoverMsg("Click to copy URL to clipboard")}>
      {src ? <img src={src} /> : <p>Loading QR...</p>}
      <div className="qr-overlay"><div className="qr-overlay-text">{qrHoverMsg}</div></div>
    </div>
  );
}

function SimpleTextHeader({primaryText, postPrimaryContent=null, secondaryText}) {
  return (
    <div style={{width: "100%", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap"}}>
      <strong>{primaryText}</strong>
      {postPrimaryContent}
      <br />
      <ul style={{
        listStyleType: "none",
        paddingLeft: "8px",
        marginTop: "4px",
      }}>
        <li>{secondaryText}</li>
      </ul>
    </div>
  )
}

function ServedItem({filename, url, size}) {
  // const [src, setSrc] = useState("");
  const [checked, setChecked] = useState(true);
  // const [qrHoverMsg, setQrHoverMsg] = useState("Click to copy URL to clipboard");
  // const [fullUrl, setFullUrl] = useState("");

  // let ip = "";
  // const fullUrl = `http://${ip}:3030/get/${url}`;

  const handleCheckboxChange = (e) => {
    const isChecked = e.target.checked ? true : false;
    setChecked(isChecked);

    var fileID = new URL(url).pathname.split("/").filter(Boolean).pop()
    window.electronAPI.setServing(isChecked, fileID);
  };

  // useEffect(() => {
  //   (async () => {
  //     try {
  //       // ip = await window.electronAPI.getDefaultIP();
  //       // console.log("renderer: set ip to " + ip);

  //       // setFullUrl(`http://${ip}:3030/get/${url}`, async () => {
  //         // console.log("renderer: fullUrl is " + fullUrl);
  //       // setFullUrl(`http://${ip}:3030/get/${url}`);


  //       // });

  //     } catch (err) {
  //       console.error("Failed to generate QR code", err);
  //     }
  //   })();

  // }, [url]);

  filename = filename ? filename.replace(/^.*[\\/]/, '') : '';

  const sizeString = size < 1024 ? `${size} B` : size < 1048576 ? `${(size / 1024).toFixed(2)} KB` : `${(size / 1048576).toFixed(2)} MB`;

  return <div className="file-entry">

    <SimpleTextHeader primaryText={filename} postPrimaryContent={<input type="checkbox" checked={checked} onChange={handleCheckboxChange} />} secondaryText={`Size: ${sizeString}`} />
    <div className="right-panel">
      <QrComponent url={url} />
    </div>
  </div>
};

// function Navbar() {

// }

function ShadedButton({ selected, hovered, pressed, enabled, customStyle = null, disabledStyle = null, icon, shadeA, shadeB, shadeC }) {
  let shadeValue = shadeA;

  if (enabled) {
    if ((selected && hovered && pressed) || (selected && !hovered && !pressed) || (!selected && hovered && !pressed)) {
      shadeValue = shadeC;
    } else if ((selected && hovered && !pressed) || (!selected && hovered && pressed)) {
      shadeValue = shadeB;
    }
  }

  return (
    <div className="button-icon" style={{ ...customStyle, ...(enabled ? { backgroundColor: shadeValue } : disabledStyle) }}>
      {icon}
    </div>
  );
}


// root.render(<App />);