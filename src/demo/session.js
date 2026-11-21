export const DEMO_EMAIL = 'demo@example.invalid';
export const DEMO_PASSWORD = 'ExploreAttendance!';

const sessionKey = 'eap-demo-session';

export function startDemoSession() {
    sessionStorage.setItem(sessionKey, 'active');
}

export function hasDemoSession() {
    return sessionStorage.getItem(sessionKey) === 'active';
}

export function endDemoSession() {
    sessionStorage.removeItem(sessionKey);
}
