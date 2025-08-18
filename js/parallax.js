const images = document.querySelectorAll('.images img');
let ticking = false;

window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            images[0].style.transform = `translateY(-${scrollY / 3}px)`;
            images[1].style.transform = `translateY(-${scrollY / 5}px)`;
            images[2].style.transform = `translateY(-${scrollY / 7}px)`;
            images[3].style.transform = `translateY(-${scrollY / 9}px)`;
            images[4].style.transform = `translateY(-${scrollY / 11}px)`;
            images[5].style.transform = `translateY(-${scrollY / 13}px)`;
            images[6].style.transform = `translateY(-${scrollY / 15}px)`;
            ticking = false;
        });
        ticking = true;
    }
});

//observer so text pops up when scrolled down to the text

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting){
            entry.target.classList.add("description-animation")
        }
    })
})

observer.observe(document.querySelector(".description"))
