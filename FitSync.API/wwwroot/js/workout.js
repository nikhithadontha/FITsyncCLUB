/* =====================================================
   FITSYNC WORKOUT CONTROLLER & STATE MACHINE
   State Machine: Scheduled -> Not Started -> In Progress -> Paused -> Incomplete / Completed
   Strict Backend Duration Enforcement & Seamless Resume
===================================================== */

/* =====================================================
   LOGIN CHECK & USER INFO
===================================================== */
const storedUser = localStorage.getItem("fitsyncUser");
if (!storedUser) {
    window.location.href = "login.html";
}

let currentUser = null;
try {
    currentUser = storedUser ? JSON.parse(storedUser) : null;
} catch (error) {
    console.error("Unable to parse logged-in user:", error);
}

const currentUserId = currentUser ? currentUser.id : null;

// Show admin navigation link if user is admin
const adminNavLink = document.getElementById("adminNavLink");
if (adminNavLink && currentUser && currentUser.role === "Admin") {
    adminNavLink.style.display = "inline-block";
}

/* =====================================================
   LOGOUT
===================================================== */
const logoutBtn = document.getElementById("logoutBtn");
logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("fitsyncUser");
    if (typeof showToast === "function") {
        showToast("Logged out successfully.", "info");
    }
    setTimeout(() => { window.location.href = "login.html"; }, 500);
});

/* =====================================================
   CATEGORY / WORKOUT NORMALIZATION
===================================================== */
const params = new URLSearchParams(window.location.search);
const selectedCategory = params.get("category") || params.get("class") || "Strength";

/* =====================================================
   YOUTUBE VIDEO MAP — real workout videos per category
===================================================== */
const categoryYouTubeMap = {
    "Strength":  "https://www.youtube.com/embed/vc1E5CfRfos?autoplay=1&rel=0",
    "Cardio":    "https://www.youtube.com/embed/ml6cT4AZdqI?autoplay=1&rel=0",
    "Yoga":      "https://www.youtube.com/embed/v7AYKMP6rOE?autoplay=1&rel=0",
    "HIIT":      "https://www.youtube.com/embed/M0uO8X3_tEA?autoplay=1&rel=0",
    "Pilates":   "https://www.youtube.com/embed/g_tea8ZNk5A?autoplay=1&rel=0",
    "Flexibility":"https://www.youtube.com/embed/L_xrDAtykMI?autoplay=1&rel=0",
    "Boxing":"https://www.youtube.com/embed/M0uO8X3_tEA?autoplay=1&rel=0",
    "Warmup":    "https://www.youtube.com/embed/Thp2GVAdqcc?autoplay=1&rel=0",
    "Cooldown":  "https://www.youtube.com/embed/nFKTP4Pxing?autoplay=1&rel=0"
};

const categoryPosterMap = {
    "Strength":   "assets/workouts/strength.jpg",
    "Cardio":     "assets/workouts/cardio.jpg",
    "Yoga":       "assets/workouts/yoga.jpg",
    "HIIT":       "assets/workouts/hiit.jpg",
    "Pilates":    "assets/workouts/plank.jpg",
    "Flexibility":"assets/workouts/warmup.jpg",
    "Warmup":     "assets/workouts/warmup.jpg",
    "Cooldown":   "assets/workouts/cooldown.jpg"
};

window.loadYouTubeVideo = function () {
    const cat = normalizeCategory ? normalizeCategory(selectedCategory) : selectedCategory;
    const videoUrl = categoryYouTubeMap[cat] || categoryYouTubeMap["Strength"];
    const poster = document.getElementById("videoPoster");
    const container = document.getElementById("youtubeContainer");
    if (!container) return;
    container.innerHTML = `<iframe width="100%" height="100%" src="${videoUrl}" title="Workout Video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="width:100%;height:100%;border:none;"></iframe>`;
    if (poster) poster.style.display = "none";
    container.style.display = "block";
};

// Update poster image to match the workout category
function updateVideoPoster(cat) {
    const posterImg = document.getElementById("videoPosterImg");
    if (posterImg && categoryPosterMap[cat]) {
        posterImg.src = categoryPosterMap[cat];
    }
}


function normalizeCategory(category) {
    if (!category) return "Strength";
    const value = category.trim().toLowerCase();
    const map = {
        "strength": "Strength",
        "strength training": "Strength",
        "cardio": "Cardio",
        "cardio blast": "Cardio",
        "yoga": "Yoga",
        "flexibility yoga": "Yoga",
        "stretching": "Yoga",
        "stretch": "Yoga",
        "dance fitness": "Cardio",
        "cycling": "Cardio",
        "running": "Cardio",
        "core training": "Strength",
        "mobility": "Yoga",
        "hiit": "HIIT",
        "hiit burn": "HIIT",
        "boxing": "Boxing",
        "boxing fitness": "Boxing",
        "pilates": "Pilates",
        "core": "Strength"
    };
    return map[value] || category;
}
const normalizedCategory = normalizeCategory(selectedCategory);
updateVideoPoster(normalizedCategory);

