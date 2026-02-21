import React, {useState} from 'react';
import QrComponent from './QrComponent';
import SimpleTextHeader from './SimpleTextHeader';

export default function ServedItem({filename, url, size}) {
  const sizeString = size < 1024 ? `${size} B` : size < 1048576 ? `${(size / 1024).toFixed(2)} KB` : `${(size / 1048576).toFixed(2)} MB`;

  console.log("ServedItem render: url = ", url);

  return <div className="file-entry">

    <SimpleTextHeader primaryText={filename} secondaryText={`Size: ${sizeString}`} />
    <div className="right-panel">
      <QrComponent url={url} />
    </div>
  </div>
};