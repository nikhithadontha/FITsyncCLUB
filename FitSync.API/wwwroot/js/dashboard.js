/* =====================================================
   FITSYNC DASHBOARD CONTROLLER
===================================================== */

/* ==============================
   CHECK LOGIN & ROLE
============================== */
const storedUser = localStorage.getItem("fitsyncUser");
if (!storedUser) {
    window.location.href = "index.html";
}

let currentUser = null;
try {
    currentUser = JSON.parse(storedUser);
} catch (error) {
    console.error("Unable to read user information:", error);
}

const currentUserId = currentUser ? currentUser.id : null;

// Welcome text
if (currentUser) {
    const welcomeHeading = document.querySelector(".hero-band h1");
    if (welcomeHeading) {
        welcomeHeading.textContent = `Welcome back, ${currentUser.fullName || "there"}! 👋`;
    }
}

// Show admin portal link if user is Admin
const adminNavLink = document.getElementById("adminNavLink");
if (adminNavLink && currentUser && currentUser.role === "Admin") {
    adminNavLink.style.display = "inline-block";
}

// Logout
const logoutBtn = document.getElementById("logoutBtn");
logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("fitsyncUser");
    if (typeof showToast === "function") {
        showToast("Logged out successfully.", "info");
    }
    setTimeout(() => { window.location.href = "index.html"; }, 500);
});

/* ==============================
   PROGRESS STATS
============================== */
async function loadProgressStats() {
    if (!currentUserId) return;

    try {
        const response = await fetch(`/api/workout/progress/${currentUserId}`);
        if (!response.ok) return;

        const data = await response.json();
        const statCards = document.querySelectorAll(".stat-card h2");

        if (statCards.length >= 3 && data.summary) {
            statCards[0].textContent = data.summary.totalCalories ?? 0;
            statCards[1].textContent = data.summary.totalMinutes ?? 0;
            statCards[2].textContent = data.summary.dayStreak ?? 0;
        }
    } catch (error) {
        console.error("Unable to load progress stats:", error);
    }
}
loadProgressStats();

/* ==============================
   QUICK ACTION BUTTONS
============================== */
document.querySelectorAll(".quick-actions button").forEach(button => {
    button.addEventListener("click", () => {
        const text = button.textContent.trim();
        if (text.includes("Workout")) {
            window.location.href = "workout.html?category=Strength";
        } else if (text.includes("Diet")) {
            window.location.href = "diet.html";
        } else if (text.includes("Progress")) {
            window.location.href = "progress.html";
        }
    });
});

/* ==============================
   FITNESS CLASSES BUTTONS
============================== */
function mapCardTitleToCategory(title) {
    // Keep every dashboard class clickable. Categories that do not yet have
    // their own database workout are mapped to the closest supported workout
    // category so the existing workout/session API contract is preserved.
    const categoryMap = {
        "Strength Training": "Strength",
        "Cardio": "Cardio",
        "Yoga": "Yoga",
        "HIIT": "HIIT",
        "Stretching": "Yoga",
        "Dance Fitness": "Cardio",
        "Boxing Fitness": "Boxing",
        "Pilates": "Pilates",
        "Cycling": "Cardio",
        "Running": "Cardio",
        "Core Training": "Strength",
        "Mobility": "Yoga"
    };

    return categoryMap[title] || null;
}

document.querySelectorAll(".class-btn").forEach(button => {
    button.addEventListener("click", () => {
        const classCard = button.closest(".class-card");
        const className = classCard?.querySelector("h3")?.textContent?.trim() || "";
        const category = mapCardTitleToCategory(className);

        if (category) {
            window.location.href = `workout.html?category=${encodeURIComponent(category)}`;
        } else {
            if (typeof showToast === "function") {
                showToast(`${className} is coming soon to live streaming!`, "info");
            }
        }
    });
});

/* ==============================
   TRAINER BOOKINGS
============================== */
const trainerListEl = document.getElementById("trainerList");
const bookingsListEl = document.getElementById("bookingsList");

const trainerAvatars = {
    1: "https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=400&q=80",
    2: "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=400&q=80",
    3: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    4: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    5: "https://images.unsplash.com/photo-1583468982228-19f19164aee2?auto=format&fit=crop&w=400&q=80",
    6: "https://images.unsplash.com/photo-1583468982228-19f19164aee2?auto=format&fit=crop&w=400&q=80"
};

/* Render star rating as filled/half/empty stars */
function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

