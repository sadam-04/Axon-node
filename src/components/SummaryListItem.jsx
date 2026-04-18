import React, {useEffect, useState} from 'react';

export default function SummaryListItem({fileName, isHovered, onCloseClick}) {  
  var _width = "260px";

  return (
    <div
      style={{
        padding: "6px 0 6px 10px",
        display: "flex",
        justifyContent: "space-between",
        flexDirection: "row",
        alignItems: "center",
        width: `calc(${_width} - 20px)`,
        height: "18px",
      }}
    >
        <div style={{display: "block", fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{fileName}</div>
        {isHovered ? <div onClick={(e)=>{e.stopPropagation(); onCloseClick();}} className="outboxItemCloseBttn" style={{display: "block", width: "10px", height: "19px", marginRight: "8px"}}>✖</div> : null}
    </div>
  )
}