/* =====================================================
   DOM ELEMENTS
===================================================== */
const workoutTitle = document.getElementById("workoutTitle");
const workoutDescription = document.getElementById("workoutDescription");
const workoutDuration = document.getElementById("workoutDuration");
const workoutDifficulty = document.getElementById("workoutDifficulty");
const exerciseCount = document.getElementById("exerciseCount");
const workoutVideo = document.getElementById("workoutVideo");
const videoSource = document.getElementById("videoSource");
const exerciseList = document.getElementById("exerciseList");
const exerciseProgress = document.getElementById("exerciseProgress");
const videoFallback = document.getElementById("videoFallback");

const startWorkoutBtn = document.getElementById("startWorkoutBtn");
const sessionStatusBadge = document.getElementById("sessionStatusBadge");
const sessionRemainingChip = document.getElementById("sessionRemainingChip");

// Resume and Completion Banners
const resumeAlertBanner = document.getElementById("resumeAlertBanner");
const resumeBannerBtn = document.getElementById("resumeBannerBtn");
const resumeBannerTitle = document.getElementById("resumeBannerTitle");
const resumeBannerCompletedLine = document.getElementById("resumeBannerCompletedLine");
const resumeBannerRemainingLine = document.getElementById("resumeBannerRemainingLine");
const completionSuccessBanner = document.getElementById("completionSuccessBanner");
const completionSuccessText = document.getElementById("completionSuccessText");

// Duration Presets & Acceptance Test Mode
const durationBtn30s = document.getElementById("durationBtn30s");
const durationBtn5m = document.getElementById("durationBtn5m");
const durationBtn30m = document.getElementById("durationBtn30m");

// Modal elements
const workoutModal = document.getElementById("workoutModal");
const closeModal = document.getElementById("closeModal");
const modalExerciseName = document.getElementById("modalExerciseName");
const modalInstruction = document.getElementById("modalInstruction");
const allocatedTime = document.getElementById("allocatedTime");
const elapsedTime = document.getElementById("elapsedTime");
const remainedTime = document.getElementById("remainedTime");
const timerValue = document.getElementById("timerValue");
const timerLabel = document.getElementById("timerLabel");
const timerCircle = document.getElementById("timerCircle");
const timerProgressBar = document.getElementById("timerProgressBar");
const timerBtn = document.getElementById("timerBtn");
const stopWorkoutBtn = document.getElementById("stopWorkoutBtn");
const nextExerciseBtn = document.getElementById("nextExerciseBtn");

/* =====================================================
   STATE MANAGEMENT
===================================================== */
let workout = null;
let originalExercises = [];
let targetDurationSeconds = 1800; // default 30 min, configurable to 30s for Section 12
let currentSession = null;
let completedExercises = 0;
let currentExercise = 0;
let timerInterval = null;
let hasCompletedSuccessfully = false;

/* =====================================================
   DURATION HELPERS
===================================================== */
function parseDuration(str) {
    if (typeof str === "number") return str;
    if (!str) return 45;
    str = String(str).toLowerCase().trim();
    if (str.includes("min")) {
        const num = parseFloat(str.replace(/[^0-9.]/g, "")) || 0;
        return Math.round(num * 60);
    }
    if (str.includes("sec") || str.includes("s")) {
        return parseInt(str.replace(/[^0-9]/g, "")) || 45;
    }
    const num = parseInt(str);
    return isNaN(num) ? 45 : num;
}

