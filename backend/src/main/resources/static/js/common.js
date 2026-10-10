/* ============================================================
   common.js - shared helpers used on every logged-in page:
   navbar rendering, auth guard, logout.
   ============================================================ */

function requireAuth() {
    if (!getToken()) {
        window.location.href = "login.html";
    }
}

function getCurrentUser() {
    return {
        id: localStorage.getItem("userId"),
        name: localStorage.getItem("userName"),
        email: localStorage.getItem("userEmail"),
        role: localStorage.getItem("userRole")
    };
}

function saveSession(authResponse) {
    // Store data locally in the browser so the user stays logged in even if they refresh
localStorage.setItem("token", authResponse.token);
    // Store data locally in the browser so the user stays logged in even if they refresh
localStorage.setItem("userId", authResponse.userId);
    // Store data locally in the browser so the user stays logged in even if they refresh
localStorage.setItem("userName", authResponse.name);
    // Store data locally in the browser so the user stays logged in even if they refresh
localStorage.setItem("userEmail", authResponse.email);
    // Store data locally in the browser so the user stays logged in even if they refresh
localStorage.setItem("userRole", authResponse.role);
}

function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}

function renderNavbar(activePage) {
    const user = getCurrentUser();
    const container = // Grab the DOM element to manipulate it directly
document.getElementById("navbar-container");
    if (!container) return;

                container.innerHTML = `<nav class="navbar">
            <div class="nav-brand"><i class='bx bx-cube-alt'></i> GeForce</div>
            <div class="global-search-wrap">
                <i class='bx bx-search' style='position:absolute; left:10px; top:10px; color:#94a3b8;'></i>
                <input type="text" id="globalSearchInput" class="global-search-input" placeholder="Search..." style="padding-left:32px;">
                <div class="global-search-dropdown hidden" id="globalSearchDropdown"></div>
            </div>
            <div class="nav-links">
                <a href="dashboard.html" class="${activePage === 'dashboard' ? 'active' : ''}"><i class='bx bx-grid-alt'></i> Dashboard</a>
                <a href="projects.html" class="${activePage === 'projects' ? 'active' : ''}"><i class='bx bx-folder'></i> Projects</a>
                <a href="tasks.html" class="${activePage === 'tasks' ? 'active' : ''}"><i class='bx bx-check-square'></i> My Tasks</a>
                <a href="profile.html" class="${activePage === 'profile' ? 'active' : ''}"><i class='bx bx-user'></i> Profile</a>
                ${user.role === 'ADMIN' ? `<a href="users.html" class="${activePage === 'users' ? 'active' : ''}"><i class='bx bx-group'></i> Users</a>` : ''}
            </div>
            <div class="nav-user">
                <button class="theme-toggle" id="themeToggleBtn" title="Theme" style="padding: 8px; width: 34px; border-radius: 6px; background: rgba(0,0,0,0.05); color: var(--text-main); border: none; cursor: pointer; font-size: 16px; display:flex; align-items:center; justify-content:center;"></button>
                <div style="position: relative;">
                    <button class="notif-bell" id="notifBellBtn" title="Notifications" style="padding: 8px; width: 34px; border-radius: 6px; background: rgba(0,0,0,0.05); color: var(--text-main); border: none; cursor: pointer; position: relative; font-size: 16px; display:flex; align-items:center; justify-content:center;">
                        <i class='bx bx-bell'></i>
                        <span class="notif-badge hidden" id="notifBadge">0</span>
                    </button>
                    <div class="notif-dropdown hidden" id="notifDropdown" style="top: 100%; margin-top: 10px; right: -50px; width: 320px;">
                        <div class="notif-dropdown-header">
                            <span>Notifications</span>
                            <button class="notif-markall" id="notifMarkAll">Mark all read</button>
                        </div>
                        <div id="notifList"><div class="notif-empty">Loading...</div></div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px; margin-left: 10px; padding-left: 16px; border-left: 1px solid var(--border);">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff&rounded=true" style="width: 32px; height: 32px; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="line-height: 1.2;">
                        <div style="font-size: 13px; font-weight: 600;">${escapeHtmlCommon(user.name)}</div>
                    </div>
                    <button class="btn-logout" onclick="logout()" style="padding: 6px; font-size: 16px; border-radius: 6px; background: rgba(220, 38, 38, 0.1); color: #dc2626; border: none; cursor: pointer; font-weight: 600; display:flex; align-items:center; justify-content:center; margin-left: 10px;" title="Logout"><i class='bx bx-log-out'></i></button>
                </div>
            </div>
        </nav>`;

    setupNotificationBell();
}

// ---------- Notification bell logic ----------

