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

    // const observerBlur = new IntersectionObserver(entries => {
    //   entries.forEach(entry => {
    //     if (entry.isIntersecting) {
    //       entry.target.classList.add("showBlur");
          
    //       if (entry.target.classList.contains("staggerProject")) {
    //         const childIndex = Array.from(entry.target.parentNode.children).indexOf(entry.target);
    //         const delays = [0, 200, 400, 600];
    //         const animationDuration = 1000;
    //         const totalTime = delays[childIndex] + animationDuration;
            
    //         setTimeout(() => {
    //           entry.target.classList.remove("staggerProject");
    //           entry.target.classList.add("hoverable");
    //         }, totalTime);
    //       }
          
    //       observerBlur.unobserve(entry.target);
    //     }
    //   });
    // });

    document.querySelectorAll(".hiddenSlideY").forEach(el => observerSlideY.observe(el));
    // document.querySelectorAll(".hiddenBlur").forEach(el => observerBlur.observe(el));
  });
});
