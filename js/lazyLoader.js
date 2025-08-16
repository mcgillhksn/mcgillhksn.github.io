document.addEventListener("fragmentsLoaded", () => {
  // Lazy loading for images
  document.querySelectorAll("img").forEach(img => {
    if (!img.getAttribute("loading")) img.setAttribute("loading", "lazy");
  });

  // Set preload="none" for videos to enable lazy loading behavior
  document.querySelectorAll("video").forEach(video => {
    video.setAttribute("preload", "none");
  });
});
