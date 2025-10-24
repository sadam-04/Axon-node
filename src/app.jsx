import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import QRCode from 'qrcode';

const root = createRoot(document.body);

function App() {
  const [children, setChildren] = useState([]);
  // const [recvQrSrc, setRecvQrSrc] = useState("");
  const [recvUrl, setRecvUrl] = useState("");

  let ip = "";
  // let recvUrl = "";

  function handleFileOpenClick() {
      window.electronAPI.openFile().then(([hostUrl, fileName, fileSize]) => {
          if (hostUrl == "" || fileName == "null") {
            return;
          }
          setChildren([...children, { id: Date.now(), fileName: fileName, url: hostUrl, size: fileSize }]);
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

  if (children.length === 0) {
    return (
      <div>
        <div className="no-files-msg" onClick={handleFileOpenClick}>No files added yet. Click here to add one.</div>
        <div className="plus-btn" onClick={handleFileOpenClick} />
      </div>
    );
  }

  (async () => {
    try {
      ip = await window.electronAPI.getDefaultIP();
      setRecvUrl(`http://${ip}:3030/send`);
      // setRecvQrSrc(await QRCode.toDataURL(recvUrl, {margin: 4}));
    } catch (err) {
      console.error("Failed to generate QR code", err);
    }
  })();

  return (
    <div className="outer-wrapper">
      <div className="nav-sidebar">
        <div className="sidebar-button" onClick={sendMode}>Send</div>
        <div className="sidebar-button" onClick={recvMode}>Receive</div>
      </div>
      <div className="content-wrapper">
        <div id="send-panel">
          {children.map((child) => (
            <ServedItem key={child.id} filename={child.fileName} url={child.url} size={child.size} />
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

function QrComponent({url}) {
  const [src, setSrc] = useState("");
  const [qrHoverMsg, setQrHoverMsg] = useState("Click to copy URL to clipboard");

  useEffect(() => {
    (async () => {
      try {
        console.log("Generating QR for url: " + url);
        const dataUrl = await QRCode.toDataURL(url, {margin: 4});
        setSrc(dataUrl);
      } catch (err) {
        console.error("Failed to generate QR code", err);
      }
    })();
  }, [url]);

  const handleQRClick = async (e) => {
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
      <QrComponent url={url} />
    </div>
  </div>
};

root.render(<App />);