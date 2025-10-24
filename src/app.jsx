import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import QRCode from 'qrcode';

const root = createRoot(document.body);

function App() {
  const [hostedFiles, setHostedFiles] = useState([]);

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
  }

  function recvMode() {
    let sendPanel = document.getElementById("send-panel");
    let recvPanel = document.getElementById("recv-panel");
    
    sendPanel.style.display = "none";
    recvPanel.style.display = "block";
  }

  function setAndPropagatePresentedIp(addr) {
    return () => {
      setRecvUrl(`http://${addr}:3030/send`);
      setPresentedIp(addr);
      // also update all hostedFiles entries
      let newHostedFiles = hostedFiles.map((file) => {
        return { ...file, presentedHost: addr };
      });
      setHostedFiles(newHostedFiles);
    }
  }

  useEffect(() => {
    async function getIP() {
      var ip = await window.electronAPI.getDefaultIP();
      setRecvUrl(`http://${ip}:3030/send`);
    }
    getIP();
    // console.log("calling listAddrs");
    async function getAddrs() {
      setAddrs(await window.electronAPI.listAddrs());
    }
    getAddrs();

  }, []);

  if (hostedFiles.length === 0) {
    return (
      <div>
        <div className="no-files-msg" onClick={handleFileOpenClick}>No files added yet. Click here to add one.</div>
        <div className="plus-btn" onClick={handleFileOpenClick} />
      </div>
    );
  }

  console.log("App rendering");





  // (async () => {

  // })();

  return (
    <div className="outer-wrapper">
      <div className="nav-sidebar">
        <div className="sidebar-button" onClick={sendMode}>Send</div>
        <div className="sidebar-button" onClick={recvMode}>Receive</div>
      </div>
      <div className="content-wrapper">
        <ul id="addr-list">
          {addrs.map((addr, index) => (
            <li key={index} onClick={setAndPropagatePresentedIp(addr)}>{addr}</li>
          ))}
        </ul>
        <div id="send-panel">
          {hostedFiles.map((file) => (
            <ServedItem key={file.id} filename={file.fileName} url={file.url} presentedHost={file.presentedHost} size={file.size} />
          ))}
          <div className="plus-btn" onClick={handleFileOpenClick} />
        </div>

        <div id="recv-panel" style={{display: "none"}}>
          <div className="file-entry">
            {recvUrl ? <QrComponent url={recvUrl} /> : <p>Loading QR...</p>}
          </div>
        </div>
      </div>
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
    window.electronAPI.setServing(isChecked, url);
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

root.render(<App />);