function formatTime(seconds) {
    seconds = Math.max(0, parseInt(seconds) || 0);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function formatDurationLabel(seconds) {
    seconds = Math.max(0, parseInt(seconds) || 0);
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (s === 0) return `${m} min`;
    return `${m}m ${s}s`;
}

function ensureExerciseState(exercise) {
    if (typeof exercise._totalSeconds !== "number") {
        exercise._totalSeconds = parseDuration(exercise.duration);
    }
    if (typeof exercise._elapsedSeconds !== "number") {
        exercise._elapsedSeconds = 0;
    }
    if (typeof exercise._remainedSeconds !== "number") {
        exercise._remainedSeconds = exercise._totalSeconds;
    }
    if (!exercise._status) {
        exercise._status = "pending"; // pending | running | partial | completed
    }
}

/* =====================================================
   WORKOUT CATALOG DATA (FALLBACK)
===================================================== */
const fallbackWorkouts = {
    Boxing: {
        workoutId: 5,
        name: "Boxing Fitness",
        category: "Boxing",
        description: "Build coordination, endurance and explosive power with dynamic boxing drills.",
        duration: "30 min",
        difficulty: "Intermediate",
        caloriesBurned: 350,
        exercises: [
            { exerciseId: 101, name: "Jump Rope Warm-up", description: "Rhythmic jump rope movements to elevate body temperature.", duration: "3 min" },
            { exerciseId: 102, name: "Jab & Cross Combos", description: "Controlled linear punches focusing on core rotation.", duration: "60 sec" },
            { exerciseId: 103, name: "Hooks & Slip Drills", description: "Power hooks followed by defensive head slips.", duration: "60 sec" },
            { exerciseId: 104, name: "Heavy Bag Interval", description: "High volume combination strikes with continuous footwork.", duration: "60 sec" },
            { exerciseId: 105, name: "Cool-down & Stretch", description: "Shoulder, rotator cuff, and spine active recovery stretches.", duration: "3 min" }
        ]
    },
    Pilates: {
        workoutId: 6,
        name: "Pilates Core Sculpt",
        category: "Pilates",
        description: "Develop deep transverse abdominal strength, pelvic stability, and spinal alignment.",
        duration: "30 min",
        difficulty: "Beginner",
        caloriesBurned: 220,
        exercises: [
            { exerciseId: 106, name: "Pilates Hundred", description: "Dynamic pump with legs table-top and scapula lifted.", duration: "60 sec" },
            { exerciseId: 107, name: "Roll-Up", description: "Articulate each vertebra off the mat with controlled inhalation.", duration: "60 sec" },
            { exerciseId: 108, name: "Single Leg Stretch", description: "Alternating knee pull maintaining a rock-steady pelvis.", duration: "60 sec" },
            { exerciseId: 109, name: "Swan Dive Prep", description: "Spinal extension and chest opener to counter slouching.", duration: "60 sec" }
        ]
    }
};

/* =====================================================
   FETCH WORKOUT & SESSION
===================================================== */
async function loadWorkoutAndSession() {
    try {
        // 1. Fetch workout definition from API
        const listRes = await fetch(`/api/workout?category=${encodeURIComponent(normalizedCategory)}`);
        if (listRes.ok) {
            const list = await listRes.json();
            if (list && list.length > 0) {
                const detailRes = await fetch(`/api/workout/${list[0].workoutId}`);
                if (detailRes.ok) {
                    workout = await detailRes.json();
                }
            }
        }

        if (!workout && fallbackWorkouts[normalizedCategory]) {
            workout = fallbackWorkouts[normalizedCategory];
        }

        if (!workout) {
            // fallback to first available
            const allRes = await fetch('/api/workout');
            if (allRes.ok) {
                const all = await allRes.json();
                if (all && all.length > 0) workout = all[0];
            }
        }

        if (!workout) {
            showWorkoutNotFound();
            return;
        }

        if (workout.exercises && workout.exercises.length) {
            originalExercises = JSON.parse(JSON.stringify(workout.exercises));
        }

        // Check if duration requested in URL (e.g. ?duration=30 or ?duration=30s)
        const durationParam = params.get("duration");
        if (durationParam === "30" || durationParam === "30s" || durationParam === "30sec") {
            setDurationPillActive(durationBtn30s);
            applyWorkoutDuration(30, "30 seconds");
        } else if (durationParam === "5m" || durationParam === "300") {
            setDurationPillActive(durationBtn5m);
            applyWorkoutDuration(300, "5 min");
        } else {
            workout.exercises.forEach(ensureExerciseState);
            renderWorkoutDetails();
        }

        // Setup duration pill button click listeners
        durationBtn30s?.addEventListener("click", () => {
            setDurationPillActive(durationBtn30s);
            applyWorkoutDuration(30, "30 seconds");
        });
        durationBtn5m?.addEventListener("click", () => {
            setDurationPillActive(durationBtn5m);
            applyWorkoutDuration(300, "5 min");
        });
        durationBtn30m?.addEventListener("click", () => {
            setDurationPillActive(durationBtn30m);
            applyWorkoutDuration(1800, "30 min");
        });

        // 2. Query backend for active or latest session for this user
        if (currentUserId && workout.workoutId) {
            await fetchActiveSession();
        }

    } catch (err) {
        console.error("Error loading workout:", err);
        if (typeof showToast === "function") {
            showToast("Failed to load workout details.", "error");
        }
    }
}

/* =====================================================
   DURATION SELECTOR & PRESET HANDLERS
===================================================== */
function setDurationPillActive(btn) {
    document.querySelectorAll(".duration-pill-btn").forEach(b => b.classList.remove("active"));
    btn?.classList.add("active");
}

function applyWorkoutDuration(seconds, label) {
    targetDurationSeconds = seconds;
    if (workoutDuration) workoutDuration.textContent = label || formatDurationLabel(seconds);

    if (!workout) return;

    if (seconds === 30) {
        workout.duration = "30 seconds";
        workout.exercises = [
            {
                exerciseId: 1,
                name: "Strength Training",
                description: "Controlled push-up and squat movements. 30 seconds required routine.",
                duration: "30 sec",
                orderIndex: 1
            }
        ];
    } else {
        if (originalExercises && originalExercises.length > 0) {
            workout.exercises = JSON.parse(JSON.stringify(originalExercises));
        }
    }

    workout.exercises.forEach(ensureExerciseState);

    // If active or incomplete session exists for this target duration, sync values
    if (currentSession && currentSession.requiredDuration === seconds) {
        if (workout.exercises[0]) {
            workout.exercises[0]._elapsedSeconds = currentSession.completedDuration || 0;
            workout.exercises[0]._remainedSeconds = currentSession.remainingDuration !== undefined ? currentSession.remainingDuration : seconds;
            workout.exercises[0]._status = currentSession.status === "Completed" ? "completed" : (currentSession.completedDuration > 0 ? "partial" : "pending");
        }
    }

    renderExercises();
    updateProgressCounter();
}

/* =====================================================
   FETCH ACTIVE / INCOMPLETE / LATEST SESSION FROM BACKEND
===================================================== */
async function fetchActiveSession() {
    try {
        // 1. First check latest session for this user & workout (preserves Completed on refresh)
        const latestRes = await fetch(`/api/workout/session/latest/${currentUserId}/${workout.workoutId}`);
        if (latestRes.ok) {
            const data = await latestRes.json();
            if (data && data.found && data.session) {
                currentSession = data.session;
                if (currentSession.requiredDuration === 30) {
                    setDurationPillActive(durationBtn30s);
                    applyWorkoutDuration(30, "30 seconds");
                }
                applySessionStateToUI(currentSession);
                return;
            }
        }

        // 2. Check active sessions as fallback
        const res = await fetch(`/api/workout/session/active/${currentUserId}`);
        if (res.ok) {
            const sessions = await res.json();
            if (sessions && Array.isArray(sessions)) {
                const matching = sessions.find(s => s.workoutId === workout.workoutId);
                if (matching) {
                    currentSession = matching;
                    if (currentSession.requiredDuration === 30) {
                        setDurationPillActive(durationBtn30s);
                        applyWorkoutDuration(30, "30 seconds");
                    }
                    applySessionStateToUI(currentSession);
                    return;
                }
            }
        }

        setSessionBadge("Not Started", "status-not-started");
        if (sessionRemainingChip) sessionRemainingChip.style.display = "none";
        if (resumeAlertBanner) resumeAlertBanner.style.display = "none";
        if (completionSuccessBanner) completionSuccessBanner.style.display = "none";
        if (startWorkoutBtn) {
            startWorkoutBtn.textContent = "▶ Start Workout";
            startWorkoutBtn.disabled = false;
        }
    } catch (err) {
        console.warn("Could not check active session:", err);
    }
}

/* =====================================================
   APPLY SESSION STATE TO UI
===================================================== */
function applySessionStateToUI(session) {
    if (!session) return;

    // Sync exercise states if saved
    if (session.exerciseStates && Array.isArray(session.exerciseStates) && session.exerciseStates.length > 0) {
        session.exerciseStates.forEach((savedEx, idx) => {
            if (workout.exercises[idx]) {
                workout.exercises[idx]._elapsedSeconds = savedEx.elapsedSeconds || 0;
                workout.exercises[idx]._remainedSeconds = savedEx.remainedSeconds !== undefined ? savedEx.remainedSeconds : parseDuration(workout.exercises[idx].duration);
                workout.exercises[idx]._status = savedEx.status || (savedEx.remainedSeconds <= 0 ? "completed" : "partial");
            }
        });
    } else if (session.requiredDuration && workout.exercises && workout.exercises.length === 1) {
        workout.exercises[0]._elapsedSeconds = session.completedDuration || 0;
        workout.exercises[0]._remainedSeconds = session.remainingDuration !== undefined ? session.remainingDuration : session.requiredDuration;
        workout.exercises[0]._status = session.status === "Completed" ? "completed" : (session.completedDuration > 0 ? "partial" : "pending");
    }

    if (typeof session.currentExerciseIndex === "number") {
        currentExercise = session.currentExerciseIndex;
    }

    // Status Machine Badge
    const status = session.status || "Incomplete";
    if (status === "Completed") {
        setSessionBadge("Completed", "status-completed");
        if (sessionRemainingChip) sessionRemainingChip.style.display = "none";
        if (resumeAlertBanner) resumeAlertBanner.style.display = "none";
        if (completionSuccessBanner) {
            if (completionSuccessText) completionSuccessText.textContent = `${workout ? workout.name : "Strength Training"} successfully completed!`;
            completionSuccessBanner.style.display = "flex";
        }
        if (startWorkoutBtn) {
            startWorkoutBtn.textContent = "✓ Workout Completed";
            startWorkoutBtn.disabled = true;
        }
        hasCompletedSuccessfully = true;
    } else if (status === "Incomplete" || status === "Paused") {
        setSessionBadge(status, status === "Paused" ? "status-paused" : "status-incomplete");
        if (completionSuccessBanner) completionSuccessBanner.style.display = "none";
        if (sessionRemainingChip) {
            sessionRemainingChip.textContent = `⏱ ${formatDurationLabel(session.remainingDuration)} Remained`;
            sessionRemainingChip.style.display = "inline-flex";
        }
        if (resumeAlertBanner) {
            resumeAlertBanner.style.display = "flex";
            if (resumeBannerTitle) resumeBannerTitle.textContent = "Your workout is incomplete.";
            if (resumeBannerCompletedLine) resumeBannerCompletedLine.textContent = `You completed ${session.completedDuration} seconds.`;
            if (resumeBannerRemainingLine) resumeBannerRemainingLine.textContent = `${session.remainingDuration} seconds remaining to finish your workout.`;
        }
        if (startWorkoutBtn) {
            startWorkoutBtn.textContent = `▶ Resume Workout (Completed: ${formatTime(session.completedDuration)} | Remaining: ${formatTime(session.remainingDuration)})`;
            startWorkoutBtn.disabled = false;
        }
        hasCompletedSuccessfully = false;
    } else if (status === "In Progress") {
        setSessionBadge("In Progress", "status-in-progress");
        if (completionSuccessBanner) completionSuccessBanner.style.display = "none";
        if (sessionRemainingChip) {
            sessionRemainingChip.textContent = `⏱ ${formatDurationLabel(session.remainingDuration)} Remained`;
            sessionRemainingChip.style.display = "inline-flex";
        }
        if (startWorkoutBtn) {
            startWorkoutBtn.textContent = "▶ Resume Workout";
            startWorkoutBtn.disabled = false;
        }
    }

    renderExercises();
    updateProgressCounter();
}

function setSessionBadge(text, className) {
    if (!sessionStatusBadge) return;
    sessionStatusBadge.className = `session-badge ${className}`;
    sessionStatusBadge.textContent = `Status: ${text}`;
}

/* =====================================================
   CATEGORY HERO IMAGE MAPPING
===================================================== */
const categoryHeroImages = {
    "Strength": "assets/workouts/strength.jpg",
    "Cardio": "assets/workouts/warmup.jpg",
    "Yoga": "assets/workouts/cooldown.jpg",
    "HIIT": "assets/workouts/squats.jpg",
    "Boxing": "assets/workouts/pushups.jpg",
    "Pilates": "assets/workouts/plank.jpg",
    "Cycling": "assets/workouts/warmup.jpg",
    "Running": "assets/workouts/warmup.jpg",
    "Core": "assets/workouts/plank.jpg",
    "Mobility": "assets/workouts/cooldown.jpg"
};

function renderWorkoutDetails() {
    if (!workout) return;

    if (workoutTitle) workoutTitle.textContent = workout.name;
    if (workoutDescription) workoutDescription.textContent = workout.description || "";
    if (workoutDuration) workoutDuration.textContent = workout.duration || "--";
    if (workoutDifficulty) workoutDifficulty.textContent = workout.difficulty || "All Levels";
    if (exerciseCount) exerciseCount.textContent = workout.exercises?.length || 0;

    // Set category-appropriate hero image
    const heroImg = categoryHeroImages[normalizedCategory] || "assets/workouts/strength.jpg";
    if (workoutVideo) workoutVideo.poster = heroImg;

    renderExercises();
    updateProgressCounter();
}

/* =====================================================
   EXERCISE IMAGE MAPPING
   Maps exercise names to relevant images from assets
===================================================== */
const exerciseImageMap = {
    // Keyword-based mapping — lowercase keywords to image paths
    "warm": "assets/workouts/warmup.jpg",
    "stretch": "assets/workouts/warmup.jpg",
    "dynamic": "assets/workouts/warmup.jpg",
    "mobility": "assets/workouts/warmup.jpg",
    "cool": "assets/workouts/cooldown.jpg",
    "recovery": "assets/workouts/cooldown.jpg",
    "squat": "assets/workouts/squats.jpg",
    "lunge": "assets/workouts/squats.jpg",
    "leg": "assets/workouts/squats.jpg",
    "deadlift": "assets/workouts/squats.jpg",
    "push": "assets/workouts/pushups.jpg",
    "press": "assets/workouts/pushups.jpg",
    "bench": "assets/workouts/pushups.jpg",
    "chest": "assets/workouts/pushups.jpg",
    "plank": "assets/workouts/plank.jpg",
    "core": "assets/workouts/plank.jpg",
    "ab": "assets/workouts/plank.jpg",
    "crunch": "assets/workouts/plank.jpg",
    "hundred": "assets/workouts/plank.jpg",
    "roll": "assets/workouts/plank.jpg",
    "strength": "assets/workouts/strength.jpg",
    "dumbbell": "assets/workouts/strength.jpg",
    "curl": "assets/workouts/strength.jpg",
    "row": "assets/workouts/strength.jpg",
    "pull": "assets/workouts/strength.jpg",
    "jab": "assets/workouts/pushups.jpg",
    "cross": "assets/workouts/pushups.jpg",
    "hook": "assets/workouts/pushups.jpg",
    "bag": "assets/workouts/strength.jpg",
    "rope": "assets/workouts/warmup.jpg",
    "jump": "assets/workouts/squats.jpg",
    "burpee": "assets/workouts/squats.jpg",
    "swan": "assets/workouts/cooldown.jpg",
    "single leg": "assets/workouts/squats.jpg"
};

// Cycle images for fallback
const fallbackImages = [
    "assets/workouts/strength.jpg",
    "assets/workouts/squats.jpg",
    "assets/workouts/pushups.jpg",
    "assets/workouts/plank.jpg",
    "assets/workouts/warmup.jpg",
    "assets/workouts/cooldown.jpg"
];

function getExerciseImage(exerciseName, index) {
    if (!exerciseName) return fallbackImages[index % fallbackImages.length];
    const nameLower = exerciseName.toLowerCase();
    for (const [keyword, imgPath] of Object.entries(exerciseImageMap)) {
        if (nameLower.includes(keyword)) return imgPath;
    }
    return fallbackImages[index % fallbackImages.length];
}

function renderExercises() {
    if (!exerciseList || !workout || !workout.exercises) return;

    exerciseList.innerHTML = "";

    workout.exercises.forEach((ex, index) => {
        ensureExerciseState(ex);

        const card = document.createElement("div");
        card.className = `exercise-card ${ex._status === "completed" ? "completed" : ""}`;
        card.id = `exerciseCard-${index}`;

        const isCompleted = ex._status === "completed";
        const isPartial = ex._status === "partial";

        let statusPill = `<span class="exercise-pill pending">Pending</span>`;
        if (isCompleted) {
            statusPill = `<span class="exercise-pill completed">✓ Done</span>`;
        } else if (isPartial) {
            statusPill = `<span class="exercise-pill partial">⏱ ${formatDurationLabel(ex._remainedSeconds)} left</span>`;
        }

        const imgSrc = getExerciseImage(ex.name, index);

        card.innerHTML = `
            <div class="exercise-card-img">
                <img src="${imgSrc}" alt="${ex.name}" loading="lazy" onerror="this.style.display='none'">
                <div class="card-img-overlay"></div>
                <span class="exercise-num-badge">${isCompleted ? "✓" : index + 1}</span>
            </div>
            <div class="exercise-card-body">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4>${ex.name}</h4>
                    ${statusPill}
                </div>
                <p class="ex-desc">${ex.description || "Controlled form and pace."}</p>
            </div>
            <div class="exercise-card-footer">
                <span class="exercise-time">⏱ Allocated: <strong>${formatDurationLabel(ex._totalSeconds)}</strong></span>
                <button class="exercise-action-btn" onclick="startSpecificExercise(${index})">
                    ${isCompleted ? "↻ Redo" : (isPartial ? "▶ Resume" : "▶ Start")}
                </button>
            </div>
        `;

        exerciseList.appendChild(card);
    });
}

function updateProgressCounter() {
    if (!workout || !workout.exercises) return;
    completedExercises = workout.exercises.filter(e => e._status === "completed").length;
    if (exerciseProgress) {
        exerciseProgress.textContent = `${completedExercises} / ${workout.exercises.length} completed`;
    }
}

function showWorkoutNotFound() {
    if (workoutTitle) workoutTitle.textContent = "Workout Not Found";
    if (workoutDescription) workoutDescription.textContent = "Please select another workout from the dashboard.";
}

/* =====================================================
   START / RESUME WORKOUT HANDLER
===================================================== */
async function handleStartOrResumeWorkout() {
    if (!workout || !workout.exercises || !workout.exercises.length) return;

    if (hasCompletedSuccessfully) {
        if (typeof showToast === "function") {
            showToast("This workout is already completed! Choose another workout or reset.", "info");
        }
        return;
    }

    // If session doesn't exist yet, start new session on backend
    if (!currentSession) {
        try {
            const res = await fetch("/api/workout/session/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: currentUserId, workoutId: workout.workoutId, duration: targetDurationSeconds })
            });
            if (res.ok) {
                const data = await res.json();
                currentSession = data.session;
                setSessionBadge("In Progress", "status-in-progress");
                if (typeof showToast === "function") {
                    showToast(data.message || "Workout session started.", "success");
                }
            }
        } catch (err) {
            console.error("Could not initialize session:", err);
        }
    } else {
        setSessionBadge("In Progress", "status-in-progress");
    }

    // Find next exercise to do
    const nextIdx = workout.exercises.findIndex(e => e._status !== "completed");
    currentExercise = nextIdx >= 0 ? nextIdx : 0;
    openExerciseModal(currentExercise);
}

