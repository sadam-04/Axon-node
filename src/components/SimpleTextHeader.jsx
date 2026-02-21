import React from 'react';

export default function SimpleTextHeader({primaryText, secondaryText}) {
  return (
    <div style={{width: "100%", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap"}}>
      <strong>{primaryText}</strong>
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