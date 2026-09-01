/**
 * Digital engineering credentials for crew and alumni.
 *
 * A member who leaves the team takes nothing with them but a line on a CV that
 * a recruiter has no way to check. A credential fixes that: a page on this site,
 * for one person, naming the subsystem they owned and the engineering work they
 * actually shipped, that anyone can open and read. "Verifiable" here means
 * exactly one thing and no more -- the page is generated from the team's own
 * roster, served by the team's own API, and it disappears the moment the roster
 * says the person is not on it. It is not a cryptographic attestation and the
 * page says so in plain words rather than implying more than it can back.
 *
 * The identifier is derived, never stored. Deriving it from the subsystem and
 * the name means every existing roster entry already has a working credential
 * with no migration, and the server can recompute the same id from its own copy
 * of the roster to answer a lookup. The trade is that renaming a member reissues
 * their id and retires the old link, which is the right way round: a credential
 * should follow the roster, not outlive it.
 */

const SUBSYSTEM_CODES = {
    'software-perception': 'SW',
    powertrain: 'PT',
    mechanical: 'ME',
    leads: 'LD'
};

/** Short code for a subsystem, falling back to its first two letters. */
export const subsystemCode = (subsystemId) =>
    SUBSYSTEM_CODES[subsystemId] || String(subsystemId || 'AX').replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase() || 'AX';

/**
 * FNV-1a, 32-bit. Chosen because it is a dozen lines, has no dependencies, and
 * gives byte-identical output in the browser and in Node -- which matters,
 * because the id the badge page shows has to be the id the API recognises.
 * It is a checksum for identifying a roster row, not a security primitive.
 */
function fnv1a(input) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i += 1) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, '0').toUpperCase();
}

/** Canonical key for a roster row, so casing and stray spaces cannot fork an id. */
const rosterKey = (subsystemId, name) =>
    `${String(subsystemId || '').trim().toLowerCase()}|${String(name || '').trim().toLowerCase().replace(/\s+/g, ' ')}`;

/** The public identifier for one member's credential, e.g. `ASX-SW-3F2A1B0C`. */
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

/** Everything stored about a credential, with the gaps filled in. */
export function credentialOf(member) {
    const c = member?.credential || {};
    return {
        issued: c.issued !== false,
        tenure: c.tenure || '',
        headline: c.headline || '',
        achievements: Array.isArray(c.achievements) ? c.achievements.filter(Boolean) : []
    };
}

/**
 * The one-line summary a credential leads with, in the shape the team asked
 * for: `Ratheeswar — Software & Perception Lead: Architected ROS 2 Stanley
 * Lateral Controller`. Falls back through the fields that do exist, so a
 * member nobody has written a headline for still reads as a sentence.
 */
export function credentialSummary(member, subsystem) {
    const cred = credentialOf(member);
    const role = member?.role || subsystem?.name || 'Crew';
    const highlight = cred.headline || cred.achievements[0] || member?.bio || '';
    const head = `${member?.name || 'Team Asterix Crew'} — ${role}`;
    return highlight ? `${head}: ${highlight}` : head;
}

/** Flattens the roster into one credential record per member. */
export function buildCredentials(subsystems) {
    const rows = [];
    for (const subsystem of subsystems || []) {
        for (const member of subsystem.teamMembers || []) {
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
                subsystemName: subsystem.name,
                subsystemColor: subsystem.color || 'bg-sky-400',
                tenure: cred.tenure,
                headline: cred.headline,
                achievements: cred.achievements,
                summary: credentialSummary(member, subsystem)
            });
        }
    }
    return rows;
}

/** Absolute URL of a credential page, for sharing. */
export function credentialUrl(id, origin) {
    const base = origin || (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '');
    return `${String(base).replace(/#.*$/, '').replace(/\/+$/, '')}/#badge/${id}`;
}

/** LinkedIn's share composer, pre-filled with the credential link. */
export const linkedInShareUrl = (url) =>
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

/**
 * LinkedIn's "add to profile" deep link for the Licenses & Certifications
 * section. `issueYear`/`issueMonth` are what LinkedIn stamps on the entry, so
 * they are taken from the end of the member's tenure where one is recorded.
 */
export function linkedInAddToProfileUrl({ name, id, url, issueYear, issueMonth }) {
    const params = new URLSearchParams({
        startTask: 'CERTIFICATION_NAME',
        name,
        organizationName: 'Team Asterix — SAEINDIA BAJA',
        certUrl: url,
        certId: id
    });
    if (issueYear) params.set('issueYear', String(issueYear));
    if (issueMonth) params.set('issueMonth', String(issueMonth));
    return `https://www.linkedin.com/profile/add?${params.toString()}`;
}

/** The last four-digit year mentioned in a tenure string, e.g. "2024 – 2026". */
export function tenureEndYear(tenure) {
    const years = String(tenure || '').match(/\b(19|20)\d{2}\b/g);
    return years?.length ? Number(years[years.length - 1]) : null;
}
