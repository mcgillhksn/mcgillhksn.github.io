// 
// ⚠️ WHEN MAKING NEW UPDATES, UPDATE THE PATHS IN loaderMembers.js  ⚠️
// 
document.addEventListener("DOMContentLoaded", function() {
    fetch('./assets/data/2025-2026/members.json')
        .then(response => response.json())
        .then(members => {
            const container = document.getElementById('about-container');
            members.forEach(member => {
                const memberDiv = document.createElement('div');
                memberDiv.className = 'col-lg-4 col-md-6 col-sm-12';
                memberDiv.innerHTML = `
                    <div class="exec-padding">
                        <div class="exec-container">
                            <img class="img-fluid exec-image rounded" src="assets/members/2025-2026/${member.image}" />
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
        .catch(error => console.error('Error loading about members:', error));
});
