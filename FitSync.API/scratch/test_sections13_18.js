const http = require('http');

function request(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                let parsed = null;
                try { parsed = JSON.parse(body); } catch (e) { parsed = body; }
                resolve({ status: res.statusCode, headers: res.headers, body: parsed });
            });
        });
        req.on('error', reject);
        if (data) {
            req.write(typeof data === 'string' ? data : JSON.stringify(data));
        }
        req.end();
    });
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✓ PASS: ${message}`);
        passed++;
    } else {
        console.error(`  ✗ FAIL: ${message}`);
        failed++;
    }
}

async function runTests() {
    console.log("=================================================");
    console.log("TEST SUITE: SECTIONS 13 - 18 VERIFICATION");
    console.log("=================================================");

    const TEST_USER_ID = 1;
    const OTHER_USER_ID = 2;

    // -------------------------------------------------------------
    // TEST 1: SECTION 15 - PROGRESS SUMMARY (10 METRICS)
    // -------------------------------------------------------------
    console.log("\n[TEST 1] Progress API returns all 10 Summary Metrics (Section 15)");
    const progRes = await request({
        hostname: 'localhost',
        port: 5298,
        path: `/api/workout/progress/${TEST_USER_ID}`,
        method: 'GET',
        headers: { 'x-user-id': TEST_USER_ID.toString() }
    });

    assert(progRes.status === 200, "Progress API returned 200 OK");
    const summary = progRes.body.summary;
    assert(summary !== undefined, "Summary object is present in response");
    assert(summary.totalWorkouts !== undefined, "1. totalWorkouts metric present");
    assert(summary.completedWorkouts !== undefined, "2. completedWorkouts metric present");
    assert(summary.incompleteWorkouts !== undefined, "3. incompleteWorkouts metric present");
    assert(summary.totalWorkoutDuration !== undefined, "4. totalWorkoutDuration metric present");
    assert(summary.caloriesBurned !== undefined, "5. caloriesBurned metric present");
    assert(summary.classesAttended !== undefined, "6. classesAttended metric present");
    assert(summary.classesScheduled !== undefined, "7. classesScheduled metric present");
    assert(summary.trainerSessions !== undefined, "8. trainerSessions metric present");
    assert(summary.currentSubscription !== undefined, "9. currentSubscription metric present");
    assert(summary.weeklyGoalProgress !== undefined, "10. weeklyGoalProgress metric present");

    // -------------------------------------------------------------
    // TEST 2: SECTION 14 - USER-SPECIFIC PROGRESS (LAST 7 DAYS)
    // -------------------------------------------------------------
    console.log("\n[TEST 2] Progress API returns Last 7 Days Itemized Workouts (Section 14)");
    const sevenDayWorkouts = progRes.body.sevenDayWorkouts;
    assert(Array.isArray(sevenDayWorkouts), "sevenDayWorkouts is an array");
    console.log(`  Found ${sevenDayWorkouts.length} itemized workout sessions in past 7 days.`);

    if (sevenDayWorkouts.length > 0) {
        const item = sevenDayWorkouts[0];
        assert(item.date !== undefined, "Item contains Date");
        assert(item.workout !== undefined, "Item contains Workout");
        assert(item.category !== undefined, "Item contains Category");
        assert(item.duration !== undefined, "Item contains Duration");
        assert(item.calories !== undefined, "Item contains Calories");
        assert(item.status !== undefined, "Item contains Status (Completed/Incomplete)");
    }

    // -------------------------------------------------------------
    // TEST 3: SECTION 16 - PROGRESS CHARTS METADATA
    // -------------------------------------------------------------
    console.log("\n[TEST 3] Progress API returns dynamic series for 4 Charts (Section 16)");
    const last7Days = progRes.body.last7Days;
    assert(Array.isArray(last7Days) && last7Days.length === 7, "last7Days has 7 daily buckets for duration & calorie charts");
    assert(last7Days.every(d => d.minutes !== undefined && d.calories !== undefined), "Each day contains real minutes and calories");

    const completionBreakdown = progRes.body.completionBreakdown;
    assert(completionBreakdown !== undefined, "completionBreakdown is present for completed vs incomplete chart");
    assert(completionBreakdown.completed !== undefined && completionBreakdown.incomplete !== undefined, "completionBreakdown contains completed and incomplete counts");

    const weeklyGoal = progRes.body.weeklyGoal;
    assert(weeklyGoal !== undefined && weeklyGoal.target === 5, "weeklyGoal target is 5 for goal gauge chart");

    // -------------------------------------------------------------
    // TEST 4: SECTION 17 - USER PROFILE DISPLAY & USER ISOLATION
    // -------------------------------------------------------------
    console.log("\n[TEST 4] User Profile retrieval and strict User Isolation security (Section 17)");
    const profRes = await request({
        hostname: 'localhost',
        port: 5298,
        path: `/api/account/profile/${TEST_USER_ID}`,
        method: 'GET'
    });

    assert(profRes.status === 200, "Profile GET returned 200 OK");
    const prof = profRes.body;
    assert(prof.fullName !== undefined, "Profile contains FullName");
    assert(prof.email !== undefined, "Profile contains Email");
    assert(prof.phoneNumber !== undefined, "Profile contains Mobile Number");
    assert(prof.age !== undefined, "Profile contains Age");
    assert(prof.gender !== undefined, "Profile contains Gender");
    assert(prof.heightCm !== undefined, "Profile contains Height");
    assert(prof.weightKg !== undefined, "Profile contains Weight");
    assert(prof.fitnessGoal !== undefined, "Profile contains Fitness Goal");
    assert(prof.fitnessLevel !== undefined, "Profile contains Fitness Level");
    assert(prof.dietPreference !== undefined, "Profile contains Diet Preference");
    assert(prof.preferredWorkout !== undefined, "Profile contains Preferred Workout");
    assert(prof.profileImage !== undefined, "Profile contains Profile Photo field");

    // Security Check: User A (ID: 1) attempts to modify User B (ID: 2) -> MUST BE 403 FORBIDDEN
    console.log("\n[TEST 4B] Security Isolation: User A (1) cannot modify User B (2)");
    const hackRes = await request({
        hostname: 'localhost',
        port: 5298,
        path: '/api/account/profile',
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': '1' // Caller is User 1
        }
    }, {
        userId: OTHER_USER_ID, // Target is User 2
        fullName: "Hacked by User 1"
    });

    assert(hackRes.status === 403, `Blocked unauthorized edit with HTTP 403 Forbidden (received ${hackRes.status})`);
    assert(hackRes.body.message && hackRes.body.message.includes("User A cannot modify User B's profile"), "Returned expected security error message");

    // Valid User Edit: User 1 updates their own profile
    console.log("\n[TEST 4C] User 1 edits their own profile successfully");
    const validEditRes = await request({
        hostname: 'localhost',
        port: 5298,
        path: '/api/account/profile',
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': '1'
        }
    }, {
        userId: 1,
        fullName: "John Fitness Doe",
        phoneNumber: "9876543210",
        age: 28,
        gender: "Male",
        heightCm: 180,
        weightKg: 78,
        fitnessGoal: "Muscle Building",
        fitnessLevel: "Intermediate",
        dietPreference: "Non-Vegetarian",
        preferredWorkout: "Strength Training",
        profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb"
    });

    assert(validEditRes.status === 200, "Valid profile update returned 200 OK");
    assert(validEditRes.body.user.preferredWorkout === "Strength Training", "Updated preferredWorkout saved successfully");
    assert(validEditRes.body.user.profileImage.includes("unsplash"), "Updated profileImage saved successfully");

    // -------------------------------------------------------------
    // TEST 5: SECTION 18 - MY BOOKINGS SEPARATION & FIELDS
    // -------------------------------------------------------------
    console.log("\n[TEST 5] My Bookings: Class Bookings & Trainer Bookings (Section 18)");
    const bookRes = await request({
        hostname: 'localhost',
        port: 5298,
        path: `/api/booking/my-bookings/${TEST_USER_ID}`,
        method: 'GET',
        headers: { 'x-user-id': TEST_USER_ID.toString() }
    });

    assert(bookRes.status === 200, "My Bookings returned 200 OK");
    assert(Array.isArray(bookRes.body.classes), "Class Bookings returned as separate array");
    assert(Array.isArray(bookRes.body.trainers), "Trainer Bookings returned as separate array");

    // Book a class for User 1 if none exists to verify fields
    if (bookRes.body.classes.length === 0) {
        await request({
            hostname: 'localhost',
            port: 5298,
            path: '/api/classes/book',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { userId: 1, classId: 1 });
    }

    // Book a trainer session for User 1 if none exists to verify fields
    if (bookRes.body.trainers.length === 0) {
        await request({
            hostname: 'localhost',
            port: 5298,
            path: '/api/booking',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { userId: 1, slotId: 1 });
    }

    // Re-fetch bookings
    const refreshedBookings = await request({
        hostname: 'localhost',
        port: 5298,
        path: `/api/booking/my-bookings/${TEST_USER_ID}`,
        method: 'GET'
    });

    const cls = refreshedBookings.body.classes[0];
    if (cls) {
        assert(cls.class !== undefined || cls.className !== undefined, "Class Booking has Class field");
        assert(cls.category !== undefined, "Class Booking has Category field");
        assert(cls.trainer !== undefined || cls.trainerName !== undefined, "Class Booking has Trainer field");
        assert(cls.date !== undefined, "Class Booking has Date field");
        assert(cls.time !== undefined, "Class Booking has Time field");
        assert(cls.mode !== undefined || cls.isOnline !== undefined, "Class Booking has Online/Offline field");
        assert(cls.facility !== undefined, "Class Booking has Facility field");
        assert(cls.status !== undefined, "Class Booking has Status field");
    }

    const tr = refreshedBookings.body.trainers[0];
    if (tr) {
        assert(tr.trainer !== undefined || tr.trainerName !== undefined, "Trainer Booking has Trainer field");
        assert(tr.date !== undefined, "Trainer Booking has Date field");
        assert(tr.time !== undefined, "Trainer Booking has Time field");
        assert(tr.facility !== undefined, "Trainer Booking has Facility field");
        assert(tr.status !== undefined, "Trainer Booking has Status field");
    }

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log("\n=================================================");
    console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================");
    if (failed > 0) process.exit(1);
}

runTests().catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
