import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('inkvoice', {
  platform: process.platform,
  retry: () => ipcRenderer.send('retry'),
  quit: () => ipcRenderer.send('quit'),
})
