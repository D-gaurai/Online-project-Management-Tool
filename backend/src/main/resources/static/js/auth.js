/* ============================================================
   auth.js - Handles User Authentication
   This file manages the logic for the login.html and register.html
   pages. It sends credentials to the backend and stores the JWT.
   ============================================================ */

// Wait for the HTML structure to fully load before attaching event listeners
document.addEventListener("DOMContentLoaded", () => {

    // ---------- LOGIN FORM LOGIC ----------
    const loginForm = document.getElementById("loginForm");
    
    // We check if the login form exists on the current page before running this code
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            // Prevent the default HTML form submission (which refreshes the page)
            e.preventDefault();
            
            // Clear any previous error messages
            hideAlert("loginError");

            // Extract the user inputs
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;

            // Give the user visual feedback that we are processing their request
            const btn = document.getElementById("loginBtn");
            btn.disabled = true;
            btn.textContent = "Logging in...";

            try {
                // Send the POST request to our Spring Boot backend
                const response = await apiRequest("/auth/login", "POST", { email, password });
                
                // If successful, save the JWT token and user info into localStorage
                saveSession(response);
                
                // Redirect the user to their dashboard!
                window.location.href = "dashboard.html";
            } catch (err) {
                // If the backend returns an error (e.g. 401 Unauthorized), show it
                showAlert("loginError", err.message);
            } finally {
                // Always reset the button state, whether it succeeded or failed
                btn.disabled = false;
                btn.textContent = "Login";
            }
        });
    }

    // ---------- REGISTER FORM LOGIC ----------
    const registerForm = document.getElementById("registerForm");
    
    // Check if we are on the register.html page
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            hideAlert("registerError");

            // Gather all the required fields for registration
            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            const role = document.getElementById("role").value;

            // Basic client-side validation so we don't bother the server unnecessarily
            if (password.length < 6) {
                showAlert("registerError", "Password must be at least 6 characters");
                return;
            }

            const btn = document.getElementById("registerBtn");
            btn.disabled = true;
            btn.textContent = "Creating account...";

            try {
                // Register the user via API
                const response = await apiRequest("/auth/register", "POST", { name, email, password, role });
                
                // The API conveniently returns a token on register, so we log them in instantly
                saveSession(response);
                window.location.href = "dashboard.html";
            } catch (err) {
                // Handle complex validation errors from the backend (like "Email already in use")
                let msg = err.message;
                if (err.details && err.details.length > 0) {
                    msg = err.details.join(", ");
                }
                showAlert("registerError", msg);
            } finally {
                btn.disabled = false;
                btn.textContent = "Create Account";
            }
        });
    }
});