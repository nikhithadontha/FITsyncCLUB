/* =====================================================
   FITSYNC DIET & NUTRITION PAGE (DB-backed + personalized)
===================================================== */


/* =====================================================
   LOGIN CHECK
===================================================== */

const storedUser = localStorage.getItem("fitsyncUser");

if (!storedUser) {
    window.location.href = "login.html";
}

const currentUser = storedUser ? JSON.parse(storedUser) : null;
const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;

const adminNavLink = document.getElementById("adminNavLink");
if (adminNavLink && currentUser && currentUser.role === "Admin") {
    adminNavLink.style.display = "inline-block";
}


/* =====================================================
   LOGOUT
===================================================== */

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", function () {
        localStorage.removeItem("fitsyncUser");
        window.location.href = "login.html";
    });

}


/* =====================================================
   STATE
===================================================== */

let plans = [];
let userPreference = "Veg"; // default until a profile says otherwise


/* =====================================================
   LOAD SAVED PROFILE (prefill form + show last result)
===================================================== */

async function loadSavedProfile() {

    if (!currentUserId) {
        return;
    }

    try {

        const response = await fetch(`/api/diet/profile/${currentUserId}`);

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        if (!data.age) {
            return;
        }

        document.getElementById("age").value = data.age;
        document.getElementById("gender").value = data.gender;
        document.getElementById("heightCm").value = data.heightCm;
        document.getElementById("weightKg").value = data.weightKg;
        document.getElementById("goal").value = data.goal;
        document.getElementById("dietaryPreference").value = data.dietaryPreference;

        userPreference = data.dietaryPreference;

        // Re-fetch their matched plan + meals to populate the result card
        const userPlanResponse = await fetch(`/api/diet/user/${currentUserId}`);
        const userPlan = await userPlanResponse.json();

        if (userPlan.planId) {

            const planResponse = await fetch(
                `/api/diet/plans/${userPlan.planId}?preference=${data.dietaryPreference}`
            );
            const plan = await planResponse.json();

            let bmr = data.bmr;
            let tdee = data.tdee;
            let recommendedCalories = data.recommendedCalories;
            if (!bmr && data.weightKg && data.heightCm && data.age) {
                const isMale = (data.gender || 'male').toLowerCase() === 'male';
                bmr = isMale
                    ? (10 * data.weightKg) + (6.25 * data.heightCm) - (5 * data.age) + 5
                    : (10 * data.weightKg) + (6.25 * data.heightCm) - (5 * data.age) - 161;
                tdee = Math.round(bmr * 1.45);
                const gLower = (data.goal || '').toLowerCase();
                recommendedCalories = gLower.includes('loss') ? Math.max(1200, tdee - 500) : (gLower.includes('gain') ? tdee + 400 : tdee);
            }

            showResult(plan, bmr, tdee, recommendedCalories);

        }

    } catch (error) {

        console.error("Unable to load saved diet profile:", error);

    }

}


/* =====================================================
   LOAD CURRENT PLAN BANNER
===================================================== */

async function loadCurrentPlan() {

    if (!currentUserId) {
        return;
    }

    try {

        const response = await fetch(`/api/diet/user/${currentUserId}`);

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        if (!data.planName) {
            return;
        }

        document.getElementById("currentPlanSection").style.display = "block";
        document.getElementById("currentPlanName").textContent = data.planName;
        document.getElementById("currentPlanGoal").textContent =
            `${data.goal} · ${data.dailyCalories} kcal/day`;

    } catch (error) {

        console.error("Unable to load current diet plan:", error);

    }

}


/* =====================================================
   PERSONALIZE FORM SUBMIT
===================================================== */

const dietProfileForm = document.getElementById("dietProfileForm");
const generateBtn = document.getElementById("generateBtn");

dietProfileForm?.addEventListener("submit", async function (event) {

    event.preventDefault();

    if (!currentUserId) {
        if (typeof showToast === "function") showToast("Please log in again to build your plan.", "error");
        return;
    }

    const payload = {
        userId: currentUserId,
        age: parseInt(document.getElementById("age").value, 10),
        heightCm: parseFloat(document.getElementById("heightCm").value),
        weightKg: parseFloat(document.getElementById("weightKg").value),
        gender: document.getElementById("gender").value,
        goal: document.getElementById("goal").value,
        dietaryPreference: document.getElementById("dietaryPreference").value
    };

    generateBtn.disabled = true;
    generateBtn.textContent = "Generating...";

    try {

        const response = await fetch("/api/diet/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            if (typeof showToast === "function") showToast(data.message || "Unable to generate your plan right now.", "error");
            return;
        }

        userPreference = payload.dietaryPreference;

        let bmr = data.bmr;
        let tdee = data.tdee;
        let recommendedCalories = data.recommendedCalories;
        if (!bmr && payload.weightKg && payload.heightCm && payload.age) {
            const isMale = (payload.gender || 'male').toLowerCase() === 'male';
            bmr = isMale
                ? (10 * payload.weightKg) + (6.25 * payload.heightCm) - (5 * payload.age) + 5
                : (10 * payload.weightKg) + (6.25 * payload.heightCm) - (5 * payload.age) - 161;
            tdee = Math.round(bmr * 1.45);
            const gLower = (payload.goal || '').toLowerCase();
            recommendedCalories = gLower.includes('loss') ? Math.max(1200, tdee - 500) : (gLower.includes('gain') ? tdee + 400 : tdee);
        }

        showResult(data.plan, bmr, tdee, recommendedCalories);
        loadCurrentPlan();
        if (typeof showToast === "function") showToast("Custom nutrition plan generated!", "success");

        document.getElementById("resultCard").scrollIntoView({ behavior: "smooth", block: "start" });

    } catch (error) {

        console.error("Unable to generate diet plan:", error);
        if (typeof showToast === "function") showToast("Something went wrong. Please try again.", "error");

    } finally {

        generateBtn.disabled = false;
        generateBtn.textContent = "Generate My Plan";

    }

});


