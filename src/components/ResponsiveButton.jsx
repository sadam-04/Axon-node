import React, { useState } from 'react';
import ShadedButton from './ShadedButton';

export default function ResponsiveButton({selected, enabled, buttonAction, onHover = null, label, customStyle = null, disabledStyle = null, shadeA, shadeB, shadeC}) {
  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
  <div className="ResponsiveButton" onMouseEnter={() => {setHovered(true); if (onHover) onHover();}} onMouseLeave={() => {setHovered(false); setClicked(false);}} onMouseDown={() => {setClicked(true)}} onMouseUp={() => {if (enabled) {buttonAction();} setClicked(false);}}>
    <ShadedButton selected={selected} hovered={hovered} pressed={clicked} enabled={enabled} icon={label} customStyle={customStyle} disabledStyle={disabledStyle} shadeA={shadeA} shadeB={shadeB} shadeC={shadeC} />
  </div>
  );
}