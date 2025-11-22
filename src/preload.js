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
    attemptToggleProtocol: () => ipcRenderer.invoke('attemptToggleProtocol'),
    getProtocol: () => ipcRenderer.invoke('getProtocol'),
    getTLSKeyPath: () => ipcRenderer.invoke('getTLSKeyPath'),
    setTLSKeyPath: (path) => ipcRenderer.invoke('setTLSKeyPath', path),
    getTLSCertPath: () => ipcRenderer.invoke('getTLSCertPath'),
    setTLSCertPath: (path) => ipcRenderer.invoke('setTLSCertPath', path),
    getPort: () => ipcRenderer.invoke('getPort'),
    setPort: (newPort) => ipcRenderer.invoke('setPort', newPort),
});

contextBridge.exposeInMainWorld('recvFileAPI', {
    onNewFile: (callback) => ipcRenderer.on('new-uploaded-file', (e, file) => callback(file)),

    onSaveFileResult: (callback) => ipcRenderer.on('savePendingFileResult', (e, result) => callback(result)),
    
    saveFile: (id) => ipcRenderer.invoke('savePendingFile', id),
    revealFile: (id) => ipcRenderer.invoke('revealPendingFile', id),
    discardFile: (id) => ipcRenderer.invoke('discardPendingFile', id),
});