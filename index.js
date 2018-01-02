const electron = require('electron');

const devMode = false;

const app = electron.app;
app.setName('Flower Dashboard');

// Adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

// Prevent window being garbage collected
let mainWindow;

function onClosed() {
    // Dereference the window
    // For multiple windows store them in an array
    mainWindow = null;
}

function createMainWindow() {
    browserOptions = {
        width: 1280,
        height: 720,
        icon: __dirname + '/icon.png'
    };
    if (!devMode) {
        browserOptions.webPreferences = {
            devTools: false
        };
    }

    const win = new electron.BrowserWindow(browserOptions);
    if (!devMode) {
        win.setMenu(null);
    }

    win.loadURL(`file://${__dirname}/index.html`);
    win.on('closed', onClosed);

    return win;
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (!mainWindow) {
        mainWindow = createMainWindow();
    }
});

app.on('ready', () => {
    mainWindow = createMainWindow();
});
