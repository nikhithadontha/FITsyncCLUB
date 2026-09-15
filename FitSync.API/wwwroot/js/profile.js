/* =====================================================
   FITSYNC USER PROFILE & MY BOOKINGS (SECTIONS 17 & 18)
===================================================== */

const storedUser = localStorage.getItem("fitsyncUser");
if (!storedUser) {
    window.location.href = "login.html";
}

let currentUser = null;
try {
    currentUser = JSON.parse(storedUser);
} catch (e) {
    console.error("Error reading user:", e);
}

const currentUserId = currentUser ? currentUser.id : null;

// Admin link
const adminNavLink = document.getElementById("adminNavLink");
if (adminNavLink && currentUser && currentUser.role === "Admin") {
    adminNavLink.style.display = "inline-block";
}

// Logout
document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("fitsyncUser");
    if (typeof showToast === "function") {
        showToast("Logged out successfully.", "info");
    }
    setTimeout(() => { window.location.href = "login.html"; }, 500);
});

// Load on DOM ready
document.addEventListener("DOMContentLoaded", () => {
    loadUserProfile();
    loadUserSubscription();
    loadUserBookings();

    // Dynamic BMI calculation
    const hInput = document.getElementById("profHeight");
    const wInput = document.getElementById("profWeight");
    hInput?.addEventListener("input", calculateBMI);
    wInput?.addEventListener("input", calculateBMI);

    // Profile photo preview
    document.getElementById("profPhotoUrl")?.addEventListener("input", (e) => {
        updateAvatarPreview(e.target.value);
    });

    // Profile form submit
    document.getElementById("profileForm")?.addEventListener("submit", handleSaveProfile);
});

