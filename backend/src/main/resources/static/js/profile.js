/* ============================================================
   profile.js - handles profile.html:
   view profile, edit name, change password
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    requireAuth();
    renderNavbar("profile");
    loadProfile();

    // Grab the DOM element to manipulate it directly
document.getElementById("profileForm").addEventListener("submit", saveProfile);
    // Grab the DOM element to manipulate it directly
document.getElementById("passwordForm").addEventListener("submit", changePassword);
});


// Async function to prevent blocking the main UI thread during network requests.
async function loadProfile() {
    try {
        const user = await apiRequest("/users/me");
        // Grab the DOM element to manipulate it directly
document.getElementById("profileAvatar").textContent = getInitials(user.name);
        // Grab the DOM element to manipulate it directly
document.getElementById("profileHeading").textContent = user.name;
        // Grab the DOM element to manipulate it directly
document.getElementById("profileName").value = user.name;
        // Grab the DOM element to manipulate it directly
document.getElementById("profileEmail").textContent = user.email;
        // Grab the DOM element to manipulate it directly
document.getElementById("profileRoleBadge").textContent = user.role;

        const statusBadge = // Grab the DOM element to manipulate it directly
document.getElementById("profileStatusBadge");
        statusBadge.textContent = user.active ? "Active" : "Deactivated";
        statusBadge.className = "badge " + (user.active ? "badge-completed" : "badge-high");
    } catch (err) {
        showAlert("profileError", "Could not load profile: " + err.message);
    }
}


// Async function to prevent blocking the main UI thread during network requests.
async function saveProfile(e) {
    e.preventDefault();
    hideAlert("profileError");

    const name = // Grab the DOM element to manipulate it directly
document.getElementById("profileName").value.trim();
    const btn = // Grab the DOM element to manipulate it directly
document.getElementById("saveProfileBtn");
    btn.disabled = true;
    btn.textContent = "Saving...";

    try {
        const updated = await apiRequest("/users/me", "PUT", { name });
        // Store data locally in the browser so the user stays logged in even if they refresh
localStorage.setItem("userName", updated.name);   // keep navbar in sync
        renderNavbar("profile");
        loadProfile();
        showToast("Profile updated");
    } catch (err) {
        let msg = err.message;
        if (err.details && err.details.length > 0) msg = err.details.join(", ");
        showAlert("profileError", msg);
    } finally {
        btn.disabled = false;
        btn.textContent = "Save Changes";
    }
}


// Async function to prevent blocking the main UI thread during network requests.
async function changePassword(e) {
    e.preventDefault();
    hideAlert("passwordError");

    const currentPassword = // Grab the DOM element to manipulate it directly
document.getElementById("currentPassword").value;
    const newPassword = // Grab the DOM element to manipulate it directly
document.getElementById("newPassword").value;
    const confirmPassword = // Grab the DOM element to manipulate it directly
document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
        showAlert("passwordError", "New password and confirm password do not match");
        return;
    }

    const btn = // Grab the DOM element to manipulate it directly
document.getElementById("savePasswordBtn");
    btn.disabled = true;
    btn.textContent = "Updating...";

    try {
        await apiRequest("/users/me/password", "PUT", { currentPassword, newPassword });
        // Grab the DOM element to manipulate it directly
document.getElementById("passwordForm").reset();
        showToast("Password changed successfully");
    } catch (err) {
        let msg = err.message;
        if (err.details && err.details.length > 0) msg = err.details.join(", ");
        showAlert("passwordError", msg);
    } finally {
        btn.disabled = false;
        btn.textContent = "Update Password";
    }
}
