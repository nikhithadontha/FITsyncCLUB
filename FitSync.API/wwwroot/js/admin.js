/* =====================================================
   FITSYNC ADMIN PORTAL CONTROLLER
===================================================== */

const storedUser = localStorage.getItem("fitsyncUser");
let currentUser = null;
try {
    currentUser = storedUser ? JSON.parse(storedUser) : null;
} catch (e) { }

// Admin Auth Guard: If not admin, redirect to admin login
if (!currentUser || currentUser.role !== "Admin") {
    if (typeof showToast === "function") {
        showToast("Administrator credentials required. Redirecting to login...", "warning");
    }
    setTimeout(() => {
        window.location.href = "login.html?role=admin";
    }, 400);
} else {
    initAdminPortal();
}

function initAdminPortal() {
    loadAdminOverview();
    loadTrainers();
    loadClasses();
    loadFacilities();
    loadAnnouncements();

    // Form submit handlers
    document.getElementById("trainerForm")?.addEventListener("submit", handleCreateTrainer);
    document.getElementById("classForm")?.addEventListener("submit", handleCreateClass);
    document.getElementById("facilityForm")?.addEventListener("submit", handleCreateFacility);
    document.getElementById("announcementForm")?.addEventListener("submit", handleCreateAnnouncement);
}

// Logout
document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("fitsyncUser");
    if (typeof showToast === "function") showToast("Logged out from admin.", "info");
    setTimeout(() => { window.location.href = "login.html"; }, 500);
});

// Tab Switching
window.switchTab = function (tabId) {
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));

    const targetPanel = document.getElementById(tabId);
    if (targetPanel) targetPanel.classList.add("active");

    const activeBtn = Array.from(document.querySelectorAll(".tab-btn")).find(b => b.getAttribute("onclick")?.includes(tabId));
    if (activeBtn) activeBtn.classList.add("active");
};

/* =====================================================
   ADMIN OVERVIEW METRICS
===================================================== */
async function loadAdminOverview() {
    try {
        const res = await fetch("/api/admin/overview");
        if (!res.ok) return;

        const stats = await res.json();
        setElText("statTotalUsers", stats.totalUsers ?? 0);
        setElText("statActiveSubs", stats.activeSubscriptions ?? 0);
        setElText("statTrainers", stats.totalTrainers ?? 0);
        setElText("statClasses", stats.totalClasses ?? 0);
        setElText("statTotalBookings", stats.totalBookings ?? 0);
    } catch (err) {
        console.error("Overview load error:", err);
    }
}

function setElText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