startWorkoutBtn?.addEventListener("click", handleStartOrResumeWorkout);
resumeBannerBtn?.addEventListener("click", handleStartOrResumeWorkout);

window.startSpecificExercise = function (index) {
    if (typeof index === "number" && workout && workout.exercises[index]) {
        currentExercise = index;
        openExerciseModal(currentExercise);
    }
};

/* =====================================================
   OPEN EXERCISE IN MODAL
===================================================== */
function openExerciseModal(index) {
    if (!workout || !workout.exercises || !workout.exercises[index]) return;

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    const ex = workout.exercises[index];
    ensureExerciseState(ex);

    if (modalExerciseName) modalExerciseName.textContent = ex.name;
    if (modalInstruction) modalInstruction.textContent = ex.description || "Maintain controlled breathing and smooth cadence.";

    if (allocatedTime) allocatedTime.textContent = formatDurationLabel(ex._totalSeconds);
    if (elapsedTime) elapsedTime.textContent = formatDurationLabel(ex._elapsedSeconds);
    if (remainedTime) remainedTime.textContent = formatDurationLabel(ex._remainedSeconds);

    if (timerValue) timerValue.textContent = formatTime(ex._remainedSeconds);

    const pct = ex._totalSeconds > 0 ? ((ex._elapsedSeconds / ex._totalSeconds) * 100).toFixed(1) : 0;
    if (timerProgressBar) timerProgressBar.style.width = `${pct}%`;

    if (timerCircle) {
        timerCircle.classList.remove("paused", "completed");
    }

    if (ex._status === "completed") {
        if (timerCircle) timerCircle.classList.add("completed");
        if (timerLabel) timerLabel.textContent = "✓ completed";
        if (timerBtn) timerBtn.textContent = "Restart";
    } else if (ex._status === "partial") {
        if (timerCircle) timerCircle.classList.add("paused");
        if (timerLabel) timerLabel.textContent = `${formatDurationLabel(ex._remainedSeconds)} remained`;
        if (timerBtn) timerBtn.textContent = "Resume";
    } else {
        if (timerLabel) timerLabel.textContent = "seconds remained";
        if (timerBtn) timerBtn.textContent = "Start";
    }

    if (nextExerciseBtn) {
        nextExerciseBtn.textContent = (index === workout.exercises.length - 1) ? "Finish Workout →" : "Next Exercise →";
    }

    if (workoutModal) {
        workoutModal.classList.add("show");
    }
}