/* =====================================================
   1. LOAD PROFILE (SECTION 17)
===================================================== */
async function loadUserProfile() {
    if (!currentUserId) return;

    try {
        const res = await fetch(`/api/account/profile/${currentUserId}`, {
            headers: {
                "x-user-id": currentUserId.toString()
            }
        });

        if (!res.ok) {
            if (typeof showToast === "function") {
                showToast("Unable to load profile data.", "error");
            }
            return;
        }

        const user = await res.json();

        // Hero info
        const heroName = document.getElementById("heroFullName");
        const heroEmail = document.getElementById("heroEmail");
        const roleBadge = document.getElementById("roleBadge");

        const name = user.fullName || "Member";
        if (heroName) heroName.innerHTML = `${name} <span class="role-badge" id="roleBadge">${user.role || 'User'}</span>`;
        if (heroEmail) heroEmail.textContent = `${user.email} • Mobile: ${user.phoneNumber || 'N/A'}`;

        // Avatar Image & Letter
        updateAvatarPreview(user.profileImage, name);

        // Split Full Name into First and Last Name
        const nameParts = (user.fullName || "").trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        setVal("profFirstName", firstName);
        setVal("profLastName", lastName);
        setVal("profEmail", user.email || "");
        setVal("profPhoneNumber", user.phoneNumber || "");
        setVal("profAge", user.age || "");
        setVal("profGender", user.gender || "Male");
        setVal("profHeight", user.heightCm || "");
        setVal("profWeight", user.weightKg || "");
        setVal("profGoal", user.fitnessGoal || "General Fitness");
        setVal("profLevel", user.fitnessLevel || "Beginner");
        setVal("profDiet", user.dietPreference || "Vegetarian");
        setVal("profPreferredWorkout", user.preferredWorkout || "Strength Training");
        setVal("profPhotoUrl", user.profileImage || "");

        calculateBMI();

    } catch (err) {
        console.error("Error loading profile:", err);
    }
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

function updateAvatarPreview(url, fallbackName = "") {
    const img = document.getElementById("heroAvatarImg");
    const letter = document.getElementById("heroAvatarLetter");
    const displayName = fallbackName || (currentUser ? currentUser.fullName : "User");

    if (url && url.trim().startsWith("http")) {
        if (img) {
            img.src = url.trim();
            img.style.display = "block";
            img.onerror = () => {
                img.style.display = "none";
                if (letter) letter.style.display = "block";
            };
        }
        if (letter) letter.style.display = "none";
    } else {
        if (img) img.style.display = "none";
        if (letter) {
            letter.textContent = displayName.charAt(0).toUpperCase();
            letter.style.display = "block";
        }
    }
}

/* =====================================================
   2. DYNAMIC BMI CALCULATION
===================================================== */
function calculateBMI() {
    const h = parseFloat(document.getElementById("profHeight")?.value) || 0;
    const w = parseFloat(document.getElementById("profWeight")?.value) || 0;

    const bmiValEl = document.getElementById("bmiValue");
    const bmiBadgeEl = document.getElementById("bmiCategory");

    if (h > 0 && w > 0) {
        const heightMeters = h / 100;
        const bmi = (w / (heightMeters * heightMeters)).toFixed(1);
        if (bmiValEl) bmiValEl.textContent = bmi;

        if (bmiBadgeEl) {
            if (bmi < 18.5) {
                bmiBadgeEl.textContent = "Underweight";
                bmiBadgeEl.style.color = "#f59e0b";
            } else if (bmi < 25) {
                bmiBadgeEl.textContent = "Normal Weight (Optimal)";
                bmiBadgeEl.style.color = "#10b981";
            } else if (bmi < 30) {
                bmiBadgeEl.textContent = "Overweight";
                bmiBadgeEl.style.color = "#f59e0b";
            } else {
                bmiBadgeEl.textContent = "Obese";
                bmiBadgeEl.style.color = "#fb7185";
            }
        }
    } else {
        if (bmiValEl) bmiValEl.textContent = "--";
        if (bmiBadgeEl) bmiBadgeEl.textContent = "Enter height & weight";
    }
}

/* =====================================================
   3. SAVE PROFILE (SECTION 17: USER ISOLATION)
===================================================== */
async function handleSaveProfile(e) {
    e.preventDefault();

    const firstName = document.getElementById("profFirstName")?.value.trim() || "";
    const lastName = document.getElementById("profLastName")?.value.trim() || "";
    const fullName = `${firstName} ${lastName}`.trim();

    const payload = {
        userId: currentUserId,
        fullName: fullName,
        phoneNumber: document.getElementById("profPhoneNumber")?.value.trim(),
        age: document.getElementById("profAge")?.value,
        gender: document.getElementById("profGender")?.value,
        heightCm: document.getElementById("profHeight")?.value,
        weightKg: document.getElementById("profWeight")?.value,
        fitnessGoal: document.getElementById("profGoal")?.value,
        fitnessLevel: document.getElementById("profLevel")?.value,
        dietPreference: document.getElementById("profDiet")?.value,
        preferredWorkout: document.getElementById("profPreferredWorkout")?.value,
        profileImage: document.getElementById("profPhotoUrl")?.value.trim() || null
    };

    try {
        const res = await fetch("/api/account/profile", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "x-user-id": currentUserId.toString()
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok) {
            // Update cached session user
            if (currentUser) {
                currentUser.fullName = fullName;
                currentUser.phoneNumber = payload.phoneNumber;
                localStorage.setItem("fitsyncUser", JSON.stringify(currentUser));
            }
            if (typeof showToast === "function") {
                showToast("Profile details updated successfully!", "success");
            }
            loadUserProfile();
        } else {
            if (typeof showToast === "function") {
                showToast(data.message || "Failed to update profile.", "error");
            }
        }
    } catch (err) {
        console.error("Save profile error:", err);
    }
}

/* =====================================================
   4. LOAD USER SUBSCRIPTION
===================================================== */
async function loadUserSubscription() {
    const container = document.getElementById("subscriptionContainer");
    if (!container || !currentUserId) return;

    try {
        const res = await fetch(`/api/subscription/user/${currentUserId}`);
        if (!res.ok) return;

        const data = await res.json();

        if (data.hasActiveSubscription && data.activeSubscription) {
            const sub = data.activeSubscription;
            const expDate = new Date(sub.endDate).toLocaleDateString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric'
            });

            container.innerHTML = `
                <div class="subscription-box">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span style="font-size:18px; font-weight:800; color:#f0f6fc;">${sub.planName}</span>
                        <span class="pill-badge offline">✓ Active Membership</span>
                    </div>
                    <p style="font-size:13px; color:#8b949e; margin-bottom:6px;"><strong>Valid Until:</strong> ${expDate}</p>
                    <p style="font-size:13px; color:#8b949e; margin-bottom:12px;"><strong>Fee:</strong> ${sub.price > 0 ? '₹' + sub.price : 'Free Trial'}</p>
                    <button class="cancel-btn" onclick="cancelActiveSubscription()">
                        Cancel Subscription
                    </button>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="subscription-box" style="border-style:dashed;">
                    <div style="font-size:16px; font-weight:700; color:#f0f6fc; margin-bottom:6px;">No Active Subscription</div>
                    <p style="color:#8b949e; font-size:13px; margin-bottom:12px;">
                        Upgrade to unlock unlimited 1:1 trainer sessions, live classes, and custom nutrition plans.
                    </p>
                    <a href="dashboard.html#planList" style="color:#06b6d4; font-size:13px; text-decoration:none; font-weight:700;">
                        View Membership Plans →
                    </a>
                </div>
            `;
        }
    } catch (err) {
        console.error("Subscription load error:", err);
    }
}

window.cancelActiveSubscription = async function () {
    if (!confirm("Are you sure you want to cancel your current active subscription?")) return;

    try {
        const res = await fetch("/api/subscription/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUserId })
        });

        const data = await res.json();
        if (res.ok) {
            if (typeof showToast === "function") {
                showToast(data.message || "Subscription cancelled.", "success");
            }
            loadUserSubscription();
        } else {
            if (typeof showToast === "function") {
                showToast(data.message || "Could not cancel subscription.", "error");
            }
        }
    } catch (err) {
        console.error("Cancel sub error:", err);
    }
};

