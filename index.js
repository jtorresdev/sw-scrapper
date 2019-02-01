const { app, BrowserWindow, ipcMain, session } = require("electron");
var mysql = require("mysql");
const path = require("path");
var fs = require("fs");

var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "elconquistador",
  multipleStatements: true
});

connection.connect();

var file = "sites/0.json";

var sites = JSON.parse(fs.readFileSync(file, "utf8"));

let win;

let current_site = sites.findIndex(o => !o.checked);
//console.time("extraer informacion");

function setUrl(site) {
  win.loadURL("https://www.similarweb.com/website/" + site + "#display");
  win.once("ready-to-show", () => {
    console.log("==========================================================");
    console.log("accesando a " + sites[current_site].domain + "...");
    console.log("==========================================================");

    // win.show();
    //win.webContents.openDevTools();
    ipcMain.once("html-dom", (event, data) => {
      let sql;

      if (data.subcategory) {
        sql =
          'SELECT id FROM categories WHERE name = "' +
          data.category +
          '";SELECT id FROM sub_categories WHERE name = "' +
          data.subcategory +
          '"';
      } else {
        sql = 'SELECT id FROM categories WHERE name = "' + data.category + '"';
      }

      connection.query(sql, function(error, results, fields) {
        if (error) console.log(error);

        let site = {
          domain: sites[current_site].domain,
          adsense: data.adsense,
          country_code: data.country_code,
          country_name: data.country_name,
          country_rank: data.country_rank,
          global_rank: data.global_rank,
          page_views: data.page_views,
          total_visits: data.total_visits,
          category: results.length == 0 ? null : results.length == 1 ? results[0].id : results[0][0].id,
          sub_category: results[1] ? results[1][0].id : null
        };

        connection.query(`INSERT INTO sites  SET ?`, site, function(err, res, fie){
          if (err) throw err;

          const id = res.insertId;

          for(const key in data.countries){
            let country = {
              id_site: id,
              name: data.countries[key].name,
              code: data.countries[key].code,
              visits_perc: data.countries[key].visits_perc
            }

            connection.query('INSERT INTO top_countries SET ?', country, function(err, res, fie){
              if (err) throw err;
      
            })
          }


          for(const key in data.traffic_sources){
            let traffic_source = {
              id_site: id,
              name: data.traffic_sources[key].traffic_sources_name,
              visits_perc: data.traffic_sources[key].traffic_sources_perc
            }

            connection.query('INSERT INTO traffic_sources SET ?', traffic_source, function(err, res, fie){
              if (err) throw err;
        
            })
          }


        })

      });


      // actualizamos el json con el check para no repetir este dominio
      sites[current_site].checked = true;
      fs.writeFileSync(file, JSON.stringify(sites));

      // seleccionamos el siguiente sitio o detemos la ejecucion si no hay mas

      if (current_site + 1 >= sites.length) {
        //console.timeEnd("extraer informacion");
        app.quit();
      } else {
        setTimeout(() => {
          if (current_site <= sites.length) {
            // seleccionamos la siguiente url
            current_site++;
            setUrl(sites[current_site].domain);
          }
        }, 3000);
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
          "Content-Security-Policy": [
            "script-src 'self' ajax.googleapis.com; style-src 'self'; img-src 'none' ; font-src 'none' ; connect-src 'self' ; media-src 'none' ; object-src 'none' ; child-src 'none' ; frame-src 'none' ;"
          ]
        },
        details.responseHeaders
      )
    });
  });

  // abrimos la primera url
  setUrl(sites[current_site].domain);

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
