document.addEventListener("fragmentsLoaded", () => {
  // Scroll animations
  requestAnimationFrame(() => {
    const observerSlideY = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("showSlideY");
          observerSlideY.unobserve(entry.target);
        }
      });
    });

    const observerBlur = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("showBlur");
          observerBlur.unobserve(entry.target);
        }
      });
    });

    const observerFlashMitigation = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("flashMitigationEnd");
          observerFlashMitigation.unobserve(entry.target);
        }
      });
    });

    document.querySelectorAll(".hiddenSlideY").forEach(el => observerSlideY.observe(el));
    document.querySelectorAll(".hiddenBlur").forEach(el => observerBlur.observe(el));
    document.querySelectorAll(".flashMitigationStart").forEach(el => observerBlur.observe(el));
  });
});
