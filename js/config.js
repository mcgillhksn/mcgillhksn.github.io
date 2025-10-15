const siteConfig = {
  homePageContentYear: "2024-2025",
  eventsContentYear: "2024-2025",
  allYears: ["2024-2025", "2023-2024", "2022-2023", "2021-2022", "2020-2021", "2019-2020", "2018-2019", "2017-2018", "2016-2017", "2015-2016", "2014-2015", "2013-2014"],

  // Helper to determine asset paths based on page location
  getBasePath: function() {
    const currentPath = window.location.pathname;
    const isInSubdirectory = currentPath.includes('/events') || currentPath.includes('/about') || currentPath.includes('/store');
    return isInSubdirectory ? '../' : './';
  }
};
