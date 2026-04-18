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
    browseForTlsKey: (fallback) => ipcRenderer.invoke('browseForTlsKey', fallback),
    getTLSCertPath: () => ipcRenderer.invoke('getTLSCertPath'),
    setTLSCertPath: (path) => ipcRenderer.invoke('setTLSCertPath', path),
    browseForTlsCert: (fallback) => ipcRenderer.invoke('browseForTlsCert', fallback),

    getPort: () => ipcRenderer.invoke('getPort'),
    setPort: (newPort) => ipcRenderer.invoke('setPort', newPort),

    getSaveDir: () => ipcRenderer.invoke('getSaveDir'),
    setSaveDir: (newSaveDir) => ipcRenderer.invoke('setSaveDir', newSaveDir),
    browseForSaveDir: (fallback) => ipcRenderer.invoke('browseForSaveDir', fallback),

});

contextBridge.exposeInMainWorld('inboxAPI', {
    onNewFile: (callback) => ipcRenderer.on('new-uploaded-file', (e, file) => callback(file)),
    onUpdate: (callback) => ipcRenderer.on('update-inbox', (e, items, ctx) => callback(items, ctx)),
    onSaveFileResult: (callback) => ipcRenderer.on('savePendingFileResult', (e, result) => callback(result)),
    
    open: (id) => ipcRenderer.invoke('openPendingFile', id),
    save: (id) => ipcRenderer.invoke('savePendingFile', id),
    reveal: (id) => ipcRenderer.invoke('revealPendingFile', id),
    discard: (id, ctx) => ipcRenderer.invoke('discardPendingFile', id, ctx),
});

contextBridge.exposeInMainWorld('outboxAPI', {
    openFile (file) {
        if (file == null) {
            return ipcRenderer.invoke('openFile', null);
        }
        let path = webUtils.getPathForFile(file);
        return ipcRenderer.invoke('openFile', path);
    },
    onUpdate: (callback) => ipcRenderer.on('update-outbox', (e, items, ctx) => callback(items, ctx)),
    addText: (text) => ipcRenderer.invoke('addTextToOutbox', text),

    // argument 2 is only needed so it can be passed back to the renderer with the resulting update, for handling selection changes on discard for example
    discard: (id, ctx) => ipcRenderer.invoke('discardOutboxItem', id, ctx),
});