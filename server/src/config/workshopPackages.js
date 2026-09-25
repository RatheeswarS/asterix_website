/**
 * Workshop tracks and packages -- the single source of truth for what the
 * workshop page shows and what the server charges.
 *
 * This file is imported by both the backend and the front end
 * (src/components/WorkshopPage.jsx), so keep it dependency-free plain data.
 *
 * `price` is in whole rupees; `null` means "not announced yet" -- the page shows
 * TBD and the server refuses to take payment for that package. The
 * registration route reads the price from here and nowhere else: the client
 * sends a package id, never an amount, so a tampered request cannot change
 * what gets charged.
 *
 * `syllabus` is a path under the front end's public/ directory (or a full
 * Drive URL).
 */

export const WORKSHOP_CURRENCY = 'INR';

export const WORKSHOP_TRACKS = {
    software: {
        id: 'software',
        name: 'Software & Perception',
        tagline: 'ROS, computer vision, ML and agentic AI, taught the way the buggy uses them.',
        overview:
            'A four-week, hands-on workshop run by the team that writes the autonomous stack on the ' +
            'Asterix buggy. Every topic is anchored to a real vehicle problem and backed by handbooks, ' +
            'guides and a mini project.',
        dates: 'From 1 Oct 2026 · 4 weeks',
        startLabel: 'Pre-session talk 29 Sep 2026 · first session Thu 1 Oct 2026',
        days: 'Tuesday & Thursday',
        timing: '5:10 PM – 6:50 PM',
        format: '8 core sessions over 4 weeks + 2 bonus sessions',
        audience: 'Beginners welcome. An online pre-session covers setup and prerequisites.',
        syllabus: '/workshop/software-perception-syllabus.pdf',
        venue: 'Autonomous Systems & Robotics Lab (Room 302, PSG iTech)',
        reportingInstructions: 'Bring laptops with chargers. Ubuntu 22.04 LTS or dual boot recommended. Arrive 10 minutes prior to session timing. Closed-toe shoes mandatory.',
        ongoingWeek: 'Week 1',
        topics: [
            {
                title: 'ROS',
                points: [
                    'Nodes, topics and messages; basic ROS commands',
                    'The publisher–subscriber model, with an on-vehicle example',
                    'Mini project'
                ]
            },
            {
                title: 'System Design',
                points: [
                    'Breaking an ATV into inputs, processing and outputs',
                    'Block diagrams for data flow, power and linkages',
                    'Mini project'
                ]
            },
            {
                title: 'ML & Computer Vision',
                points: [
                    'Pixels, resolutions, channels; resizing, cropping, Gaussian blur',
                    'Colour and contour tracking',
                    'Supervised vs unsupervised learning; linear regression',
                    'Mini project'
                ]
            },
            {
                title: 'Agentic AI',
                points: [
                    'Generative AI, agents and agentic systems',
                    'Prompting, tools and decision making',
                    'Engineering applications; mini project'
                ]
            }
        ],
        schedule: [
            { id: 'sch-sw-0', label: 'Week 0', days: 'Tuesday', date: '29 Sep', title: 'Pre-workshop online beginner session' },
            { id: 'sch-sw-1', label: 'Week 1', days: 'Tue & Thu', date: '1 Oct & 3 Oct', title: 'System Design' },
            { id: 'sch-sw-2', label: 'Week 2', days: 'Tue & Thu', date: '6 Oct & 8 Oct', title: 'Computer Vision · ML' },
            { id: 'sch-sw-b1', label: 'Bonus I', days: 'Saturday', date: '10 Oct', title: 'Powertrain & Embedded / Electrical' },
            { id: 'sch-sw-3', label: 'Week 3', days: 'Tue & Thu', date: '13 Oct & 15 Oct', title: 'ML · ROS' },
            { id: 'sch-sw-b2', label: 'Bonus II', days: 'Saturday', date: '17 Oct', title: 'Mechanical Fundamentals' },
            { id: 'sch-sw-4', label: 'Week 4', days: 'Tue & Thu', date: '20 Oct & 22 Oct', title: 'Agentic AI I · Agentic AI II' }
        ],
        bonus: 'Two complimentary sessions: Powertrain & Embedded/Electrical, and Mechanical Fundamentals. Timings announced later.'
    },
    powertrain: {
        id: 'powertrain',
        name: 'Electronics & Powertrain',
        tagline: 'Circuits, microcontrollers, motors and PCB design, from scratch.',
        overview:
            'Learn the basics of circuits, electronic parts, microcontrollers and motors, and see how ' +
            'the electronics inside the Team Asterix autonomous buggy actually work. Includes hands-on ' +
            'sessions with free circuit simulators and a PCB design tool.',
        dates: '7 Oct – 6 Nov 2026',
        startLabel: 'First session Wed 7 Oct 2026 · last core session Mon 2 Nov 2026',
        days: 'Monday, Wednesday & Friday',
        timing: '5:15 PM – 6:45 PM',
        format: '9 talks + 3 hands-on sessions + 2 complimentary sessions (21 hours)',
        audience: 'First-year students. No prior knowledge needed.',
        syllabus: '/workshop/powertrain-syllabus.pdf',
        venue: 'Electrical Machines & Power Electronics Lab (Ground Floor, PSG iTech)',
        reportingInstructions: 'Basic stationery and laptop with LTspice installed required. Safety shoes required inside the lab.',
        ongoingWeek: 'Week 1',
        topics: [
            {
                title: 'Circuits & Devices',
                points: [
                    'Voltage, current, Ohm’s and Kirchhoff’s laws, RC circuits',
                    'Diodes, BJTs and MOSFETs as switches',
                    'Hands-on: simulating a transistor switch (LTspice)'
                ]
            },
            {
                title: 'Microcontrollers',
                points: [
                    'ESP32 basics and your first Arduino IDE program',
                    'How the buggy starts up: safety and kill switches',
                    'Hands-on: build the start-up sequence in Tinkercad'
                ]
            },
            {
                title: 'Analog & Power',
                points: [
                    'Buck and boost converters vs linear regulators',
                    'Op-amps and filters for noisy sensor signals',
                    'How electric motors work: DC, BLDC, stepper, servo'
                ]
            },
            {
                title: 'PCB Design',
                points: [
                    'What a PCB is and how it is made',
                    'Laying out a board and checking the design',
                    'Hands-on: design your first PCB'
                ]
            }
        ],
        schedule: [
            { id: 'sch-pt-1', label: 'Week 1', days: 'Mon, Wed & Fri', date: '7 – 9 Oct', title: 'Circuit Basics · Diodes & Transistors' },
            { id: 'sch-pt-2', label: 'Week 2', days: 'Mon, Wed & Fri', date: '12 – 16 Oct', title: 'Hands-on 1 · ESP32 Basics · How Our Buggy Starts Up' },
            { id: 'sch-pt-b1', label: 'Bonus I', days: 'Saturday', date: '17 Oct', title: 'Autonomous Perception' },
            { id: 'sch-pt-3', label: 'Week 3', days: 'Mon, Wed & Fri', date: '19 – 23 Oct', title: 'Hands-on 2 · Buck & Boost · Op-Amps & Filters' },
            { id: 'sch-pt-b2', label: 'Bonus II', days: 'Saturday', date: '24 Oct', title: 'Mechanical Fundamentals' },
            { id: 'sch-pt-4', label: 'Week 4', days: 'Mon, Wed & Fri', date: '26 – 30 Oct', title: 'Electric Motors · PCB Design I · PCB Design II' },
            { id: 'sch-pt-5', label: 'Week 5', days: 'Mon, Wed & Fri', date: '2 – 6 Nov', title: 'Hands-on 3 · Mechanical Basics · Software Basics + Valedictory' }
        ],
        bonus: 'Two complimentary sessions: Mechanical Basics (4 Nov) and Software Basics + Valedictory (6 Nov).'
    }
};

// Whole rupees. null = TBD (shown as TBD, payments refused).
export const WORKSHOP_PACKAGES = [
    {
        id: 'software',
        name: 'Software & Perception',
        price: 899,
        tracksIncluded: ['software'],
        open: true
    },
    {
        id: 'powertrain',
        name: 'Electronics & Powertrain',
        price: 899,
        tracksIncluded: ['powertrain'],
        open: true
    },
    {
        id: 'combo',
        name: 'Combo: both tracks',
        price: 1399,
        tracksIncluded: ['software', 'powertrain'],
        open: true
    }
];

export function getWorkshopPackage(id) {
    const key = String(id || '').toLowerCase().trim();
    return WORKSHOP_PACKAGES.find(p => p.id === key) || null;
}

export function isPriced(pkg) {
    return Boolean(pkg) && Number.isFinite(pkg.price) && pkg.price > 0;
}
