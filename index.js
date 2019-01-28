const { app, BrowserWindow, ipcMain, session } = require("electron");
const path = require("path");

/*
TODO:
- Verificar cual es el script que carga la grafica para permitirlo en el CSP
-  
*/

let win;

let sites = ["chinatimes.com", "google.com", "yahoo.com", "twitter.com"];
let current_site = 0;
console.time("extraer informacion");

function setUrl(site) {
  win.loadURL("https://www.similarweb.com/website/" + site + "#display");
  win.once("ready-to-show", () => {
    console.log("==========================================================");
    console.log("accesando a " + sites[current_site] + "...");
    console.log("==========================================================");
    win.show();
    ipcMain.once("html-dom", (event, arg) => {
      // imprimimos los resultados
      console.log(arg);
      //console.timeEnd('extraer informacion');
      

      /*if(current_site == 1){
        win.show();
      }*/

      if (current_site + 1 >= sites.length) {
        console.timeEnd("extraer informacion");
        app.quit();
      } else {
        setTimeout(() => {
          if (current_site <= sites.length) {
            // seleccionamos la siguiente url
            current_site++;
            setUrl(sites[current_site]);
          }
        }, 2000);
      }
    });
  });
}

// creamos la ventana, pero no la mostramos
function createWindow() {
  win = new BrowserWindow({
    //width: 320,
    //height: 568,
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      images: false,
      disableBlinkFeatures: true,
      defaultFontFamily: true,
      nodeIntegration: false,
      // inyectamos el javascript
      preload: path.join(__dirname, "crawler.js")
    }
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: Object.assign(
        {
          "Content-Security-Policy": ["script-src 'self' *.googleapis.com *.highcharts.com  img-src 'self' data:"]
        },
        details.responseHeaders
      )
    });
  }); 

  // abrimos la primera url
  setUrl(sites[current_site]);

  win.on("closed", () => {
    win = null;
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (win === null) {
    createWindow();
  }
});
