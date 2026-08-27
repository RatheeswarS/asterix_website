export const subsystems = [
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
        id: "drive-by-wire",
        name: "Drive By Wire",
        tagline: "Zero-Backlash Electronic Steer-by-Wire & Throttle Actuation",
        badge: "STEER & THROTTLE DBW",
        color: "bg-amber-400",
        stat: "< 8 MS SERVO LATENCY",
        shortDesc: "Zero-backlash electronic steer-by-wire system and brushless throttle servo drive with hardware fail-safes and redundant CAN bus integration.",
        fullDesc: "The Drive By Wire (DBW) subsystem bridges algorithmic autonomy and vehicle dynamics. Eliminating mechanical steering shafts in favor of high-bandwidth brushless torque servos and absolute rotary encoders, the system achieves sub-8ms response with dual redundant CAN-bus channels and physical watchdog fail-safes.",
        specifications: [
            { label: "Steering Actuator", value: "High-Torque Brushless Servo (45 Nm)" },
            { label: "Throttle Actuation", value: "Linear Stepper / Micro-Servo (<5ms)" },
            { label: "Response Latency", value: "< 8 ms Full Lock-to-Lock" },
            { label: "Encoder Resolution", value: "14-Bit Absolute Magnetic Sensing" },
            { label: "Bus Protocol", value: "Redundant Dual CAN-FD (1 Mbps)" },
            { label: "Safety Classification", value: "Dual Hardware Watchdog E-Stop" }
        ],
        highlights: [
            "Zero-backlash planetary reduction gearbox delivering rapid high-torque steering response.",
            "Dual-channel hall effect throttle position feedback ensuring instantaneous fail-safe cutoff.",
            "Hardware-level e-stop interrupt overriding all actuators to passive safe state in < 2ms."
        ],
        teamMembers: [
            {
                name: "DBW Systems Lead",
                role: "Actuation & Embedded Control Lead",
                initials: "DW",
                bio: "Designs electronic steering servo loops, PID torque feedback, and actuator integration.",
                badge: "LEAD"
            },
            {
                name: "Servo Hardware Engineer",
                role: "Motor Drive & Power Electronics",
                initials: "SH",
                bio: "Develops high-current MOSFET drive stages and transient suppression circuits.",
                badge: "HARDWARE"
            },
            {
                name: "Embedded Firmware Dev",
                role: "Microcontroller & CAN-FD Logic",
                initials: "EF",
                bio: "Writes bare-metal C drivers for high-frequency encoder sampling and safety state machines.",
                badge: "FIRMWARE"
            }
        ]
    },
    {
        id: "brake-by-wire",
        name: "Brake by wire",
        tagline: "High-Pressure Electro-Hydraulic Deceleration & Redundant Lockup",
        badge: "ELECTRO-HYDRAULIC BBW",
        color: "bg-rose-500",
        stat: "100% REDUNDANT LOCKUP",
        shortDesc: "Electro-hydraulic brake actuator capable of delivering 100% 4-wheel lockup in milliseconds with redundant pressure circuits and autonomous emergency braking (AEB).",
        fullDesc: "The Brake by Wire (BBW) subsystem provides safety-critical electronically controlled stopping force. Powered by high-pressure electro-hydraulic actuators and dual proportioning circuits, it delivers instantaneous 4-wheel lockup from top racing speeds, with seamless autonomous emergency braking (AEB) and manual driver override.",
        specifications: [
            { label: "Actuator Type", value: "High-Pressure Electro-Hydraulic Pump" },
            { label: "Peak System Pressure", value: "1,200 PSI (8.2 MPa)" },
            { label: "Lockup Time", value: "< 95 ms From Signal to Clamp" },
            { label: "Circuit Architecture", value: "Dual Front/Rear Redundant Tandem" },
            { label: "Braking Distance", value: "< 4.2 Meters From 40 km/h" },
            { label: "Brake Fluid", value: "DOT 5.1 High-Boiling Silicone Glyel" }
        ],
        highlights: [
            "Integrated Autonomous Emergency Braking (AEB) watchdog triggers instant lockup on fault.",
            "Dual piezoresistive hydraulic pressure transducers monitor line pressures at 200 Hz.",
            "Mechanically isolated dual reservoir with stainless braided PTFE high-pressure lines."
        ],
        teamMembers: [
            {
                name: "BBW Systems Lead",
                role: "Hydraulic & Actuator Control Lead",
                initials: "BL",
                bio: "Designs electro-hydraulic braking architecture, actuator clamping kinetics, and pressure control.",
                badge: "LEAD"
            },
            {
                name: "Hydraulics Specialist",
                role: "High-Pressure Valves & Manifolds",
                initials: "HS",
                bio: "Fabricates custom aluminum manifolds, proportional valves, and master cylinder mounts.",
                badge: "HYDRAULICS"
            },
            {
                name: "Safety & AEB Engineer",
                role: "Fault Detection & Emergency Stopping",
                initials: "SE",
                bio: "Implements redundant fault monitoring, slip detection, and emergency stop algorithms.",
                badge: "SAFETY"
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
                bio: "Directs team operations, sponsor relations, competition logistics, and cross-team execution.",
                badge: "CAPTAIN"
            },
            {
                name: "Technical Director",
                role: "Chief Vehicle Architect",
                initials: "TD",
                bio: "Oversees mechanical, electrical, and autonomous subsystem integration and design reviews.",
                badge: "DIRECTOR"
            },
            {
                name: "Ratheeswar",
                role: "Technical Co-Lead & Software Architect",
                initials: "RW",
                bio: "Leads autonomous computing, electronics architecture, and data-driven race strategy.",
                badge: "LEAD"
            },
            {
                name: "Operations & Finance Lead",
                role: "Sponsorship & Logistics Head",
                initials: "OF",
                bio: "Manages fabrication budgets, sponsor deliverables, and pit equipment logistics.",
                badge: "OPERATIONS"
            }
        ]
    }
];
