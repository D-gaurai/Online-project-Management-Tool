/* ============================================================
   project-details.js - handles project-details.html:
   project info + status, tasks list, kanban board, members,
   task modal (priority/status/comments/edit/delete).
   ============================================================ */

const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get("id");
let currentTaskId = null;
let editingTaskId = null;
let currentProject = null;

document.addEventListener("DOMContentLoaded", () => {
    requireAuth();
    renderNavbar("projects");

    if (!projectId) {
        window.location.href = "projects.html";
        return;
    }

    // Members can only view and update their own tasks - hide manager-only controls
    const user = getCurrentUser();
    if (user.role === "MEMBER") {
        ["newTaskBtn", "addMemberBtn", "deleteProjectBtn", "editProjectBtn",
         "editTaskFromDetailBtn", "deleteTaskFromDetailBtn", "projectStatusSelect"]
            .forEach(id => // Grab the DOM element to manipulate it directly
document.getElementById(id).classList.add("hidden"));
        // Grab the DOM element to manipulate it directly
document.getElementById("taskPrioritySelect").disabled = true;
    }

    refreshAll();
    loadMembers();

    // Tabs
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });

    // Tasks
    // Grab the DOM element to manipulate it directly
document.getElementById("newTaskBtn").addEventListener("click", openTaskCreateModal);
    // Grab the DOM element to manipulate it directly
document.getElementById("cancelTaskModalBtn").addEventListener("click", () => {
        // Grab the DOM element to manipulate it directly
document.getElementById("taskModal").classList.remove("open");
    });
    // Grab the DOM element to manipulate it directly
document.getElementById("taskForm").addEventListener("submit", saveTask);
    // Grab the DOM element to manipulate it directly
document.getElementById("statusFilter").addEventListener("change", loadTasks);
    // Grab the DOM element to manipulate it directly
document.getElementById("priorityFilter").addEventListener("change", loadTasks);
    // Grab the DOM element to manipulate it directly
document.getElementById("exportCsvBtn").addEventListener("click", exportTasksCsv);

    // Members
    // Grab the DOM element to manipulate it directly
document.getElementById("addMemberBtn").addEventListener("click", openMemberModal);
    // Grab the DOM element to manipulate it directly
document.getElementById("cancelMemberModalBtn").addEventListener("click", () => {
        // Grab the DOM element to manipulate it directly
document.getElementById("memberModal").classList.remove("open");
    });
    // Grab the DOM element to manipulate it directly
document.getElementById("memberForm").addEventListener("submit", addMember);

    // Project actions
    // Grab the DOM element to manipulate it directly
document.getElementById("deleteProjectBtn").addEventListener("click", deleteProject);
    // Grab the DOM element to manipulate it directly
document.getElementById("editProjectBtn").addEventListener("click", openProjectEditModal);
    // Grab the DOM element to manipulate it directly
document.getElementById("cancelProjectEditBtn").addEventListener("click", () => {
        // Grab the DOM element to manipulate it directly
document.getElementById("projectEditModal").classList.remove("open");
    });
    // Grab the DOM element to manipulate it directly
document.getElementById("projectEditForm").addEventListener("submit", saveProjectEdit);
    // Grab the DOM element to manipulate it directly
document.getElementById("projectStatusSelect").addEventListener("change", changeProjectStatus);

    // Task detail modal
    // Grab the DOM element to manipulate it directly
document.getElementById("closeTaskDetailBtn").addEventListener("click", () => {
        // Grab the DOM element to manipulate it directly
document.getElementById("taskDetailModal").classList.remove("open");
    });
    // Grab the DOM element to manipulate it directly
document.getElementById("commentForm").addEventListener("submit", addComment);
    // Grab the DOM element to manipulate it directly
document.getElementById("taskStatusSelect").addEventListener("change", updateTaskStatusFromDetail);
    // Grab the DOM element to manipulate it directly
document.getElementById("taskPrioritySelect").addEventListener("change", updateTaskPriorityFromDetail);
    // Grab the DOM element to manipulate it directly
document.getElementById("editTaskFromDetailBtn").addEventListener("click", openTaskEditModal);
    // Grab the DOM element to manipulate it directly
document.getElementById("deleteTaskFromDetailBtn").addEventListener("click", deleteTask);

    setupBoardDragAndDrop();
});

