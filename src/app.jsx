import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import QRCode from 'qrcode';

const root = createRoot(document.body);

function App() {
  const [children, setChildren] = useState([]);

  function handleClick() {
      window.electronAPI.openFile().then(([hostUrl, filePath, fileSize]) => {
          if (hostUrl == 0 && filePath == "null") {
            return;
          }
          setChildren([...children, { id: Date.now(), path: filePath, url: hostUrl, size: fileSize }]);
      });
  }

  if (children.length === 0) {
    return (
      <div>
        <div className="no-files-msg" onClick={handleClick}>No files added yet. Click here to add one.</div>
        <div className="plus-btn" onClick={handleClick} />
      </div>
    );
  }

  return (
    <div>
      {children.map((child) => (
        <ServedItem key={child.id} path={child.path} url={child.url} size={child.size} />
      ))}
      <div className="plus-btn" onClick={handleClick} />
    </div>
  );
}

function ServedItem({path, url, size}) {
  const [src, setSrc] = useState("");
  const [checked, setChecked] = useState(true);
  const [qrHoverMsg, setQrHoverMsg] = useState("Click to copy URL to clipboard");

  const fullUrl = `http://192.168.1.182:3030/get/${url}`;

  const handleCheckboxChange = (e) => {
    const isChecked = e.target.checked ? true : false;
    setChecked(isChecked);
    window.electronAPI.setServing(isChecked, url);
    // You can also call local or Electron IPC functions here
  };

  const handleQRClick = (e) => {
    navigator.clipboard.writeText(fullUrl).then(() => {
      setQrHoverMsg("Copied!");
    })
  }

  useEffect(() => {
    (async () => {
      try {
        const dataUrl = await QRCode.toDataURL(fullUrl, {margin: 4});
        setSrc(dataUrl);
      } catch (err) {
        console.error("Failed to generate QR code", err);
      }
    })();
  }, [url]);

  path = path.replace(/^.*[\\/]/, '');

  const sizeString = size < 1024 ? `${size} B` : size < 1048576 ? `${(size / 1024).toFixed(2)} KB` : `${(size / 1048576).toFixed(2)} MB`;

  return <div className="file-entry">
    <div className="left-panel">
      <strong>{path}</strong>
      <input type="checkbox" checked={checked} onChange={handleCheckboxChange} />
      <br />
      <ul className="details-list">
        <li>Size: {sizeString}</li>
      </ul>

    </div>
    <div className="right-panel">
      <div className="qr-wrapper" onClick={handleQRClick} onMouseLeave={() => setQrHoverMsg("Click to copy URL to clipboard")}>
        {src ? <img src={src} /> : <p>Loading QR...</p>}
        <div className="qr-overlay"><div className="qr-overlay-text">{qrHoverMsg}</div></div>
      </div>
    </div>
  </div>;
}

root.render(<App />);