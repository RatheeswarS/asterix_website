import crypto from 'node:crypto';

/**
 * Auditable random team draw.
 *
 * The draw has to be defensible after the fact. "We shuffled it, trust us" is
 * not something a rejected candidate can check, so the shuffle is seeded and
 * deterministic and both the seed and a hash of the exact input roster are
 * stored on every team. Re-running `drawTeams` with the same seed and roster
 * reproduces the same teams exactly, which turns a dispute into a two-minute
 * verification instead of an argument.
 */

/** Deterministic 32-bit PRNG. Small, fast, and good enough for a shuffle. */
function mulberry32(a) {
    return function next() {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Folds an arbitrary seed string into the 32-bit integer the PRNG wants. */
function seedToInt(seed) {
    const digest = crypto.createHash('sha256').update(String(seed)).digest();
    return digest.readUInt32BE(0);
}

/** A fresh seed for a draw nobody has specified one for. */
export function generateSeed() {
    return crypto.randomBytes(8).toString('hex');
}

/**
 * Pins the exact set of people who went into a draw. Sorted first so the hash
 * depends on the membership and not on whatever order the database returned.
 */
export function rosterHashOf(refCodes) {
    const sorted = [...refCodes].map(String).sort();
    return crypto.createHash('sha256').update(sorted.join(',')).digest('hex');
}

/** Seeded Fisher-Yates. Does not mutate the input. */
export function seededShuffle(items, seed) {
    const random = mulberry32(seedToInt(seed));
    const out = [...items];
    for (let i = out.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

/**
 * Shuffles `applications` and deals them round-robin into teams of roughly
 * `teamSize`.
 *
 * Round-robin rather than slicing into consecutive chunks because slicing
 * leaves the remainder as a runt team -- with 7 people and a size of 3 you get
 * 3/3/1, and the person left alone is carrying a team's workload by themselves.
 * Dealing gives 3/2/2, so sizes never differ by more than one.
 *
 * Callers must pass applications from a single track; `drawTeams` asserts it
 * rather than trusting them, because a mixed draw is the one outcome that would
 * be unrecoverable once published.
 */
export function drawTeams({ applications, teamSize, seed, track }) {
    if (!Array.isArray(applications) || applications.length === 0) {
        return { teams: [], seed, rosterHash: rosterHashOf([]) };
    }

    const stray = applications.find((a) => a.track !== track);
    if (stray) {
        throw new Error(
            `Refusing to draw: application ${stray.refCode} is on track "${stray.track}" but the draw is for "${track}".`
        );
    }

    const size = Math.max(1, Math.floor(teamSize) || 1);
    const shuffled = seededShuffle(applications, seed);
    const teamCount = Math.max(1, Math.ceil(shuffled.length / size));

    const buckets = Array.from({ length: teamCount }, () => []);
    shuffled.forEach((application, index) => {
        buckets[index % teamCount].push(application);
    });

    return {
        teams: buckets.filter((b) => b.length > 0),
        seed,
        rosterHash: rosterHashOf(applications.map((a) => a.refCode))
    };
}

/** `SW-T03`, `PT-T02`. */
export function teamCodeFor(prefix, index) {
    return `${prefix}-T${String(index + 1).padStart(2, '0')}`;
}
