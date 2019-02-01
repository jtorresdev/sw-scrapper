const { ipcRenderer } = require("electron");

Array.from(document.getElementsByTagName("script")).map(function(e) {
  e.innerHTML = "";
});

var waitForEl = function(selector, callback) {
  if (jQuery(selector).length) {
    callback();
  } else {
    setTimeout(function() {
      waitForEl(selector, callback);
    }, 100);
  }
};

function subStrAfterChars(str, char, pos) {
  if (pos == "b") return str.substring(str.indexOf(char) + 1);
  else if (pos == "a") return str.substring(0, str.indexOf(char));
  else return str;
}

window.addEventListener("DOMContentLoaded", () => {
  /* Obtenemos JSON con informacion */
  var script_code = $('script:contains("Sw.preloadedData")').html();
  var start = script_code.indexOf("Sw.preloadedData");
  var end = script_code.indexOf("Sw.period");

  var data = JSON.parse(
    script_code.slice(start + "Sw.preloadedData =".length, end).replace(";", "")
  );

  /* Obtenemos visitas para calcular paginas vistas */

  /*let visits_string = $(
    $(".engagementInfo-valueNumber.js-countValue")[0]
  ).text();
  const page_views_prom = $(
    $(".engagementInfo-valueNumber.js-countValue")[2]
  ).text();

  let visits;

  if (visits_string.indexOf("M") >= 0) {
    visits_string = visits_string.replace("M", ""); // returns 55.20
    const dot_pos = visits_string.indexOf(".");
    if (dot_pos >= 0) {
      const after_dot = subStrAfterChars(visits_string, ".", "b").length;
      if (after_dot == 1) {
        visits = visits_string.replace(".", "") + "00000";
      } else if (after_dot == 2) {
        visits = visits_string.replace(".", "") + "0000";
      } else {
        visits = visits_string.replace(".", "") + "000";
      }
    } else {
      visits_string = visits_string + "000000";
    }
  } else if (visits_string.indexOf("K") >= 0) {
    // para cifras de mil
  } else if (visits_string.indexOf("B") >= 0) {
    visits_string = visits_string.replace("B", ""); // returns 3.95
    const dot_pos = visits_string.indexOf(".");
    if (dot_pos >= 0) {
      const after_dot = subStrAfterChars(visits_string, ".", "b").length;
      if (after_dot == 1) {
        visits = visits_string.replace(".", "") + "00000000";
      } else if (after_dot == 2) {
        visits = visits_string.replace(".", "") + "0000000";
      } else {
        visits = visits_string.replace(".", "") + "000000";
      }
    } else {
      visits_string = visits_string + "000000000";
    }
  }

  const total_pages_views = visits * page_views_prom;*/

  let total_visits = data.overview.EngagementsSimilarweb.TotalLastMonthVisits;
  let page_views = data.overview.EngagementsSimilarweb.PageViews.toFixed(2);

  /* Ranking paises */

  let countries = [];

  countries_arr = data.overview.TopCountryShares;

  for (let i = 0; i < countries_arr.length; i++) {
    let visits_perc = (countries_arr[i][1] * 100).toFixed(2);
    let name = $($(".country-name")[i]).text();
    let code = countries_arr[i][0];
    countries.push({ visits_perc, name, code });
  }

  /* Ranking global */

  const global_rank = data.overview.GlobalRank[0];

  const country_rank = data.overview.CountryRanks[data.overview.Country][0];

  const country_name = $(
    ".websiteRanks-item.js-countryRank > .websiteRanks-header > .websiteRanks-name > a.websiteRanks-nameText"
  ).text();

  const country_code = data.overview.Country;

  /* Categoria y subcategoria */

  let category;
  let subcategory;

  if (data.overview.Category.indexOf("/") >= 0) {
    let categories = data.overview.Category.split("/");

    category = categories[0].replace(/_/g, " ");
    subcategory = categories[1].replace(/_/g, " ");
  } else {
    category = data.overview.Category.replace(/_/g, " ");
    subcategory = null;
  }

  /* Fuentes de trafico */

  let traffic_sources = [];

  const traffic_sources_obj = data.overview.TrafficSources;

  for (const source in traffic_sources_obj) {
    traffic_sources_name = source;
    traffic_sources_perc = (traffic_sources_obj[source] * 100).toFixed(2);
    traffic_sources.push({ traffic_sources_name, traffic_sources_perc });
  }

  const date = data.overview.Date;

  /* Verificamos si tiene adsense */

  let adsense = false;

  if ($("script:contains('Google Display Network')").length >= 1) {
    adsense = true;
  }

  ipcRenderer.send("html-dom", {
    date,
    total_visits,
    page_views,
    countries,
    global_rank,
    country_rank,
    country_name,
    country_code,
    category,
    subcategory,
    traffic_sources,
    adsense
  });
});