function showResult(plan, bmr, tdee, recommendedCalories) {

    if (!plan) return;
    const resultCard = document.getElementById("resultCard");
    if (resultCard) resultCard.style.display = "block";

    const nameEl = document.getElementById("resultPlanName");
    if (nameEl) nameEl.textContent = plan.name || "Custom Nutrition Plan";
    const goalEl = document.getElementById("resultPlanGoal");
    if (goalEl) goalEl.textContent = `${plan.goal || "Fitness"} plan · ${plan.preference === "Veg" ? "Vegetarian" : "Non-Vegetarian"}`;

    const bmrVal = Math.round(Number(bmr) || 1650);
    const tdeeVal = Math.round(Number(tdee) || 2300);
    const calVal = Math.round(Number(recommendedCalories) || 1850);

    const bmrEl = document.getElementById("resultBmr");
    if (bmrEl) bmrEl.textContent = bmrVal;
    const tdeeEl = document.getElementById("resultTdee");
    if (tdeeEl) tdeeEl.textContent = tdeeVal;
    const calEl = document.getElementById("resultCalories");
    if (calEl) calEl.textContent = calVal;

    const mealListEl = document.getElementById("resultMealList");
    if (mealListEl && Array.isArray(plan.meals)) {
        mealListEl.innerHTML = plan.meals.map(function (meal) {

            return `
                <div class="meal-row">
                    <div>
                        <span class="meal-type">${meal.mealType}</span>
                        <div class="meal-name">${meal.name}</div>
                        <div class="meal-desc">${meal.description ?? ""}</div>
                    </div>
                    <div class="meal-calories">${meal.calories} kcal</div>
                </div>
            `;

        }).join("");
    }

}


/* =====================================================
   LOAD PLAN LIST (browse all plans)
===================================================== */

async function loadPlans() {

    const dietPlanListEl = document.getElementById("dietPlanList");
    if (!dietPlanListEl) return;

    try {

        const response = await fetch("/api/diet/plans");

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        plans = await response.json();

        if (!plans || !plans.length) {
            dietPlanListEl.innerHTML = "<p style='color:#94a3b8; padding:20px 0;'>No diet plans available yet.</p>";
            return;
        }

        renderPlanCards(plans, dietPlanListEl);

    } catch (error) {

        console.warn("Server diet plans fetch fallback activated:", error);
        // Resilient fallback plans so the UI is never stuck on 'Loading plans...'
        plans = [
            {
                dietPlanId: 1,
                name: "Lean & Light",
                goal: "Weight Loss",
                description: "A calorie-controlled plan built around lean protein and high-fiber vegetables.",
                dailyCalories: 1600,
                proteinGrams: 120,
                carbsGrams: 140,
                fatGrams: 45
            },
            {
                dietPlanId: 2,
                name: "Muscle Builder",
                goal: "Muscle Gain",
                description: "Calorie-surplus plan with elevated protein to support hypertrophy and muscle recovery.",
                dailyCalories: 2600,
                proteinGrams: 175,
                carbsGrams: 280,
                fatGrams: 70
            },
            {
                dietPlanId: 3,
                name: "Balanced Lifestyle",
                goal: "Maintenance",
                description: "Even macronutrient split designed to sustain daily energy, health, and weight stability.",
                dailyCalories: 2000,
                proteinGrams: 140,
                carbsGrams: 210,
                fatGrams: 55
            }
        ];
        renderPlanCards(plans, dietPlanListEl);

    }

}

