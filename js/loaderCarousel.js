document.addEventListener("DOMContentLoaded", function() {
    const carouselContainer = document.querySelector("#eventCarousel .carousel-inner");
    const year = "2025-2026";
    
    // Determine if we're in a subdirectory or root
    const currentPath = window.location.pathname;
    const isInSubdirectory = currentPath.includes('/events') || currentPath.includes('/about') || currentPath.includes('/store');
    const basePath = isInSubdirectory ? '../' : './';

    fetch(`${basePath}assets/data/${year}/carousel.json`)
        .then(response => response.json())
        .then(data => {
            carouselContainer.innerHTML = ""; // Clear existing items
            data.forEach((item, index) => {
                const carouselItem = document.createElement("div");
                carouselItem.classList.add("carousel-item");
                if (index === 0) {
                    carouselItem.classList.add("active");
                }

                const img = document.createElement("img");
                // Update image path to use dynamic base path
                const imagePath = item.image.replace('./', basePath);
                img.src = imagePath;
                img.classList.add("d-block", "w-100", "rounded");
                img.alt = item.alt || "Carousel Image";
                img.loading = "lazy";

                carouselItem.appendChild(img);
                carouselContainer.appendChild(carouselItem);
            });
        })
        .catch(error => console.error("Error loading carousel data:", error));
});
