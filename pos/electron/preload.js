const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  platform: process.platform,

  getAppVersion: () => {
    return "1.0.0";
  },
});
