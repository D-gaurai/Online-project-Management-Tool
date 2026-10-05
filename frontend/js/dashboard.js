/* ============================================================
   dashboard.js - Handles loading and rendering the dashboard UI.
   We fetch data from the backend and populate the stats, 
   the upcoming deadlines, recent activity, and the mini calendar.
   ============================================================ */

// Run this as soon as the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    // 1. Check if the user is actually logged in (otherwise redirect to login)
    requireAuth();
    
    // 2. Render the top navigation bar and highlight "dashboard" tab
    renderNavbar("dashboard");
    
    // 3. Fetch all dashboard statistics and render them
    loadDashboard();
});

/**
 * Fetches dashboard data from the API and populates all the UI cards.
 */
async function loadDashboard() {
    const loading = document.getElementById("loadingState");
    const content = document.getElementById("dashboardContent");

    try {
        // Fetch data from our Spring Boot backend
        const data = await apiRequest("/dashboard");

        // --- Populate the top 6 Stat Cards ---
        document.getElementById("totalProjects").textContent = data.totalProjects;
        document.getElementById("activeProjects").textContent = data.activeProjects;
        document.getElementById("completedProjects").textContent = data.completedProjects;
        document.getElementById("totalTasks").textContent = data.totalTasks;
        document.getElementById("pendingTasks").textContent = data.pendingTasks;
        document.getElementById("completedTasks").textContent = data.completedTasks;

        // --- Render Upcoming Deadlines List ---
        const deadlineList = document.getElementById("deadlineList");
        if (data.upcomingDeadlines.length === 0) {
            // Show a friendly empty state if there are no tasks due soon
            deadlineList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎉</div>
                    <h3>No upcoming deadlines</h3>
                    <p>Tasks assigned to you with a deadline in the next 7 days will show up here.</p>
                </div>`;
        } else {
            // Map over the tasks and render HTML for each one
            deadlineList.innerHTML = data.upcomingDeadlines.map(task => `
                <div class="item-card">
                    <div class="item-card-main">
                        <h3>${escapeHtml(task.title)}</h3>
                        <p>${escapeHtml(task.projectName)} &middot; Due ${formatDate(task.deadline)}</p>
                    </div>
                    <div class="item-card-meta">
                        <span class="${badgeClass(task.priority)}">${task.priority}</span>
                        <span class="${badgeClass(task.status)}">${task.status.replace('_',' ')}</span>
                    </div>
                </div>
            `).join("");
        }

        // --- Render the CSS Bar Chart ---
        renderStatusChart(data.todoTasks, data.inProgressTasks, data.completedTasks);

        // --- Render Recent Activity List ---
        const activityList = document.getElementById("activityList");
        if (data.recentActivity.length === 0) {
            activityList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h3>No activity yet</h3>
                    <p>Once projects and tasks are created, recent updates will show up here.</p>
                </div>`;
        } else {
            activityList.innerHTML = data.recentActivity.map(a => `
                <div class="item-card">
                    <div class="item-card-main">
                        <p>${escapeHtml(a.description)}</p>
                    </div>
                    <div class="item-card-meta">
                        <span style="font-size:12px; color:#6b7280;">${formatDate(a.timestamp)}</span>
                    </div>
                </div>
            `).join("");
        }

        // Hide the loading spinner and show the real content
        loading.classList.add("hidden");
        content.classList.remove("hidden");
        
        // Finally, load all tasks so we can put red dots on the mini calendar
        loadCalendarTasks();

    } catch (err) {
        // If anything fails (e.g. server is down), show the error clearly
        loading.innerHTML = `<p style="color:#dc2626;">Could not load dashboard: ${err.message}</p>`;
    }
}

/**
 * Renders a simple CSS-based bar chart for task statuses.
 * No heavy external charting library needed for just 3 bars!
 */