async function loadTrainers() {
    if (!trainerListEl) return;

    try {
        const res = await fetch("/api/trainer");
        if (!res.ok) {
            trainerListEl.innerHTML = "<p style='color:#94a3b8;'>Unable to load trainers right now.</p>";
            return;
        }

        const trainers = await res.json();
        if (!trainers.length) {
            trainerListEl.innerHTML = "<p style='color:#94a3b8;'>No trainers available currently.</p>";
            return;
        }

        trainerListEl.innerHTML = trainers.map(t => {
            const avatarUrl = t.profilePhoto || trainerAvatars[t.trainerId] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
            const rating = t.rating || 4.5;
            const reviews = t.totalReviews || 0;
            const stars = renderStars(rating);
            return `
            <div class="trainer-card" id="trainer-card-${t.trainerId}">
                <div class="trainer-header">
                    <img src="${avatarUrl}" alt="${t.fullName}" class="trainer-avatar-img" loading="lazy" />
                    <div>
                        <h3>${t.fullName}</h3>
                        <p class="trainer-spec">🎯 ${t.specialization}</p>
                        <p class="trainer-exp">⚡ ${t.experienceYears} years experience</p>
                        <div class="trainer-rating-row">
                            <span class="stars">${stars}</span>
                            <span class="rating-val">${rating.toFixed(1)}</span>
                            <span class="rating-reviews">(${reviews} reviews)</span>
                        </div>
                    </div>
                </div>
                <p class="trainer-bio">${t.bio ?? ""}</p>
                <div class="slots-container" id="slots-${t.trainerId}">
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        <button class="view-slots-btn" onclick="loadTrainerSlots(${t.trainerId})">
                            View Available Slots
                        </button>
                        <button class="view-slots-btn" onclick="openTrainerProfile(${t.trainerId})" style="background:rgba(184,255,61,0.1); border-color:rgba(184,255,61,0.3); color:#b8ff3d;">
                            Know More
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join("");

    } catch (err) {
        console.error("Trainers load error:", err);
    }
}

/* Open trainer profile in a new tab, storing the current page so "Back to Home" works */
window.openTrainerProfile = function (trainerId) {
    sessionStorage.setItem('trainerReturnPage', window.location.href);
    window.open('trainer.html?id=' + trainerId, '_blank');
};

window.loadTrainerSlots = async function (trainerId) {
    const container = document.getElementById(`slots-${trainerId}`);
    if (!container) return;

    container.innerHTML = `<span style="font-size:12px; color:#8b949e;">Checking availability...</span>`;

    try {
        const res = await fetch(`/api/trainer/${trainerId}/slots`);
        if (!res.ok) {
            container.innerHTML = `<p style="font-size:12px; color:#fb7185;">Could not load slots.</p>`;
            return;
        }

        const slots = await res.json();
        if (!slots.length) {
            container.innerHTML = `<p style="font-size:12px; color:#8b949e;">No open slots today.</p>`;
            return;
        }

        container.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
                ${slots.map(s => {
                    const dateStr = new Date(s.slotDate).toLocaleDateString(undefined, { month: "short", day: "numeric" });
                    return `
                        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(13,17,23,0.6); padding:8px 12px; border-radius:8px; border:1px solid rgba(48,54,61,0.5);">
                            <span style="font-size:12px; color:#c9d1d9;">📅 ${dateStr} • ${s.startTime.slice(0,5)}</span>
                            <button onclick="bookTrainerSlot(${s.slotId})" style="background:#06b6d4; color:#000; border:none; border-radius:6px; padding:4px 10px; font-size:11px; font-weight:700; cursor:pointer;">
                                Book Slot
                            </button>
                        </div>
                    `;
                }).join("")}
            </div>
        `;
    } catch (err) {
        console.error("Slots error:", err);
    }
};

window.bookTrainerSlot = async function (slotId) {
    if (!currentUserId) {
        if (typeof showToast === "function") showToast("Please login to book a session.", "error");
        return;
    }

    try {
        const res = await fetch("/api/booking", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUserId, slotId })
        });

        const data = await res.json();
        if (res.ok) {
            if (typeof showToast === "function") showToast(data.message || "Session booked successfully! 🎉", "success");
            loadTrainers();
            loadUserBookings();
        } else {
            if (typeof showToast === "function") showToast(data.message || "Failed to book slot.", "error");
        }
    } catch (err) {
        console.error("Booking error:", err);
    }
};

