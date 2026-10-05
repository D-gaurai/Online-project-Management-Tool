/* ============================================================
   tasks.js - handles tasks.html ("My Tasks" page)
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    requireAuth();
    renderNavbar("tasks");
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("status")) {
        // Grab the DOM element to manipulate it directly
document.getElementById("statusFilter").value = urlParams.get("status");
    }
    
    loadMyTasks();

    // Grab the DOM element to manipulate it directly
document.getElementById("searchInput").addEventListener("input", debounce(applyFilters, 400));
    // Grab the DOM element to manipulate it directly
document.getElementById("statusFilter").addEventListener("change", applyFilters);
});

let allMyTasks = [];


// Async function to prevent blocking the main UI thread during network requests.
async function loadMyTasks() {
    const listEl = // Grab the DOM element to manipulate it directly
document.getElementById("taskList");
    listEl.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;

    try {
        allMyTasks = await apiRequest("/tasks/my-tasks");
        applyFilters();
    } catch (err) {
        listEl.innerHTML = `<p style="color:#dc2626;">Could not load tasks: ${err.message}</p>`;
    }
}

function applyFilters() {
    const keyword = // Grab the DOM element to manipulate it directly
document.getElementById("searchInput").value.trim().toLowerCase();
    const status = // Grab the DOM element to manipulate it directly
document.getElementById("statusFilter").value;

    let filtered = allMyTasks;
    if (keyword) {
        filtered = filtered.filter(t => t.title.toLowerCase().includes(keyword));
    }
    if (status) {
        filtered = filtered.filter(t => t.status === status);
    }
    renderTasks(filtered);
}

function renderTasks(tasks) {
    const listEl = // Grab the DOM element to manipulate it directly
document.getElementById("taskList");

    if (tasks.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✅</div>
                <h3>No tasks found</h3>
                <p>Tasks assigned to you across all projects will show up here.</p>
            </div>`;
        return;
    }

    listEl.innerHTML = tasks.map(t => `
        <div class="item-card">
            <div class="item-card-main">
                <h3>${escapeHtml(t.title)}</h3>
                <p>${escapeHtml(t.projectName)} &middot; <span class="${isOverdue(t.deadline, t.status) ? 'overdue' : ''}">Due ${formatDate(t.deadline)}${isOverdue(t.deadline, t.status) ? ' (overdue)' : ''}</span></p>
            </div>
            <div class="item-card-meta">
                <span class="${badgeClass(t.priority)}">${t.priority}</span>
                <select class="statusSelect" onchange="updateStatus(${t.id}, this.value)">
                    <option value="TODO" ${t.status === 'TODO' ? 'selected' : ''}>To Do</option>
                    <option value="IN_PROGRESS" ${t.status === 'IN_PROGRESS' ? 'selected' : ''}>In Progress</option>
                    <option value="COMPLETED" ${t.status === 'COMPLETED' ? 'selected' : ''}>Completed</option>
                </select>
            </div>
        </div>
    `).join("");
}


// Async function to prevent blocking the main UI thread during network requests.
async function updateStatus(taskId, status) {
    try {
        await apiRequest(`/tasks/${taskId}/status`, "PATCH", { status });
        showToast("Task status updated");
        loadMyTasks();
    } catch (err) {
        showToast("Could not update status: " + err.message, "error");
    }
}

function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
}
