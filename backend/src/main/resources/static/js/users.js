/* ============================================================
   users.js - handles users.html (ADMIN only):
   list all users, search/filter, activate or deactivate
   ============================================================ */

let allUsers = [];

document.addEventListener("DOMContentLoaded", () => {
    requireAuth();

    // Only admins may open this page
    if (getCurrentUser().role !== "ADMIN") {
        window.location.href = "dashboard.html";
        return;
    }

    renderNavbar("users");
    loadUsers();

    // Grab the DOM element to manipulate it directly
document.getElementById("searchInput").addEventListener("input", renderUsers);
    // Grab the DOM element to manipulate it directly
document.getElementById("roleFilter").addEventListener("change", renderUsers);
});


// Async function to prevent blocking the main UI thread during network requests.
async function loadUsers() {
    const listEl = // Grab the DOM element to manipulate it directly
document.getElementById("userList");
    listEl.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;
    try {
        allUsers = await apiRequest("/users");
        renderUsers();
    } catch (err) {
        listEl.innerHTML = `<p style="color:#dc2626;">Could not load users: ${err.message}</p>`;
    }
}

function renderUsers() {
    const listEl = // Grab the DOM element to manipulate it directly
document.getElementById("userList");
    const keyword = // Grab the DOM element to manipulate it directly
document.getElementById("searchInput").value.trim().toLowerCase();
    const role = // Grab the DOM element to manipulate it directly
document.getElementById("roleFilter").value;
    const myId = Number(getCurrentUser().id);

    const users = allUsers.filter(u =>
        (!role || u.role === role) &&
        (!keyword || u.name.toLowerCase().includes(keyword) || u.email.toLowerCase().includes(keyword))
    );

    if (users.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👤</div>
                <h3>No users found</h3>
                <p>Try a different search or filter.</p>
            </div>`;
        return;
    }

    listEl.innerHTML = users.map(u => `
        <div class="item-card">
            <div class="item-card-main" style="display:flex; align-items:center; gap:12px;">
                <span class="avatar avatar-lg">${getInitials(u.name)}</span>
                <div>
                    <h3>${escapeHtml(u.name)}${u.id === myId ? ' <small>(you)</small>' : ''}</h3>
                    <p>${escapeHtml(u.email)}</p>
                </div>
            </div>
            <div class="item-card-meta">
                <span class="badge badge-active">${u.role}</span>
                <span class="badge ${u.active ? 'badge-completed' : 'badge-high'}">${u.active ? 'Active' : 'Deactivated'}</span>
                ${u.id === myId ? '' : `
                    <button class="btn btn-small ${u.active ? 'btn-danger' : 'btn-secondary'}"
                            onclick="toggleUser(${u.id}, ${!u.active})">
                        ${u.active ? 'Deactivate' : 'Activate'}
                    </button>`}
            </div>
        </div>
    `).join("");
}


// Async function to prevent blocking the main UI thread during network requests.
async function toggleUser(userId, makeActive) {
    if (!makeActive) {
        const ok = await confirmDialog("This user will no longer be able to log in. You can activate them again later.", "Deactivate");
        if (!ok) return;
    }
    try {
        await apiRequest(`/users/${userId}/active?active=${makeActive}`, "PATCH");
        showToast(makeActive ? "User activated" : "User deactivated");
        loadUsers();
    } catch (err) {
        showToast(err.message, "error");
    }
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
}
