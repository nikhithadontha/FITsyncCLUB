/* =========================================================
   FITSYNC - AUTHENTICATION CONTROLLER
========================================================= */

/* =========================================================
   REAL GOOGLE OAUTH via Google Identity Services (GIS)
   --------------------------------------------------------
   Requires a Google Cloud Console OAuth 2.0 Client ID.
   Set window.GOOGLE_CLIENT_ID before this script loads,
   or update the fallback below with your client ID.
========================================================= */
const GOOGLE_CLIENT_ID = window.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

function triggerGoogleSignIn() {
    // If no real client ID is configured, use simulated login immediately
    if (GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com") {
        simulatedGoogleLogin();
        return;
    }

    // Real OAuth — check if GIS library loaded
    if (typeof google === "undefined" || !google.accounts) {
        if (typeof showToast === "function") {
            showToast("Google sign-in library is loading. Please try again in a moment.", "warning");
        }
        return;
    }

    const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: "email profile",
        callback: async (tokenResponse) => {
            if (tokenResponse.error) {
                if (typeof showToast === "function") showToast("Google sign-in cancelled.", "warning");
                return;
            }

            // Fetch user info from Google using the access token
            try {
                const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const gUser = await userInfoRes.json();

                // Send to our server for account creation/login
                const res = await fetch("/api/account/google-login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: gUser.email,
                        name: gUser.name,
                        googleId: gUser.sub
                    })
                });

                const data = await res.json();
                if (res.ok && data.user) {
                    localStorage.setItem("fitsyncUser", JSON.stringify(data.user));
                    if (typeof showToast === "function") {
                        showToast(`Signed in as ${data.user.fullName}!`, "success");
                    }
                    setTimeout(() => { window.location.href = "dashboard.html"; }, 800);
                } else {
                    if (typeof showToast === "function") showToast("Google authentication failed.", "error");
                }
            } catch (err) {
                console.error("Google sign-in error:", err);
                if (typeof showToast === "function") showToast("Connection error during Google sign-in.", "error");
            }
        }
    });

    tokenClient.requestAccessToken();
}

// Fallback simulated Google login (when no client ID is configured)
async function simulatedGoogleLogin() {
    try {
        const res = await fetch("/api/account/google-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "google.member@fitsync.com",
                name: "Google Athlete",
                googleId: "gid-12345"
            })
        });

        const data = await res.json();
        if (res.ok && data.user) {
            localStorage.setItem("fitsyncUser", JSON.stringify(data.user));
            if (typeof showToast === "function") {
                showToast(`Signed in with Google as ${data.user.fullName}!`, "success");
            }
            setTimeout(() => { window.location.href = "dashboard.html"; }, 800);
        } else {
            if (typeof showToast === "function") showToast("Google authentication failed.", "error");
        }
    } catch {
        if (typeof showToast === "function") showToast("Server connection error.", "error");
    }
}

/* =========================================================
   REGISTER SUBMIT
======================================================== */
const registerForm = document.getElementById("registerForm");

// Restrict the phone field to digits only, as the user types/pastes
const phoneNumberInput = document.getElementById("phoneNumber");
if (phoneNumberInput) {
    phoneNumberInput.addEventListener("input", function () {
        let value = this.value.trim();
        if (value.startsWith("+")) {
            value = "+" + value.slice(1).replace(/\D/g, "");
        } else {
            value = value.replace(/\D/g, "");
        }
        if (value.startsWith("+91")) value = "+91" + value.slice(3).slice(0, 10);
        else value = value.slice(0, 10);
        this.value = value;
    });
    phoneNumberInput.addEventListener("paste", function (e) {
        e.preventDefault();
        let pasted = (e.clipboardData || window.clipboardData).getData("text").trim();
        pasted = pasted.startsWith("+91")
            ? "+91" + pasted.slice(3).replace(/\D/g, "").slice(0, 10)
            : pasted.replace(/\D/g, "").slice(0, 10);
        this.value = pasted;
    });
}

// Normalize Indian mobile numbers to the backend format: exactly 10 digits.
// Accepts either 9876543210 or +919876543210.
function normalizePhoneNumber(value) {
    let phone = String(value ?? "").trim().replace(/[\s()-]/g, "");

    if (phone.startsWith("+91")) {
        phone = phone.slice(3);
    } else if (phone.startsWith("91") && phone.length === 12) {
        phone = phone.slice(2);
    }

    return phone.replace(/\D/g, "").slice(0, 10);
}