/* =====================================================
   TIMER CONTROLS (START / PAUSE / RESUME)
===================================================== */
timerBtn?.addEventListener("click", function () {
    if (!workout || !workout.exercises || !workout.exercises[currentExercise]) return;

    const ex = workout.exercises[currentExercise];
    ensureExerciseState(ex);

    /* ---------------------------------------------
       PAUSE RUNNING TIMER
    --------------------------------------------- */
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;

        if (ex._remainedSeconds > 0) {
            ex._status = "partial";
            timerBtn.textContent = "Resume";
            if (timerCircle) timerCircle.classList.add("paused");
            if (timerLabel) timerLabel.textContent = `${formatDurationLabel(ex._remainedSeconds)} remained`;
        }

        saveSessionProgress("Paused");
        renderExercises();
        updateProgressCounter();
        return;
    }

    /* ---------------------------------------------
       START / RESUME / RESTART
    --------------------------------------------- */
    if (ex._status === "completed" || ex._remainedSeconds <= 0) {
        ex._elapsedSeconds = 0;
        ex._remainedSeconds = ex._totalSeconds;
        ex._status = "pending";
        if (timerCircle) timerCircle.classList.remove("completed");
    }

    timerBtn.textContent = "Pause";
    if (timerCircle) timerCircle.classList.remove("paused");
    if (timerLabel) timerLabel.textContent = `${formatDurationLabel(ex._remainedSeconds)} remained`;

    timerInterval = setInterval(function () {
        ex._elapsedSeconds++;
        ex._remainedSeconds--;

        if (ex._remainedSeconds < 0) ex._remainedSeconds = 0;

        if (timerValue) timerValue.textContent = formatTime(ex._remainedSeconds);
        if (elapsedTime) elapsedTime.textContent = formatDurationLabel(ex._elapsedSeconds);
        if (remainedTime) remainedTime.textContent = formatDurationLabel(ex._remainedSeconds);

        const pct = ex._totalSeconds > 0 ? Math.min(100, (ex._elapsedSeconds / ex._totalSeconds) * 100).toFixed(1) : 0;
        if (timerProgressBar) timerProgressBar.style.width = `${pct}%`;

        if (ex._remainedSeconds > 0) {
            ex._status = "partial";
            if (timerLabel) timerLabel.textContent = `${formatDurationLabel(ex._remainedSeconds)} remained`;
        }

        /* ---------------------------------------------
           EXERCISE REACHED 0: COMPLETED
        --------------------------------------------- */
        if (ex._remainedSeconds <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;

            ex._status = "completed";
            ex._remainedSeconds = 0;
            ex._elapsedSeconds = ex._totalSeconds;

            if (timerBtn) timerBtn.textContent = "✓ Completed";
            if (timerCircle) {
                timerCircle.classList.remove("paused");
                timerCircle.classList.add("completed");
            }
            if (timerLabel) timerLabel.textContent = "exercise completed";
            if (timerProgressBar) timerProgressBar.style.width = "100%";

            renderExercises();
            updateProgressCounter();

            if (typeof showToast === "function") {
                showToast(`Exercise completed: ${ex.name}!`, "success");
            }

            // Check if all exercises are completed
            const allDone = workout.exercises.every(e => e._status === "completed");
            if (allDone) {
                attemptCompleteWorkout();
            }
        }
    }, 1000);
});

