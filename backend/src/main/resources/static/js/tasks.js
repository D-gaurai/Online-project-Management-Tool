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
                <div class="empty-icon"><i class='bx bx-folder-open' style="font-size: 48px; color: #cbd5e1;"></i></div>
                <h3>No tasks found</h3>
                <p>Tasks assigned to you across all projects will show up here.</p>
            </div>`;
        return;
    }

        const tbody = tasks.map(t => {
        const isLate = isOverdue(t.deadline, t.status);
        return `
        <tr>
            <td>
                <div style="font-weight: 600; margin-bottom: 2px;">${escapeHtml(t.title)}</div>
                <div style="font-size: 12px; color: var(--text-muted);">${escapeHtml(t.projectName)}</div>
            </td>
            <td>
                <span class="${isLate ? 'overdue' : ''}">${formatDate(t.deadline)} ${isLate ? '(overdue)' : ''}</span>
            </td>
            <td><span class="${badgeClass(t.priority)}">${t.priority}</span></td>
            <td>
                <select class="statusSelect" onchange="updateStatus(${t.id}, this.value)" style="padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border); font-size: 12px;">
                    <option value="TODO" ${t.status === 'TODO' ? 'selected' : ''}>To Do</option>
                    <option value="IN_PROGRESS" ${t.status === 'IN_PROGRESS' ? 'selected' : ''}>In Progress</option>
                    <option value="COMPLETED" ${t.status === 'COMPLETED' ? 'selected' : ''}>Completed</option>
                </select>
            </td>
        </tr>`;
    }).join("");

    listEl.innerHTML = `
        <div class="data-table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Task Name</th>
                        <th>Deadline</th>
                        <th>Priority</th>
                        <th>Status / Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${tbody}
                </tbody>
            </table>
        </div>`;
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