/* =====================================================
   5. LOAD MY BOOKINGS (SECTION 18)
===================================================== */
async function loadUserBookings() {
    const classContainer = document.getElementById("classBookingsList");
    const trainerContainer = document.getElementById("trainerBookingsList");
    if (!currentUserId) return;

    try {
        const res = await fetch(`/api/booking/my-bookings/${currentUserId}`, {
            headers: {
                "x-user-id": currentUserId.toString()
            }
        });

        if (!res.ok) return;

        const data = await res.json();
        const classes = data.classes || [];
        const trainers = data.trainers || [];

        // 1. Render Class Bookings (Class, Category, Trainer, Date, Time, Online/Offline, Facility, Status)
        if (classContainer) {
            if (classes.length === 0) {
                classContainer.innerHTML = `<p style="color:#8b949e; font-size:13px; padding:16px 0;">No class bookings scheduled. Explore fitness classes on the dashboard!</p>`;
            } else {
                classContainer.innerHTML = "";
                classes.forEach(c => {
                    const item = document.createElement("div");
                    item.className = "booking-card-item";

                    const isOnline = !!c.isOnline;
                    const statusClass = (c.status || "Confirmed").toLowerCase();

                    item.innerHTML = `
                        <div class="booking-info">
                            <h4>${c.className || c.class}</h4>
                            <div class="booking-meta-line">
                                <span>🏋️ <strong>${c.category}</strong></span>
                                <span>👨‍🏫 Trainer: <strong>${c.trainerName || c.trainer}</strong></span>
                                <span>📅 Date: <strong>${c.date}</strong></span>
                                <span>⏰ Time: <strong>${c.time}</strong></span>
                            </div>
                            <div class="booking-meta-line" style="margin-top:6px;">
                                <span class="pill-badge ${isOnline ? 'online' : 'offline'}">
                                    ${isOnline ? '🌐 Online' : '🏢 Offline'}
                                </span>
                                <span>📍 Facility: <strong>${c.facility || (isOnline ? 'Online Studio 1' : 'Studio A')}</strong></span>
                                <span class="pill-badge ${statusClass}">● ${c.status || 'Confirmed'}</span>
                            </div>
                            ${isOnline && c.meetLink ? `
                                <div><a href="${c.meetLink}" target="_blank" class="meet-link-btn">🔗 Join Live Studio →</a></div>
                            ` : ''}
                        </div>
                        <div>
                            ${c.status === 'Confirmed' ? `
                                <button class="cancel-btn" onclick="cancelClassBooking(${c.classBookingId})">
                                    Cancel
                                </button>
                            ` : ''}
                        </div>
                    `;
                    classContainer.appendChild(item);
                });
            }
        }

        // 2. Render Trainer Bookings (Trainer, Date, Time, Facility, Status)
        if (trainerContainer) {
            if (trainers.length === 0) {
                trainerContainer.innerHTML = `<p style="color:#8b949e; font-size:13px; padding:16px 0;">No 1:1 trainer sessions booked. Book a trainer on the dashboard!</p>`;
            } else {
                trainerContainer.innerHTML = "";
                trainers.forEach(t => {
                    const item = document.createElement("div");
                    item.className = "booking-card-item";
                    const statusClass = (t.status || "Confirmed").toLowerCase();

                    item.innerHTML = `
                        <div class="booking-info">
                            <h4>Trainer: ${t.trainerName || t.trainer}</h4>
                            <div class="booking-meta-line">
                                <span>🎯 Specialization: <strong>${t.specialization || 'Fitness Coaching'}</strong></span>
                                <span>📅 Date: <strong>${t.date}</strong></span>
                                <span>⏰ Time: <strong>${t.time}</strong></span>
                            </div>
                            <div class="booking-meta-line" style="margin-top:6px;">
                                <span>📍 Facility: <strong>${t.facility}</strong></span>
                                <span class="pill-badge ${statusClass}">● ${t.status}</span>
                            </div>
                        </div>
                        <div>
                            ${t.status === 'Confirmed' ? `
                                <button class="cancel-btn" onclick="cancelTrainerBooking(${t.bookingId})">
                                    Cancel
                                </button>
                            ` : ''}
                        </div>
                    `;
                    trainerContainer.appendChild(item);
                });
            }
        }

    } catch (err) {
        console.error("Error loading user bookings:", err);
    }
}

window.cancelClassBooking = async function (id) {
    if (!confirm("Are you sure you want to cancel this class booking?")) return;

    try {
        const res = await fetch("/api/classes/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUserId, classBookingId: id })
        });
        if (res.ok) {
            if (typeof showToast === "function") showToast("Class booking cancelled.", "info");
            loadUserBookings();
        }
    } catch (err) {
        console.error("Cancel class error:", err);
    }
};

window.cancelTrainerBooking = async function (id) {
    if (!confirm("Are you sure you want to cancel this trainer session?")) return;

    try {
        const res = await fetch(`/api/booking/${id}/cancel`, {
            method: "POST"
        });
        if (res.ok) {
            if (typeof showToast === "function") showToast("Trainer session cancelled.", "info");
            loadUserBookings();
        }
    } catch (err) {
        console.error("Cancel trainer error:", err);
    }
};