async function loadUserBookings() {
    if (!bookingsListEl || !currentUserId) return;

    try {
        const res = await fetch(`/api/booking/my-bookings/${currentUserId}`);
        if (!res.ok) return;

        const data = await res.json();
        const trainers = data.trainers || [];
        const classes = data.classes || [];

        if (trainers.length === 0 && classes.length === 0) {
            bookingsListEl.innerHTML = `<p style="color:#8b949e; font-size:13px;">No active bookings found. Book a trainer or class above!</p>`;
            return;
        }

        let html = "";
        classes.forEach(c => {
            html += `
                <div class="booking-card" style="padding:14px; background:rgba(22,27,34,0.8); border:1px solid rgba(48,54,61,0.6); border-radius:10px; margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h4 style="color:#f0f6fc; font-size:15px; margin-bottom:2px;">${c.className}</h4>
                            <p style="color:#8b949e; font-size:12px;">${c.scheduleTime} • Coach: ${c.trainerName}</p>
                            <span style="font-size:11px; padding:2px 6px; border-radius:4px; background:rgba(6,182,212,0.15); color:#06b6d4; font-weight:700;">
                                ${c.isOnline ? 'Online Live' : 'In-Person Studio'}
                            </span>
                        </div>
                        <a href="profile.html" style="font-size:12px; color:#06b6d4; text-decoration:none;">Details →</a>
                    </div>
                </div>
            `;
        });

        trainers.forEach(t => {
            const dateStr = t.slotDate ? new Date(t.slotDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
            html += `
                <div class="booking-card" style="padding:14px; background:rgba(22,27,34,0.8); border:1px solid rgba(48,54,61,0.6); border-radius:10px; margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h4 style="color:#f0f6fc; font-size:15px; margin-bottom:2px;">1:1 Coach: ${t.trainerName}</h4>
                            <p style="color:#8b949e; font-size:12px;">📅 ${dateStr} at ${t.startTime} - ${t.endTime}</p>
                            <span style="font-size:11px; padding:2px 6px; border-radius:4px; background:rgba(16,185,129,0.15); color:#34d399; font-weight:700;">
                                ${t.status}
                            </span>
                        </div>
                        <a href="profile.html" style="font-size:12px; color:#06b6d4; text-decoration:none;">Manage →</a>
                    </div>
                </div>
            `;
        });

        bookingsListEl.innerHTML = html;

    } catch (err) {
        console.error("Bookings error:", err);
    }
}

/* ==============================
   MEMBERSHIP PLANS & STRICT SINGLE ACTIVE ENFORCEMENT
============================== */
const planListEl = document.getElementById("planList");
const activeSubBannerEl = document.getElementById("activeSubBanner");
const trialPromoCardEl = document.getElementById("trialPromoCard");

async function loadPlans() {
    if (!planListEl) return;

    try {
        // 1. Fetch user subscription status
        let userSubStatus = null;
        if (currentUserId) {
            const subRes = await fetch(`/api/subscription/user/${currentUserId}`);
            if (subRes.ok) userSubStatus = await subRes.json();
        }

        // Active subscription banner
        if (userSubStatus && userSubStatus.hasActiveSubscription && userSubStatus.activeSubscription) {
            const sub = userSubStatus.activeSubscription;
            const expDate = new Date(sub.endDate).toLocaleDateString();
            if (activeSubBannerEl) {
                activeSubBannerEl.style.display = "block";
                activeSubBannerEl.innerHTML = `
                    <div style="background:rgba(16, 185, 129, 0.12); border:1px solid rgba(16, 185, 129, 0.35); border-radius:12px; padding:16px 20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                        <div>
                            <span style="color:#10b981; font-size:12px; font-weight:700; text-transform:uppercase;">Current Active Membership</span>
                            <h4 style="color:#f0f6fc; font-size:18px; margin-top:2px;">${sub.planName}</h4>
                            <p style="color:#8b949e; font-size:13px;">Valid until: <strong>${expDate}</strong> • Single active membership policy enforced</p>
                        </div>
                        <button onclick="cancelActiveSubscription()" style="background:transparent; border:1px solid rgba(244,63,94,0.4); color:#fb7185; padding:8px 16px; border-radius:8px; cursor:pointer; font-weight:700;">
                            Cancel Subscription
                        </button>
                    </div>
                `;
            }
        } else {
            if (activeSubBannerEl) activeSubBannerEl.style.display = "none";
        }

        // 1-Day Free Trial card
        if (userSubStatus && !userSubStatus.hasUsedTrial && !userSubStatus.hasActiveSubscription) {
            if (trialPromoCardEl) {
                trialPromoCardEl.style.display = "block";
                trialPromoCardEl.innerHTML = `
                    <div style="background:linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(16, 185, 129, 0.12)); border:1px solid rgba(6, 182, 212, 0.35); border-radius:14px; padding:20px 24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
                        <div>
                            <span style="color:#06b6d4; font-size:12px; font-weight:700; text-transform:uppercase;">FitSync Complimentary Pass</span>
                            <h3 style="color:#f0f6fc; font-size:20px; margin:4px 0;">1-Day Free Gym Trial ⚡</h3>
                            <p style="color:#8b949e; font-size:13px;">Experience unlimited workout routines, online classes, and trainer schedules for 24 hours.</p>
                        </div>
                        <button onclick="activate1DayFreeTrial()" style="background:#06b6d4; color:#000; border:none; padding:10px 22px; border-radius:8px; font-weight:700; cursor:pointer;">
                            Activate Free Trial
                        </button>
                    </div>
                `;
            }
        } else {
            if (trialPromoCardEl) trialPromoCardEl.style.display = "none";
        }

        // 2. Fetch plans catalog
        const res = await fetch("/api/subscription/plans");
        if (!res.ok) return;

        const plans = await res.json();
        const hasActive = userSubStatus && userSubStatus.hasActiveSubscription;
        const activePlanId = userSubStatus?.activeSubscription?.planId;

        planListEl.innerHTML = plans.map(p => {
            const isThisActive = hasActive && (activePlanId === p.planId);
            return `
                <div class="plan-card ${isThisActive ? 'active-plan' : ''}">
                    <h3>${p.planName}</h3>
                    <p class="plan-price">
                        ₹${p.price} <span>/ ${p.durationDays} days</span>
                    </p>
                    <p>${p.description ?? ""}</p>
                    <button class="subscribe-btn ${isThisActive ? 'subscribed-btn' : ''}" 
                            data-plan-id="${p.planId}" 
                            onclick="subscribeToPlan(${p.planId})">
                        ${isThisActive ? 'Current Active Plan ✓' : (hasActive ? 'Upgrade Plan' : 'Subscribe')}
                    </button>
                </div>
            `;
        }).join("");

    } catch (err) {
        console.error("Plans load error:", err);
    }
}

window.subscribeToPlan = async function (planId) {
    if (!currentUserId) {
        if (typeof showToast === "function") showToast("Please login to subscribe.", "error");
        return;
    }

    try {
        const res = await fetch("/api/subscription/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUserId, planId })
        });

        const data = await res.json();

        if (res.status === 409) {
            // STRICT RULE: User already has an active subscription
            if (typeof showToast === "function") {
                showToast(data.message || "Active subscription already exists! Cancel your current plan before switching.", "warning");
            }
            return;
        }

        if (res.ok) {
            if (typeof showToast === "function") {
                showToast(data.message || "Subscribed successfully! 🎉", "success");
            }
            loadPlans();
        } else {
            if (typeof showToast === "function") {
                showToast(data.message || "Unable to subscribe.", "error");
            }
        }
    } catch (err) {
        console.error("Subscribe error:", err);
    }
};

window.cancelActiveSubscription = async function () {
    if (!confirm("Are you sure you want to cancel your active subscription?")) return;

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
            loadPlans();
        } else {
            if (typeof showToast === "function") {
                showToast(data.message || "Could not cancel subscription.", "error");
            }
        }
    } catch (err) {
        console.error("Cancel error:", err);
    }
};

window.activate1DayFreeTrial = async function () {
    try {
        const res = await fetch("/api/subscription/trial", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUserId })
        });

        const data = await res.json();
        if (res.ok) {
            if (typeof showToast === "function") {
                showToast(data.message || "1-Day Free Trial activated! Enjoy full gym access.", "success");
            }
            loadPlans();
        } else {
            if (typeof showToast === "function") {
                showToast(data.message || "Could not activate trial.", "error");
            }
        }
    } catch (err) {
        console.error("Trial error:", err);
    }
};

/* ==============================
   INITIALIZE
============================== */
document.addEventListener("DOMContentLoaded", () => {
    loadTrainers();
    loadUserBookings();
    loadPlans();
});