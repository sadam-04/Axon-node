import React from 'react';

export default function ShadedButton({ selected, hovered, pressed, enabled, customStyle = null, styleClass = null, disabledStyle = null, icon, shadeA, shadeB, shadeC }) {
  let shadeValue = shadeA;

  if (enabled) {
    if ((selected && hovered && pressed) || (selected && !hovered && !pressed) || (!selected && hovered && !pressed)) {
      shadeValue = shadeC;
    } else if ((selected && hovered && !pressed) || (!selected && hovered && pressed)) {
      shadeValue = shadeB;
    }
  }

  return (
    <div className={styleClass} style={{...customStyle, ...(enabled ? { backgroundColor: shadeValue } : disabledStyle), display: "flex", alignItems: "center", justifyContent: "center" }}>
      {icon}
    </div>
  );
}