import React from 'react';

export default function SimpleTextHeader({primaryText, postPrimaryContent=null, secondaryText}) {
  return (
    <div style={{width: "100%", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap"}}>
      <strong>{primaryText}</strong>
      {postPrimaryContent}
      <br />
      <ul style={{
        listStyleType: "none",
        paddingLeft: "8px",
        marginTop: "4px",
      }}>
        <li>{secondaryText}</li>
      </ul>
    </div>
  )
}