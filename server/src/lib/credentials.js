/**
 * Server-side mirror of `src/lib/credentials.js`.
 *
 * Deliberately duplicated rather than imported across the boundary: `server/`
 * has its own `package.json` and its own `node_modules`, and reaching up into
 * the Vite app's source would make the API un-deployable on its own. The two
 * copies have to agree on exactly one thing -- the identifier -- so `fnv1a` and
 * `rosterKey` below are byte-for-byte the same algorithm, and there is a test
 * of that agreement in the sense that a mismatch shows up immediately as a
 * badge link that 404s.
 *
 * "Verifiable" means the badge is generated from the team's own roster and
 * served by the team's own API. It is not a signed attestation, and the public
 * page says as much rather than implying a guarantee this cannot make.
 */

const SUBSYSTEM_CODES = {
    'software-perception': 'SW',
    powertrain: 'PT',
    mechanical: 'ME',
    leads: 'LD'
};

export const subsystemCode = (subsystemId) =>
    SUBSYSTEM_CODES[subsystemId]
    || String(subsystemId || 'AX').replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase()
    || 'AX';

/** FNV-1a, 32-bit. Must stay identical to the browser copy. */
function fnv1a(input) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i += 1) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, '0').toUpperCase();
}

const rosterKey = (subsystemId, name) =>
    `${String(subsystemId || '').trim().toLowerCase()}|${String(name || '').trim().toLowerCase().replace(/\s+/g, ' ')}`;

export function credentialId(subsystemId, name) {
    if (!String(name || '').trim()) return '';
    return `ASX-${subsystemCode(subsystemId)}-${fnv1a(rosterKey(subsystemId, name))}`;
}

/** Same rule the admin uses when adding a specialist: first letters of the
    first two words, so "A Person" reads as "AP" and not as "A ". */
const initialsFor = (name) =>
    String(name || '')
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'TM';

function credentialOf(member) {
    const c = member?.credential || {};
    return {
        issued: c.issued !== false,
        tenure: c.tenure || '',
        headline: c.headline || '',
        achievements: Array.isArray(c.achievements) ? c.achievements.filter(Boolean) : []
    };
}

function summaryFor(member, subsystem, cred) {
    const role = member?.role || subsystem?.name || 'Crew';
    const highlight = cred.headline || cred.achievements[0] || member?.bio || '';
    const head = `${member?.name || 'Team Asterix Crew'} — ${role}`;
    return highlight ? `${head}: ${highlight}` : head;
}

/**
 * Every issued credential in a roster.
 *
 * Only fields that belong on a public page are copied out. The roster carries
 * nothing sensitive today, but building the response by naming each field means
 * a future private field on a member does not leak the moment it is added.
 */
export function buildCredentials(subsystems) {
    const rows = [];
    for (const subsystem of subsystems || []) {
        for (const member of subsystem?.teamMembers || []) {
            if (!member?.name) continue;
            const cred = credentialOf(member);
            if (!cred.issued) continue;
            rows.push({
                id: credentialId(subsystem.id, member.name),
                name: member.name,
                initials: member.initials || initialsFor(member.name),
                role: member.role || '',
                badge: member.badge || 'ENGINEER',
                bio: member.bio || '',
                photo: member.photo || '',
                photoFit: member.photoFit || 'cover',
                photoPosition: member.photoPosition || '50% 50%',
                status: member.status === 'Alumni' ? 'Alumni' : 'Active Member',
                subsystemId: subsystem.id,
                subsystemName: subsystem.name || subsystem.id,
                subsystemColor: subsystem.color || 'bg-sky-400',
                tenure: cred.tenure,
                headline: cred.headline,
                achievements: cred.achievements,
                summary: summaryFor(member, subsystem, cred)
            });
        }
    }
    return rows;
}
