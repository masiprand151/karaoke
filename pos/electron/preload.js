const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  platform: process.platform,

  getAppVersion: () => {
    return "1.0.0";
  },

  printCashier: (html) => {
    return ipcRenderer.invoke("print-cashier", html);
  },
});
