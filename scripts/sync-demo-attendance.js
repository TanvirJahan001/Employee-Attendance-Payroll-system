import { DEMO_SYNC_UID, signInDemoScheduler, syncDemoAttendance } from '../server/demo-attendance.js';

async function main() {
    const { DEMO_FIREBASE_PROJECT_ID, DEMO_FIREBASE_WEB_API_KEY, DEMO_SYNC_EMAIL, DEMO_SYNC_PASSWORD } = process.env;
    if (!DEMO_FIREBASE_PROJECT_ID) throw new Error('Demo attendance project ID is missing');
    const token = await signInDemoScheduler({
        apiKey: DEMO_FIREBASE_WEB_API_KEY,
        email: DEMO_SYNC_EMAIL,
        password: DEMO_SYNC_PASSWORD,
        uid: DEMO_SYNC_UID,
    });

    const result = await syncDemoAttendance({ projectId: DEMO_FIREBASE_PROJECT_ID, token });
    console.info('Demo attendance sync finished', result);
}

main().catch(error => {
    console.error('Demo attendance sync failed:', error.message);
    process.exitCode = 1;
});
