document.addEventListener("DOMContentLoaded", function() {
    const basePath = siteConfig.getBasePath();
    const years = siteConfig.allYears;
    const yearSelectorMenu = document.getElementById('year-selector-menu');
    const yearSelectorButton = document.getElementById('year-selector-button');
    const container = document.getElementById('about-container');
    const groupPhoto = document.getElementById('group-photo');

    groupPhoto.onerror = function() {
        this.style.visibility = 'hidden';
    };

    function loadMembers(year) {
        yearSelectorButton.textContent = year;
        groupPhoto.style.visibility = 'visible';
        groupPhoto.src = `${basePath}assets/members/${year}/groupPhoto.jpg`;

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
            })
            .catch(error => {
                console.error('Error loading about members:', error);
                container.innerHTML = '<p class="text-center">Could not load members for this year.</p>';
                groupPhoto.style.visibility = 'hidden';
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

