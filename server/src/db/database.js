import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.resolve(__dirname, '../../data');


if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'asterix.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode for high concurrency & performance
try {
    db.exec('PRAGMA journal_mode = WAL;');
} catch (err) {
    console.warn('Could not set WAL mode:', err.message);
}

// Initialize tables
db.exec(`
    CREATE TABLE IF NOT EXISTS site_data (
        section TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        access_level TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscribers (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        created_at TEXT NOT NULL
    );
`);

// Helper to seed initial data if empty
export function initDatabase() {
    // Check if site_data is populated
    const checkStmt = db.prepare('SELECT COUNT(*) as count FROM site_data');
    const { count } = checkStmt.get();

    if (count === 0) {
        console.log('⚡ Initializing and seeding Asterix database with defaults...');
        const now = new Date().toISOString();

        const initialHeroData = {
            teamTitle: "TEAM",
            teamName: "ASTERIX",
            tagline: "Got the passion? We got the track.",
            badges: [
                { label: "⚡ AIR 13", class: "rotate-[-3deg] bg-amber-300 text-slate-900" },
                { label: "SAEINDIA a-BAJA 2026", class: "bg-white text-slate-900" },
                { label: "★ TN RANK 1", class: "rotate-[3deg] bg-sky-400 text-white" }
            ],
            ctaText: "EXPLORE THE SQUAD →",
            ctaLink: "#squad",
            joinFormUrl: "https://forms.gle/6hHG6aXqrunnfj7V6"
        };

        const initialStoryText = `It started as a training program.

In the first year, there was no Team Asterix, no competition vehicle, and no clear idea where the journey would lead. It was simply a group of students learning how vehicles worked. Months were spent understanding vehicle dynamics, control systems, electronics, and autonomous technologies.

About a year later, the group decided to take the program seriously and registered for SAE BAJA 2026. Somewhere along that journey, the name Asterix came into existence, and the training program evolved into a team with a much bigger ambition.

That was where the real learning began.

The project was divided into five major subsystems: Software, Sensors, Powertrain, Steer-by-Wire, and Brake & Throttle-by-Wire. Each had its own challenges, but the vehicle could only work when all five came together.

The team started with planning. Budgets were prepared, timelines were drawn, documents were written, and everything looked organized on paper. But this was the first BAJA vehicle ever built by this group. When work moved from paper to the workshop, reality hit hard.

Parts did not arrive on time. Some components were missing. Others arrived damaged or did not fit the way they were supposed to. Fabrication work was delayed, and testing schedules had to be rewritten again and again. Every week brought a new obstacle, and progress felt painfully slow.

Then came the physical assembly.

Mounting the systems was far more complicated than expected. Wires had to be rerouted, brackets had to be redesigned, and mechanical adjustments had to be made directly on the vehicle frame. Days were spent troubleshooting electrical noise, sensor communication drops, and mechanical alignment issues. The workshop slowly became a place of long hours, frustration, and continuous trial and error.

Testing brought another layer of difficulty.

Systems that worked in isolation failed when connected together. Sensors gave unexpected readings when the vehicle moved. The steering actuator responded with slight delays that had to be corrected through control tuning. The brake actuator required precise pressure calibration to ensure safe stopping distances. Each test run revealed a new flaw, and each flaw meant going back to the design, changing parameters, and testing again.

There were moments when things seemed stalled. The competition deadline was approaching, the vehicle was still not performing reliably, and fatigue was beginning to set in. The team had to make difficult decisions: simplify certain mechanisms, rebuild faulty connections, and work through nights to keep the project alive.

What kept the team moving forward was simple: the vehicle had to drive.

Bit by bit, the problems were solved. The software pipeline stabilized. The drive-by-wire systems began responding accurately to commands. The mechanical assembly became solid. The vehicle that once existed only as sketches and CAD files slowly became an actual running machine.

Team Asterix was not built with experience or endless resources. It was built through mistakes, delays, redesigns, and the stubborn refusal to leave the workshop until the car worked.

SAE BAJA was never just a competition for this team.

It was the reason a training program turned into a family of engineers who learned how to build something real from nothing.`;

        const initialSubsystems = [
            {
                id: "software-perception",
                name: "Software and Perception",
                tagline: "ROS 2 Jazzy, Classical OpenCV Vision & Advanced Stanley Lateral Control",
                badge: "AUTONOMOUS STACK",
                color: "bg-sky-400",
                stat: "ROS 2 JAZZY & STANLEY CONTROL",
                shortDesc: "Production-grade C++ autonomous pipeline featuring real-time OpenCV lane extraction, 1D Kalman tracking, single-camera perspective warping, and Stanley steering control.",
                fullDesc: "Built on ROS 2 Jazzy within our custom colcon workspace (abja_ws), the Software and Perception subsystem is engineered in pure, optimized C++ for maximum determinism and zero GPU/ML overhead. The perception node processes single-lens cropped stereo feeds through custom pinhole calibration, 1.5x buffer-expanded Bird's-Eye View perspective warping, and sliding-window polynomial fitting. To overcome low camera mounting angles, our single-lane fallback projects the virtual centerline across the fixed 3.0m track width, stabilized by 3 independent 1D Kalman filters. Lateral steering commands are generated via an Advanced Stanley Controller featuring curvature feedforward, slew-rate limiting, track-side dynamic parameter tuning (k = 1.0 to 15.0), and a 300ms fail-safe safety watchdog transmitting directly to Arduino hardware via serial bridge.",
                specifications: [
                    { label: "Core Framework", value: "ROS 2 Jazzy (Ubuntu / Linux)" },
                    { label: "Build System", value: "colcon (abja_ws Workspace)" },
                    { label: "Perception Engine", value: "C++ OpenCV (baja_perception)" },
                    { label: "Lateral Controller", value: "Advanced Stanley Node (baja_lane_control)" },
                    { label: "Mathematical Model", value: "2nd-Order Polynomial (x = ay² + by + c)" },
                    { label: "State Filtering", value: "Three Independent 1D Kalman Filters" },
                    { label: "Track Geometry", value: "Fixed 3.0m Width Polynomial Shifting" },
                    { label: "Actuation Interface", value: "Arduino Serial Bridge (/lka/steering_angle)" }
                ],
                highlights: [
                    "Hardware Perspective Correction: Automatically crops side-by-side stereo streams in half to extract the clean left lens with 1.5x buffer-expanded Bird's-Eye View warp for sharp turns.",
                    "Single-Lane Fallback Projection: Employs polynomial gap shifting based on the fixed 3.0m eBaja track width when the low camera angle loses outer boundary visibility.",
                    "Advanced Stanley Lateral Control: Combines velocity-normalized Cross Track Error (k * cte / v) with Curvature Feedforward to eliminate lag on technical hairpin corners.",
                    "Safety Watchdog System: Dedicated 300ms timer monitors perception confidence and sensor silence, executing smooth automatic return-to-center (0°) fail-safe steering.",
                    "Dynamic Parameter Tuning: Full ROS 2 parameter support for track-side on-the-fly adjustment of Stanley gain (k = 1.0 - 15.0) and fallback velocity."
                ],
                teamMembers: [
                    {
                        name: "Ratheeswar",
                        role: "Software & Perception Lead",
                        initials: "RW",
                        bio: "Architects the ROS 2 Jazzy node graph, colcon workspace build pipeline, and end-to-end autonomous architecture.",
                        badge: "SUBSYSTEM LEAD"
                    },
                    {
                        name: "Autonomous Perception Engineer",
                        role: "Computer Vision & Pipeline Architect",
                        initials: "CV",
                        bio: "Develops the C++ OpenCV sliding-window detector, BEV perspective transform, and 1D Kalman filter state estimators.",
                        badge: "PERCEPTION"
                    },
                    {
                        name: "Controls & Vehicle Dynamics Engineer",
                        role: "Lateral & Longitudinal Control",
                        initials: "LC",
                        bio: "Tunes the Advanced Stanley controller, curvature feedforward gains, and 300ms safety watchdog fail-safe routines.",
                        badge: "CONTROLS"
                    },
                    {
                        name: "Embedded Systems Engineer",
                        role: "Serial Bridge & Hardware Interface",
                        initials: "ES",
                        bio: "Implements the high-reliability Arduino serial communication bridge for steering actuator drive and telemetry feedback.",
                        badge: "FIRMWARE"
                    }
                ]
            },
            {
                id: "powertrain",
                name: "Powertrain",
                tagline: "Continuous Variable Torque Delivery & Propulsion Dynamics",
                badge: "PROPULSION & TORQUE",
                color: "bg-emerald-400",
                stat: "380 NM WHEEL TORQUE",
                shortDesc: "Race-tuned high-torque powerplant coupled with custom-ratio transmission and induction-hardened reduction drives for instant rock crawl surge.",
                fullDesc: "Engineered to deliver relentless instantaneous torque across extreme mud bogs, steep rock ascents, and high-speed rally straights. The Powertrain team optimizes torque delivery through custom-calibrated transmission stages, lightweight drivetrain inertia reduction, and thermal-stabilized gearboxes.",
                specifications: [
                    { label: "Engine / Powerplant", value: "Vanguard 305cc OHV / Tuned Output" },
                    { label: "Peak Wheel Torque", value: "380 Nm (Final Reduction)" },
                    { label: "Gearbox Type", value: "Custom 2-Stage Enclosed Oil-Bath" },
                    { label: "CVT Ratio Range", value: "3.9:1 (Low) to 0.9:1 (High)" },
                    { label: "Axle Shafts", value: "4340 Induction-Hardened Chromoly" },
                    { label: "Thermal Dissipation", value: "Forced Air Cooling & IR Monitoring" }
                ],
                highlights: [
                    "Custom-machined flyweights calibrated for instantaneous torque engagement under peak loads.",
                    "Splash-lubricated enclosed reduction casing with precision heat-treated helical gears.",
                    "Quick-disconnect paddock maintenance access for rapid belt and drive inspections."
                ],
                teamMembers: [
                    {
                        name: "Powertrain Specialist",
                        role: "Transmission & Drivetrain Lead",
                        initials: "PS",
                        bio: "Calibrates transmission shift points, dyno-tunes engine curves, and leads drivetrain architecture.",
                        badge: "LEAD"
                    },
                    {
                        name: "Gearbox Designer",
                        role: "Transmission CAD & Machining",
                        initials: "GD",
                        bio: "Designs structural casing tolerances, bearing journals, and gear tooth profiles.",
                        badge: "MECHANICAL"
                    },
                    {
                        name: "Dyno Calibration Tech",
                        role: "Thermodynamics & Fuel Mapping",
                        initials: "DC",
                        bio: "Monitors exhaust gas temperatures, AFR ratios, and governor performance.",
                        badge: "TESTING"
                    }
                ]
            },
            {
                id: "mechanical",
                name: "Mechanical",
                tagline: "Chassis Spaceframe, Suspension Kinematics, Brakes & FEA Rigidity",
                badge: "STRUCTURAL & DYNAMICS",
                color: "bg-amber-400",
                stat: "100% CAD / FEA VALIDATED",
                shortDesc: "Custom AISI 4130 chromoly roll cage, long-travel double wishbone suspension, precision Ackermann steering, and electro-hydraulic brake systems.",
                fullDesc: "The Mechanical subsystem forms the structural backbone and dynamic handling soul of the Asterix BAJA vehicle. The unit designs and fabricates the rule-compliant AISI 4130 tubular roll cage, calculates suspension roll center migration, manufactures custom uprights and A-arms, optimizes steering Ackermann geometry, and integrates the high-pressure 4-wheel lockup braking system.",
                specifications: [
                    { label: "Chassis Material", value: "AISI 4130 Chromoly (Seamless Tubular)" },
                    { label: "Front Suspension", value: "Double A-Arm with FOX Float Air Shocks" },
                    { label: "Rear Suspension", value: "Multi-Link Semi-Trailing Arm Assembly" },
                    { label: "Suspension Travel", value: "10.5 Inches Front / 9.8 Inches Rear" },
                    { label: "Steering Geometry", value: "Rack & Pinion with 100% Ackermann" },
                    { label: "Braking System", value: "Dual Tandem Hydraulic Disc (All 4 Lockup)" }
                ],
                highlights: [
                    "Torsional rigidity optimized using ANSYS FEA structural crash simulations for maximum driver safety.",
                    "Custom CNC-machined 6061-T6 aluminum uprights engineered for minimum unsprung mass.",
                    "Long-travel progressive shock damping tuned for brutal rock crawl obstacles and high jumps.",
                    "Integrated high-pressure brake proportioning valve enabling instant 4-wheel dynamic lockup."
                ],
                teamMembers: [
                    {
                        name: "Mechanical Lead",
                        role: "Chassis & Suspension Architect",
                        initials: "ML",
                        status: "Active Member",
                        bio: "Oversees chassis roll cage fabrication, suspension kinematics, and vehicle weight distribution.",
                        badge: "LEAD"
                    },
                    {
                        name: "Suspension Specialist",
                        role: "Geometry & Damper Dynamics",
                        initials: "SS",
                        status: "Active Member",
                        bio: "Calculates camber curves, roll centers, and tunes FOX air shock nitrogen pressures.",
                        badge: "DYNAMICS"
                    },
                    {
                        name: "Brake & Steering Engineer",
                        role: "Hydraulics & Actuation",
                        initials: "BS",
                        status: "Active Member",
                        bio: "Designs dual-circuit hydraulic brake calipers, pedal ratio linkages, and Ackermann geometry.",
                        badge: "BRAKES"
                    },
                    {
                        name: "Chassis Fabrication Tech",
                        role: "Tubing Notch & TIG Specialist",
                        initials: "CF",
                        status: "Alumni",
                        bio: "Former master welder and tube notch fabricator for our Gen-1 spaceframe chassis.",
                        badge: "ALUMNI"
                    }
                ]
            },
            {
                id: "leads",
                name: "Leads",
                tagline: "Project Management, Technical Architecture & Race Direction",
                badge: "EXECUTIVE & DIRECTORS",
                color: "bg-indigo-500",
                stat: "CHIEF ENGINEERING & OPS",
                shortDesc: "Executive team directing vehicle architecture, inter-subsystem integration, financial sponsorships, and competition race strategy.",
                fullDesc: "The Leads subsystem represents the technical and executive leadership driving Team Asterix. From overarching vehicle design architecture and cross-subsystem integration to project timelines, budget management, safety compliance, and race day pit-lane strategy, the leadership team ensures Asterix performs at peak engineering excellence.",
                specifications: [
                    { label: "Leadership Scope", value: "Overall Technical & Operational Command" },
                    { label: "Competition Division", value: "SAEINDIA BAJA Autonomous Series" },
                    { label: "Integration Cadence", value: "Weekly Sprint Milestones & Design Reviews" },
                    { label: "Safety Compliance", value: "100% SAEINDIA Tech Inspection Standards" },
                    { label: "Budget & Sponsorship", value: "Full Paddock Logistics & Sponsor Relations" },
                    { label: "Race Strategy", value: "Real-Time Telemetry & Driver Coaching" }
                ],
                highlights: [
                    "Holistic cross-subsystem systems engineering ensuring seamless mechanical-electronic synergy.",
                    "Rigorous design reviews, FMEA risk assessments, and competition compliance audits.",
                    "Paddock logistics, telemetry strategy, and driver training execution during competition."
                ],
                teamMembers: [
                    {
                        name: "Team Captain",
                        role: "Overall Project & Team Direction",
                        initials: "TC",
                        status: "Active Member",
                        bio: "Directs team operations, sponsor relations, competition logistics, and cross-team execution.",
                        badge: "CAPTAIN"
                    },
                    {
                        name: "Technical Director",
                        role: "Chief Vehicle Architect",
                        initials: "TD",
                        status: "Active Member",
                        bio: "Oversees mechanical, electrical, and autonomous subsystem integration and design reviews.",
                        badge: "DIRECTOR"
                    },
                    {
                        name: "Ratheeswar",
                        role: "Technical Co-Lead & Software Architect",
                        initials: "RW",
                        status: "Active Member",
                        bio: "Leads autonomous computing, electronics architecture, and data-driven race strategy.",
                        badge: "LEAD"
                    },
                    {
                        name: "Operations & Finance Lead",
                        role: "Sponsorship & Logistics Head",
                        initials: "OF",
                        status: "Active Member",
                        bio: "Manages fabrication budgets, sponsor deliverables, and pit equipment logistics.",
                        badge: "OPERATIONS"
                    }
                ]
            }
        ];

        const initialGalleryItems = [
            {
                id: "gal-1",
                title: "Paddock Dawn Inspection",
                category: "PIT LANE • SCRUTINEERING",
                year: "2026",
                src: "/uploads/gallery/01_team_paddock.jpg",
                desc: "Complete pre-race technical scrutineering and telemetry calibration under paddock sunrise."
            },
            {
                id: "gal-2",
                title: "Spaceframe Chassis TIG Welding",
                category: "WORKSHOP • CHASSIS FAB",
                year: "2025",
                src: "/uploads/gallery/02_workshop_welding.jpg",
                desc: "Precision TIG welding of AISI 4130 chromoly roll cage joints with zero dimensional distortion."
            },
            {
                id: "gal-3",
                title: "LiDAR & Neural Vision Tuning",
                category: "AI LAB • PERCEPTION",
                year: "2026",
                src: "/uploads/gallery/03_lidar_sensor_tuning.jpg",
                desc: "Real-time point-cloud registration and stereo camera depth calibration on the test bench."
            },
            {
                id: "gal-4",
                title: "High-Speed Dirt Proving Grounds",
                category: "DYNAMIC TESTING • TERRAIN",
                year: "2026",
                src: "/uploads/gallery/04_track_dirt_action.jpg",
                desc: "Full-throttle endurance run across punishing washboard ruts and loose red dirt trails."
            },
            {
                id: "gal-5",
                title: "Suspension & Brake Tuning",
                category: "PIT BAY • QUICK SERVICE",
                year: "2026",
                src: "/uploads/gallery/05_pitlane_mechanics.jpg",
                desc: "Trackside damper valving adjustments and hydraulic line bleeding between endurance heats."
            },
            {
                id: "gal-6",
                title: "Podium & National Victory",
                category: "FINALS • PODIUM",
                year: "2026",
                src: "/uploads/gallery/06_team_celebration.jpg",
                desc: "Team Asterix celebrating AIR 13 and TN Rank 1 at the national SAE BAJA finals."
            }
        ];

        const initialUpdates = [
            {
                id: "upd-1",
                label: "Paddock Lineup & Shakedown",
                tag: "FEB 2026 • PIT LANE",
                image: "/uploads/gallery/01_team_paddock.jpg",
                link: "#"
            },
            {
                id: "upd-2",
                label: "Spaceframe TIG Welding",
                tag: "NOV 2025 • CHASSIS BAY",
                image: "/uploads/gallery/02_workshop_welding.jpg",
                link: "#"
            },
            {
                id: "upd-3",
                label: "LiDAR & Neural Perception",
                tag: "JAN 2026 • AI LAB",
                image: "/uploads/gallery/03_lidar_sensor_tuning.jpg",
                link: "#"
            },
            {
                id: "upd-4",
                label: "High-Speed Dirt Testing",
                tag: "JAN 2026 • PROVING GROUNDS",
                image: "/uploads/gallery/04_track_dirt_action.jpg",
                link: "#"
            },
            {
                id: "upd-5",
                label: "Endurance Podium Victory",
                tag: "FEB 2026 • NATIONAL FINALS",
                image: "/uploads/gallery/06_team_celebration.jpg",
                link: "#"
            }
        ];

        const initialContactInfo = {
            email: "asterix.psgitech@gmail.com",
            address: "PSG iTech, Neelambur, Coimbatore, Tamil Nadu",
            category: "Autonomous All-Terrain Vehicle Development",
            instagramUrl: "https://www.instagram.com/asterix_itech/",
            linkedinUrl: "https://www.linkedin.com/company/teamasterix/",
            githubUrl: "https://github.com/Team-Asterix264016/"
        };

        const insertSection = db.prepare(`
            INSERT INTO site_data (section, content, updated_at)
            VALUES (?, ?, ?)
        `);

        insertSection.run('hero', JSON.stringify(initialHeroData), now);
        insertSection.run('story', JSON.stringify(initialStoryText), now);
        insertSection.run('subsystems', JSON.stringify(initialSubsystems), now);
        insertSection.run('gallery', JSON.stringify(initialGalleryItems), now);
        insertSection.run('updates', JSON.stringify(initialUpdates), now);
        insertSection.run('contact', JSON.stringify(initialContactInfo), now);
    }

    // Check if users table is populated
    const userCountStmt = db.prepare('SELECT COUNT(*) as count FROM users');
    const { count: userCount } = userCountStmt.get();

    if (userCount === 0) {
        console.log('⚡ Seeding initial administrator accounts...');
        const now = new Date().toISOString();
        const insertUser = db.prepare(`
            INSERT INTO users (id, username, password_hash, name, role, access_level, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertUser.run(
            'acc-1',
            'admin',
            bcrypt.hashSync('asterix2026', 10),
            'Ratheeswar',
            'System Administrator & Software Lead',
            'SuperAdmin',
            now,
            now
        );

        insertUser.run(
            'acc-2',
            'powertrain_lead',
            bcrypt.hashSync('baja2026powertrain', 10),
            'Powertrain Lead',
            'Subsystem Lead',
            'Lead',
            now,
            now
        );

        insertUser.run(
            'acc-3',
            'chassis_lead',
            bcrypt.hashSync('baja2026chassis', 10),
            'Chassis Lead',
            'Subsystem Lead',
            'Lead',
            now,
            now
        );
    }
}

export default db;