function setupNotificationBell() {
    const bellBtn = // Grab the DOM element to manipulate it directly
document.getElementById("notifBellBtn");
    const dropdown = // Grab the DOM element to manipulate it directly
document.getElementById("notifDropdown");

    refreshUnreadCount();
    setupThemeButton();
    setupGlobalSearch();

    // Grab the DOM element to manipulate it directly
document.getElementById("notifMarkAll").addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
            await apiRequest("/notifications/read-all", "PATCH");
            loadNotificationList();
            refreshUnreadCount();
        } catch (err) {
            showToast("Could not mark notifications as read", "error");
        }
    });

    bellBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = !dropdown.classList.contains("hidden");
        if (isOpen) {
            dropdown.classList.add("hidden");
        } else {
            dropdown.classList.remove("hidden");
            loadNotificationList();
        }
    });

    // Close dropdown when clicking anywhere else on the page
    document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target) && e.target !== bellBtn) {
            dropdown.classList.add("hidden");
        }
    });

    // Refresh the unread count every 30 seconds so the badge stays up to date
    setInterval(refreshUnreadCount, 30000);
}


// Async function to prevent blocking the main UI thread during network requests.
async function refreshUnreadCount() {
    const badge = // Grab the DOM element to manipulate it directly
document.getElementById("notifBadge");
    if (!badge) return;

    try {
        const data = await apiRequest("/notifications/unread-count");
        if (data.unreadCount > 0) {
            badge.textContent = data.unreadCount > 9 ? "9+" : data.unreadCount;
            badge.classList.remove("hidden");
        } else {
            badge.classList.add("hidden");
        }
    } catch (err) {
        // Fails silently - the bell just won't show a count this cycle
    }
}


// Async function to prevent blocking the main UI thread during network requests.
async function loadNotificationList() {
    const listEl = // Grab the DOM element to manipulate it directly
document.getElementById("notifList");
    listEl.innerHTML = `<div class="notif-empty">Loading...</div>`;

    try {
        const notifications = await apiRequest("/notifications");

        if (notifications.length === 0) {
            listEl.innerHTML = `<div class="notif-empty">No notifications yet</div>`;
            return;
        }

        listEl.innerHTML = notifications.map(n => `
            <div class="notif-item ${n.read ? '' : 'unread'}" onclick="markNotificationRead(${n.id})">
                <div class="notif-message">${escapeHtmlCommon(n.message)}</div>
                <div class="notif-time">${formatDate(n.createdAt)}</div>
            </div>
        `).join("");
    } catch (err) {
        listEl.innerHTML = `<div class="notif-empty">Could not load notifications</div>`;
    }
}


// Async function to prevent blocking the main UI thread during network requests.
async function markNotificationRead(id) {
    try {
        await apiRequest(`/notifications/${id}/read`, "PATCH");
        loadNotificationList();
        refreshUnreadCount();
    } catch (err) {
        // ignore - not critical if this fails silently
    }
}

// ---------- Small UI helpers shared across pages ----------

// Toast = small message that appears in the corner and fades away by itself.
function showToast(message, type = "success") {
    let container = // Grab the DOM element to manipulate it directly
document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = "toast toast-" + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("toast-hide");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// "Deepanshu Garg" -> "DG"
function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    const first = parts[0].charAt(0);
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
    return (first + last).toUpperCase();
}

// True when the deadline is in the past and the task is not finished yet.
function isOverdue(dateStr, status) {
    if (!dateStr || status === "COMPLETED") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr) < today;
}

function progressBarHtml(done, total) {
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    return `
        <div class="progress-wrap" title="${percent}% complete">
            <div class="progress-bar"><div class="progress-fill" style="width:${percent}%"></div></div>
            <span class="progress-text">${percent}%</span>
        </div>`;
}

// ---------- Global search (projects + tasks together) ----------

function setupGlobalSearch() {
    const input = // Grab the DOM element to manipulate it directly
document.getElementById("globalSearchInput");
    const dropdown = // Grab the DOM element to manipulate it directly
document.getElementById("globalSearchDropdown");
    if (!input) return;

    input.addEventListener("input", debounceCommon(async () => {
        const q = input.value.trim();
        if (q.length < 2) {
            dropdown.classList.add("hidden");
            return;
        }
        dropdown.innerHTML = `<div class="notif-empty">Searching...</div>`;
        dropdown.classList.remove("hidden");

        try {
            const [projects, tasks] = await Promise.all([
                apiRequest(`/projects?search=${encodeURIComponent(q)}`),
                apiRequest(`/tasks/search?keyword=${encodeURIComponent(q)}`)
            ]);
            renderGlobalSearchResults(projects, tasks);
        } catch (err) {
            dropdown.innerHTML = `<div class="notif-empty">Search failed</div>`;
        }
    }, 350));

    document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target) && e.target !== input) {
            dropdown.classList.add("hidden");
        }
    });
}

