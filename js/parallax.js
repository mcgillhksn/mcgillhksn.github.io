const images = document.querySelectorAll('.images img');
const title = document.querySelector('.title');

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    title.style.top = `calc(20% + ${scrollY / 1.1}px)`;
    images[0].style.top = "-" + (scrollY / 3) + "px";
    images[1].style.top = "-" + (scrollY / 5) + "px";
    images[2].style.top = "-" + (scrollY / 7) + "px";
    images[3].style.top = "-" + (scrollY / 9) + "px";
    images[4].style.top = "-" + (scrollY / 11) + "px";
    images[5].style.top = "-" + (scrollY / 13) + "px";
    images[6].style.top = "-" + (scrollY / 15) + "px";

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
