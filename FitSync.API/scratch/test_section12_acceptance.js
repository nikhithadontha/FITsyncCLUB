const http = require('http');

const BASE_URL = 'http://localhost:5298';

function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = data ? JSON.parse(data) : {};
                    resolve({ status: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

let testPassed = 0;
let testFailed = 0;

function assert(condition, testName) {
    if (condition) {
        console.log(`PASS: ${testName}`);
        testPassed++;
    } else {
        console.error(`FAIL: ${testName}`);
        testFailed++;
    }
}

async function runSection12AcceptanceTest() {
    console.log('====================================================');
    console.log('FITSYNC - SECTION 12 WORKOUT ACCEPTANCE TEST RUNNER');
    console.log('====================================================\n');

    const testUserId = 1;
    const testWorkoutId = 1; // Strength Training

    // Step 1: Set workout duration to 30 seconds and start workout
    console.log('[Step 1] Set workout duration to: 30 seconds & Start workout');
    const startRes = await request('POST', '/api/workout/session/start', {
        userId: testUserId,
        workoutId: testWorkoutId,
        duration: 30
    });

    assert(startRes.status === 200, 'Start workout returns HTTP 200');
    assert(startRes.body.session !== undefined, 'Workout session object created/returned');
    const session = startRes.body.session;
    const sessionId = session.sessionId || session.workoutSessionId;

    assert(session.requiredDuration === 30, 'Workout required duration is set to 30 seconds');
    assert(session.status === 'In Progress' || session.status === 'Incomplete', 'Workout state machine initializes active session');
    console.log(`   Session initialized: ID=${sessionId}, Required=${session.requiredDuration}s, Status=${session.status}`);

    // Step 2: Wait 5 seconds (simulated 5s elapsed)
    console.log('\n[Step 2] Elapsed duration = 5 seconds');
    const elapsed = 5;
    const remaining = 30 - elapsed; // 25 seconds

    // Step 3: Stop workout
    console.log('\n[Step 3] Stop workout at 5 seconds');
    const stopRes = await request('POST', '/api/workout/session/update', {
        sessionId: sessionId,
        workoutSessionId: sessionId,
        userId: testUserId,
        completedDuration: elapsed,
        remainingDuration: remaining,
        status: 'Incomplete'
    });

    assert(stopRes.status === 200, 'Stop workout update returns HTTP 200');
    assert(stopRes.body.session.status === 'Incomplete', 'Expected Status = Incomplete');
    assert(stopRes.body.session.completedDuration === 5, 'Expected CompletedDuration = 5 seconds');
    assert(stopRes.body.session.remainingDuration === 25, 'Expected RemainingDuration = 25 seconds');
    assert(stopRes.body.session.status !== 'Completed', 'Strict check: Status MUST NOT be set to Completed');

    // UI text check:
    const expectedUIBanner = `Your workout is incomplete. You completed 5 seconds. 25 seconds remaining to finish your workout.`;
    const constructedUIBanner = `Your workout is incomplete. You completed ${stopRes.body.session.completedDuration} seconds. ${stopRes.body.session.remainingDuration} seconds remaining to finish your workout.`;
    assert(constructedUIBanner === expectedUIBanner, `Expected UI text matches: "${expectedUIBanner}"`);

    // Step 4: Prevent Frontend Manipulation (Section 9)
    console.log('\n[Step 4] Prevent Frontend Manipulation: Attempt early completion at 5s with forged status="Completed"');
    const manipulateRes = await request('POST', '/api/workout/session/complete', {
        sessionId: sessionId,
        workoutSessionId: sessionId,
        userId: testUserId,
        workoutId: testWorkoutId,
        completedDuration: 5,
        status: 'Completed' // Malicious client attempt
    });

    assert(manipulateRes.status === 400, 'Backend rejects completion when completedDuration (5s) < requiredDuration (30s) (HTTP 400)');
    assert(manipulateRes.body.success === false, 'Completion response success is false');
    assert(manipulateRes.body.status === 'Incomplete', 'Backend enforces Status = Incomplete');
    assert(manipulateRes.body.completedDuration === 5, 'Backend maintains CompletedDuration = 5 seconds');
    assert(manipulateRes.body.remainingDuration === 25, 'Backend maintains RemainingDuration = 25 seconds');
    assert(manipulateRes.body.message === expectedUIBanner, `Backend rejection message exactly matches Section 12 UI text: "${manipulateRes.body.message}"`);

    // Step 5: Resume workout (Section 11)
    console.log('\n[Step 5] Resume Workout: verify progress preserved and timer does not reset to zero');
    const resumeCheckRes = await request('GET', `/api/workout/session/latest/${testUserId}/${testWorkoutId}`);
    assert(resumeCheckRes.status === 200, 'Fetch latest session returns HTTP 200');
    assert(resumeCheckRes.body.found === true, 'Incomplete session found for resume');
    const resumedSession = resumeCheckRes.body.session;
    assert(resumedSession.completedDuration === 5, 'Resume preserves completedDuration = 5 (does NOT reset to zero)');
    assert(resumedSession.remainingDuration === 25, 'Resume preserves remainingDuration = 25 (does NOT reset to 30)');
    console.log(`   Resume state verified: Completed=${resumedSession.completedDuration}s, Remaining=${resumedSession.remainingDuration}s`);

    // Step 6: Wait remaining 25 seconds and complete workout
    console.log('\n[Step 6] Wait remaining 25 seconds -> Total completed = 30 seconds -> Complete workout');
    const completeRes = await request('POST', '/api/workout/session/complete', {
        sessionId: sessionId,
        workoutSessionId: sessionId,
        userId: testUserId,
        workoutId: testWorkoutId,
        completedDuration: 30
    });

    assert(completeRes.status === 200, 'Completion returns HTTP 200 when completedDuration >= requiredDuration (30 >= 30)');
    assert(completeRes.body.success === true, 'Completion success = true');
    assert(completeRes.body.status === 'Completed', 'Expected Status = Completed');
    assert(completeRes.body.message === '✓ Strength Training successfully completed!', `Expected UI message: "${completeRes.body.message}"`);

    // Step 7: Refresh the browser (Section 12 requirement)
    console.log('\n[Step 7] Refresh the browser: Status must remain Completed');
    const refreshRes = await request('GET', `/api/workout/session/latest/${testUserId}/${testWorkoutId}`);
    assert(refreshRes.status === 200, 'Query session after browser refresh returns HTTP 200');
    assert(refreshRes.body.found === true, 'Session found on refresh');
    assert(refreshRes.body.session.status === 'Completed', 'Status strictly REMAINS "Completed" after browser refresh!');
    assert(refreshRes.body.session.remainingDuration === 0, 'Remaining duration is 0 on refresh');

    // Summary
    console.log('\n====================================================');
    console.log(`TEST RESULTS: ${testPassed} Passed, ${testFailed} Failed`);
    console.log('====================================================\n');

    if (testFailed > 0) {
        process.exit(1);
    }
}

runSection12AcceptanceTest().catch((err) => {
    console.error('Test execution error:', err);
    process.exit(1);
});
