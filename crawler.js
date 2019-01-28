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
  let visits_string = $(
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

  const total_page_views = visits * page_views_prom;

  let countries = [];
  let traffic_sources = [];

  countries_arr = $(".traffic-share-valueNumber.js-countValue");

  for (let i = 0; i < countries_arr.length; i++) {
    let pages_views =
      ($(countries_arr[i])
        .text()
        .replace("%", "") /
        100) *
      total_page_views;
    country_name = $($(".country-name")[i]).text();
    countries.push({ pages_views, country_name });
  }

  const global_rank = $(
    $(".websiteRanks-valueContainer.js-websiteRanksValue")[0]
  )
    .text()
    .replace(/(\r\n\t|\n|\r\t)/gm, "")
    .replace(/ /g, "");
  const country_rank = $(
    $(".websiteRanks-valueContainer.js-websiteRanksValue")[1]
  )
    .text()
    .replace(/(\r\n\t|\n|\r\t)/gm, "")
    .replace(/ /g, "");

  let category;
  let subcategory;

  if (
    $($(".websiteRanks-nameText")[2])
      .text()
      .indexOf(">") >= 0
  ) {
    let categories = $($(".websiteRanks-nameText")[2])
      .text()
      .split(">");

    category = categories[0];
    subcategory = categories[1].replace(/ /g, "");
  } else {
    category = $($(".websiteRanks-nameText")[2]).text();
    subcategory = null;
  }

  let traffic_sources_arr = $(".trafficSourcesChart-title");
  for (let i = 0; i < 4; i++) {
    traffic_sources_name = $(traffic_sources_arr[i])
      .text()
      .replace(/(\r\n\t|\n|\r\t)/gm, "")
      .replace(/ /g, "");
    traffic_sources_perc = $($(".trafficSourcesChart-value")[i]).text();
    traffic_sources.push({ traffic_sources_name, traffic_sources_perc });
  }

  let adsense_ok = false;

  if ($('h2:contains("NO DISPLAY ADVERTISING")').length >= 1) {
    ipcRenderer.send("html-dom", {
      total_page_views,
      countries,
      global_rank,
      country_rank,
      category,
      subcategory,
      traffic_sources,
      adsense_ok
    });
  } else {
    waitForEl('.highcharts-container', function() {
      if ($('span:contains("Google Display Network")').length >= 1) {
        adsense_ok = true;
      }else{
        adsense_ok = false;
      }
      ipcRenderer.send("html-dom", {
        total_page_views,
        countries,
        global_rank,
        country_rank,
        category,
        subcategory,
        traffic_sources,
        adsense_ok
      });
    });
  }

  /*
    
    {
      total_page_views,
      countries,
      global_rank,
      country_rank,
      category,
      subcategory,
      traffic_sources,
      adsense_ok
    }
    */
});
