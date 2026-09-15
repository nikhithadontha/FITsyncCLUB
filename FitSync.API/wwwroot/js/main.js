/* =========================================
   FITSYNC - MAIN JAVASCRIPT
========================================= */

// START WORKOUT
function startWorkout() {
    document.getElementById("workouts").scrollIntoView({
        behavior: "smooth"
    });
}


// EXPLORE PLANS
function explorePlans() {
    document.getElementById("diet").scrollIntoView({
        behavior: "smooth"
    });
}


// SELECT WORKOUT
function selectWorkout(workout) {

    const storedUser = localStorage.getItem("fitsyncUser");

    if (!storedUser) {
        window.location.href = "login.html";
        return;
    }

    window.location.href =
        "workout.html?category=" + encodeURIComponent(workout);
}


// VIEW DIET
function viewDiet(meal) {
    if (typeof showToast === "function") {
        showToast(`${meal} plan selected! Redirecting to Diet section...`, "info");
    }
    setTimeout(() => { window.location.href = "diet.html"; }, 800);
}


// LOGIN
function goToLogin() {
    window.location.href = "login.html";
}


// REGISTER
function goToRegister() {
    window.location.href = "register.html";
}


// =========================================
// SHOW LOGGED-IN USER
// =========================================

function displayLoggedInUser() {

    const authButtons = document.getElementById("authButtons");

    if (!authButtons) {
        return;
    }

    const storedUser = localStorage.getItem("fitsyncUser");

    // User is not logged in
    if (!storedUser) {
        return;
    }

    try {

        const user = JSON.parse(storedUser);

        if (user && user.fullName) {

            authButtons.innerHTML = `
                <div class="user-menu">
                    <button class="user-btn" onclick="toggleUserMenu()" data-initials="${user.fullName.charAt(0).toUpperCase()}">
                        ${user.fullName.split(' ')[0]}
                    </button>

                    <div class="user-dropdown" id="userDropdown">

                        <div class="user-info">
                            <strong>${user.fullName}</strong>
                            <span>${user.email}</span>
                        </div>

                        <hr>

                        <button onclick="window.location.href='dashboard.html'">
                            🏠 Dashboard
                        </button>

                        ${user.role === 'Admin' ? `
                        <button onclick="window.location.href='admin.html'" style="color: #fb7185; font-weight: 700;">
                            🛡️ Admin Portal
                        </button>` : ''}

                        <button onclick="goToProfile()">
                            👤 My Profile
                        </button>

                        <button onclick="logoutUser()">
                            ⎋ Logout
                        </button>

                    </div>
                </div>
            `;

            // Show nav links that are hidden by default on the home page
            const dashNav = document.getElementById('dashNavLink');
            const profileNav = document.getElementById('profileNavLink');
            const adminNav = document.getElementById('adminNavLink');
            if (dashNav) dashNav.style.display = 'inline-block';
            if (profileNav) profileNav.style.display = 'inline-block';
            if (adminNav && user.role === 'Admin') adminNav.style.display = 'inline-block';
        }

    } catch (error) {

        console.error("Unable to read logged-in user:", error);

        localStorage.removeItem("fitsyncUser");
    }
}


// =========================================
// USER DROPDOWN
// =========================================

function toggleUserMenu() {

    const dropdown = document.getElementById("userDropdown");

    if (!dropdown) {
        return;
    }

    dropdown.classList.toggle("show");
}


// =========================================
// PROFILE
// =========================================

function goToProfile() {

    window.location.href = "profile.html";
}


// =========================================
// LOGOUT
// =========================================

function logoutUser() {

    localStorage.removeItem("fitsyncUser");

    window.location.href = "index.html";
}


// =========================================
// HIGHLIGHT ACTIVE NAVIGATION ITEM
// =========================================

const navLinks = document.querySelectorAll(".navbar nav a");

navLinks.forEach(function (link) {

    link.addEventListener("click", function () {

        navLinks.forEach(function (item) {
            item.classList.remove("active");
        });

        this.classList.add("active");

    });

});


// =========================================
// RUN WHEN PAGE LOADS
// =========================================

displayLoggedInUser();