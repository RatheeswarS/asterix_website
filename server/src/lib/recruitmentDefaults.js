import { CYCLE, STAGES } from './recruitmentConstants.js';

/**
 * Seed schedule and briefs for the 2026-27 cycle.
 *
 * Every timestamp carries an explicit +05:30 so a candidate's own timezone can
 * never shift a deadline, matching the convention already used by the countdown
 * on the recruitment page. These are defaults: the admin can retune any of them,
 * but the written test (11 Sept) and the 20 Sept cutoff are fixed by the team.
 *
 * `gated: true` on a brief means its body is withheld from the public config and
 * released only to an applicant on that track who has reached `gatedToStage`.
 * That is what keeps a mechanical applicant from reading the powertrain problem
 * statement before the people who actually sat the written test do.
 */

export const DEFAULT_TRACKS = [
    {
        id: 'software-perception',
        name: 'Software & Perception',
        enabled: true,
        blurb: 'Build the autonomous stack: perception, planning and control for the BAJA vehicle.',
        applyOpensAt: '2026-08-24T09:00:00+05:30',
        applyClosesAt: '2026-09-07T23:59:00+05:30',
        stages: [
            {
                id: 'sw-apply',
                label: 'Applications Close',
                detail: 'Register for the Software & Perception track. Teams are drawn from everyone who applies.',
                opensAt: '2026-08-24T09:00:00+05:30',
                closesAt: '2026-09-07T23:59:00+05:30',
                submissionPhase: null
            },
            {
                id: 'sw-draw',
                label: 'Random Team Draw',
                detail: 'Applicants are shuffled into teams. The draw is seeded and recorded, so it can be reproduced on request.',
                opensAt: '2026-09-07T23:59:00+05:30',
                closesAt: '2026-09-08T18:00:00+05:30',
                submissionPhase: null
            },
            {
                id: 'sw-phase-1',
                label: 'Phase 1 — Documentation & Research',
                detail: 'Your team submits its written research and design documentation for the problem statement.',
                opensAt: '2026-09-08T18:00:00+05:30',
                closesAt: '2026-09-13T23:59:00+05:30',
                submissionPhase: 'sw-phase-1'
            },
            {
                id: 'sw-phase-2',
                label: 'Phase 2 — Working Model',
                detail: 'Your team submits a running implementation of the problem statement, with test evidence.',
                opensAt: '2026-09-13T23:59:00+05:30',
                closesAt: '2026-09-19T23:59:00+05:30',
                submissionPhase: 'sw-phase-2'
            },
            {
                id: 'sw-interview',
                label: 'Team Interviews',
                detail: 'Shortlisted teams defend their design and implementation in person.',
                opensAt: '2026-09-19T23:59:00+05:30',
                closesAt: '2026-09-20T20:00:00+05:30',
                submissionPhase: null
            }
        ],
        brief: {
            title: 'Classical OpenCV Lane Extraction & Stanley Steering Controller',
            description: 'A two-phase challenge: first document the approach in depth, then build it. Phase 1 is written research and design; Phase 2 is a working model.',
            deliverables: 'Phase 1 — research and design document (PDF). Phase 2 — source repository, recorded test results, and a short architecture note.',
            gated: true,
            gatedToStage: STAGES.TEAM_ASSIGNED,
            bodyMarkdown: [
                '## Phase 1 — Documentation & Detailed Research',
                '',
                'Produce a design document covering:',
                '',
                '- A survey of classical lane-detection approaches and why you chose yours.',
                '- The Bird’s-Eye View perspective transform: derivation of the homography and how you calibrate it.',
                '- Lane-fitting strategy: 2nd-order polynomial fitting, outlier rejection, and behaviour under variable illumination.',
                '- The Stanley lateral controller: the cross-track and heading error terms, gain selection, and a stability argument for a 3.0 m track width.',
                '- A test plan describing how you would prove each stage works.',
                '',
                '## Phase 2 — Working Model',
                '',
                'Implement the pipeline in C++ or Python:',
                '',
                '- Crop and rectify a stereo camera feed, then apply the BEV transform.',
                '- Fit lane polynomials in real time and compute the Stanley steering error.',
                '- Run it against recorded footage and record the output.',
                '',
                'Submit a repository or archive link containing the source, the test video, and instructions to run it.'
            ].join('\n'),
            fileUrl: ''
        },
        resultsPublished: false,
        resultsBody: ''
    },
    {
        id: 'powertrain',
        name: 'Powertrain',
        enabled: true,
        blurb: 'Engine, CVT and drivetrain. Selection starts with a written test.',
        applyOpensAt: '2026-08-24T09:00:00+05:30',
        applyClosesAt: '2026-09-10T18:00:00+05:30',
        stages: [
            {
                id: 'pt-register',
                label: 'Registration Closes',
                detail: 'Register to sit the Powertrain written test. Registration is required to be allotted a seat.',
                opensAt: '2026-08-24T09:00:00+05:30',
                closesAt: '2026-09-10T18:00:00+05:30',
                submissionPhase: null
            },
            {
                id: 'pt-written-test',
                label: 'Written Test (in person)',
                detail: 'Held on 11 September. Bring your application reference code and college ID.',
                opensAt: '2026-09-11T09:00:00+05:30',
                closesAt: '2026-09-11T13:00:00+05:30',
                submissionPhase: null
            },
            {
                id: 'pt-shortlist',
                label: 'Written Test Shortlist',
                detail: 'Candidates who cleared the test are published here. Only they continue.',
                opensAt: '2026-09-11T13:00:00+05:30',
                closesAt: '2026-09-12T18:00:00+05:30',
                submissionPhase: null
            },
            {
                id: 'pt-draw',
                label: 'Random Team Draw',
                detail: 'Shortlisted candidates are shuffled into teams. Drawn separately from every other track.',
                opensAt: '2026-09-12T18:00:00+05:30',
                closesAt: '2026-09-12T21:00:00+05:30',
                submissionPhase: null
            },
            {
                id: 'pt-solution',
                label: 'Problem Statement Submission',
                detail: 'The problem statement is released to shortlisted teams only. Submit your solution and deck.',
                opensAt: '2026-09-12T21:00:00+05:30',
                closesAt: '2026-09-19T23:59:00+05:30',
                submissionPhase: 'pt-solution'
            },
            {
                id: 'pt-presentation',
                label: 'Presentation & Interview',
                detail: 'Presentation and technical interview run in the same session.',
                opensAt: '2026-09-19T23:59:00+05:30',
                closesAt: '2026-09-20T20:00:00+05:30',
                submissionPhase: null
            }
        ],
        brief: {
            title: 'CVT Shift Curve Optimization & Dynamic Torque Reduction',
            description: 'Released to candidates who clear the written test. Solved in teams, then presented and defended in a combined session.',
            deliverables: 'Calculations, shift ratio curves (Excel / MATLAB / Python), a reduction gearbox casing CAD brief, and the presentation deck.',
            gated: true,
            gatedToStage: STAGES.TEST_PASSED,
            bodyMarkdown: [
                '## Problem Statement',
                '',
                'Model the flyweight and secondary spring characteristics of a CVT paired with a 305cc Vanguard engine.',
                '',
                'Optimise shift engagement so the vehicle delivers maximum torque during a rock-crawl surge without giving up a 45 km/h top straightaway speed.',
                '',
                '### Required work',
                '',
                '- Derive the primary and secondary clutch force balance and state your assumptions.',
                '- Select flyweight mass and secondary spring preload; justify both numerically.',
                '- Plot the resulting shift ratio curve against engine RPM and vehicle speed.',
                '- Size the reduction gearbox and outline the casing in CAD.',
                '- Quantify the trade-off you accepted between crawl torque and top speed.',
                '',
                '### Presentation',
                '',
                'Prepare a deck covering your method, your numbers and your trade-off. The presentation and the technical interview happen in the same session, so expect to defend every figure.'
            ].join('\n'),
            fileUrl: ''
        },
        resultsPublished: false,
        resultsBody: ''
    },
    {
        id: 'mechanical',
        name: 'Mechanical',
        enabled: true,
        blurb: 'Chassis, suspension and structures. Solve the statement, build a deck, defend it.',
        applyOpensAt: '2026-08-24T09:00:00+05:30',
        applyClosesAt: '2026-09-07T23:59:00+05:30',
        stages: [
            {
                id: 'me-apply',
                label: 'Applications Close',
                detail: 'Register for the Mechanical track. The problem statement is released to every applicant.',
                opensAt: '2026-08-24T09:00:00+05:30',
                closesAt: '2026-09-07T23:59:00+05:30',
                submissionPhase: null
            },
            {
                id: 'me-solution',
                label: 'Solution & Presentation Deck',
                detail: 'Solve the problem statement individually and submit your work together with your PPT.',
                opensAt: '2026-09-07T23:59:00+05:30',
                closesAt: '2026-09-18T23:59:00+05:30',
                submissionPhase: 'me-solution'
            },
            {
                id: 'me-presentation',
                label: 'Presentation & Interview',
                detail: 'Present your deck and sit the technical interview in the same session.',
                opensAt: '2026-09-18T23:59:00+05:30',
                closesAt: '2026-09-20T20:00:00+05:30',
                submissionPhase: null
            }
        ],
        brief: {
            title: 'Roll Cage Torsional Rigidity & Suspension Kinematics Design',
            description: 'Solved individually. Submit the engineering work and a presentation deck, then defend both in a combined presentation and interview.',
            deliverables: 'CAD STEP file, FEA impact stress report, kinematics coordinate spreadsheet, and a presentation deck (PPT or PDF).',
            gated: true,
            gatedToStage: STAGES.APPLIED,
            bodyMarkdown: [
                '## Problem Statement',
                '',
                'Design an AISI 4130 tubular roll cage that complies with SAE BAJA technical inspection rules.',
                '',
                '### Required work',
                '',
                '- Model the spaceframe in CAD and state your tube sizes and wall thicknesses against the rulebook.',
                '- Run frontal, lateral and rollover impact FEA; report peak stress, factor of safety, and where the structure yields first.',
                '- Model double wishbone suspension geometry targeting minimal scrub radius and controlled anti-dive.',
                '- Tabulate the hardpoint coordinates and show bump steer across the travel range.',
                '',
                '### Presentation',
                '',
                'Build a deck that walks through your design decisions and your FEA results. The presentation and the technical interview run together, so be ready to justify each choice.'
            ].join('\n'),
            fileUrl: ''
        },
        resultsPublished: false,
        resultsBody: ''
    }
];

export const DEFAULT_CONFIG = {
    key: 'main',
    cycle: CYCLE,
    headline: 'SAEINDIA BAJA 2026-27 Crew Recruitment',
    intro: 'Three subsystems, three different selection processes, one shared deadline: everything concludes on 20 September 2026, and results follow after that.',
    // Cleared once applications are open; the admin edits it on the Schedule tab.
    notice: 'Applications open on Wednesday 2 September during the orientation event. The forms below go live then — come to the orientation to hear what each subsystem actually does before you pick one.',
    resultsNote: 'Results for all tracks are published after 20 September 2026.',
    tracks: DEFAULT_TRACKS
};