function renderGlobalSearchResults(projects, tasks) {
    const dropdown = // Grab the DOM element to manipulate it directly
document.getElementById("globalSearchDropdown");

    if (projects.length === 0 && tasks.length === 0) {
        dropdown.innerHTML = `<div class="notif-empty">No matches found</div>`;
        return;
    }

    let html = "";
    if (projects.length > 0) {
        html += `<div class="search-group-label">Projects</div>`;
        html += projects.slice(0, 5).map(p => `
            <a class="search-result-item" href="project-details.html?id=${p.id}">
                <i class='bx bx-folder' style="color: #7c3aed; font-size: 16px; margin-right: 6px;"></i> ${escapeHtmlCommon(p.name)}
            </a>`).join("");
    }
    if (tasks.length > 0) {
        html += `<div class="search-group-label">Tasks</div>`;
        html += tasks.slice(0, 5).map(t => `
            <a class="search-result-item" href="project-details.html?id=${t.projectId}">
                <i class='bx bx-check-square' style="color: #10b981; font-size: 16px; margin-right: 6px;"></i> ${escapeHtmlCommon(t.title)} <span class="search-result-sub" style="margin-left:auto; font-size:11px; color:#a3aed1;">in ${escapeHtmlCommon(t.projectName)}</span>
            </a>`).join("");
    }
    dropdown.innerHTML = html;
}

function debounceCommon(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

// ---------- Dark / light theme ----------

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
}

// Runs as soon as this file loads, so the saved theme is applied on every page.
applyTheme(localStorage.getItem("theme") || "light");

function setupThemeButton() {
    const btn = // Grab the DOM element to manipulate it directly
document.getElementById("themeToggleBtn");
    if (!btn) return;
    const refreshIcon = () => {
        btn.innerHTML = document.documentElement.getAttribute("data-theme") === "dark" ? "<i class='bx bx-sun'></i>" : "<i class='bx bx-moon'></i>";
    };
    refreshIcon();
    btn.addEventListener("click", () => {
        const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        // Store data locally in the browser so the user stays logged in even if they refresh
localStorage.setItem("theme", next);
        applyTheme(next);
        refreshIcon();
    });
}

// ---------- Show / hide button on every password field ----------

function enablePasswordToggles() {
    document.querySelectorAll('input[type="password"]').forEach(input => {
        if (input.dataset.toggleAdded) return;
        input.dataset.toggleAdded = "1";

        const wrap = document.createElement("div");
        wrap.className = "pw-wrap";
        input.parentNode.insertBefore(wrap, input);
        wrap.appendChild(input);

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pw-toggle";
        btn.textContent = "Show";
        btn.addEventListener("click", () => {
            const show = input.type === "password";
            input.type = show ? "text" : "password";
            btn.textContent = show ? "Hide" : "Show";
        });
        wrap.appendChild(btn);
    });
}

document.addEventListener("DOMContentLoaded", enablePasswordToggles);

// ---------- Nicer replacement for the browser's confirm() box ----------
// Usage:  if (await confirmDialog("Delete this?")) { ... }

function confirmDialog(message, confirmText = "Delete") {
    return new Promise(resolve => {
        const overlay = document.createElement("div");
        overlay.className = "modal-overlay open";
        overlay.innerHTML = `
            <div class="modal-box" style="max-width:380px;">
                <h2>Are you sure?</h2>
                <p style="font-size:14px; color:var(--text-muted);">${escapeHtmlCommon(message)}</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" data-act="no">Cancel</button>
                    <button class="btn btn-danger" data-act="yes">${escapeHtmlCommon(confirmText)}</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener("click", (e) => {
            const act = e.target.dataset.act;
            if (act || e.target === overlay) {
                overlay.remove();
                resolve(act === "yes");
            }
        });
    });
}

function escapeHtmlCommon(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
}

// Small helper to format an ISO date (yyyy-mm-dd) nicely, or show a fallback.
function formatDate(dateStr) {
    if (!dateStr) return "Not set";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function badgeClass(value) {
    return "badge badge-" + (value || "").toLowerCase();
}

// Used by every page that shows an inline error/success alert box
// (login, register, create project, create task, add member, etc.)
function showAlert(id, message) {
    const el = // Grab the DOM element to manipulate it directly
document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.style.display = "block";
}

function hideAlert(id) {
    const el = // Grab the DOM element to manipulate it directly
document.getElementById(id);
    if (!el) return;
    el.style.display = "none";
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
  });
}













