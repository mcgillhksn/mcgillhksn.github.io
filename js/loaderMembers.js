document.addEventListener("DOMContentLoaded", function() {
    const currentPath = window.location.pathname;
    const isInSubdirectory = currentPath.includes('/events') || currentPath.includes('/about') || currentPath.includes('/store');
    const basePath = isInSubdirectory ? '../' : './';

    const years = ["2024-2025", "2023-2024", "2019-2020"]; // Manually listed from folder structure
    const yearSelectorMenu = document.getElementById('year-selector-menu');
    const yearSelectorButton = document.getElementById('year-selector-button');
    const container = document.getElementById('about-container');
    const groupPhoto = document.getElementById('group-photo');

    function loadMembers(year) {
        fetch(`${basePath}assets/members/${year}/members.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok for ${year}`);
                }
                return response.json();
            })
            .then(members => {
                container.innerHTML = ''; // Clear existing members
                members.forEach(member => {
                    const memberDiv = document.createElement('div');
                    memberDiv.className = 'col-lg-4 col-md-6 col-sm-12';
                    memberDiv.innerHTML = `
                        <div class="exec-padding">
                            <div class="exec-container">
                                <img class="img-fluid exec-image rounded" src="${basePath}assets/members/${year}/${member.image}" />
                                <div class="member-info">
                                    <div class="member-name">${member.name}</div>
                                    <div class="member-role">${member.position}</div>
                                </div>
                            </div>
                        </div>
                    `;
                    container.appendChild(memberDiv);
                });
                yearSelectorButton.textContent = year;

                groupPhoto.src = `${basePath}assets/members/${year}/groupPhoto.jpg`;
            })
            .catch(error => {
                console.error('Error loading about members:', error);
                container.innerHTML = '<p class="text-center">Could not load members for this year.</p>';
            });
    }

    years.forEach(year => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.className = 'dropdown-item';
        link.href = '#';
        link.textContent = year;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            loadMembers(year);
        });
        listItem.appendChild(link);
        yearSelectorMenu.appendChild(listItem);
    });

    if (years.length > 0) {
        const latestYear = years[0];
        yearSelectorButton.textContent = latestYear;
        loadMembers(latestYear);
    }
});

