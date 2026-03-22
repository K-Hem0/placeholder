const { app, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')

const distPath = path.join(__dirname, '../dist/index.html')
const forceDev = process.argv.includes('--dev')
const isDev =
  forceDev || (!app.isPackaged && !fs.existsSync(distPath))

if (isDev) {
  app.commandLine.appendSwitch('disable-http-cache')
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 640,
    minHeight: 480,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Daftar',
    show: false,
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  if (isDev) {
    const url = 'http://localhost:5932'
    mainWindow.loadURL(url)
    mainWindow.webContents.on('did-fail-load', () => {
      setTimeout(() => mainWindow.loadURL('http://localhost:5932'), 500)
    })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