// Rejects missing numbers, wrong length, numbers starting with 0,
// and placeholder numbers like "0000000000" or "1111111111"
function isValidPhoneNumber(phoneNumber) {
    if (!/^\d{10}$/.test(phoneNumber)) return false;
    if (phoneNumber[0] === "0") return false;
    if (/^(\d)\1{9}$/.test(phoneNumber)) return false;
    return true;
}

if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const fullName = document.getElementById("fullName").value.trim();
        const email = document.getElementById("email").value.trim();
        const enteredPhoneNumber = document.getElementById("phoneNumber").value.trim();
        const phoneNumber = normalizePhoneNumber(enteredPhoneNumber);
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (!fullName || !email || !phoneNumber || !password) {
            if (typeof showToast === "function") {
                showToast("Please fill in all required fields.", "warning");
            }
            return;
        }

        if (!isValidPhoneNumber(phoneNumber)) {
            if (typeof showToast === "function") {
                showToast("Please enter a valid 10-digit mobile number.", "error");
            }
            return;
        }

        if (password !== confirmPassword) {
            if (typeof showToast === "function") {
                showToast("Passwords do not match.", "error");
            }
            return;
        }

        try {
            const response = await fetch("/api/account/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName,
                    email,
                    phoneNumber,
                    password,
                    confirmPassword
                })
            });

            const responseText = await response.text();
            let data = {};
            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch (parseError) {
                console.error("Registration response was not valid JSON:", responseText, parseError);
            }

            if (!response.ok) {
                if (typeof showToast === "function") {
                    showToast(data.message || "Registration failed.", "error");
                }
                return;
            }

            if (typeof showToast === "function") {
                showToast(`Registration successful, ${fullName}! Redirecting...`, "success");
            }

            // Redirect after the success toast has been rendered.
            // Use an absolute path so the redirect also works when the page
            // is opened from a nested URL.
            setTimeout(() => {
                window.location.assign("/login.html");
            }, 1000);

        } catch (error) {
            console.error("Registration error:", error);
            if (typeof showToast === "function") {
                showToast("Unable to connect to the server.", "error");
            }
        }
    });
}

/* =========================================================
   LOGIN SUBMIT
========================================================= */
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        if (!email || !password) {
            if (typeof showToast === "function") {
                showToast("Please enter both email and password.", "warning");
            }
            return;
        }

        const loginBtn = document.getElementById("loginBtn");
        const originalBtnText = loginBtn ? loginBtn.textContent : "Login";
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.textContent = "Verifying...";
        }

        try {
            const response = await fetch("/api/account/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                if (typeof showToast === "function") {
                    showToast(data.message || "Invalid email or password.", "error");
                }
                if (loginBtn) {
                    loginBtn.disabled = false;
                    loginBtn.textContent = originalBtnText;
                }
                return;
            }

            let user = data.user || {
                id: data.id,
                fullName: data.fullName,
                email: data.email,
                phoneNumber: data.phoneNumber,
                role: data.role || "User"
            };

            // If user explicitly chose Admin Portal login, ensure account has Admin privileges
            if (window.currentLoginRole === "admin" && user.role !== "Admin") {
                if (typeof showToast === "function") {
                    showToast("Access Denied: This account does not have administrator privileges.", "error");
                }
                if (loginBtn) {
                    loginBtn.disabled = false;
                    loginBtn.textContent = originalBtnText;
                }
                return;
            }

            localStorage.setItem("fitsyncUser", JSON.stringify(user));

            if (typeof showToast === "function") {
                if (user.role === "Admin") {
                    showToast(`Welcome Administrator, ${user.fullName}!`, "success");
                } else {
                    showToast(`Welcome back, ${user.fullName}!`, "success");
                }
            }

            setTimeout(() => {
                if (user.role === "Admin") {
                    window.location.href = "admin.html";
                } else {
                    window.location.href = "dashboard.html";
                }
            }, 800);

        } catch (error) {
            console.error("Login error:", error);
            if (typeof showToast === "function") {
                showToast("Unable to connect to the server.", "error");
            }
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.textContent = originalBtnText;
            }
        }
    });
}

/* =========================================================
   SHOW / HIDE PASSWORD TOGGLE
========================================================= */
function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    if (!input) return;

    if (input.type === "password") {
        input.type = "text";
        button.textContent = "🙈";
        button.setAttribute("aria-label", "Hide password");
    } else {
        input.type = "password";
        button.textContent = "👁";
        button.setAttribute("aria-label", "Show password");
    }
}