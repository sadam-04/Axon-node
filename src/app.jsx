import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import QRCode from 'qrcode';

const root = createRoot(document.body);

function App() {
  const [children, setChildren] = useState([]);

  function handleClick() {
      window.electronAPI.openFile().then(([hostUrl, filePath]) => {
          if (hostUrl == 0 && filePath == "null") {
            return;
          }
          setChildren([...children, { id: Date.now(), path: filePath, url: hostUrl }]);
      });
  }

  return (
    <div>
      <div className="add-data-button" onClick={handleClick}></div>
      {children.map((child) => (
        <ServedItem key={child.id} path={child.path} url={child.url} />
      ))}
    </div>
  );
}

function ServedItem({path, url}) {
  const [src, setSrc] = useState("");
  const [checked, setChecked] = useState(false);

  const handleCheckboxChange = (e) => {
    const isChecked = e.target.checked ? true : false;
    setChecked(isChecked);
    window.electronAPI.setServing(isChecked, url);
    // You can also call local or Electron IPC functions here
  };

  useEffect(() => {
    (async () => {
      try {
        const dataUrl = await QRCode.toDataURL(`http://192.168.1.182:3030/get/${url}`, {margin: 4});
        setSrc(dataUrl);
      } catch (err) {
        console.error("Failed to generate QR code", err);
      }
    })();
  }, [url]);

  path = path.replace(/^.*[\\/]/, '');

  return <div className="file-entry">
    <strong>{path}</strong>
    <input type="checkbox" checked={checked} onChange={handleCheckboxChange} />
    <br />
    http://192.168.1.182:3030/get/{url}
    <br />
    {src ? <img src={src} /> : <p>Loading QR...</p>}
  </div>;
}

root.render(<App />);