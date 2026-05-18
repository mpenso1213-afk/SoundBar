import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipc/handlers'
import { sonosManager } from './sonos/manager'
import { nowPlayingPoller } from './apple-music/now-playing'
import { audioPipeline } from './audio/pipeline'

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'sidebar',
    visualEffectState: 'active',
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

app.whenReady().then(async () => {
  const win = createWindow()

  registerIpcHandlers()
  sonosManager.init(win)
  nowPlayingPoller.init(win)
  audioPipeline.init(win)

  // Start Sonos discovery and Apple Music polling after window is ready
  win.webContents.on('did-finish-load', () => {
    sonosManager.discover()
    nowPlayingPoller.start()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', async () => {
  await audioPipeline.stop()
  sonosManager.destroy()
  nowPlayingPoller.stop()
  if (process.platform !== 'darwin') app.quit()
})
