import React, {useState, useEffect} from 'react';
import QRCode from 'qrcode';

const QrComponent = ({url}) => {
  const [src, setSrc] = useState("");
  const [qrHoverMsg, setQrHoverMsg] = useState("Click to copy URL to clipboard");

  // var combinedUrl = url ? url.replace("localhost", presentedHost ? presentedHost : "localhost") : "";

  // console.log("QrComponent: url = " + url);

  useEffect(() => {
    (async () => {
      try {
        //var combinedUrl = url.replace("localhost", presentedHost ? presentedHost : "localhost");
        console.log("Generating QR for url: " + url);
        QRCode.toDataURL(url, {margin: 4}, (err, dataUrl) => {
          setSrc(dataUrl);
        });
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

export default QrComponent;