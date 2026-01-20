document.addEventListener("fragmentsLoaded", () => {
  // Lazy loading for images (skip images that already have loading attribute set, e.g., "eager")
  document.querySelectorAll("img").forEach(img => {
    if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
  });

  // Set preload="none" for videos to enable lazy loading behavior
  document.querySelectorAll("video").forEach(video => {
    video.setAttribute("preload", "none");
  });
});
