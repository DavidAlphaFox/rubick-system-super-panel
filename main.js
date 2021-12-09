const superPanel = require("./panel-window");
const os = require("os");
const http = require('http');

// const rubickBase = newRubickBase();

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
      const {ipcMain, clipboard, ipcRenderer} = ctx;
      const panelInstance = superPanel(ctx);
      panelInstance.init();
      const mouse = getMouse();
      let down_time = 0;
      let isPress = false;
      mouse.on("right-down", (x, y) => {
        isPress = true;
        down_time = Date.now();
        setTimeout(async () => {
          if (isPress) {
            const copyResult = await getSelectedContent(clipboard);
            let win = panelInstance.getWindow();

            const localPlugins = global.LOCAL_PLUGINS.getLocalPlugins();

            win.webContents.send('trigger-super-panel', {
              ...copyResult,
              optionPlugin: localPlugins,
            });
            // translate(copyResult.text, win.webContents);
            win.setPosition(parseInt(x), parseInt(y));
            win.setAlwaysOnTop(true);
            win.setVisibleOnAllWorkspaces(true, {visibleOnFullScreen: true});
            win.focus();
            win.setVisibleOnAllWorkspaces(false, {visibleOnFullScreen: true});
            win.show();

            // todo 翻译文案
          }
        }, 300);
      });
      mouse.on("right-up", (e) => {
        isPress = false;
      });
    },
  }
}

// function translate (msg, webContents) {
//   const params = encodeURI(
//     `q=${msg}&keyfrom=neverland&key=969918857&type=data&doctype=json&version=1.1`
//   );
//   return http.get(`http://fanyi.youdao.com/openapi.do?${params}`, (res) => {
//     let data = '';
//
//     // called when a data chunk is received.
//     res.on('data', (chunk) => {
//       data += chunk;
//     });
//
//     // called when the complete response is received.
//     res.on('end', () => {
//       webContents.executeJavaScript(`window.setTranslateData(${JSON.stringify({
//         ...JSON.parse(data),
//         src: msg,
//       })})`);
//     });
//   }).on("error", (err) => {
//     console.log(err);
//     webContents.executeJavaScript(`window.setTranslateData()`);
//     // this.$set(this.selectData, 'translate', null);
//   })
// }
