export class Navbar {
    constructor() {
        this.navHTML = `
            <div class="fixed-top hiddenSlideY" id="nav">
                <nav class="navbar navbar-expand-md container py-3 container">
                    <div class="container-fluid">
                        <a href="#top" class="navbar-brand d-flex align-items-center text-decoration-none">
                            <img src="./assets/logo/logo+text.png" alt="HKSN Logo" height="32" style="margin-top: -7px;"/>
                        </a>
                        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
                            aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                            <span class="navbar-toggler-icon"></span>
                        </button>
                        <div class="collapse navbar-collapse" id="navbarNav">
                            <ul class="navbar-nav ms-auto">
                                <li class="nav-item ms-auto">
                                    <a href="./index.html" class="nav-link richLink fw-bold">Home</a>
                                </li>
                                <li class="nav-item ms-auto">
                                    <a href="./events.html" class="nav-link richLink fw-bold">Events</a>
                                </li>
                                <li class="nav-item ms-auto">
                                    <a href="./store.html" class="nav-link richLink fw-bold">Store</a>
                                </li>
                                <li class="nav-item ms-auto">
                                    <a href="./team.html" class="nav-link richLink fw-bold">Team</a>
                                </li>
                                <li class="nav-item ms-auto">
                                    <a href="#Interests" class="nav-link richLink fw-bold">Socials</a>
                                </li>
                                <li class="nav-item dropdown">
                                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        Connect
                                    </a>
                                    <ul class="dropdown-menu gap-1 p-2 rounded-3 shadow" style="width: 220px;">
                                        <li>
                                            <a class="dropdown-item rounded-2" href="https://www.linkedin.com/in/gordonng03/" target="_blank">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-linkedin" viewBox="0 0 16 16">
                                                    <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z"/>
                                                </svg>
                                                LinkedIn
                                            </a>
                                        </li>
                                        <li>
                                            <a class="dropdown-item rounded-2" href="https://github.com/SoloUnity" target="_blank">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-github" viewBox="0 0 16 16">
                                                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/>
                                                </svg>
                                                GitHub
                                            </a>
                                        </li>
                                        <li>
                                            <a class="dropdown-item rounded-2" href="mailto:gordon.ng@mail.mcgill.ca" target="_blank">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-envelope-fill" viewBox="0 0 16 16">
                                                    <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414zM0 4.697v7.104l5.803-3.558zM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586zm3.436-.586L16 11.801V4.697z"/>
                                                </svg>
                                                Email
                                            </a>
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </div>
                </nav>
            </div>
        `;
    }

    inject(targetSelector = 'body') {
        const targetElement = document.querySelector(targetSelector);
        if (targetElement) {
            targetElement.insertAdjacentHTML('afterbegin', this.navHTML);
        }
    }
}

// Create and export the navbar instance
export const navbar = new Navbar();