import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { paths } from './lib/paths'
import { allocatePorts } from './lib/ports'
import { startServers, stopServers } from './lib/servers'
import { runFirstLaunchSetup } from './lib/setup'
import { createSleepBlocker } from './lib/sleepBlocker'

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

const isDev = paths.isDev
let mainWindow: BrowserWindow | null = null
const sleepBlocker = createSleepBlocker()

const createWindow = (): BrowserWindow => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    webPreferences: {
      preload: isDev
        ? path.join(__dirname, 'preload.js')
        : path.join(app.getAppPath(), 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.once('ready-to-show', () => win.show())

  return win
}

const startDev = async (): Promise<void> => {
  mainWindow = createWindow()
  // In dev mode, just load the existing dev server
  await mainWindow.loadURL('http://localhost:3000')
}

const startProduction = async (): Promise<void> => {
  mainWindow = createWindow()

  // Show loading screen
  const loadingPath = paths.loadingHtml
  await mainWindow.loadFile(loadingPath)

  const sendStatus = (message: string): void => {
    mainWindow?.webContents.executeJavaScript(
      `window.postMessage(${JSON.stringify({ type: 'status', message })}, '*')`,
    )
  }

  const sendError = (message: string, detail?: string): void => {
    mainWindow?.webContents.executeJavaScript(
      `window.postMessage(${JSON.stringify({ type: 'error', message, detail })}, '*')`,
    )
  }

  // IPC for retry/quit from loading screen
  ipcMain.on('retry', () => launchServers())
  ipcMain.on('quit', () => app.quit())

  const launchServers = async (): Promise<void> => {
    try {
      sendStatus('Preparing data directories...')
      runFirstLaunchSetup()

      sendStatus('Allocating ports...')
      const ports = await allocatePorts()

      sendStatus('Warming up the narrator...')
      const result = await startServers(ports)

      if (result.ok) {
        console.log(`[main] App ready at ${result.appUrl}`)
        await mainWindow?.loadURL(result.appUrl)
        // Open DevTools in development to debug rendering issues
        if (isDev || process.env.INKVOICE_DEBUG) {
          mainWindow?.webContents.openDevTools()
        }
        // Log any renderer console errors
        mainWindow?.webContents.on('console-message', (_e, level, message) => {
          if (level >= 2) console.log(`[renderer] ${message}`)
        })
      } else {
        sendError('Could not start InkVoice', result.error)
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      sendError('Unexpected error during startup', message)
    }
  }

  // Handle app quit — clean up servers
  app.on('before-quit', () => {
    stopServers()
  })

  await launchServers()
}

app.whenReady().then(async () => {
  ipcMain.on('sleep-block-start', () => sleepBlocker.start())
  ipcMain.on('sleep-block-stop', () => sleepBlocker.stop())

  if (isDev) {
    await startDev()
  } else {
    await startProduction()
  }

  app.on('activate', () => {
    // macOS: re-create window when dock icon clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      if (isDev) {
        startDev()
      }
      // In production, window re-creation requires server state — skip for now
    }
  })
})

// macOS: quit only when Cmd+Q, not on window close
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})
