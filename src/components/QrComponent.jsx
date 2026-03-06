import React, {useState, useEffect} from 'react';
import QRCode from 'qrcode';

import ResponsiveButton from './ResponsiveButton';

const QrComponent = ({url, alignment, shadeA="#282828", shadeB="#303030", shadeC="#383838"}) => {
  const [src, setSrc] = useState("");
  const [qrHoverMsg, setQrHoverMsg] = useState("Click to copy URL to clipboard");

  useEffect(() => {
    (async () => {
      try {
        console.log("Generating QR for url: " + url);
        QRCode.toDataURL(url.toUpperCase(), {margin: 4}, (err, dataUrl) => {
          setSrc(dataUrl);
        });
      } catch (err) {
        console.error("Failed to generate QR code", err);
      }
    })();
  }, [url]);

  const handleQRClick = async (e) => {
    window.focus();
    navigator.clipboard.writeText(url.toLowerCase()).then(() => {
      setQrHoverMsg("Copied!");
    })
  }

  return (
    <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", fontSize: "0.8rem"}}>
      <div className="qr-code" style={{position: "relative", width: "fit-content", height: "fit-content", aspectRatio: "1/1", textAlign: "center", fontStyle: "italic", cursor: "pointer", borderRadius: "8px", whiteSpace: "normal"}} onClick={handleQRClick} onMouseLeave={() => setQrHoverMsg("Click to copy URL to clipboard")}>
        {src ? <img src={src} /> : <p>Loading QR...</p>}
        <div className="qr-overlay"><div className="qr-overlay-text">{qrHoverMsg}</div></div>
      </div>

      {showUrl ? (<div style={{alignSelf: {alignment}}}>{url.toLowerCase()}</div>) : null}
      <ResponsiveButton selected={false} enabled={true} buttonAction={()=>{setShowUrl(!showUrl)}} label={showUrl ? "Hide" : "Show"} customStyle={{borderRadius: "5px", width: "fit-content", paddingLeft: "10px", paddingRight: "10px", height: "30px"}} shadeA={shadeA} shadeB={shadeB} shadeC={shadeC} />
    </div>
  );
}

export default QrComponent;