/* =====================================================
   NEXT EXERCISE BUTTON
===================================================== */
nextExerciseBtn?.addEventListener("click", function () {
    if (!workout || !workout.exercises) return;

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    const ex = workout.exercises[currentExercise];
    if (ex) {
        if (ex._remainedSeconds > 0 && ex._elapsedSeconds > 0) {
            ex._status = "partial";
        }
    }

    if (currentExercise >= workout.exercises.length - 1) {
        // Last exercise
        const allDone = workout.exercises.every(e => e._status === "completed");
        if (allDone) {
            attemptCompleteWorkout();
        } else {
            // Some exercises remain incomplete
            closeWorkoutModalAndPersist("Incomplete");
            if (typeof showToast === "function") {
                showToast("Workout is not fully finished. Remaining exercises saved.", "warning");
            }
        }
    } else {
        currentExercise++;
        openExerciseModal(currentExercise);
    }
});

/* =====================================================
   CLOSE & STOP MODAL HANDLERS (PERSIST INCOMPLETE STATUS)
===================================================== */
closeModal?.addEventListener("click", function () {
    closeWorkoutModalAndPersist("Incomplete");
});

stopWorkoutBtn?.addEventListener("click", function () {
    closeWorkoutModalAndPersist("Incomplete");
});

function closeWorkoutModalAndPersist(statusOverride) {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    if (workoutModal) {
        workoutModal.classList.remove("show");
    }

    // If workout was already marked complete, don't revert to incomplete
    if (hasCompletedSuccessfully) return;

    // Calculate total elapsed and remaining
    let totalElapsed = 0;
    let totalRemained = 0;
    workout.exercises.forEach(e => {
        totalElapsed += (e._elapsedSeconds || 0);
        totalRemained += (e._remainedSeconds || 0);
    });

    const statusToSave = (totalRemained > 0) ? (statusOverride || "Incomplete") : "Completed";

    saveSessionProgress(statusToSave);

    if (totalRemained > 0) {
        setSessionBadge("Incomplete", "status-incomplete");
        if (completionSuccessBanner) completionSuccessBanner.style.display = "none";
        if (sessionRemainingChip) {
            sessionRemainingChip.textContent = `⏱ ${formatDurationLabel(totalRemained)} Remained`;
            sessionRemainingChip.style.display = "inline-flex";
        }
        if (resumeAlertBanner) {
            resumeAlertBanner.style.display = "flex";
            if (resumeBannerTitle) resumeBannerTitle.textContent = "Your workout is incomplete.";
            if (resumeBannerCompletedLine) resumeBannerCompletedLine.textContent = `You completed ${totalElapsed} seconds.`;
            if (resumeBannerRemainingLine) resumeBannerRemainingLine.textContent = `${totalRemained} seconds remaining to finish your workout.`;
        }
        if (startWorkoutBtn) {
            startWorkoutBtn.textContent = `▶ Resume Workout (Completed: ${formatTime(totalElapsed)} | Remaining: ${formatTime(totalRemained)})`;
            startWorkoutBtn.disabled = false;
        }

        if (typeof showToast === "function") {
            showToast(`Your workout is incomplete. You completed ${totalElapsed} seconds. ${totalRemained} seconds remaining to finish your workout.`, "warning");
        }
    }

    renderExercises();
    updateProgressCounter();
}

