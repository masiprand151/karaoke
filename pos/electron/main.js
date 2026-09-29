const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1366,
    height: 768,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("print-receipt", async (event, { html, target = "cashier" }) => {
  const printWindow = new BrowserWindow({
    show: false,

    webPreferences: {
      sandbox: true,
    },
  });

  try {
    await printWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
    );

    await new Promise((resolve) => {
      setTimeout(resolve, 300);
    });

    const printers = await printWindow.webContents.getPrintersAsync();

    // =========================================
    // CARI PRINTER CASHIER / THERMAL
    // =========================================

    let printer = printers.find((item) =>
      item.name.toLowerCase().includes(target),
    );
    let silent = true;

    // =========================================
    // FALLBACK UNTUK TESTING
    // =========================================

    if (!printer) {
      silent = false;
      printer = printers.find((item) => item.name === "Microsoft Print to PDF");
    }

    // =========================================
    // TIDAK ADA PRINTER
    // =========================================

    if (!printer) {
      silent = false;
      throw new Error("Printer tidak ditemukan");
    }

    // =========================================
    // PRINT
    // =========================================

    await new Promise((resolve, reject) => {
      printWindow.webContents.print(
        {
          silent,
          printBackground: true,

          deviceName: printer.name,

          margins: {
            marginType: "none",
          },

          pageSize: {
            width: 80000,
            height: 200000,
          },
        },

        (success, failureReason) => {
          if (!success) {
            reject(new Error(failureReason || "Gagal mencetak receipt"));

            return;
          }

          resolve();
        },
      );
    });

    return {
      success: true,
      printer: printer.name,
    };
  } finally {
    if (!printWindow.isDestroyed()) {
      printWindow.close();
    }
  }
});
