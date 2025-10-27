import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import QRCode from 'qrcode';

const root = createRoot(document.body);

function App() {
  const [hostedFiles, setHostedFiles] = useState([]);

  const [guiMode, setGuiMode] = useState("send"); // "send" or "recv"
  const [addrs, setAddrs] = useState([]);
  // const [recvQrSrc, setRecvQrSrc] = useState("");
  const [recvUrl, setRecvUrl] = useState("");
  const [presentedIp, setPresentedIp] = useState("");

  // let ip = "";
  // let recvUrl = "";

  function handleFileOpenClick() {
      window.electronAPI.openFile().then(([hostUrl, fileName, fileSize]) => {
          if (hostUrl == "" || fileName == "null") {
            return;
          }
          setHostedFiles([...hostedFiles, { id: Date.now(), fileName: fileName, url: hostUrl, presentedHost: presentedIp, size: fileSize }]);
      });
  }

  function sendMode() {
    let sendPanel = document.getElementById("send-panel");
    let recvPanel = document.getElementById("recv-panel");
    
    sendPanel.style.display = "block";
    recvPanel.style.display = "none";

    setGuiMode("send");
  }

  function recvMode() {
    let sendPanel = document.getElementById("send-panel");
    let recvPanel = document.getElementById("recv-panel");
    
    sendPanel.style.display = "none";
    recvPanel.style.display = "block";

    setGuiMode("recv");
  }

  function setAndPropagatePresentedIp(addr) {
    setRecvUrl(`http://${addr}:3030/send`);
    setPresentedIp(addr);
    // also update all hostedFiles entries
    let newHostedFiles = hostedFiles.map((file) => {
      return { ...file, presentedHost: addr };
    });
    setHostedFiles(newHostedFiles);
  }

  useEffect(() => {
    async function getIP() {
      var ip = await window.electronAPI.getDefaultIP();
      setRecvUrl(`http://${ip}:3030/send`);
    }
    getIP();
    // console.log("calling listAddrs");
    async function getAddrs() {
      let addrs = await window.electronAPI.listAddrs();
      setAddrs(addrs);
      setAndPropagatePresentedIp(addrs[0]);
      console.log("Propagated ip: " + addrs[0]);
    }
    getAddrs();

  }, []);

  // if (hostedFiles.length === 0) {
  //   return (
  //     <div>
  //       <div className="no-files-msg" onClick={handleFileOpenClick}>No files added yet. Click here to add one.</div>
  //       <div className="plus-btn" onClick={handleFileOpenClick} />
  //     </div>
  //   );
  // }

  console.log("App rendering");

  // const [activeS, setActiveS] = useState(true);
  // const [activeR, setActiveR] = useState(false);

  // function handleSelectSend() {
  //   setActiveS(true);
  //   setActiveR(false);
  //   sendMode();
  // }

  // function handleSelectRecv() {
  //   setActiveR(true);
  //   setActiveS(false);
  //   recvMode();
  // }

  // function addButton() {
  //   setButtons(prev => [...prev, { id: Date.now(), label: `Btn ${prev.length + 1}` }]);
  // }

  const [buttons, setButtons] = useState([
    {id: 1, label: (<div style={{display: "flex", width: "35px", height: "35px", borderRadius: "5px", justifyContent: "center", alignItems: "center"}}>S</div>), action: sendMode},
    {id: 2, label: (<div style={{display: "flex", width: "35px", height: "35px", borderRadius: "5px", justifyContent: "center", alignItems: "center"}}>R</div>), action: recvMode}
  ]);
  const [activeNavPage, setActiveNavPage] = useState(null);

  const [activeSFile, setActiveSFile] = useState(null);

  return (
    <div className="outer-wrapper">
      <div className="nav-sidebar">

        {/* <ResponsiveButton isActive={activeS} setActive={handleSelectSend} />
        <ResponsiveButton isActive={activeR} setActive={handleSelectRecv} /> */}

        {buttons.map((btn, i) => (
          <ResponsiveButton
            key={btn.id}
            label={btn.label}
            buttonAction={btn.action}
            isActive={activeNavPage === i}
            setActive={() => setActiveNavPage(i)}
            shadeA={"#181818"}
            shadeB={"#202020"}
            shadeC={"#282828"}
          />
        ))}

      </div>
      <div className="content-wrapper">

        {/* <div className="ip-selector">
          <h4>Select ip address:</h4>
          <select id="addr-list" onChange={(e) => setAndPropagatePresentedIp(e.target.value)()}>
            {addrs.map((addr, index) => (
              <option key={index} value={addr}>{addr}</option>
            ))}
          </select>
        </div> */}

        <div id="left-summary-panel">
          <div id="send-panel">
            <div className="send-title-ribbon">
              <h4 style={{marginBottom: "5px", marginTop: "5px" }}>Outbox</h4>
              <div className="plus-btn" onClick={handleFileOpenClick} />
            </div>
            <hr style={{backgroundColor: "#303030", border: "none", height: "1px", margin: "10px 0" }} />
            {hostedFiles.map((file, i) => (

              <ResponsiveButton
                key={file.id}
                label={<OutboxItemLabel fileName={file.fileName.replace(/^.*[\\/]/, '')} onCloseClick={() => {var fileID = new URL(file.url).pathname.split("/").filter(Boolean).pop(); window.electronAPI.setServing(false, fileID); setHostedFiles(prev => prev.filter(f => f.id !== file.id));}} />}
                buttonAction={() => {}}
                isActive={activeSFile === i}
                setActive={() => setActiveSFile(i)}
                shadeA={"#202020"}
                shadeB={"#282828"}
                shadeC={"#303030"}
              />
              


              // <ServedItem key={file.id} filename={file.fileName} url={file.url} presentedHost={file.presentedHost} size={file.size} />
            ))}
          </div>
          <div id="recv-panel" style={{display: "none"}}>
            <h4 style={{marginBottom: "5px", marginTop: "5px" }}>Inbox</h4>
            <div className="file-entry">
              {recvUrl ? <QrComponent url={recvUrl} /> : <p>Loading QR...</p>}
            </div>
          </div>
        </div>

        <div id="right-detail-panel">

          {activeSFile !== null && guiMode == "send" ? (
          <ServedItem key={hostedFiles[activeSFile]?.id} filename={hostedFiles[activeSFile]?.fileName} url={hostedFiles[activeSFile]?.url} presentedHost={hostedFiles[activeSFile]?.presentedHost} size={hostedFiles[activeSFile]?.size} />
          ) : (
          <div style={{color: "white"}}>No file selected. Please select a file from the outbox to see details.</div>
          )}

          {activeRFile !== null && guiMode == "recv" ? (
          <ServedItem key={hostedFiles[activeRFile]?.id} filename={hostedFiles[activeSFile]?.fileName} url={hostedFiles[activeSFile]?.url} presentedHost={hostedFiles[activeSFile]?.presentedHost} size={hostedFiles[activeSFile]?.size} />
          ) : (
          <div style={{color: "white"}}>No file selected. Please select a file from the outbox to see details.</div>
          )}

          <div className="ip-selector">
            {/* <h4>Select ip address:</h4> */}
            <select id="addr-list" onChange={(e) => setAndPropagatePresentedIp(e.target.value)}>
              {addrs.map((addr, index) => (
                <option key={index} value={addr}>{addr}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

function OutboxItemLabel({fileName, onCloseClick}) {
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseEnter(event) {
    setIsHovered(true);
  }

  function handleMouseLeave(event) {
    setIsHovered(false);
  }
  
  return (
    <div
      onMouseEnter={(event) => {handleMouseEnter(event);}}
      onMouseLeave={(event) => {handleMouseLeave(event);}}
      style={{
        padding: "8px 12px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        justifyContent: "space-between",
        display: "flex",
        width: "calc(100% - 24px)"
      }}
    >
        <div>{fileName}</div>
        {isHovered ? <div onClick={onCloseClick} className="outboxItemCloseBttn" style={{display: "block"}}>✖</div> : null}
    </div>
  )
}

// function ResponsiveButtonSet({buttonData}) {

//   const [activeStates, setActiveStates] = useState([]);

//   for (let i = 0; i < buttonData.length; i++) {
//     <ResponsiveButton activeState={buttonData[i].activeState} activeStateSetter={buttonData[i].activeStateSetter} />
//   }
// }

function ResponsiveButton({isActive, setActive, buttonAction, onHover = null, label, shadeA, shadeB, shadeC}) {
  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
  <div  onMouseEnter={() => {setHovered(true); if (onHover)onHover();}} onMouseLeave={() => {setHovered(false); setClicked(false);}} onMouseDown={() => {setClicked(true)}} onMouseUp={() => {setActive(); buttonAction(); setClicked(false);}}>
    <ShadedButton selected={isActive} hovered={hovered} pressed={clicked} icon={label} shadeA={shadeA} shadeB={shadeB} shadeC={shadeC} />
  </div>
  );
}

function QrComponent({url, presentedHost}) {
  const [src, setSrc] = useState("");
  const [qrHoverMsg, setQrHoverMsg] = useState("Click to copy URL to clipboard");

  var combinedUrl = url.replace("localhost", presentedHost ? presentedHost : "localhost");

  useEffect(() => {
    (async () => {
      try {
        //var combinedUrl = url.replace("localhost", presentedHost ? presentedHost : "localhost");
        console.log("Generating QR for url: " + combinedUrl);
        const dataUrl = await QRCode.toDataURL(combinedUrl, {margin: 4});
        setSrc(dataUrl);
      } catch (err) {
        console.error("Failed to generate QR code", err);
      }
    })();
  }, [url, presentedHost]);

  const handleQRClick = async (e) => {
    navigator.clipboard.writeText(combinedUrl).then(() => {
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

function ServedItem({filename, url, presentedHost, size}) {
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

  filename = filename.replace(/^.*[\\/]/, '');

  const sizeString = size < 1024 ? `${size} B` : size < 1048576 ? `${(size / 1024).toFixed(2)} KB` : `${(size / 1048576).toFixed(2)} MB`;

  return <div className="file-entry">
    <div className="left-panel">
      <strong>{filename}</strong>
      <input type="checkbox" checked={checked} onChange={handleCheckboxChange} />
      <br />
      <ul className="details-list">
        <li>Size: {sizeString}</li>
      </ul>
    </div>

    <div className="right-panel">
      <QrComponent url={url} presentedHost={presentedHost} />
    </div>
  </div>
};

// function Navbar() {

// }

function ShadedButton({ selected, hovered, pressed, icon, shadeA, shadeB, shadeC }) {
  let shadeValue = shadeA;

  if ((selected && hovered && pressed) || (selected && !hovered && !pressed) || (!selected && hovered && !pressed)) {
    shadeValue = shadeB;
  } else if ((selected && hovered && !pressed) || (!selected && hovered && pressed)) {
    shadeValue = shadeC;
  }

  return (
    <div className="sidebar-button" style={{ backgroundColor: shadeValue }}>
      <div className="button-icon">{icon}</div>
    </div>
  );
}


root.render(<App />);