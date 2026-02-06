import React, { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";


import { handleAddText, handleChangedIP, openFile, handleDiscardPendingFile, initialize, updateURL } from "./handlers";
import { Outbox, Inbox } from "./components/pages";
import ShadedButton from "./components/ShadedButton";

import ResponsiveButton from "./components/ResponsiveButton";

// const root = createRoot(document.body);
const root = createRoot(document.getElementById("root"));
root.render(<App />);

window.addEventListener("will-navigate", event => {
  event.preventDefault();
  console.log("Navigation prevented to: ", event.url);
  return false;
});

function App() {
  const [hostedFiles, setHostedFiles] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);

  // const [guiMode, setGuiMode] = useState("send"); // "send" or "recv"
  const [addrs, setAddrs] = useState([]);

  const [presentedIp, setPresentedIp] = useState("");
  const [protocol, setProtocol] = useState("");

  const [protocolMessage, setProtocolMessage] = useState("");

  const [port, setPort] = useState(2222);

  const [recvUrl, setRecvUrl] = useState("");

  const [savePaths, setSavePaths] = useState({});

  const [selectedNavPage, setSelectedNavPage] = useState(0);

  const [buttons, setButtons] = useState([
    {id: 1, label: "Outbox", action: () => setSelectedNavPage(0)},
    {id: 2, label: "Inbox", action: () => setSelectedNavPage(1)},
  ]);

  const [activeSFile, setSelectedSFile] = useState(null);
  const [activeRFile, setSelectedRFile] = useState(null);
  const [writingNewText, setWritingNewText] = useState(false);

  const [tlsKeyPath, setTLSKeyPath] = useState("");
  const [tlsCertPath, setTLSCertPath] = useState("");

  const protocolRef = useRef(protocol);
  const ipRef = useRef(presentedIp);
  const portRef = useRef(port);

  const [addTextValue, setAddTextValue] = useState("");

  useEffect(() => {
    protocolRef.current = protocol;
  }, [protocol]);

  useEffect(() => {
    ipRef.current = presentedIp;
  }, [presentedIp]);

  useEffect(() => {
    portRef.current = port;
  }, [port]);

  useEffect(() => {
    // In send mode:
    //  when a file is selected, exit writing mode
    if (activeSFile !== null) {
      setWritingNewText(false);
    }
  }, [activeSFile]);

  //TODO :GET RID OF THIS!!!
  // REAL TODO: fix protocol, presentedIp, port being stale. (use react refs) 
  // function openFile(file = null) {
  //   // console.log("stage 2 file=", file);
  //   // let _f = null;
  //   // if (file != null) {
  //   //   _f = file;
  //   // }
  //   // console.log("stage 3 file=", _f);
  //   window.electronAPI.openFile(file).then(([uid, fileName, fileSize]) => {
  //     if (uid == "" || fileName == "null") {
  //       return;
  //     }
  //     var url = `${protocolRef.current}://${ipRef.current}:${portRef.current}/get/${uid}`;
  //     // console.log("appending to hostedfiles (current length " + hostedFiles.length + "): ", { id: uid, fileName: fileName, url: url, size: fileSize });
      
  //     setHostedFiles(prev => {
  //       const updated = [...prev, { id: uid, fileName: fileName, url: url, size: fileSize }]
  //       setSelectedSFile(updated.length - 1);
  //       return updated;
  //     });
  //   });
  // }

  // function handleNewTextClick() {
  //   setSelectedSFile(null);
  //   setWritingNewText(true);
  // }

  // const handleAddText = (event) => {
  //   event.preventDefault();
  //   console.log("Received addtext event: ", event);

  //   window.electronAPI.addTextToOutbox(addTextValue).then(([uid, filename, filesize]) => {
  //     var url = `${protocolRef.current}://${ipRef.current}:${portRef.current}/get/${uid}`;

  //     setHostedFiles(prev => {
  //       const updated = [...prev, { id: uid, fileName: filename, url: url, size: filesize }]



  //       setSelectedSFile(updated.length - 1);
  //       return updated;
  //     });
  //   });

  //   setAddTextValue("");
  // }

  // function handleChangedIP(newIP) {
  //   setPresentedIp(newIP);
  //   // Save ip to config for next launch
  //   window.electronAPI.setIP(newIP);
  // }

  // function discardPendingFile() {
  //   window.recvFileAPI.discardFile(pendingFiles[activeRFile].id);
  //   var _pendingFiles = pendingFiles.filter(f => f.id !== pendingFiles[activeRFile].id);
  //   if (_pendingFiles.length == 0) {
  //     setSelectedRFile(null);
  //   } else {
  //     setSelectedRFile(0);
  //   }
  //   setPendingFiles(_pendingFiles);
  // }

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
    console.log("renderer init: hostedFiles = \n" + hostedFiles.toString());

    initialize(openFile, protocolRef, ipRef, portRef, setPort, setPresentedIp, setAddrs, setPendingFiles, setSavePaths, setProtocol, setTLSKeyPath, setTLSCertPath, setHostedFiles, setSelectedSFile);
  }, []);

  //update all URLs when port, protocol or presentedIp changes
  useEffect(() => {
    updateURL(protocol, presentedIp, port, setRecvUrl, hostedFiles, setHostedFiles);
  }, [protocol, presentedIp, port]);

  // console.log("App rendering");

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
    let current = pendingFiles[activeRFile];
    console.log("Active rfile:" + activeRFile);
    return savePaths[current.id] != null;
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
                buttonAction={() => setSelectedNavPage(i)}
                selected={selectedNavPage === i}
                enabled={true}
                customStyle={{display: "flex", width: "100%",  height: "45px", fontWeight: "regular", fontSize: "0.6rem", marginBottom: "3px",borderRadius: "8px", justifyContent: "center", alignItems: "center"}}
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
            enabled={true}
            customStyle={{display: "flex", width: "100%",  height: "45px", fontWeight: "regular", fontSize: "0.6rem", marginBottom: "3px", borderRadius: "8px", justifyContent: "center", alignItems: "center"}}
            shadeA={"#202020"}
            shadeB={"#282828"}
            shadeC={"#2c2c2c"}
          />
        </div>
        <div className="content-wrapper" style={{height: "100%", width: "300px", flexGrow: 1, borderRadius: "8px"}}>
          {selectedNavPage === 0 ? (
            <Outbox hostedFiles={hostedFiles} setHostedFiles={setHostedFiles} openFile={openFile} handleAddText={handleAddText} addTextValue={addTextValue} setAddTextValue={setAddTextValue} setSelectedSFile={setSelectedSFile} protocolRef={protocolRef} ipRef={ipRef} portRef={portRef} activeSFile={activeSFile}/>
          ) : selectedNavPage === 1 ? (
            <Inbox setSelectedRFile={setSelectedRFile} pendingFiles={pendingFiles} setPendingFiles={setPendingFiles} activeRFile={activeRFile} handleDiscardPendingFile={handleDiscardPendingFile} recvUrl={recvUrl} hasCurrentFileBeenSaved={hasCurrentFileBeenSaved} savePaths={savePaths} />
          ) : selectedNavPage === -1 ? (
            <div style={{display: "flex", flexDirection: "column", height: "100%", width: "100%", fontSize: "0.8rem", marginLeft: "12px"}}>
              <h4 style={{marginBottom: "10px", marginTop: "13px"}}>Preferences</h4>
              <div style={{flexDirection: "column", display: "flex"}}>
                <strong>TLS key/certificate locations</strong>
                <span>Specify a custom directory for the TLS key and certificate files. If left blank, defaults to the application directory.</span>
                <input type="text" style={{marginTop: "5px", width: "300px"}} defaultValue={tlsKeyPath} onBlur={(e) => {setTLSKeyPath(e.target.value); window.electronAPI.setTLSKeyPath(e.target.value);}} placeholder="Enter path to TLS key file" />
                <input type="text" style={{marginTop: "5px", width: "300px"}} defaultValue={tlsCertPath} onBlur={(e) => {setTLSCertPath(e.target.value); window.electronAPI.setTLSCertPath(e.target.value);}} placeholder="Enter path to TLS certificate file" />
              </div>
              <br />
              <div style={{flexDirection: "column", display: "flex"}}>
                <strong>Server port</strong>
                <span>Specify the port number the server will listen on. Default is 2222.</span>
                <input type="number" style={{marginTop: "5px", width: "300px"}} defaultValue={port} onBlur={(e) => {setPort(e.target.value); window.electronAPI.setPort(e.target.value);}} placeholder="Enter server port" />
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div style={{display: "flex", flexDirection: "row", justifyContent: "space-between", height: footerHeight, flexGrow: 0, width: "100%", backgroundColor: "#202020", lineHeight: "16px", color: "#606060", overflow: "hidden"}}>
        <div id="left-footer" style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
          <div className="ip-selector" style={{margin: "0", width: "115px", height: footerHeight, overflow: "hidden"}}>
            <select style={{height: "100%", fontSize: "12px", color: "#a0a0a0"}} onChange={(e) => handleChangedIP(e.target.value, setPresentedIp)} value={presentedIp}>
              {addrs.map((addr, index) => (
                <option key={index} value={addr} style={{height: footerHeight}}>{addr}</option>
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

          {/* <div style={{margin: "0 2px", height: footerHeight}}>
            <a href="https://github.com/sadam-04/Axon-node" style={{height: footerHeight, fontSize: "12px", color: "#a0a0a0", textDecoration: "none", lineHeight: footerHeight}}>Axon-node © 2025</a>
          </div> */}
        </div>
        <div id="right-footer" style={{display: "flex", alignItems: "center"}}>
          <div style={{width: "115px",height: footerHeight, overflow: "hidden"}}>
            <ResponsiveButton
              label={"Axon-node © 2026"}
              buttonAction={async () => {
                window.location.href = "https://github.com/sadam-04/Axon-node";
              }}
              selected={false}
              enabled={true}
              customStyle={{height: footerHeight, fontSize: "12px", color: "#a0a0a0"}}
              shadeA={"#202020"}
              shadeB={"#282828"}
              shadeC={"#303030"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// function SummaryListItem({fileName, onCloseClick}) {
//   const [isHovered, setIsHovered] = useState(false);

//   function handleMouseEnter(event) {
//     setIsHovered(true);
//   }

//   function handleMouseLeave(event) {
//     setIsHovered(false);
//   }
  
//   var _width = "260px";

//   return (
//     <div
//       onMouseEnter={(event) => {handleMouseEnter(event);}}
//       onMouseLeave={(event) => {handleMouseLeave(event);}}
//       style={{
//         padding: "6px 0 6px 10px",
//         display: "flex",
//         justifyContent: "space-between",
//         flexDirection: "row",
//         alignItems: "center",
//         width: `calc(${_width} - 20px)`,
//         height: "18px",
//       }}
//     >
//         <div style={{display: "block", fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{fileName}</div>
//         {isHovered ? <div onClick={onCloseClick} className="outboxItemCloseBttn" style={{display: "block", width: "10px", height: "19px", marginRight: "8px"}}>✖</div> : null}
//     </div>
//   )
// }

// function ResponsiveButtonSet({buttonData}) {

//   const [activeStates, setSelectedStates] = useState([]);

//   for (let i = 0; i < buttonData.length; i++) {
//     <ResponsiveButton activeState={buttonData[i].activeState} activeStateSetter={buttonData[i].activeStateSetter} />
//   }
// }>





// function SimpleTextHeader({primaryText, postPrimaryContent=null, secondaryText}) {
//   return (
//     <div style={{width: "100%", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap"}}>
//       <strong>{primaryText}</strong>
//       {postPrimaryContent}
//       <br />
//       <ul style={{
//         listStyleType: "none",
//         paddingLeft: "8px",
//         marginTop: "4px",
//       }}>
//         <li>{secondaryText}</li>
//       </ul>
//     </div>
//   )
// }

// function ServedItem({filename, url, size}) {
//   // const [src, setSrc] = useState("");
//   const [checked, setChecked] = useState(true);
//   // const [qrHoverMsg, setQrHoverMsg] = useState("Click to copy URL to clipboard");
//   // const [fullUrl, setFullUrl] = useState("");

//   // let ip = "";
//   // const fullUrl = `http://${ip}:3030/get/${url}`;

//   const handleCheckboxChange = (e) => {
//     const isChecked = e.target.checked ? true : false;
//     setChecked(isChecked);

//     var fileID = new URL(url).pathname.split("/").filter(Boolean).pop()
//     window.electronAPI.setServing(isChecked, fileID);
//   };

//   // useEffect(() => {
//   //   (async () => {
//   //     try {
//   //       // ip = await window.electronAPI.getDefaultIP();
//   //       // console.log("renderer: set ip to " + ip);

//   //       // setFullUrl(`http://${ip}:3030/get/${url}`, async () => {
//   //         // console.log("renderer: fullUrl is " + fullUrl);
//   //       // setFullUrl(`http://${ip}:3030/get/${url}`);


//   //       // });

//   //     } catch (err) {
//   //       console.error("Failed to generate QR code", err);
//   //     }
//   //   })();

//   // }, [url]);

//   filename = filename ? filename.replace(/^.*[\\/]/, '') : '';

//   const sizeString = size < 1024 ? `${size} B` : size < 1048576 ? `${(size / 1024).toFixed(2)} KB` : `${(size / 1048576).toFixed(2)} MB`;

//   return <div className="file-entry">

//     <SimpleTextHeader primaryText={filename} postPrimaryContent={<input type="checkbox" checked={checked} onChange={handleCheckboxChange} />} secondaryText={`Size: ${sizeString}`} />
//     <div className="right-panel">
//       <QrComponent url={url} />
//     </div>
//   </div>
// };

// function Navbar() {

// }

// function ShadedButton({ selected, hovered, pressed, enabled, customStyle = null, disabledStyle = null, icon, shadeA, shadeB, shadeC }) {
//   let shadeValue = shadeA;

//   if (enabled) {
//     if ((selected && hovered && pressed) || (selected && !hovered && !pressed) || (!selected && hovered && !pressed)) {
//       shadeValue = shadeC;
//     } else if ((selected && hovered && !pressed) || (!selected && hovered && pressed)) {
//       shadeValue = shadeB;
//     }
//   }

//   return (
//     <div className="button-icon" style={{ ...customStyle, ...(enabled ? { backgroundColor: shadeValue } : disabledStyle) }}>
//       {icon}
//     </div>
//   );
// }


// root.render(<App />);