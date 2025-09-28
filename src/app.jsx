import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import QRCode from 'qrcode';

const root = createRoot(document.body);

function App() {
  const [children, setChildren] = useState([]);

    function handleClick() {
        window.electronAPI.openFile().then(([hostUrl, filePath]) => {
            setChildren([...children, { id: Date.now(), path: filePath, url: hostUrl }]);
        });
    }

  return (
    <div>
      <button onClick={handleClick}>Open File</button>
      {children.map((child) => (
        <DynamicChild key={child.id} path={child.path} url={child.url} />
      ))}
    </div>
  );
}

function DynamicChild({path, url}) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const dataUrl = await QRCode.toDataURL(`http://192.168.1.182:3030/get/${url}`);
        setSrc(dataUrl);
      } catch (err) {
        console.error("Failed to generate QR code", err);
      }
    })();
  }, [url]);

  path = path.replace(/^.*[\\/]/, '');

  return <div className="file-entry">
    <p>Serving: <strong>{path}</strong> at <strong>http://192.168.1.182:3030/get/{url}</strong></p>
    {src ? <img src={src} /> : <p>Loading QR...</p>}
  </div>;
}

root.render(<App />);