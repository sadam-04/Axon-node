import React from 'react';

export default function ShadedButton({ selected, hovered, pressed, enabled, customStyle = null, disabledStyle = null, icon, shadeA, shadeB, shadeC }) {
  let shadeValue = shadeA;

  if (enabled) {
    if ((selected && hovered && pressed) || (selected && !hovered && !pressed) || (!selected && hovered && !pressed)) {
      shadeValue = shadeC;
    } else if ((selected && hovered && !pressed) || (!selected && hovered && pressed)) {
      shadeValue = shadeB;
    }
  }

  return (
    <div className="button-icon" style={{ ...customStyle, ...(enabled ? { backgroundColor: shadeValue } : disabledStyle) }}>
      {icon}
    </div>
  );
}