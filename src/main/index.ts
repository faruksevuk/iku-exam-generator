import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { createMenu } from './menu'
import { registerIpcHandlers } from './ipc'

// Force consistent app name so userData path is always the same
app.setName('iku-exam-generator')

const isDev = !app.isPackaged

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 850,
    minWidth: 900,
    minHeight: 700,
    title: 'Untitled - IKU Exam Generator',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    show: false
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('close', (e) => {
    e.preventDefault()
    mainWindow?.webContents.send('menu:action', 'check-before-close')
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  createMenu(mainWindow)
  registerIpcHandlers(mainWindow)
}

app.whenReady().then(() => {
  createWindow()
})

app.on('window-all-closed', () => {
  app.quit()
})

ipcMain.on('app:force-close', () => {
  if (mainWindow) {
    mainWindow.removeAllListeners('close')
    mainWindow.close()
  }
})