// Reloads everything that depends on task data.
function refreshAll() {
    loadProjectInfo();
    loadTasks();
    loadBoard();
}

function switchTab(tab) {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.toggle("active", p.id === "tab-" + tab));
}

// ---------- Project info ----------


// Async function to prevent blocking the main UI thread during network requests.
async function loadProjectInfo() {
    try {
        const p = await apiRequest(`/projects/${projectId}`);
        currentProject = p;
        // Grab the DOM element to manipulate it directly
document.getElementById("projectName").textContent = p.name;
        // Grab the DOM element to manipulate it directly
document.getElementById("projectDescription").textContent = p.description || "No description added";
        // Grab the DOM element to manipulate it directly
document.getElementById("projectStatus").textContent = p.status.replace("_", " ");
        // Grab the DOM element to manipulate it directly
document.getElementById("projectStatus").className = badgeClass(p.status);
        // Grab the DOM element to manipulate it directly
document.getElementById("projectStatusSelect").value = p.status;
        // Grab the DOM element to manipulate it directly
document.getElementById("projectDates").textContent =
            `${formatDate(p.startDate)} → ${formatDate(p.endDate)}`;
        // Grab the DOM element to manipulate it directly
document.getElementById("projectCreator").textContent = p.createdByName;
        // Grab the DOM element to manipulate it directly
document.getElementById("projectProgress").innerHTML =
            `${p.completedTasks}/${p.totalTasks} tasks completed` + progressBarHtml(p.completedTasks, p.totalTasks);
    } catch (err) {
        // Grab the DOM element to manipulate it directly
document.getElementById("projectName").textContent = "Project not found";
    }
}


// Async function to prevent blocking the main UI thread during network requests.
async function changeProjectStatus() {
    const status = // Grab the DOM element to manipulate it directly
document.getElementById("projectStatusSelect").value;
    try {
        await apiRequest(`/projects/${projectId}/status?status=${status}`, "PATCH");
        showToast("Project status updated");
        loadProjectInfo();
    } catch (err) {
        showToast("Could not update project status: " + err.message, "error");
        loadProjectInfo();
    }
}

function openProjectEditModal() {
    if (!currentProject) return;
    hideAlert("projectEditError");
    // Grab the DOM element to manipulate it directly
document.getElementById("editProjName").value = currentProject.name;
    // Grab the DOM element to manipulate it directly
document.getElementById("editProjDescription").value = currentProject.description || "";
    // Grab the DOM element to manipulate it directly
document.getElementById("editProjStartDate").value = currentProject.startDate || "";
    // Grab the DOM element to manipulate it directly
document.getElementById("editProjEndDate").value = currentProject.endDate || "";
    // Grab the DOM element to manipulate it directly
document.getElementById("projectEditModal").classList.add("open");
}


// Async function to prevent blocking the main UI thread during network requests.
async function saveProjectEdit(e) {
    e.preventDefault();
    hideAlert("projectEditError");

    const btn = // Grab the DOM element to manipulate it directly
document.getElementById("saveProjectEditBtn");
    btn.disabled = true;
    btn.textContent = "Saving...";

    try {
        await apiRequest(`/projects/${projectId}`, "PUT", {
            name: // Grab the DOM element to manipulate it directly
document.getElementById("editProjName").value.trim(),
            description: // Grab the DOM element to manipulate it directly
document.getElementById("editProjDescription").value.trim(),
            startDate: // Grab the DOM element to manipulate it directly
document.getElementById("editProjStartDate").value || null,
            endDate: // Grab the DOM element to manipulate it directly
document.getElementById("editProjEndDate").value || null
        });
        // Grab the DOM element to manipulate it directly
document.getElementById("projectEditModal").classList.remove("open");
        showToast("Project updated");
        loadProjectInfo();
    } catch (err) {
        let msg = err.message;
        if (err.details && err.details.length > 0) msg = err.details.join(", ");
        showAlert("projectEditError", msg);
    } finally {
        btn.disabled = false;
        btn.textContent = "Save Changes";
    }
}


// Async function to prevent blocking the main UI thread during network requests.
async function deleteProject() {
    const ok = await confirmDialog("Delete this project? All its tasks and comments will also be deleted. This cannot be undone.");
    if (!ok) return;
    try {
        await apiRequest(`/projects/${projectId}`, "DELETE");
        window.location.href = "projects.html";
    } catch (err) {
        showToast("Could not delete project: " + err.message, "error");
    }
}

