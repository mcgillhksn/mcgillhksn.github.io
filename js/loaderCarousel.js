document.addEventListener("DOMContentLoaded", function() {
    const carouselContainer = document.querySelector("#eventCarousel .carousel-inner");
    const year = "2025-2026";

    fetch(`./assets/data/${year}/carousel.json`)
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
                img.src = item.image;
                img.classList.add("d-block", "w-100", "rounded");
                img.alt = item.alt || "Carousel Image";
                img.loading = "lazy";

                carouselItem.appendChild(img);
                carouselContainer.appendChild(carouselItem);
            });
        })
        .catch(error => console.error("Error loading carousel data:", error));
});
