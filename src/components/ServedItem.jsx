import React, {useState} from 'react';
import QrComponent from './QrComponent';
import SimpleTextHeader from './SimpleTextHeader';

export default function ServedItem({filename, url, size}) {
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

  // if (shortenName) {
  //   filename = filename ? filename.replace(/^.*[\\/]/, '') : '';
  // }

  const sizeString = size < 1024 ? `${size} B` : size < 1048576 ? `${(size / 1024).toFixed(2)} KB` : `${(size / 1048576).toFixed(2)} MB`;

  console.log("ServedItem render: url = ", url);

  return <div className="file-entry">

    <SimpleTextHeader primaryText={filename} postPrimaryContent={<input type="checkbox" checked={checked} onChange={handleCheckboxChange} />} secondaryText={`Size: ${sizeString}`} />
    <div className="right-panel">
      <QrComponent url={url} />
    </div>
  </div>
};