/* =====================================================
   PERSIST SESSION TO BACKEND
===================================================== */
async function saveSessionProgress(status) {
    if (!currentUserId || !workout) return;

    let totalElapsed = 0;
    let totalRemained = 0;
    const exerciseStates = workout.exercises.map((e, idx) => {
        totalElapsed += (e._elapsedSeconds || 0);
        totalRemained += (e._remainedSeconds || 0);
        return {
            exerciseId: e.exerciseId || idx + 1,
            name: e.name,
            totalSeconds: e._totalSeconds,
            elapsedSeconds: e._elapsedSeconds,
            remainedSeconds: e._remainedSeconds,
            status: e._status
        };
    });

    try {
        if (!currentSession) {
            const startRes = await fetch("/api/workout/session/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: currentUserId, workoutId: workout.workoutId, duration: targetDurationSeconds })
            });
            if (startRes.ok) {
                const data = await startRes.json();
                currentSession = data.session;
            }
        }

        const sid = currentSession ? (currentSession.sessionId || currentSession.workoutSessionId) : null;
        if (sid) {
            await fetch("/api/workout/session/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId: sid,
                    workoutSessionId: sid,
                    userId: currentUserId,
                    completedDuration: totalElapsed,
                    remainingDuration: totalRemained,
                    status: status || (totalRemained > 0 ? "Incomplete" : "Completed"),
                    currentExerciseIndex: currentExercise,
                    exerciseStates: exerciseStates
                })
            });
        }
    } catch (err) {
        console.warn("Unable to sync session with server:", err);
    }
}

