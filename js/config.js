const siteConfig = {
  contentYear: "2024-2025", // The home page and the events uses this
  allYears: ["2024-2025", "2023-2024", "2019-2020"],

  // Helper to determine asset paths based on page location
  getBasePath: function() {
    const currentPath = window.location.pathname;
    const isInSubdirectory = currentPath.includes('/events') || currentPath.includes('/about') || currentPath.includes('/store');
    return isInSubdirectory ? '../' : './';
  }
};
