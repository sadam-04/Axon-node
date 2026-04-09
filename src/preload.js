// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('configAPI', {
    listAddrs: () => ipcRenderer.invoke('listAddrs'),
    getDefaultIP: () => ipcRenderer.invoke('getDefaultIP'),
    setIP: (newIP) => ipcRenderer.invoke('setIP', newIP),
    attemptToggleProtocol: () => ipcRenderer.invoke('attemptToggleProtocol'),
    getProtocol: () => ipcRenderer.invoke('getProtocol'),
    getTLSKeyPath: () => ipcRenderer.invoke('getTLSKeyPath'),
    setTLSKeyPath: (path) => ipcRenderer.invoke('setTLSKeyPath', path),
    getTLSCertPath: () => ipcRenderer.invoke('getTLSCertPath'),
    setTLSCertPath: (path) => ipcRenderer.invoke('setTLSCertPath', path),
    getPort: () => ipcRenderer.invoke('getPort'),
    setPort: (newPort) => ipcRenderer.invoke('setPort', newPort),
    getSaveDir: () => ipcRenderer.invoke('getSaveDir'),
    setSaveDir: (newSaveDir) => ipcRenderer.invoke('setSaveDir', newSaveDir),
    browseForSaveDir: (fallback) => ipcRenderer.invoke('browseForSaveDir', fallback),
});

contextBridge.exposeInMainWorld('inboxAPI', {
    onNewFile: (callback) => ipcRenderer.on('new-uploaded-file', (e, file) => callback(file)),
    
    onSaveFileResult: (callback) => ipcRenderer.on('savePendingFileResult', (e, result) => callback(result)),
    
    open: (id) => ipcRenderer.invoke('openPendingFile', id),
    save: (id) => ipcRenderer.invoke('savePendingFile', id),
    reveal: (id) => ipcRenderer.invoke('revealPendingFile', id),
    discard: (id) => ipcRenderer.invoke('discardPendingFile', id),
});

contextBridge.exposeInMainWorld('outboxAPI', {
    openFile (file) {
        if (file == null) {
            return ipcRenderer.invoke('openFile', null);
        }
        let path = webUtils.getPathForFile(file);
        return ipcRenderer.invoke('openFile', path);
    },
    addText: (text) => ipcRenderer.invoke('addTextToOutbox', text),
    discard: (id) => ipcRenderer.invoke('discardOutboxItem', id),
});