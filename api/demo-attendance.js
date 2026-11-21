import { timingSafeEqual } from 'node:crypto';
import { VERCEL_DEMO_SYNC_UID, signInDemoScheduler, syncDemoAttendance } from '../server/demo-attendance.js';

export async function GET(request) {
    const {
        CRON_SECRET,
        VITE_FIREBASE_API_KEY,
        VITE_FIREBASE_PROJECT_ID,
        DEMO_VERCEL_SYNC_EMAIL,
        DEMO_VERCEL_SYNC_PASSWORD,
    } = process.env;
    if (!CRON_SECRET) {
        console.error('Demo attendance cron secret is missing');
        return new Response(null, { status: 503 });
    }

    const supplied = Buffer.from(request.headers.get('authorization') || '');
    const expected = Buffer.from(`Bearer ${CRON_SECRET}`);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
        return new Response(null, { status: 401 });
    }

    try {
        if (!VITE_FIREBASE_PROJECT_ID) throw new Error('Demo attendance project ID is missing');
        const token = await signInDemoScheduler({
            apiKey: VITE_FIREBASE_API_KEY,
            email: DEMO_VERCEL_SYNC_EMAIL,
            password: DEMO_VERCEL_SYNC_PASSWORD,
            uid: VERCEL_DEMO_SYNC_UID,
        });
        const result = await syncDemoAttendance({ projectId: VITE_FIREBASE_PROJECT_ID, token });
        console.info('Demo attendance sync finished', result);
        return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        console.error('Demo attendance sync failed:', error.message);
        return new Response(null, { status: 500 });
    }
}
