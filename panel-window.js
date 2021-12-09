module.exports = (ctx) => {
  const { BrowserWindow, ipcMain, mainWindow } = ctx;

  let win;

  let init = () => {
    if (win === null || win === undefined) {
      createWindow();
      ipcMain.on("superPanel-hidden", () => {
        win.hide();
      });
      ipcMain.on("superPanel-setSize", (e, height) => {
        win.setSize(250, height);
      });
      ipcMain.on("superPanel-openPlugin", (e, args) => {
        mainWindow.webContents.send("superPanel-openPlugin", args);
      });
    }
  };

  let createWindow = () => {
    win = new BrowserWindow({
      frame: false,
      autoHideMenuBar: true,
      width: 250,
      height: 50,
      show: false,
      alwaysOnTop: true,
      webPreferences: {
        contextIsolation: false,
        webviewTag: true,
        webSecurity: false,
        enableRemoteModule: true,
        backgroundThrottling: false,
        nodeIntegration: true,
      },
    });
    win.loadURL(`file://${__dirname}/superPannel/main.html`);
    win.on("closed", () => {
      win = undefined;
    });
    // 打包后，失焦隐藏
    win.on("blur", () => {
      win.hide();
    });
  };

  let getWindow = () => win;

  return {
    init,
    getWindow,
  };
};
