/* =====================================================
   FITSYNC PROGRESS & ANALYTICS CONTROLLER (SECTIONS 14, 15, 16)
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

// Admin link visibility
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

async function loadProgressData() {
    if (!currentUserId) return;

    try {
        const res = await fetch(`/api/workout/progress/${currentUserId}`, {
            headers: {
                "x-user-id": currentUserId.toString()
            }
        });

        if (!res.ok) {
            if (typeof showToast === "function") {
                showToast("Failed to fetch analytics data.", "error");
            }
            return;
        }

        const data = await res.json();
        const summary = data.summary || {};
        const last7Days = data.last7Days || [];
        const sevenDayWorkouts = data.sevenDayWorkouts || [];
        const completionBreakdown = data.completionBreakdown || {};
        const weeklyGoal = data.weeklyGoal || {};
        const recentWorkouts = data.recentWorkouts || [];

        // 1. Populate all 10 Progress Summary KPI Cards (Section 15)
        renderSummaryKPIs(summary);

        // 2. Render 4 Progress Charts (Section 16)
        renderDurationChart(last7Days);
        renderCaloriesChart(last7Days);
        renderCompletionDonut(completionBreakdown, summary);
        renderWeeklyGoalGauge(weeklyGoal, summary);

        // 3. Render 7-Day Itemized Workouts Table (Section 14)
        renderItemizedTable(sevenDayWorkouts);

        // 4. Render Recent Workout History
        renderRecentSessions(recentWorkouts);

    } catch (err) {
        console.error("Error loading progress analytics:", err);
    }
}

/* =====================================================
   1. 10 SUMMARY KPI CARDS (SECTION 15)
===================================================== */
function renderSummaryKPIs(s) {
    setText("kpiTotalWorkouts", s.totalWorkouts ?? 0);
    setText("kpiCompletedWorkouts", s.completedWorkouts ?? 0);
    setText("kpiIncompleteWorkouts", s.incompleteWorkouts ?? 0);
    setText("kpiTotalDuration", s.totalWorkoutDuration || "0 minutes");
    setText("kpiCaloriesBurned", `${s.caloriesBurned ?? 0} kcal`);
    setText("kpiClassesAttended", s.classesAttended ?? 0);
    setText("kpiClassesScheduled", s.classesScheduled ?? 0);
    setText("kpiTrainerSessions", s.trainerSessions ?? 0);
    setText("kpiCurrentSubscription", s.currentSubscription || "Active");
    setText("kpiWeeklyGoalProgress", s.weeklyGoalProgress || "0 / 5");
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

/* =====================================================
   2. CHARTS (SECTION 16)
===================================================== */

// Chart 1: Workout Duration (Past 7 Days)
function renderDurationChart(days) {
    const container = document.getElementById("durationChartContainer");
    if (!container) return;
    container.innerHTML = "";

    if (!days || days.length === 0) {
        container.innerHTML = `<p style="color:#8b949e; width:100%; text-align:center; padding:40px 0;">No duration data recorded yet.</p>`;
        return;
    }

    const maxMinutes = Math.max(30, ...days.map(d => d.minutes || 0));

    days.forEach(day => {
        const mins = day.minutes || 0;
        const heightPct = maxMinutes > 0 ? Math.max(8, Math.round((mins / maxMinutes) * 100)) : 8;

        const col = document.createElement("div");
        col.className = "bar-item";
        col.innerHTML = `
            <span class="bar-val-badge">${mins}m</span>
            <div class="bar-stick-wrap">
                <div class="bar-stick duration" style="height: ${heightPct}%;" title="${mins} min on ${day.dayOfWeek || day.dayName}"></div>
            </div>
            <span class="bar-day-name">${day.dayName}${day.isToday ? '*' : ''}</span>
        `;
        container.appendChild(col);
    });
}

// Chart 2: Calories Burned (Past 7 Days)
function renderCaloriesChart(days) {
    const container = document.getElementById("caloriesChartContainer");
    if (!container) return;
    container.innerHTML = "";

    if (!days || days.length === 0) {
        container.innerHTML = `<p style="color:#8b949e; width:100%; text-align:center; padding:40px 0;">No calorie data recorded yet.</p>`;
        return;
    }

    const maxCals = Math.max(300, ...days.map(d => d.calories || 0));

    days.forEach(day => {
        const cals = day.calories || 0;
        const heightPct = maxCals > 0 ? Math.max(8, Math.round((cals / maxCals) * 100)) : 8;

        const col = document.createElement("div");
        col.className = "bar-item";
        col.innerHTML = `
            <span class="bar-val-badge">${cals}</span>
            <div class="bar-stick-wrap">
                <div class="bar-stick calories" style="height: ${heightPct}%;" title="${cals} kcal on ${day.dayOfWeek || day.dayName}"></div>
            </div>
            <span class="bar-day-name">${day.dayName}${day.isToday ? '*' : ''}</span>
        `;
        container.appendChild(col);
    });
}

// Chart 3: Workout Completion (Completed vs Incomplete)
function renderCompletionDonut(breakdown, summary) {
    const comp = breakdown.completed !== undefined ? breakdown.completed : (summary.completedWorkouts || 0);
    const incomp = breakdown.incomplete !== undefined ? breakdown.incomplete : (summary.incompleteWorkouts || 0);
    const total = comp + incomp;
    const rate = total > 0 ? Math.round((comp / total) * 100) : 0;

    const circle = document.getElementById("completionCircle");
    const rateText = document.getElementById("completionRateText");
    const compLabel = document.getElementById("compCountLabel");
    const incompLabel = document.getElementById("incompCountLabel");

    if (circle) circle.setAttribute("stroke-dasharray", `${rate} ${100 - rate}`);
    if (rateText) rateText.textContent = `${rate}%`;
    if (compLabel) compLabel.textContent = comp;
    if (incompLabel) incompLabel.textContent = incomp;
}

// Chart 4: Weekly Goal (Progress toward target)
function renderWeeklyGoalGauge(weeklyGoal, summary) {
    const target = weeklyGoal.target || 5;
    const completed = weeklyGoal.completed !== undefined ? weeklyGoal.completed : (summary.weeklyGoalProgress ? parseInt(summary.weeklyGoalProgress) : 0);
    const pct = Math.min(100, Math.round((completed / target) * 100));

    const metricText = document.getElementById("goalMetricText");
    const barFill = document.getElementById("goalBarFill");
    const note = document.getElementById("goalStatusNote");

    if (metricText) metricText.textContent = `${completed} / ${target} Workouts`;
    if (barFill) barFill.style.width = `${pct}%`;
    if (note) {
        if (completed >= target) {
            note.textContent = "🏆 Outstanding performance! You crushed your weekly workout target!";
            note.style.color = "#34d399";
        } else {
            note.textContent = `${target - completed} more workout session(s) needed this week to reach your fitness goal.`;
            note.style.color = "#8b949e";
        }
    }
}

/* =====================================================
   3. LAST 7 DAYS ITEMIZED TABLE (SECTION 14)
===================================================== */
function renderItemizedTable(workouts) {
    const tbody = document.getElementById("last7DaysTableBody");
    if (!tbody) return;

    if (!workouts || workouts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#8b949e; padding: 24px;">No workout activity recorded in the last 7 days. Start a workout session today!</td></tr>`;
        return;
    }

    tbody.innerHTML = "";

    workouts.forEach(w => {
        const tr = document.createElement("tr");
        const isCompleted = w.status === "Completed";

        tr.innerHTML = `
            <td><strong>${w.date || w.dayOfWeek || "Recent"}</strong></td>
            <td>${w.workout || w.workoutName || "Workout"}</td>
            <td><span style="color:#06b6d4; font-weight:600;">${w.category || "Strength"}</span></td>
            <td>${w.duration || "0 seconds"}</td>
            <td>${w.calories || "0 calories"}</td>
            <td>
                <span class="status-badge ${isCompleted ? 'completed' : 'incomplete'}">
                    ${isCompleted ? '✓ Completed' : '⏳ Incomplete'}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/* =====================================================
   4. RECENT SESSIONS LIST
===================================================== */
function renderRecentSessions(sessions) {
    const list = document.getElementById("recentSessionsList");
    if (!list) return;

    if (!sessions || sessions.length === 0) {
        list.innerHTML = `<p style="color:#8b949e; text-align:center; padding: 20px;">No workout sessions logged yet. Complete a workout to start your history!</p>`;
        return;
    }

    list.innerHTML = "";

    sessions.forEach(sess => {
        const item = document.createElement("div");
        item.className = "history-item";

        const dateStr = sess.completedAt ? new Date(sess.completedAt).toLocaleDateString(undefined, {
            month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
        }) : "Recently";

        item.innerHTML = `
            <div>
                <h4 style="font-size:15px; color:#f0f6fc; margin-bottom:4px;">${sess.workoutName} (${sess.category})</h4>
                <span style="font-size:12px; color:#8b949e;">${dateStr} • ⏱ ${sess.durationMinutes} min • 🔥 ${sess.caloriesBurned} kcal</span>
            </div>
            <span class="status-badge completed">✓ Verified Completed</span>
        `;
        list.appendChild(item);
    });
}

document.addEventListener("DOMContentLoaded", loadProgressData);