function renderPlanCards(planData, container) {

    container.innerHTML = planData.map(function (plan) {

        return `
            <div class="diet-plan-card">

                <span class="diet-plan-goal">${plan.goal}</span>
                <h3>${plan.name}</h3>
                <p class="diet-plan-desc">${plan.description ?? ""}</p>

                <div class="diet-plan-calories">
                    ${plan.dailyCalories} <span>kcal / day</span>
                </div>

                <div class="macro-row">
                    <div class="macro-chip">
                        <div class="macro-value">${plan.proteinGrams}g</div>
                        <div class="macro-label">Protein</div>
                    </div>
                    <div class="macro-chip">
                        <div class="macro-value">${plan.carbsGrams}g</div>
                        <div class="macro-label">Carbs</div>
                    </div>
                    <div class="macro-chip">
                        <div class="macro-value">${plan.fatGrams}g</div>
                        <div class="macro-label">Fat</div>
                    </div>
                </div>

                <div class="diet-plan-actions">
                    <button class="view-meals-btn" data-plan-id="${plan.dietPlanId}">
                        View Meals
                    </button>
                    <button class="choose-plan-btn" data-plan-id="${plan.dietPlanId}">
                        Choose Plan
                    </button>
                </div>

            </div>
        `;

    }).join("");

    container.querySelectorAll(".view-meals-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            openMealModal(btn.dataset.planId);
        });
    });

    container.querySelectorAll(".choose-plan-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            choosePlan(btn.dataset.planId);
        });
    });

}


/* =====================================================
   MEAL MODAL (uses the user's chosen veg/non-veg preference)
===================================================== */

const dietModal = document.getElementById("dietModal");
const dietModalClose = document.getElementById("dietModalClose");
const modalChooseBtn = document.getElementById("modalChooseBtn");

let activePlanId = null;

async function openMealModal(planId) {

    activePlanId = planId;

    try {

        const response = await fetch(`/api/diet/plans/${planId}?preference=${userPreference}`);

        if (!response.ok) {
            if (typeof showToast === "function") showToast("Unable to load this plan's meals right now.", "error");
            return;
        }

        const plan = await response.json();

        document.getElementById("modalPlanGoal").textContent =
            `${plan.goal} · ${plan.preference === "Veg" ? "Vegetarian" : "Non-Vegetarian"}`;
        document.getElementById("modalPlanName").textContent = plan.name;
        document.getElementById("modalPlanDescription").textContent = plan.description ?? "";

        document.getElementById("modalMacros").innerHTML = `
            <div class="macro-chip">
                <div class="macro-value">${plan.dailyCalories}</div>
                <div class="macro-label">Kcal</div>
            </div>
            <div class="macro-chip">
                <div class="macro-value">${plan.proteinGrams}g</div>
                <div class="macro-label">Protein</div>
            </div>
            <div class="macro-chip">
                <div class="macro-value">${plan.carbsGrams}g</div>
                <div class="macro-label">Carbs</div>
            </div>
            <div class="macro-chip">
                <div class="macro-value">${plan.fatGrams}g</div>
                <div class="macro-label">Fat</div>
            </div>
        `;

        document.getElementById("modalMealList").innerHTML = plan.meals.map(function (meal) {

            return `
                <div class="meal-row">
                    <div>
                        <span class="meal-type">${meal.mealType}</span>
                        <div class="meal-name">${meal.name}</div>
                        <div class="meal-desc">${meal.description ?? ""}</div>
                    </div>
                    <div class="meal-calories">${meal.calories} kcal</div>
                </div>
            `;

        }).join("");

        dietModal.classList.add("show");

    } catch (error) {

        console.error("Unable to load plan meals:", error);
        if (typeof showToast === "function") showToast("Unable to load this plan's meals right now.", "error");

    }

}

dietModalClose?.addEventListener("click", function () {
    dietModal.classList.remove("show");
});

dietModal?.addEventListener("click", function (event) {
    if (event.target === dietModal) {
        dietModal.classList.remove("show");
    }
});

modalChooseBtn?.addEventListener("click", function () {

    if (activePlanId) {
        choosePlan(activePlanId);
    }

});


/* =====================================================
   CHOOSE PLAN (manual browse-and-pick path)
===================================================== */

async function choosePlan(planId) {

    if (!currentUserId) {
        if (typeof showToast === "function") showToast("Please log in again to choose a plan.", "error");
        return;
    }

    try {

        const response = await fetch("/api/diet/select", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: currentUserId,
                dietPlanId: parseInt(planId, 10)
            })
        });

        const data = await response.json();

        if (!response.ok) {
            if (typeof showToast === "function") showToast(data.message || "Unable to choose this plan right now.", "error");
            return;
        }

        if (typeof showToast === "function") showToast(data.message || "Plan updated!", "success");
        dietModal?.classList.remove("show");
        loadCurrentPlan();

    } catch (error) {

        console.error("Unable to choose plan:", error);
        if (typeof showToast === "function") showToast("Something went wrong. Please try again.", "error");

    }

}


/* =====================================================
   INIT
===================================================== */

function initDietPage() {
    loadSavedProfile();
    loadCurrentPlan();
    loadPlans();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDietPage);
} else {
    initDietPage();
}
