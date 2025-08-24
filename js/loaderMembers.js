// 
// 
// 
// 
document.addEventListener("DOMContentLoaded", function() {
    fetch('./assets/data/members.json')
        .then(response => response.json())
        .then(members => {
            const container = document.getElementById('team-container');
            members.forEach(member => {
                const memberDiv = document.createElement('div');
                memberDiv.className = 'col-lg-4 col-md-6 col-sm-12';
                memberDiv.innerHTML = `
                    <div class="exec-padding">
                        <div class="exec-container">
                            <img class="img-fluid exec-image" src="assets/members/2024-2025/${member.image}" />
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
        .catch(error => console.error('Error loading team members:', error));
});
