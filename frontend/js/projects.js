/* ============================================================
   projects.js - Manages the Project Listing Page
   Features: Search, filtering by status, role-based creation,
   and visual progress bars.
   ============================================================ */

// Global array to cache loaded projects so we don't fetch unnecessarily when just filtering by status
let loadedProjects = [];

document.addEventListener("DOMContentLoaded", () => {
    // 1. Ensure user is logged in
    requireAuth();
    // 2. Render top nav bar
    renderNavbar("projects");
    
    // 3. Drill-down navigation logic: Check if we arrived here from the dashboard with a specific filter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("status")) {
        document.getElementById("statusFilter").value = urlParams.get("status");
    }
    
    // 4. Initial load of all projects
    loadProjects();

    // 5. Attach Event Listeners
    // Use debounce for search so we don't bombard the API on every single keystroke
    document.getElementById("searchInput").addEventListener("input", debounce(loadProjects, 400));
    
    // Status filter is applied instantly on the cached list (no API call)
    document.getElementById("statusFilter").addEventListener("change", renderProjects);
    
    // Switch between all projects and my projects (requires API call)
    document.getElementById("myProjectsOnly").addEventListener("change", loadProjects);

    // --- Role Based Access Control (RBAC) ---
    // Only Managers can create projects. Hide the button if they are just a Member.
    if (getCurrentUser().role === "MEMBER") {
        document.getElementById("newProjectBtn").classList.add("hidden");
    }

    // Modal toggling
    document.getElementById("newProjectBtn").addEventListener("click", () => {
        document.getElementById("projectModal").classList.add("open");
    });

    document.getElementById("cancelModalBtn").addEventListener("click", () => {
        document.getElementById("projectModal").classList.remove("open");
    });

    // Create project form submission
    document.getElementById("projectForm").addEventListener("submit", createProject);
});

/**
 * Fetches the project list from the backend API.
 * Handles both the "search" keyword and "my projects" toggle.
 */
async function loadProjects() {
    const listEl = document.getElementById("projectList");
    const keyword = document.getElementById("searchInput").value.trim();
    const onlyMine = document.getElementById("myProjectsOnly").checked;
    
    // UX improvement: Only show full loading spinner if list is currently empty.
    // If we are just searching, dim the opacity instead to prevent jarring flashes.
    if (!loadedProjects.length) {
        listEl.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;
    } else {
        listEl.style.opacity = "0.5";
    }

    try {
        let endpoint;
        // Determine the correct API endpoint based on user selections
        if (onlyMine) {
            endpoint = "/projects/my";
        } else {
            endpoint = keyword ? \`/projects?search=\${encodeURIComponent(keyword)}\` : "/projects";
        }
        
        // Fetch from API
        loadedProjects = await apiRequest(endpoint);
        
        // Minor edge case: If "Only mine" is checked, search filtering has to happen locally
        if (onlyMine && keyword) {
            loadedProjects = loadedProjects.filter(p => p.name.toLowerCase().includes(keyword.toLowerCase()));
        }
        
        // Re-render the UI
        renderProjects();
    } catch (err) {
        // Reset opacity and show error
        listEl.style.opacity = "1";
        listEl.innerHTML = `<p style="color:#dc2626;">Could not load projects: \${err.message}</p>`;
    }
}

/**
 * Builds the HTML layout for the project list based on the cached 'loadedProjects' array.
 */
function renderProjects() {
    const listEl = document.getElementById("projectList");
    listEl.style.opacity = "1";
    
    const keyword = document.getElementById("searchInput").value.trim();
    const status = document.getElementById("statusFilter").value;
    
    // Apply client-side filtering for status
    const projects = status ? loadedProjects.filter(p => p.status === status) : loadedProjects;

    // Show empty state if nothing matches
    if (projects.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📁</div>
                <h3>No projects found</h3>
                <p>\${keyword || status ? "Try a different search or filter." : "Create your first project to get started."}</p>
            </div>`;
        return;
    }

    // Generate HTML for each project card
    listEl.innerHTML = projects.map(p => `
        <a href="project-details.html?id=\${p.id}" class="item-card">
            <div class="item-card-main">
                <h3>\${escapeHtml(p.name)}</h3>
                <p>\${escapeHtml(p.description || "No description added")} &middot; by \${escapeHtml(p.createdByName)}</p>
                \${progressBarHtml(p.completedTasks, p.totalTasks)}
            </div>
            <div class="item-card-meta">
                <span>\${p.completedTasks}/\${p.totalTasks} tasks done</span>
                <span class="\${badgeClass(p.status)}">\${p.status.replace('_',' ')}</span>
            </div>
        </a>
    `).join("");
}

/**
 * Sends a POST request to the API to create a new project.
 */
async function createProject(e) {
    e.preventDefault(); // Prevent page reload
    hideAlert("projectFormError");

    const name = document.getElementById("projName").value.trim();
    const description = document.getElementById("projDescription").value.trim();
    const startDate = document.getElementById("projStartDate").value || null;
    const endDate = document.getElementById("projEndDate").value || null;

    // Disable button to prevent double-clicks
    const btn = document.getElementById("saveProjectBtn");
    btn.disabled = true;
    btn.textContent = "Saving...";

    try {
        await apiRequest("/projects", "POST", { name, description, startDate, endDate });
        
        showToast("Project created successfully");
        document.getElementById("projectModal").classList.remove("open");
        document.getElementById("projectForm").reset();
        
        // Reload list to show the newly created project
        loadProjects();
    } catch (err) {
        let msg = err.message;
        if (err.details && err.details.length > 0) msg = err.details.join(", ");
        showAlert("projectFormError", msg);
    } finally {
        btn.disabled = false;
        btn.textContent = "Create Project";
    }
}

/**
 * Debounce helper: Delays the execution of a function until after 'delay' ms have passed
 * since the last time it was called. Perfect for search bars!
 */
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

// XSS Protection
function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
}