/* =====================================================
   TRAINERS CRUD
===================================================== */
async function loadTrainers() {
    const tbody = document.getElementById("trainersTableBody");
    if (!tbody) return;

    try {
        const res = await fetch("/api/admin/trainers");
        if (!res.ok) return;
        const trainers = await res.json();

        tbody.innerHTML = "";
        trainers.forEach(t => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${t.fullName}</strong></td>
                <td>${t.specialization}</td>
                <td>${t.experienceYears} Years</td>
                <td>${t.email}</td>
                <td>
                    <button class="del-btn" onclick="deleteTrainer(${t.trainerId})">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
    }
}

async function handleCreateTrainer(e) {
    e.preventDefault();
    const payload = {
        fullName: document.getElementById("trName")?.value,
        specialization: document.getElementById("trSpec")?.value,
        experienceYears: document.getElementById("trExp")?.value,
        bio: document.getElementById("trBio")?.value
    };

    try {
        const res = await fetch("/api/admin/trainers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            closeAdminModals();
            if (typeof showToast === "function") showToast("Trainer added successfully!", "success");
            loadTrainers();
            loadAdminOverview();
        }
    } catch (err) {
        console.error(err);
    }
}

window.deleteTrainer = async function (id) {
    if (!confirm("Are you sure you want to remove this trainer?")) return;
    try {
        const res = await fetch(`/api/admin/trainers/${id}`, { method: "DELETE" });
        if (res.ok) {
            if (typeof showToast === "function") showToast("Trainer removed.", "info");
            loadTrainers();
            loadAdminOverview();
        }
    } catch (err) {
        console.error(err);
    }
};

/* =====================================================
   CLASSES CRUD
===================================================== */
async function loadClasses() {
    const tbody = document.getElementById("classesTableBody");
    if (!tbody) return;

    try {
        const res = await fetch("/api/admin/classes");
        if (!res.ok) return;
        const classes = await res.json();

        tbody.innerHTML = "";
        classes.forEach(c => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${c.name}</strong></td>
                <td>${c.category}</td>
                <td>${c.trainerName}</td>
                <td>${c.scheduleTime}</td>
                <td>${c.isOnline ? '<span style="color:#60a5fa;">Online</span>' : '<span style="color:#34d399;">In-Person</span>'}</td>
                <td>${c.isOnline ? (c.meetLink || 'Zoom/Meet') : (c.roomNumber || 'Main Studio')}</td>
                <td>
                    <button class="del-btn" onclick="deleteClass(${c.classId})">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
    }
}

window.toggleOnlineClassFields = function () {
    const isOnline = document.getElementById("clIsOnline")?.value === "true";
    const room = document.getElementById("roomField");
    const meet = document.getElementById("meetField");
    if (room) room.style.display = isOnline ? "none" : "block";
    if (meet) meet.style.display = isOnline ? "block" : "none";
};

async function handleCreateClass(e) {
    e.preventDefault();
    const isOnline = document.getElementById("clIsOnline")?.value === "true";
    const payload = {
        name: document.getElementById("clName")?.value,
        category: document.getElementById("clCategory")?.value,
        trainerName: document.getElementById("clTrainer")?.value,
        scheduleTime: document.getElementById("clSchedule")?.value,
        isOnline: isOnline,
        roomNumber: isOnline ? null : document.getElementById("clRoom")?.value,
        meetLink: isOnline ? document.getElementById("clMeet")?.value : null
    };

    try {
        const res = await fetch("/api/admin/classes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            closeAdminModals();
            if (typeof showToast === "function") showToast("Class created successfully!", "success");
            loadClasses();
            loadAdminOverview();
        }
    } catch (err) {
        console.error(err);
    }
}

window.deleteClass = async function (id) {
    if (!confirm("Are you sure you want to delete this class?")) return;
    try {
        const res = await fetch(`/api/admin/classes/${id}`, { method: "DELETE" });
        if (res.ok) {
            if (typeof showToast === "function") showToast("Class deleted.", "info");
            loadClasses();
            loadAdminOverview();
        }
    } catch (err) {
        console.error(err);
    }
};

/* =====================================================
   FACILITIES CRUD
===================================================== */
async function loadFacilities() {
    const tbody = document.getElementById("facilitiesTableBody");
    if (!tbody) return;

    try {
        const res = await fetch("/api/admin/facilities");
        if (!res.ok) return;
        const facs = await res.json();

        tbody.innerHTML = "";
        facs.forEach(f => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${f.name}</strong></td>
                <td>${f.type}</td>
                <td>${f.location}</td>
                <td>${f.openHours}</td>
                <td><span style="color:#34d399;">${f.status}</span></td>
                <td>
                    <button class="del-btn" onclick="deleteFacility(${f.facilityId})">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
    }
}

async function handleCreateFacility(e) {
    e.preventDefault();
    const payload = {
        name: document.getElementById("fcName")?.value,
        type: document.getElementById("fcType")?.value,
        location: document.getElementById("fcLocation")?.value,
        openHours: document.getElementById("fcHours")?.value
    };

    try {
        const res = await fetch("/api/admin/facilities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            closeAdminModals();
            if (typeof showToast === "function") showToast("Facility added successfully!", "success");
            loadFacilities();
        }
    } catch (err) {
        console.error(err);
    }
}

window.deleteFacility = async function (id) {
    if (!confirm("Are you sure you want to delete this facility?")) return;
    try {
        const res = await fetch(`/api/admin/facilities/${id}`, { method: "DELETE" });
        if (res.ok) {
            if (typeof showToast === "function") showToast("Facility removed.", "info");
            loadFacilities();
        }
    } catch (err) {
        console.error(err);
    }
};

/* =====================================================
   ANNOUNCEMENTS CRUD
===================================================== */
async function loadAnnouncements() {
    const tbody = document.getElementById("announcementsTableBody");
    if (!tbody) return;

    try {
        const res = await fetch("/api/admin/announcements");
        if (!res.ok) return;
        const anns = await res.json();

        tbody.innerHTML = "";
        anns.forEach(a => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${a.title}</strong></td>
                <td>${a.content}</td>
                <td>${a.date}</td>
                <td>${a.category}</td>
                <td><span style="color:${a.priority === 'High' ? '#fb7185' : '#38bdf8'};">${a.priority}</span></td>
                <td>
                    <button class="del-btn" onclick="deleteAnnouncement(${a.announcementId})">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
    }
}

async function handleCreateAnnouncement(e) {
    e.preventDefault();
    const payload = {
        title: document.getElementById("anTitle")?.value,
        content: document.getElementById("anContent")?.value,
        priority: document.getElementById("anPriority")?.value
    };

    try {
        const res = await fetch("/api/admin/announcements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            closeAdminModals();
            if (typeof showToast === "function") showToast("Announcement published!", "success");
            loadAnnouncements();
        }
    } catch (err) {
        console.error(err);
    }
}

window.deleteAnnouncement = async function (id) {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
        const res = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
        if (res.ok) {
            if (typeof showToast === "function") showToast("Announcement deleted.", "info");
            loadAnnouncements();
        }
    } catch (err) {
        console.error(err);
    }
};

/* =====================================================
   MODAL CONTROLS
===================================================== */
window.openTrainerModal = () => document.getElementById("trainerModal")?.classList.add("show");
window.openClassModal = () => document.getElementById("classModal")?.classList.add("show");
window.openFacilityModal = () => document.getElementById("facilityModal")?.classList.add("show");
window.openAnnouncementModal = () => document.getElementById("announcementModal")?.classList.add("show");

window.closeAdminModals = () => {
    document.querySelectorAll(".admin-modal").forEach(m => m.classList.remove("show"));
};
