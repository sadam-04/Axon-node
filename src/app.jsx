import * as React from 'react';
import { createRoot } from 'react-dom/client';

const root = createRoot(document.body);
// root.render(<h2>Hello from React!</h2>);

function handleClick() {
    window.electronAPI.openFile().then((filePath) => {
        const filePathElement = document.getElementById('filePath');
        filePathElement.innerText = filePath;
    });
}

root.render(
    <div><button onClick={handleClick}>Open a File</button>
    <p>Serving: <strong id="filePath">none</strong></p></div>
)