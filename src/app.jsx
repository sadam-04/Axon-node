import React, { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import { handleAddText, handleChangedIP, openFile, handleDiscardPendingFile, initialize, updateURL } from "./handlers";
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
    <div id="titlebar" style={{"display": "flex", "flex-direction": "row", "height": "35px", "app-region": "drag", "width": "100%"}}>
      <img src={app_icon} style={{"width": "18px", "height": "18px", "border-radius": "4px", "margin-left": "7px", "margin-right": "5px", "margin-top": "7px"}} />
      <div style={{"height": "35px", "line-height": "32px", "font-size": "12px"}}>Axon</div>
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

  // initialization
  useEffect(() => {
    initialize(openFile, protocolRef, ipRef, portRef, setPort, setPresentedIp, setAddrs, setInboxItems, setSavePaths, setProtocol, setTLSKeyPath, setTLSCertPath, setOutboxItems, setSelectedSFile);
  }, []);

  //update all URLs when port, protocol or presentedIp changes
  useEffect(() => {
    updateURL(protocol, presentedIp, port, setRecvUrl, outboxItems, setOutboxItems);
  }, [protocol, presentedIp, port]);

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
            customStyle={{display: "flex", width: "100%",  height: "45px", fontWeight: "regular", fontSize: "0.6rem", marginBottom: "3px", borderRadius: "8px", justifyContent: "center", alignItems: "center"}}
            shadeA={"#202020"}
            shadeB={"#282828"}
            shadeC={"#2c2c2c"}
          />
        </div>
        <div className="content-wrapper" style={{height: "100%", width: "300px", flexGrow: 1, borderRadius: "8px"}}>
          {selectedNavPage === 0 ? (
            <Outbox hostedFiles={outboxItems} setHostedFiles={setOutboxItems} openFile={openFile} handleAddText={handleAddText} addTextValue={addTextValue} setAddTextValue={setAddTextValue} setSelectedSFile={setSelectedSFile} protocolRef={protocolRef} ipRef={ipRef} portRef={portRef} activeSFile={activeSFile}/>
          ) : selectedNavPage === 1 ? (
            <Inbox setSelectedRFile={setSelectedRFile} inboxItems={inboxItems} setinboxItems={setInboxItems} activeRFile={activeRFile} handleDiscardPendingFile={handleDiscardPendingFile} recvUrl={recvUrl} hasCurrentFileBeenSaved={hasCurrentFileBeenSaved} savePaths={savePaths} />
          ) : selectedNavPage === -1 ? (
            <div style={{display: "flex", flexDirection: "column", height: "100%", width: "100%", fontSize: "0.8rem", marginLeft: "12px"}}>
              <h4 style={{marginBottom: "10px", marginTop: "13px"}}>Preferences</h4>
              <div style={{flexDirection: "column", display: "flex"}}>
                <strong>TLS key/certificate locations</strong>
                <span>Specify a custom directory for the TLS key and certificate files. If left blank, defaults to the application directory.</span>
                <input type="text" style={{marginTop: "5px", width: "300px"}} defaultValue={tlsKeyPath} onBlur={(e) => {setTLSKeyPath(e.target.value); configAPI.setTLSKeyPath(e.target.value);}} placeholder="Enter path to TLS key file" />
                <input type="text" style={{marginTop: "5px", width: "300px"}} defaultValue={tlsCertPath} onBlur={(e) => {setTLSCertPath(e.target.value); configAPI.setTLSCertPath(e.target.value);}} placeholder="Enter path to TLS certificate file" />
              </div>
              <br />
              <div style={{flexDirection: "column", display: "flex"}}>
                <strong>Server port</strong>
                <span>Specify the port number the server will listen on. Default is 2222.</span>
                <input type="number" style={{marginTop: "5px", width: "300px"}} defaultValue={port} onBlur={(e) => {setPort(e.target.value); configAPI.setPort(e.target.value);}} placeholder="Enter server port" />
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