// ---------- Task list ----------


// Async function to prevent blocking the main UI thread during network requests.
async function loadTasks() {
    const listEl = // Grab the DOM element to manipulate it directly
document.getElementById("taskList");
    const status = // Grab the DOM element to manipulate it directly
document.getElementById("statusFilter").value;
    const priority = // Grab the DOM element to manipulate it directly
document.getElementById("priorityFilter").value;

    listEl.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;

    try {
        let endpoint = `/tasks/project/${projectId}`;
        const params = [];
        if (status) params.push(`status=${status}`);
        if (priority) params.push(`priority=${priority}`);
        if (params.length > 0) endpoint += "?" + params.join("&");

        const tasks = await apiRequest(endpoint);

        if (tasks.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h3>No tasks found</h3>
                    <p>Create a task to start tracking work on this project.</p>
                </div>`;
            return;
        }

        listEl.innerHTML = tasks.map(t => `
            <div class="item-card" style="cursor:pointer" onclick="openTaskDetail(${t.id})">
                <div class="item-card-main">
                    <h3>${escapeHtml(t.title)}</h3>
                    <p>Assigned to ${escapeHtml(t.assignedToName)} &middot; <span class="${isOverdue(t.deadline, t.status) ? 'overdue' : ''}">Due ${formatDate(t.deadline)}${isOverdue(t.deadline, t.status) ? ' (overdue)' : ''}</span></p>
                </div>
                <div class="item-card-meta">
                    <span class="${badgeClass(t.priority)}">${t.priority}</span>
                    <span class="${badgeClass(t.status)}">${t.status.replace('_',' ')}</span>
                </div>
            </div>
        `).join("");
    } catch (err) {
        listEl.innerHTML = `<p style="color:#dc2626;">Could not load tasks: ${err.message}</p>`;
    }
}

// ---------- Kanban board ----------


// Async function to prevent blocking the main UI thread during network requests.
async function loadBoard() {
    try {
        const tasks = await apiRequest(`/tasks/project/${projectId}`);
        const columns = { TODO: [], IN_PROGRESS: [], COMPLETED: [] };
        tasks.forEach(t => columns[t.status].push(t));

        document.querySelectorAll(".board-col").forEach(col => {
            const list = columns[col.dataset.status];
            col.querySelector(".board-count").textContent = list.length;
            col.querySelector(".board-cards").innerHTML = list.length === 0
                ? `<div class="board-empty">Drop tasks here</div>`
                : list.map(t => `
                    <div class="board-card" draggable="true" data-id="${t.id}" onclick="openTaskDetail(${t.id})">
                        <h4>${escapeHtml(t.title)}</h4>
                        <div class="board-card-meta">
                            <span class="${badgeClass(t.priority)}">${t.priority}</span>
                            <span class="${isOverdue(t.deadline, t.status) ? 'overdue' : ''}">${t.deadline ? formatDate(t.deadline) : 'No deadline'}</span>
                            <span class="avatar" title="${escapeHtml(t.assignedToName)}">${getInitials(t.assignedToName === 'Unassigned' ? '' : t.assignedToName)}</span>
                        </div>
                    </div>`).join("");
        });
    } catch (err) {
        showToast("Could not load board: " + err.message, "error");
    }
}

function setupBoardDragAndDrop() {
    const board = // Grab the DOM element to manipulate it directly
document.getElementById("board");

    board.addEventListener("dragstart", (e) => {
        const card = e.target.closest(".board-card");
        if (!card) return;
        e.dataTransfer.setData("text/plain", card.dataset.id);
        card.classList.add("dragging");
    });

    board.addEventListener("dragend", () => {
        document.querySelectorAll(".board-card").forEach(c => c.classList.remove("dragging"));
        document.querySelectorAll(".board-col").forEach(c => c.classList.remove("drag-over"));
    });

    board.addEventListener("dragover", (e) => {
        const col = e.target.closest(".board-col");
        if (!col) return;
        e.preventDefault();
        col.classList.add("drag-over");
    });

    board.addEventListener("dragleave", (e) => {
        const col = e.target.closest(".board-col");
        if (col && !col.contains(e.relatedTarget)) col.classList.remove("drag-over");
    });

    board.addEventListener("drop", async (e) => {
        const col = e.target.closest(".board-col");
        if (!col) return;
        e.preventDefault();
        col.classList.remove("drag-over");

        const taskId = e.dataTransfer.getData("text/plain");
        if (!taskId) return;

        try {
            await apiRequest(`/tasks/${taskId}/status`, "PATCH", { status: col.dataset.status });
            showToast("Task moved");
        } catch (err) {
            showToast("Could not move task: " + err.message, "error");
        }
        refreshAll();
    });
}

// ---------- Members ----------


// Async function to prevent blocking the main UI thread during network requests.
async function loadMembers() {
    const listEl = // Grab the DOM element to manipulate it directly
document.getElementById("memberList");
    try {
        const members = await apiRequest(`/projects/${projectId}/members`);
        window.projectMembers = members;

        listEl.innerHTML = members.map(m => `
            <div class="item-card">
                <div class="item-card-main" style="display:flex; align-items:center; gap:12px;">
                    <span class="avatar avatar-lg">${getInitials(m.name)}</span>
                    <div>
                        <h3>${escapeHtml(m.name)}</h3>
                        <p>${escapeHtml(m.email)}</p>
                    </div>
                </div>
                <div class="item-card-meta">
                    <span class="badge badge-active">${m.role}</span>
                </div>
            </div>
        `).join("");

        const select = // Grab the DOM element to manipulate it directly
document.getElementById("taskAssignee");
        select.innerHTML = `<option value="">Unassigned</option>` +
            members.map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join("");
    } catch (err) {
        listEl.innerHTML = `<p style="color:#dc2626;">Could not load members: ${err.message}</p>`;
    }
}

// Shows a dropdown of active users who are not yet in this project.

// Async function to prevent blocking the main UI thread during network requests.
async function openMemberModal() {
    hideAlert("memberFormError");
    const select = // Grab the DOM element to manipulate it directly
document.getElementById("memberUserId");
    select.innerHTML = `<option value="">Loading users...</option>`;
    // Grab the DOM element to manipulate it directly
document.getElementById("memberModal").classList.add("open");

    try {
        const users = await apiRequest("/users");
        const memberIds = (window.projectMembers || []).map(m => m.id);
        const available = users.filter(u => u.active && !memberIds.includes(u.id));

        if (available.length === 0) {
            select.innerHTML = `<option value="">No more users available to add</option>`;
            return;
        }
        select.innerHTML = `<option value="">Select a user...</option>` +
            available.map(u => `<option value="${u.id}">${escapeHtml(u.name)} (${u.role}) - ${escapeHtml(u.email)}</option>`).join("");
    } catch (err) {
        select.innerHTML = `<option value="">Could not load users</option>`;
        showAlert("memberFormError", err.message);
    }
}


// Async function to prevent blocking the main UI thread during network requests.
async function addMember(e) {
    e.preventDefault();
    hideAlert("memberFormError");

    const userId = // Grab the DOM element to manipulate it directly
document.getElementById("memberUserId").value;
    if (!userId) {
        showAlert("memberFormError", "Please select a user");
        return;
    }

    const btn = // Grab the DOM element to manipulate it directly
document.getElementById("saveMemberBtn");
    btn.disabled = true;
    btn.textContent = "Adding...";

    try {
        await apiRequest(`/projects/${projectId}/members`, "POST", { userId: Number(userId) });
        // Grab the DOM element to manipulate it directly
document.getElementById("memberModal").classList.remove("open");
        showToast("Member added to project");
        loadMembers();
    } catch (err) {
        showAlert("memberFormError", err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "Add Member";
    }
}

// ---------- Create / edit task ----------

function openTaskCreateModal() {
    editingTaskId = null;
    hideAlert("taskFormError");
    // Grab the DOM element to manipulate it directly
document.getElementById("taskForm").reset();
    // Grab the DOM element to manipulate it directly
document.getElementById("taskModalTitle").textContent = "New Task";
    // Grab the DOM element to manipulate it directly
document.getElementById("saveTaskBtn").textContent = "Create Task";
    // Grab the DOM element to manipulate it directly
document.getElementById("taskModal").classList.add("open");
}


// Async function to prevent blocking the main UI thread during network requests.
async function openTaskEditModal() {
    try {
        const task = await apiRequest(`/tasks/${currentTaskId}`);
        editingTaskId = task.id;
        hideAlert("taskFormError");

        // Grab the DOM element to manipulate it directly
document.getElementById("taskTitle").value = task.title;
        // Grab the DOM element to manipulate it directly
document.getElementById("taskDescription").value = task.description || "";
        // Grab the DOM element to manipulate it directly
document.getElementById("taskPriority").value = task.priority;
        // Grab the DOM element to manipulate it directly
document.getElementById("taskDeadline").value = task.deadline || "";
        // Grab the DOM element to manipulate it directly
document.getElementById("taskAssignee").value = task.assignedToId || "";

        // Grab the DOM element to manipulate it directly
document.getElementById("taskModalTitle").textContent = "Edit Task";
        // Grab the DOM element to manipulate it directly
document.getElementById("saveTaskBtn").textContent = "Save Changes";
        // Grab the DOM element to manipulate it directly
document.getElementById("taskDetailModal").classList.remove("open");
        // Grab the DOM element to manipulate it directly
document.getElementById("taskModal").classList.add("open");
    } catch (err) {
        showToast("Could not load task for editing: " + err.message, "error");
    }
}


// Async function to prevent blocking the main UI thread during network requests.
async function saveTask(e) {
    e.preventDefault();
    hideAlert("taskFormError");

    const title = // Grab the DOM element to manipulate it directly
document.getElementById("taskTitle").value.trim();
    const description = // Grab the DOM element to manipulate it directly
document.getElementById("taskDescription").value.trim();
    const priority = // Grab the DOM element to manipulate it directly
document.getElementById("taskPriority").value;
    const deadline = // Grab the DOM element to manipulate it directly
document.getElementById("taskDeadline").value || null;
    const assignedToId = // Grab the DOM element to manipulate it directly
document.getElementById("taskAssignee").value || null;
    const wasEditing = editingTaskId !== null;

    const btn = // Grab the DOM element to manipulate it directly
document.getElementById("saveTaskBtn");
    btn.disabled = true;
    btn.textContent = wasEditing ? "Saving..." : "Creating...";

    const payload = {
        title, description, priority, deadline,
        projectId: Number(projectId),
        assignedToId: assignedToId ? Number(assignedToId) : null
    };

    try {
        if (wasEditing) {
            await apiRequest(`/tasks/${editingTaskId}`, "PUT", payload);
        } else {
            await apiRequest("/tasks", "POST", payload);
        }
        // Grab the DOM element to manipulate it directly
document.getElementById("taskModal").classList.remove("open");
        showToast(wasEditing ? "Task updated" : "Task created");
        refreshAll();
    } catch (err) {
        let msg = err.message;
        if (err.details && err.details.length > 0) msg = err.details.join(", ");
        showAlert("taskFormError", msg);
    } finally {
        btn.disabled = false;
        btn.textContent = wasEditing ? "Save Changes" : "Create Task";
    }
}

// ---------- Task detail modal ----------

function fillTaskDetail(task) {
    // Grab the DOM element to manipulate it directly
document.getElementById("taskDetailTitle").textContent = task.title;
    // Grab the DOM element to manipulate it directly
document.getElementById("taskDetailDescription").textContent = task.description || "No description added";
    // Grab the DOM element to manipulate it directly
document.getElementById("taskDetailAssignee").textContent = task.assignedToName;
    // Grab the DOM element to manipulate it directly
document.getElementById("taskDetailDeadline").textContent = formatDate(task.deadline);
    // Grab the DOM element to manipulate it directly
document.getElementById("taskPrioritySelect").value = task.priority;
    // Grab the DOM element to manipulate it directly
document.getElementById("taskStatusSelect").value = task.status;
}


// Async function to prevent blocking the main UI thread during network requests.
async function openTaskDetail(taskId) {
    currentTaskId = taskId;
    // Grab the DOM element to manipulate it directly
document.getElementById("taskDetailModal").classList.add("open");

    try {
        fillTaskDetail(await apiRequest(`/tasks/${taskId}`));
        loadComments(taskId);
    } catch (err) {
        showToast("Could not load task: " + err.message, "error");
    }
}


// Async function to prevent blocking the main UI thread during network requests.
async function updateTaskStatusFromDetail() {
    const newStatus = // Grab the DOM element to manipulate it directly
document.getElementById("taskStatusSelect").value;
    try {
        await apiRequest(`/tasks/${currentTaskId}/status`, "PATCH", { status: newStatus });
        showToast("Status updated");
        refreshAll();
    } catch (err) {
        showToast("Could not update status: " + err.message, "error");
        fillTaskDetail(await apiRequest(`/tasks/${currentTaskId}`)); // put dropdown back
    }
}


// Async function to prevent blocking the main UI thread during network requests.
async function updateTaskPriorityFromDetail() {
    const newPriority = // Grab the DOM element to manipulate it directly
document.getElementById("taskPrioritySelect").value;
    try {
        await apiRequest(`/tasks/${currentTaskId}/priority`, "PATCH", { priority: newPriority });
        showToast("Priority updated");
        refreshAll();
    } catch (err) {
        showToast("Could not update priority: " + err.message, "error");
        fillTaskDetail(await apiRequest(`/tasks/${currentTaskId}`));
    }
}


// Async function to prevent blocking the main UI thread during network requests.
async function deleteTask() {
    const ok = await confirmDialog("Delete this task and all its comments? This cannot be undone.");
    if (!ok) return;
    try {
        await apiRequest(`/tasks/${currentTaskId}`, "DELETE");
        // Grab the DOM element to manipulate it directly
document.getElementById("taskDetailModal").classList.remove("open");
        showToast("Task deleted");
        refreshAll();
    } catch (err) {
        showToast("Could not delete task: " + err.message, "error");
    }
}


// Async function to prevent blocking the main UI thread during network requests.
async function loadComments(taskId) {
    const listEl = // Grab the DOM element to manipulate it directly
document.getElementById("commentList");
    listEl.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;

    try {
        const comments = await apiRequest(`/tasks/${taskId}/comments`);
        if (comments.length === 0) {
            listEl.innerHTML = `<p style="color:var(--text-muted); font-size:13px;">No comments yet. Start the discussion below.</p>`;
            return;
        }
        listEl.innerHTML = comments.map(c => `
            <div class="comment-item">
                <div class="comment-meta"><strong>${escapeHtml(c.authorName)}</strong> &middot; ${formatDate(c.createdAt)}</div>
                <div>${escapeHtml(c.content)}</div>
            </div>
        `).join("");
    } catch (err) {
        listEl.innerHTML = `<p style="color:#dc2626;">Could not load comments</p>`;
    }
}


// Async function to prevent blocking the main UI thread during network requests.
async function addComment(e) {
    e.preventDefault();
    const input = // Grab the DOM element to manipulate it directly
document.getElementById("commentInput");
    const content = input.value.trim();
    if (!content) return;

    try {
        await apiRequest(`/tasks/${currentTaskId}/comments`, "POST", { content });
        input.value = "";
        loadComments(currentTaskId);
    } catch (err) {
        showToast("Could not add comment: " + err.message, "error");
    }
}

// Builds a CSV file from the currently visible tasks (respects active
// status/priority filters) and triggers a browser download - no backend call.

// Async function to prevent blocking the main UI thread during network requests.
async function exportTasksCsv() {
    try {
        const status = // Grab the DOM element to manipulate it directly
document.getElementById("statusFilter").value;
        const priority = // Grab the DOM element to manipulate it directly
document.getElementById("priorityFilter").value;
        let endpoint = `/tasks/project/${projectId}`;
        const params = [];
        if (status) params.push(`status=${status}`);
        if (priority) params.push(`priority=${priority}`);
        if (params.length > 0) endpoint += "?" + params.join("&");

        const tasks = await apiRequest(endpoint);
        if (tasks.length === 0) {
            showToast("No tasks to export", "error");
            return;
        }

        const header = ["Title", "Description", "Priority", "Status", "Deadline", "Assigned To"];
        const rows = tasks.map(t => [
            t.title, t.description || "", t.priority, t.status,
            t.deadline || "", t.assignedToName
        ]);

        const csvEscape = (val) => `"${String(val).replace(/"/g, '""')}"`;
        const csv = [header, ...rows].map(row => row.map(csvEscape).join(",")).join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${(currentProject ? currentProject.name : "tasks").replace(/\s+/g, "_")}_tasks.csv`;
        link.click();
        URL.revokeObjectURL(url);

        showToast("Tasks exported");
    } catch (err) {
        showToast("Could not export tasks: " + err.message, "error");
    }
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
}
