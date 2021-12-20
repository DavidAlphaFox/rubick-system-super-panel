const superPanel = require("./panel-window");
const os = require("os");

const isMacOS = os.type() === "Darwin";

function getSelectedContent(clipboard) {
  const robot = os.type() === "Darwin" ? require("./robot/darwin/robotjs") : {};

  return new Promise((resolve) => {
    const lastText = clipboard.readText('clipboard');
    // todo 缓存文件
    clipboard.clear();

    // 复制选中文案
    if (isMacOS) {
      robot.keyTap('c', 'command');
    } else {
      robot.keyTap('c', 'control');
    }

    setTimeout(() => {
      // 延时一定时间才能从剪切板内读取到内容
      const text = clipboard.readText('clipboard') || ''
      const fileUrl = clipboard.read('public.file-url');
      // if (this.isWin) {
      //   // todo https://github.com/njzydark/Aragorn/blob/afe4a60972b4255dd417480ca6aca2af1fd8e637/packages/aragorn-app-main/src/uploaderManager.ts#L88
      // }
      // 如果之前是文案，则回填
      clipboard.writeText(lastText);

      resolve({
        text,
        fileUrl
      })
    }, 300);
  })
}

const getMouse = () => {
  if (isMacOS) return os.type() === "Darwin" ? require('./robot/darwin/osx-mouse')() : () => {};
}

module.exports = () => {
  return {
    async onReady(ctx) {
      const {clipboard} = ctx;
      // 初始化超级面板 window
      const panelInstance = superPanel(ctx);
      panelInstance.init();

      // 生成鼠标监听事件
      const mouse = getMouse();
      let isPress = false;
      mouse.on("right-down", (x, y) => {
        isPress = true;
        // 3000 ms 后触发超级面板
        setTimeout(async () => {
          if (isPress) {
            const copyResult = await getSelectedContent(clipboard);
            let win = panelInstance.getWindow();

            const localPlugins = global.LOCAL_PLUGINS.getLocalPlugins();

            win.webContents.send('trigger-super-panel', {
              ...copyResult,
              optionPlugin: localPlugins,
            });
            win.setPosition(parseInt(x), parseInt(y));
            win.setAlwaysOnTop(true);
            win.setVisibleOnAllWorkspaces(true, {visibleOnFullScreen: true});
            win.focus();
            win.setVisibleOnAllWorkspaces(false, {visibleOnFullScreen: true});
            win.show();
          }
        }, 300);
      });
      mouse.on("right-up", (e) => {
        isPress = false;
      });
    },
  }
}