/* =====================================================
   COMPLETE WORKOUT (STRICT BACKEND ENFORCEMENT)
===================================================== */
async function attemptCompleteWorkout() {
    if (!currentUserId || !workout) return;

    let totalElapsed = 0;
    workout.exercises.forEach(e => {
        totalElapsed += (e._elapsedSeconds || 0);
    });

    try {
        const sid = currentSession ? (currentSession.sessionId || currentSession.workoutSessionId) : null;
        const res = await fetch("/api/workout/session/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sessionId: sid,
                workoutSessionId: sid,
                userId: currentUserId,
                workoutId: workout.workoutId,
                completedDuration: totalElapsed
            })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            hasCompletedSuccessfully = true;
            setSessionBadge("Completed", "status-completed");
            if (sessionRemainingChip) sessionRemainingChip.style.display = "none";
            if (resumeAlertBanner) resumeAlertBanner.style.display = "none";
            
            if (completionSuccessBanner) {
                if (completionSuccessText) completionSuccessText.textContent = `${workout ? workout.name : "Strength Training"} successfully completed!`;
                completionSuccessBanner.style.display = "flex";
            }
            if (startWorkoutBtn) {
                startWorkoutBtn.textContent = "✓ Workout Completed";
                startWorkoutBtn.disabled = true;
            }

            if (workoutModal) workoutModal.classList.remove("show");

            if (typeof showToast === "function") {
                showToast(`✓ ${workout ? workout.name : "Strength Training"} successfully completed!`, "success");
            }
            renderExercises();
            updateProgressCounter();
        } else {
            // STRICT REJECTION: CompletedDuration < RequiredDuration
            if (typeof showToast === "function") {
                showToast(data.message || "Cannot complete workout: duration not met.", "error");
            }
            setSessionBadge("Incomplete", "status-incomplete");
        }
    } catch (err) {
        console.error("Error completing workout:", err);
        if (typeof showToast === "function") {
            showToast("Server connection error during completion.", "error");
        }
    }
}

/* =====================================================
   INITIALIZATION
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
    loadWorkoutAndSession();
});