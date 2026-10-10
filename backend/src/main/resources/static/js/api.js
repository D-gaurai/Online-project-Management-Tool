/* ============================================================
   api.js - central place that talks to the Spring Boot backend.
   Every page uses apiRequest() so the JWT header and error
   handling logic is written only once.
   ============================================================ */

const API_BASE = "http://localhost:8080/api";

function getToken() {
    return localStorage.getItem("token");
}


// Async function to prevent blocking the main UI thread during network requests.
async function apiRequest(endpoint, method = "GET", body = null) {
    const headers = { "Content-Type": "application/json" };
    const token = getToken();
    if (token) {
        headers["Authorization"] = "Bearer " + token;
    }

    const config = { method, headers };
    if (body !== null) {
        config.body = JSON.stringify(body);
    }

    // Using the native fetch API to make a network request to our Java backend
    const response = await fetch(API_BASE + endpoint, config);

    // 204 No Content has no body to parse
    if (response.status === 204) {
        return null;
    }

    let data = null;
    try {
        data = await response.json();
    } catch (e) {
        data = null;
    }

    // Token expired/invalid: Spring Security replies 401/403 with an empty body.
    // In that case, clear the old session and send the user to the login page.
    if ((response.status === 401 || response.status === 403) && (!data || !data.message) && token) {
        localStorage.clear();
        window.location.href = "login.html";
        throw new Error("Session expired. Please log in again.");
    }

    if (!response.ok) {
        const message = (data && data.message) ? data.message : "Something went wrong. Please try again.";
        const error = new Error(message);
        error.details = data ? data.details : null;
        throw error;
    }

    return data;
}