function renderStatusChart(todo, inProgress, completed) {
    const el = document.getElementById("statusChart");
    
    // Find the maximum value to calculate the percentage height of each bar (min 1 to avoid div by zero)
    const max = Math.max(todo, inProgress, completed, 1);
    
    const bars = [
        { label: "To Do", value: todo, color: "#2563eb" }, // Blue
        { label: "In Progress", value: inProgress, color: "#d97706" }, // Orange
        { label: "Completed", value: completed, color: "#16a34a" } // Green
    ];

    el.innerHTML = bars.map(b => `
        <div class="chart-bar-col">
            <div class="chart-bar-value">${b.value}</div>
            <div class="chart-bar" style="height:${(b.value / max) * 100}%; background:${b.color};"></div>
            <div class="chart-bar-label">${b.label}</div>
        </div>
    `).join("");
}

// Utility to prevent XSS (Cross-Site Scripting) attacks when injecting user data into HTML
function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
}

/* ============================================================
   --- Mini Calendar Logic ---
   This handles the small custom calendar on the dashboard.
   It highlights the current day and shows red dots for deadlines.
   ============================================================ */

let currentCalDate = new Date(); // Keeps track of the month currently being viewed
let taskDeadlines = []; // Array to store all task deadlines

/**
 * Fetch all tasks assigned to the current user to get their deadlines.
 */
async function loadCalendarTasks() {
    try {
        const tasks = await apiRequest('/tasks/my-tasks');
        // Keep only tasks that actually have a deadline set
        taskDeadlines = tasks.filter(t => t.deadline);
        
        initCalendar();
        renderCalendar();
    } catch(err) {
        console.error('Failed to load tasks for calendar', err);
    }
}

/**
 * Attach event listeners to the Next and Previous month buttons.
 */
function initCalendar() {
    document.getElementById('prevMonth').addEventListener('click', () => {
        // Go back one month
        currentCalDate.setMonth(currentCalDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        // Go forward one month
        currentCalDate.setMonth(currentCalDate.getMonth() + 1);
        renderCalendar();
    });
}

/**
 * Calculates the days in the month and builds the calendar grid HTML.
 */
function renderCalendar() {
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Update the month/year header (e.g. "October 2026")
    document.getElementById('calendarMonth').textContent = monthNames[month] + ' ' + year;
    
    // Find what day of the week the 1st of the month lands on (0 = Sunday, 1 = Monday...)
    const firstDay = new Date(year, month, 1).getDay();
    // Get total days in this month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const daysEl = document.getElementById('calendarDays');
    daysEl.innerHTML = ''; // Clear old calendar days
    
    const today = new Date();
    
    // Extract just the day numbers (1-31) that have a deadline in the currently viewed month/year
    const deadlineDates = taskDeadlines.map(t => {
        const d = new Date(t.deadline);
        if (d.getFullYear() === year && d.getMonth() === month) {
            return d.getDate();
        }
        return null;
    }).filter(d => d !== null);

    // Add empty spacer divs for the days before the 1st of the month
    for(let i=0; i<firstDay; i++) {
        daysEl.innerHTML += '<div></div>';
    }
    
    // Render the actual days (1 to 28/30/31)
    for(let i=1; i<=daysInMonth; i++) {
        // Check if this specific day is exactly "today"
        const isToday = (i === today.getDate() && month === today.getMonth() && year === today.getFullYear());
        
        // Check if this day is in our list of deadlines
        const hasDeadline = deadlineDates.includes(i);
        
        // Base styling for a day cell
        let style = 'padding: 6px 0; border-radius: 4px; position: relative;';
        
        // Highlight today's date
        if(isToday) {
            style += ' background: var(--primary); color: white; font-weight: bold;';
        }
        
        // Draw a small dot if there's a deadline
        let dot = '';
        if(hasDeadline && !isToday) {
            // Red dot for normal days
            dot = '<div style="position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); width: 4px; height: 4px; background: #ef4444; border-radius: 50%;"></div>';
        } else if(hasDeadline && isToday) {
            // White dot if it's "today" so it contrasts with the blue background
            dot = '<div style="position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); width: 4px; height: 4px; background: white; border-radius: 50%;"></div>';
        }
        
        // Append the day to the grid
        daysEl.innerHTML += '<div style="' + style + '">' + i + dot + '</div>';
    }
}
