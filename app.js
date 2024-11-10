const images = document.querySelectorAll('.images img');

window.addEventListener('scroll', () => {
    images[0].style.top = "-" + (window.scrollY / 2.5) + "px";
    images[1].style.top = "-" + (window.scrollY / 3.5) + "px";
    images[2].style.top = "-" + (window.scrollY / 4) + "px";
    images[3].style.top = "-" + (window.scrollY / 5) + "px";
    images[4].style.top = "-" + (window.scrollY / 6) + "px";
    images[5].style.top = "-" + (window.scrollY / 7) + "px";
    images[6].style.top = "-" + (window.scrollY / 9) + "px";

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