import { DEMO_SYNC_UID, syncDemoAttendance } from '../server/demo-attendance.js';

async function main() {
    const { DEMO_FIREBASE_PROJECT_ID, DEMO_FIREBASE_WEB_API_KEY, DEMO_SYNC_EMAIL, DEMO_SYNC_PASSWORD } = process.env;
    if (!DEMO_FIREBASE_PROJECT_ID || !DEMO_FIREBASE_WEB_API_KEY || !DEMO_SYNC_EMAIL || !DEMO_SYNC_PASSWORD) {
        throw new Error('Demo attendance credentials are missing');
    }

    const url = new URL('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword');
    url.searchParams.set('key', DEMO_FIREBASE_WEB_API_KEY);
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: DEMO_SYNC_EMAIL, password: DEMO_SYNC_PASSWORD, returnSecureToken: true }),
        signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Demo attendance sign-in returned HTTP ${response.status}`);
    const { idToken, localId } = await response.json();
    if (!idToken || localId !== DEMO_SYNC_UID) throw new Error('Unexpected demo attendance user');

    const result = await syncDemoAttendance({ projectId: DEMO_FIREBASE_PROJECT_ID, token: idToken });
    console.info('Demo attendance sync finished', result);
}

main().catch(error => {
    console.error('Demo attendance sync failed:', error.message);
    process.exitCode = 1;
});
