import React, { useEffect, useRef, useState } from 'react';
import ShadedButton from './ShadedButton';

export default function ResponsiveButton({selected, enabled, buttonAction, onHover = null, label, passHoverToLabel = false, customStyle = null, disabledStyle = null, shadeA, shadeB, shadeC}) {
  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);

  let hoverLabel = label;

  if (passHoverToLabel) {
    hoverLabel = React.cloneElement(label, {isHovered: hovered});
  }

  return (
  <div className="ResponsiveButton" onMouseOver={() => {setHovered(true); if (onHover) onHover();}} onMouseOut={() => {setHovered(false); setClicked(false);}} onMouseDown={() => {setClicked(true)}} onMouseUp={() => {setClicked(false);}} onClick={(e)=>{if (enabled) {buttonAction();} e.stopPropagation();}}>
    <ShadedButton selected={selected} hovered={hovered} pressed={clicked} enabled={enabled} icon={hoverLabel} customStyle={customStyle} disabledStyle={disabledStyle} shadeA={shadeA} shadeB={shadeB} shadeC={shadeC} />
  </div>
  );
}