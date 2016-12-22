const {app, Menu, dialog, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')
const settings = require('electron-settings');

settings.defaults({
  logs: []
});

const Tail = require('tail').Tail;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({width: 1500, height: 900, x: 20, y: 30});

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  // win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })

  settings.get('logs').then(logs => {
    if (Array.isArray(logs)) {
      logs.forEach(launchTail);
    }
  });
}

const addLog = (path) => {
  settings.get('logs').then(logs => {
    if (logs.indexOf(path) === -1) {
      logs.push(path);
      settings.set('logs', logs);
      launchTail(path);
    }
  });
}

const addLine = (line) => {
  win.webContents.send('line', line);
}

function launchTail(file) {
  const tail = new Tail(file);
  tail.on('line', addLine);
  tail.on('error', console.log);
}

function handleClearClick() {
  win.webContents.send('clear');
}

function handleFadeClick() {
  win.webContents.send('fade');
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        // {label: 'New File', accelerator: 'CmdOrCtrl+N'},
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            dialog.showOpenDialog({properties: ['multiSelections', 'openFile', 'showHiddenFiles']}, (fileNames) => {
              if (fileNames === undefined) {
                return;
              }

              fileNames.forEach(addLog);
            });
          }
        },
        {type: 'separator'},
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {role: 'cut'},
        {role: 'copy'},
        {role: 'delete'},
        {role: 'selectall'}
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Fade',
          accelerator: 'CmdOrCtrl+L',
          click: handleFadeClick
        },
        {
          label: 'Clear log',
          accelerator: 'CmdOrCtrl+K',
          click: handleClearClick
        },
        {type: 'separator'},
        {role: 'togglefullscreen'}
      ]
    },
    {
      role: 'window',
      submenu: [
        {role: 'minimize'},
        {role: 'close'}
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click() {
            // TODO: Link to fiddlings documentation site
            require('electron').shell.openExternal('https://github.com/priithaamer/Tail');
          }
        }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    const name = app.getName();

    template.unshift({
      label: name,
      submenu: [
        {role: 'about'},
        {type: 'separator'},
        {role: 'services', submenu: []},
        {type: 'separator'},
        {role: 'hide'},
        {role: 'hideothers'},
        {role: 'unhide'},
        {type: 'separator'},
        {role: 'quit'}
      ]
    });
    // Window menu.
    template[4].submenu = [
      {label: 'Close', accelerator: 'CmdOrCtrl+W', role: 'close'},
      {label: 'Minimize', accelerator: 'CmdOrCtrl+M', role: 'minimize'},
      {label: 'Zoom', role: 'zoom'},
      {type: 'separator'},
      {label: 'Bring All to Front', role: 'front'}
    ];
  }

  if (process.env.NODE_ENV === 'development') {
    template[3].submenu.push(
      {type: 'separator'},
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: () => {
          win.reload();
        }
      },
      {
        label: 'Toggle Developer Tools',
        accelerator: 'Command+Option+C',
        click: () => {
          win.webContents.toggleDevTools();
        }
      },
      {role: 'resetzoom'},
      {role: 'zoomin'},
      {role: 'zoomout'}
    );
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('open-file', (event, path) => {
  event.preventDefault();
  addLog(path);
});
app.on('ready', createWindow);
app.on('ready', createMenu);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
