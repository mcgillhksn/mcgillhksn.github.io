const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting){
            entry.target.classList.add("description-animation")
        }
    })
})

observer.observe(document.querySelector(".description"))