/**
 * Canonical recruitment vocabulary, shared by the models, the routes and the
 * config seed so the three cannot drift apart.
 *
 * The 2026-27 cycle runs three structurally different processes, and the whole
 * point of keeping them here is that a track's shape -- whether it works in
 * teams, when the draw happens, which submission phases exist -- is stated once
 * and enforced everywhere. Phase ids are namespaced per track (`sw-`, `pt-`,
 * `me-`) so a submission intended for one track can never be accepted against
 * another, even by accident.
 */

export const CYCLE = '2026-27';

export const TRACKS = {
    'software-perception': {
        id: 'software-perception',
        name: 'Software & Perception',
        refPrefix: 'SW',
        teamBased: true,
        // Teams are drawn as soon as applications close; both phases are team work.
        drawAfter: 'apply-close',
        phases: ['sw-phase-1', 'sw-phase-2'],
        hasWrittenTest: false
    },
    powertrain: {
        id: 'powertrain',
        name: 'Powertrain',
        refPrefix: 'PT',
        teamBased: true,
        // Teams are drawn only from those who cleared the offline written test.
        drawAfter: 'written-test',
        phases: ['pt-solution'],
        hasWrittenTest: true
    },
    mechanical: {
        id: 'mechanical',
        name: 'Mechanical',
        refPrefix: 'ME',
        teamBased: false,
        drawAfter: null,
        phases: ['me-solution'],
        hasWrittenTest: false
    }
};

export const TRACK_IDS = Object.keys(TRACKS);

/** Every submission phase in the cycle, flattened. */
export const ALL_PHASES = TRACK_IDS.flatMap((id) => TRACKS[id].phases);

/** Which track a phase belongs to, or undefined for an unknown phase. */
export const PHASE_TRACK = Object.fromEntries(
    TRACK_IDS.flatMap((id) => TRACKS[id].phases.map((p) => [p, id]))
);

/**
 * Applicant lifecycle. One enum across all tracks -- which values a given track
 * can actually reach is checked in the routes against `TRACK_STAGES` below.
 */
export const STAGES = {
    APPLIED: 'APPLIED',
    TEST_ABSENT: 'TEST_ABSENT',
    TEST_FAILED: 'TEST_FAILED',
    TEST_PASSED: 'TEST_PASSED',
    TEAM_ASSIGNED: 'TEAM_ASSIGNED',
    PHASE_1_SUBMITTED: 'PHASE_1_SUBMITTED',
    PHASE_2_SUBMITTED: 'PHASE_2_SUBMITTED',
    SOLUTION_SUBMITTED: 'SOLUTION_SUBMITTED',
    INTERVIEW: 'INTERVIEW',
    CONCLUDED: 'CONCLUDED'
};

export const STAGE_VALUES = Object.values(STAGES);

/** The stages each track's applicants can legitimately occupy. */
export const TRACK_STAGES = {
    'software-perception': [
        STAGES.APPLIED,
        STAGES.TEAM_ASSIGNED,
        STAGES.PHASE_1_SUBMITTED,
        STAGES.PHASE_2_SUBMITTED,
        STAGES.INTERVIEW,
        STAGES.CONCLUDED
    ],
    powertrain: [
        STAGES.APPLIED,
        STAGES.TEST_ABSENT,
        STAGES.TEST_FAILED,
        STAGES.TEST_PASSED,
        STAGES.TEAM_ASSIGNED,
        STAGES.SOLUTION_SUBMITTED,
        STAGES.INTERVIEW,
        STAGES.CONCLUDED
    ],
    mechanical: [
        STAGES.APPLIED,
        STAGES.SOLUTION_SUBMITTED,
        STAGES.INTERVIEW,
        STAGES.CONCLUDED
    ]
};

/**
 * Rank used for "has this applicant reached at least stage X" checks, which is
 * how brief gating is decided. Terminal states rank high so a concluded
 * applicant never loses read access to material they already had.
 */
export const STAGE_RANK = {
    [STAGES.APPLIED]: 10,
    [STAGES.TEST_ABSENT]: 15,
    [STAGES.TEST_FAILED]: 15,
    [STAGES.TEST_PASSED]: 20,
    [STAGES.TEAM_ASSIGNED]: 30,
    [STAGES.PHASE_1_SUBMITTED]: 40,
    [STAGES.PHASE_2_SUBMITTED]: 50,
    [STAGES.SOLUTION_SUBMITTED]: 50,
    [STAGES.INTERVIEW]: 60,
    [STAGES.CONCLUDED]: 70
};

export const APPLICATION_STATUSES = ['ACTIVE', 'WITHDRAWN', 'REJECTED', 'SELECTED'];
export const TEAM_STATUSES = ['ACTIVE', 'ELIMINATED', 'SELECTED'];

export const isTrack = (id) => Object.hasOwn(TRACKS, id);
export const isTeamTrack = (id) => Boolean(TRACKS[id]?.teamBased);

/** True when `stage` is at or beyond `required` on the rank scale. */
export const hasReachedStage = (stage, required) =>
    (STAGE_RANK[stage] ?? 0) >= (STAGE_RANK[required] ?? Number.POSITIVE_INFINITY);
