import { apiUrl } from './api';

/**
 * Client for the recruitment endpoints.
 *
 * The credential a candidate holds is a reference code plus a one-time token.
 * They are kept in `localStorage` purely as a convenience so a returning
 * candidate does not have to retype them; the server re-verifies both on every
 * single request, so a tampered local value buys nothing.
 */

const CREDENTIAL_KEY = 'asterix_recruitment_credential_v1';

async function request(path, options = {}) {
    const res = await fetch(apiUrl(path), {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });

    let body = null;
    try {
        body = await res.json();
    } catch {
        body = null;
    }

    if (!res.ok) {
        const error = new Error(body?.error || `Request failed (${res.status}).`);
        error.status = res.status;
        error.reason = body?.reason;
        error.body = body;
        throw error;
    }
    return body;
}

/** Public schedule, stages, and the ungated part of each brief. */
export const fetchRecruitmentConfig = () => request('/api/recruitment/config');

export const submitApplication = (payload) =>
    request('/api/recruitment/apply', { method: 'POST', body: JSON.stringify(payload) });

export const lookupApplication = (refCode, token) =>
    request('/api/recruitment/lookup', {
        method: 'POST',
        body: JSON.stringify({ refCode, token })
    });

export const submitWork = ({ refCode, token, phase, url, note }) =>
    request('/api/recruitment/submit', {
        method: 'POST',
        body: JSON.stringify({ refCode, token, phase, url, note })
    });

/* --- Local credential convenience ------------------------------------- */

export function saveCredential(refCode, token) {
    try {
        localStorage.setItem(CREDENTIAL_KEY, JSON.stringify({ refCode, token }));
    } catch {
        // Private browsing or blocked storage. The candidate still has the code
        // on screen, so this is only a convenience we can do without.
    }
}

export function loadCredential() {
    try {
        const raw = localStorage.getItem(CREDENTIAL_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.refCode && parsed?.token ? parsed : null;
    } catch {
        return null;
    }
}

export function clearCredential() {
    try {
        localStorage.removeItem(CREDENTIAL_KEY);
    } catch {
        // Nothing to do.
    }
}

/**
 * Render's free tier suspends the service after about fifteen minutes of
 * inactivity, and the next request then waits roughly a minute for a cold
 * start. On a deadline night that reads as an outage. Firing a cheap health
 * check when the portal mounts gets the wake-up out of the way before anyone
 * tries to submit.
 */
export function warmUpBackend() {
    fetch(apiUrl('/api/health')).catch(() => { });
}

/* --- Admin ------------------------------------------------------------ *
 * Every one of these requires a valid admin JWT. The server checks it; the
 * token is passed in explicitly rather than read from storage here so the
 * caller stays responsible for having a real session.
 * --------------------------------------------------------------------- */

const authed = (token, path, options = {}) =>
    request(path, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...options.headers
        }
    });

export const adminFetchConfig = (token) => authed(token, '/api/recruitment/config/admin');

export const adminSaveConfig = (token, payload) =>
    authed(token, '/api/recruitment/config', { method: 'PUT', body: JSON.stringify(payload) });

export const adminFetchApplications = (token, params = {}) => {
    const query = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    ).toString();
    return authed(token, `/api/recruitment/applications${query ? `?${query}` : ''}`);
};

export const adminUpdateApplication = (token, id, payload) =>
    authed(token, `/api/recruitment/applications/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });

export const adminBulkAdvance = (token, payload) =>
    authed(token, '/api/recruitment/applications/bulk-advance', {
        method: 'POST',
        body: JSON.stringify(payload)
    });

export const adminFetchTeams = (token, track) =>
    authed(token, `/api/recruitment/teams${track ? `?track=${encodeURIComponent(track)}` : ''}`);

export const adminDrawTeams = (token, payload) =>
    authed(token, '/api/recruitment/teams/draw', { method: 'POST', body: JSON.stringify(payload) });

export const adminPublishResults = (token, payload) =>
    authed(token, '/api/recruitment/config/publish-results', {
        method: 'POST',
        body: JSON.stringify(payload)
    });

/** CSV export. Needs the auth header, so it cannot be a plain anchor link. */
export async function adminExportCsv(token, track) {
    const res = await fetch(apiUrl(`/api/recruitment/export${track ? `?track=${encodeURIComponent(track)}` : ''}`), {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Export failed (${res.status}).`);

    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `asterix-applications-${track || 'all'}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
}
