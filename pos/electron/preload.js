const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  platform: process.platform,

  getAppVersion: () => {
    return "1.0.0";
  },

  printReceipt: ({ html, target }) => {
    return ipcRenderer.invoke("print-receipt", { html, target });
  },
  closeApp: () => ipcRenderer.send("app-close"),
});
