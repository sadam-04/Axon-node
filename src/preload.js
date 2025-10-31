// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

// contextBridge.exposeInMainWorld('versions', {
//     node: () => process.versions.node,
//     chrome: () => process.versions.chrome,
//     electron: () => process.versions.electron,
// })

contextBridge.exposeInMainWorld('electronAPI', {
    setTitle: (title) => ipcRenderer.send('set-title', title),
    ping: () => ipcRenderer.invoke('ping'),
    openFile: () => ipcRenderer.invoke('openFile'),
    setServing: (shouldServe, id) => ipcRenderer.invoke('setServing', shouldServe, id),
    getDefaultIP: () => ipcRenderer.invoke('getDefaultIP'),
    listAddrs: () => ipcRenderer.invoke('listAddrs'),
});

contextBridge.exposeInMainWorld('recvFileAPI', {
    onNewFile: (callback) => ipcRenderer.on('new-uploaded-file', (e, file) => callback(file)),
    onSaveFileResult: (callback) => ipcRenderer.on('save-file-result', (e, result) => callback(result)),
    
    savePendingFile: (id) => ipcRenderer.invoke('savePendingFile', id),
    revealFile: (id) => ipcRenderer.invoke('revealFile', id),
});