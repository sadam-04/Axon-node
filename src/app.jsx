import React, { useEffect, useLayoutEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import { handleAddText, handleChangedIP, openFile, initialize } from "./handlers";
import { Outbox, Inbox } from "./components/pages";
import ResponsiveButton from "./components/ResponsiveButton";

const root = createRoot(document.getElementById("root"));
root.render(<App />);

const titlebar = createRoot(document.getElementById("titlebar"));
titlebar.render(<TitleBar />);

window.addEventListener("will-navigate", event => {
  event.preventDefault();
  console.log("Navigation prevented to: ", event.url);
  return false;
});

const app_icon = require("../static/clear.png");

function TitleBar() {
  return (
    <div id="titlebar" style={{"display": "flex", "flexDirection": "row", "height": "35px", "appRegion": "drag", "width": "100%"}}>
      <img src={app_icon} style={{"width": "17px", "height": "17px", "borderRadius": "4px", "marginLeft": "7px", "marginRight": "5px", "marginTop": "7px"}} />
      <div style={{"height": "35px", "lineHeight": "32px", "fontSize": "12px"}}>Axon</div>
    </div>
  );
}

function App() {
  const [outboxItems, setOutboxItems] = useState([]);
  const [inboxItems, setInboxItems] = useState([]);

  const [addrs, setAddrs] = useState([]);

  const [presentedIp, setPresentedIp] = useState("");
  const [protocol, setProtocol] = useState("");

  const [protocolMessage, setProtocolMessage] = useState("");

  const [port, setPort] = useState(2222);

  const [savePaths, setSavePaths] = useState({});

  const [selectedNavPage, setSelectedNavPage] = useState(0);

  const [buttons, setButtons] = useState([
    {id: 1, label: "Outbox", action: () => setSelectedNavPage(0)},
    {id: 2, label: "Inbox", action: () => setSelectedNavPage(1)},
  ]);

  const [activeSFile, setSelectedSFile] = useState(null);
  // const [activeSFileUid, setSelectedSFileUid] = useState(null);
  const [activeRFile, setSelectedRFile] = useState(null);
  // const [activeRFileUid, setSelectedRFileUid] = useState(null);
  
  var activeSFileUid = null;
  var activeRFileUid = null;

  // const [writingNewText, setWritingNewText] = useState(false);

  const [tlsKeyPath, setTLSKeyPath] = useState("");
  const [tlsCertPath, setTLSCertPath] = useState("");

  // const protocolRef = useRef(protocol);
  // const ipRef = useRef(presentedIp);
  // const portRef = useRef(port);

  const [saveDir, setSaveDir] = useState(null);
  
  const [addTextValue, setAddTextValue] = useState("");

  // useEffect(() => {
  //   protocolRef.current = protocol;
  // }, [protocol]);

  // useEffect(() => {
  //   ipRef.current = presentedIp;
  // }, [presentedIp]);

  // useEffect(() => {
  //   portRef.current = port;
  // }, [port]);

  // useLayoutEffect(() => {
  //   if (outboxItems.length == 0) {
  //     setSelectedSFile(null);
  //   } else if (activeSFile >= outboxItems.length) {
  //     setSelectedSFile(outboxItems.length - 1);
  //   }
  // }, [outboxItems]);

  useLayoutEffect(() => {
    if (inboxItems.length == 0) {
      setSelectedRFile(null);
    } else if (activeRFile >= inboxItems.length) {
      setSelectedRFile(inboxItems.length - 1);
    }
  }, [inboxItems]);

  // useEffect(() => {
  //   // In send mode:
  //   //  when a file is selected, exit writing mode
  //   if (activeSFile !== null) {
  //     setWritingNewText(false);
  //   }
  // }, [activeSFile]);

  // initialization
  useEffect(() => {
    initialize(openFile, setPort, setPresentedIp, setSaveDir, setAddrs, setInboxItems, setSavePaths, setProtocol, setTLSKeyPath, setTLSCertPath, setOutboxItems, setSelectedSFile, setSelectedRFile, setSelectedNavPage);
  }, []);

  function hasCurrentFileBeenSaved() {
    let current = inboxItems[activeRFile];
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
            customStyle={{display: "flex", width: "100%",  height: "45px", fontWeight: "regular", fontSize: "0.6rem", borderRadius: "8px", justifyContent: "center", alignItems: "center"}}
            shadeA={"#202020"}
            shadeB={"#282828"}
            shadeC={"#2c2c2c"}
          />
        </div>
        <div className="content-wrapper" style={{height: "100%", width: "300px", flexGrow: 1, borderRadius: "8px 0 0 0"}}>
          {selectedNavPage === 0 ? (
            <Outbox hostedFiles={outboxItems} setHostedFiles={setOutboxItems} openFile={openFile} handleAddText={handleAddText} addTextValue={addTextValue} setAddTextValue={setAddTextValue} setSelectedSFile={setSelectedSFile} protocol={protocol} ip={presentedIp} port={port} activeSFile={activeSFile}/>
          ) : selectedNavPage === 1 ? (
            <Inbox setSelectedRFile={setSelectedRFile} inboxItems={inboxItems} setinboxItems={setInboxItems} activeRFile={activeRFile} hasCurrentFileBeenSaved={hasCurrentFileBeenSaved} savePaths={savePaths} protocol={protocol} ip={presentedIp} port={port} />
          ) : selectedNavPage === -1 ? (
            <div style={{display: "flex", flexDirection: "column", height: "100%", width: "100%", fontSize: "0.8rem", marginLeft: "12px", overflow: "hidden"}}>
              <h4 style={{marginBottom: "10px", marginTop: "13px"}}>Preferences</h4>
              <div style={{flexDirection: "column", display: "flex"}}>
                <strong>TLS key/certificate locations</strong>
                <span>Specify a custom directory for the TLS key and certificate files. If left blank, defaults to the application directory.</span>
                <div style={{display: "flex", flexDirection: "row", marginTop: "6px"}}>
                  <div style={{display: "flex", flex: "0 0 27px", alignItems: "center", justifyContent: "start", marginRight: "10px"}}>Key: </div>
                  <div style={{display: "flex", flex: "1 1 0", minWidth: "0"}}>
                    <ResponsiveButton
                      label={<div style={{whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{tlsKeyPath}</div>}
                      buttonAction={()=>{configAPI.browseForTlsKey(tlsKeyPath).then((result)=>{setTLSKeyPath(result)});}}
                      selected={false}
                      enabled={true}
                      styleClass="theme-box"
                      customStyle={{whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}
                      shadeA="#343434"
                      shadeB="#3a3a3a"
                      shadeC="#404040"
                    />
                  </div>
                </div>

                <div style={{display: "flex", flexDirection: "row", marginTop: "3px"}}>
                  <div style={{display: "flex", flex: "0 0 27px", alignItems: "center", justifyContent: "start", marginRight: "10px"}}>Cert: </div>
                  <div style={{display: "flex", flex: "1 1 0", minWidth: "0"}}>
                    <ResponsiveButton
                      label={<div style={{whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{tlsCertPath}</div>}
                      buttonAction={()=>{configAPI.browseForTlsCert(tlsCertPath).then((result)=>{setTLSCertPath(result)});}}
                      selected={false}
                      enabled={true}
                      styleClass="theme-box"
                      customStyle={{whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}
                      shadeA="#343434"
                      shadeB="#3a3a3a"
                      shadeC="#404040"
                    />
                  </div>
                </div>
              </div>
              <br />
              <div style={{flexDirection: "column", display: "flex"}}>
                <strong>Server port</strong>
                <span>Specify the port number the server will listen on. Default is 2222.</span>
                <input type="number" className="theme-text-input" style={{marginTop: "2px", backgroundColor: "#222222", width: "150px"}} defaultValue={port} onBlur={(e) => {configAPI.setPort(e.target.value).then((result) => {setPort(result);});}} placeholder="Enter server port" />
              </div>
            <br />
              <div style={{flexDirection: "column", display: "flex"}}>
                <strong>Save directory</strong>
                <span>Specify the directory where files will be saved when the "Save" option is used in the inbox. Default is the user's Downloads folder.</span>
                
                
                <div style={{display: "flex", flex: "1 1 0", minWidth: "0", marginTop: "6px"}}>
                  <ResponsiveButton
                    label={<div style={{whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{saveDir}</div>}
                    buttonAction={()=>{configAPI.browseForSaveDir(saveDir).then((result)=>{setSaveDir(result)});}}
                    selected={false}
                    enabled={true}
                    styleClass="theme-box"
                    customStyle={{whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}
                    shadeA="#343434"
                    shadeB="#3a3a3a"
                    shadeC="#404040"
                  />
                </div>


                {/* <div style={{display: "flex", marginTop: "5px", flexDirection: "row"}}>
                  <div style={{width: "300px", height: "20px", backgroundColor: "#202020", border: "none", borderRadius: "4px"}}>{saveDir}</div>
                  <button style={{height: "18px", padding: "0", border: "none", borderRadius: "8px"}} onClick={()=>{configAPI.browseForSaveDir(saveDir).then((result)=>{setSaveDir(result)});}}>browse</button>
                </div> */}
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

          <div style={{margin: "auto 2px", width: "50px", height: footerHeight, overflow: "hidden"}}>
              <ResponsiveButton
                label={protocol}
                buttonAction={async () => {
                  configAPI.attemptToggleProtocol().then(([newProtocol, toggleSuccess]) => {
                    setProtocol(newProtocol);
                    if (newProtocol == "HTTP" && !toggleSuccess) {
                      setProtocolMessage("Unable to switch to HTTPS. Make sure key and cert files are present.");
                    } else {
                      setProtocolMessage("");
                    }
                  });
                }}
                selected={false}
                setSelected={() => {}}
                enabled={true}
                customStyle={{height: footerHeight, width: "100%", fontSize: "12px", fontWeight: "regular", color: "#a0a0a0"}}
                shadeA={"#202020"}
                shadeB={"#282828"}
                shadeC={"#303030"}
              />
          </div>

          <div style={{display: "flex", alignItems: "center", padding: "0 2px 0 2px", margin: "0", height: footerHeight, overflow: "hidden"}}>
            {protocolMessage ? <span style={{height: "wrap-content", fontSize: "12px", color: "#a04040"}}>{protocolMessage}</span> : null}
          </div>
        </div>
        <div id="right-footer" style={{display: "flex", alignItems: "center"}}>
          <div style={{width: "120px",height: footerHeight, overflow: "hidden"}}>
            <ResponsiveButton
              label={"Axon-node © 2026"}
              buttonAction={async () => {
                window.location.href = "https://github.com/sadam-04/Axon-node";
              }}
              selected={false}
              enabled={true}
              customStyle={{height: footerHeight, width: "120px", fontSize: "12px", color: "#a0a0a0"}}
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