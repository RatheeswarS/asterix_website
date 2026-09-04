/**
 * Recruitment challenge data for Team Asterix induction.
 *
 * Subsystems:
 * 1. Software & Perception: Two distinct problem statements (Vision-Based Object Detection
 *    and Sensor Fusion & Track Reconstruction), each split into Phase 1 (due 8th night 11:59 PM)
 *    and Phase 2 (due 14th night 11:59 PM).
 * 2. Powertrain: Offline written recruitment test (11 September 2026, 5:30 PM - 6:30 PM,
 *    45 questions, 60 minutes, 1 handwritten A4 cheat sheet allowed).
 */

export const RECRUITMENT_RELEASE_DATE_STR = '2026-09-03T18:30:00+05:30';
export const RECRUITMENT_RELEASE_MS = new Date(RECRUITMENT_RELEASE_DATE_STR).getTime();

export const HARDWARE_RELEASE_DATE_STR = '2026-09-03T19:00:00+05:30';
export const HARDWARE_RELEASE_MS = new Date(HARDWARE_RELEASE_DATE_STR).getTime();

export const SUBSYSTEM_LEADS = {
    'software-perception': {
        name: 'Ratheeshwar',
        role: 'Software & Perception Lead',
        phone: '+91 86089 44644',
    },
    'software': {
        name: 'Ratheeshwar',
        role: 'Software & Perception Lead',
        phone: '+91 86089 44644',
    },
    'powertrain': {
        name: 'Joel Anto Edwin',
        role: 'Powertrain Subsystem Lead',
        phone: '+91 72079 60077',
    },
    'mechanical': {
        name: 'Soorya Ramprakash',
        role: 'Mechanical Subsystem Lead',
        phone: '+91 89394 52244',
    }
};

export const SOFTWARE_PERCEPTION_DATA = {
    id: 'software-perception',
    name: 'Software & Perception',
    headline: 'AUTONOMOUS PERCEPTION & STATE ESTIMATION',
    blurb: 'Two comprehensive recruitment challenges. Choose your domain, design your pipeline in Phase 1, and implement your solution in Phase 2.',
    lead: SUBSYSTEM_LEADS['software-perception'],
    teamFormat: {
        title: 'Team Formation: Teams of 2',
        badge: 'DUO TEAMS ALLOCATED',
        desc: 'Candidates will be working in allocated teams of two to design the architecture, complete deliverables, and submit solutions.',
        pdfUrl: 'https://ik.imagekit.io/kitzwb4be/asterix/recruitment/software_perception_teams.pdf?v=2',
        pdfLocalUrl: '/recruitment/software_perception_teams.pdf?v=2',
        teamsIIYear: [
            { group: 'Group 1', members: [{ name: 'Dharanish V', dept: 'AIDS', phone: '9361365173' }, { name: 'Udhayanthi S', dept: 'AIDS', phone: '9443477014' }] },
            { group: 'Group 2', members: [{ name: 'Aravinth G V', dept: 'CSE', phone: '9080158763' }, { name: 'Rithanya M', dept: 'AIDS', phone: '9865976546' }] },
            { group: 'Group 3', members: [{ name: 'Samritha M', dept: 'CSE', phone: '9500324772' }, { name: 'Kanishka S', dept: 'AIDS', phone: '8072999845' }] },
            { group: 'Group 4', members: [{ name: 'Sruthi S', dept: 'CSE', phone: '8438702606' }, { name: 'Sakarnika J', dept: 'AIDS', phone: '8807958435' }] },
            { group: 'Group 5', members: [{ name: 'Jayashree Saravanakumar', dept: 'AIDS', phone: '9500876355' }, { name: 'M. Samvida', dept: 'VLSI', phone: '9500654772' }] },
            { group: 'Group 6', members: [{ name: 'Abhishek Karuppusamy', dept: 'CSE', phone: '8807003699' }, { name: 'Angannan A N', dept: 'ECE', phone: '9566691403' }] },
            { group: 'Group 7', members: [{ name: 'Vishnuram A G', dept: 'AIDS', phone: '9245805745' }, { name: 'Akash S M', dept: 'CSE', phone: '7339265715' }] },
            { group: 'Group 8', members: [{ name: 'Kanishka Devarajan', dept: 'CSE', phone: '8870167781' }, { name: 'Nandhitha', dept: 'VLSI', phone: '8248916170' }] },
            { group: 'Group 9', members: [{ name: 'Sathvika D V', dept: 'CSE', phone: '7010466966' }, { name: 'Darshan S', dept: 'CSE', phone: '9600688397' }] },
            { group: 'Group 10', members: [{ name: 'Subanandhini', dept: 'CSE', phone: '9159677776' }, { name: 'Rhythami Raja', dept: 'AIDS', phone: '8015790344' }] },
            { group: 'Group 11', members: [{ name: 'Deeshitha G J', dept: 'VLSI', phone: '9965195322' }, { name: 'V. Anushka', dept: 'ECE', phone: '9363479841' }] },
            { group: 'Group 12', members: [{ name: 'M. Sivaprakash', dept: 'CSE', phone: '8056847102' }, { name: 'Vijay Adithiya E', dept: 'CSE', phone: '9488412780' }] },
            { group: 'Group 13', members: [{ name: 'Shreeshanth S', dept: 'CSE', phone: '9787501016' }, { name: 'Devadharsa B', dept: 'ECE', phone: '6385431538' }] },
            { group: 'Group 14', members: [{ name: 'S. Shreeshaa', dept: 'AIDS', phone: '6383111845' }, { name: 'Dhiya D', dept: 'VLSI', phone: '9566334833' }] }
        ],
        teamsIIIYear: [
            { group: 'Group 1', members: [{ name: 'Bharath V', dept: 'ICE', phone: '9342953944' }, { name: 'Vishal S', dept: 'AIDS', phone: '8248897569' }] },
            { group: 'Group 2', members: [{ name: 'Manikandan D', dept: 'AIDS', phone: '7305315144' }, { name: 'Swaraj Rs', dept: 'ECE', phone: '9790299906' }] },
            { group: 'Group 3', members: [{ name: 'Arun Madav R', dept: 'CSE', phone: '6374704044' }] }
        ]
    },
    timeline: [
        {
            id: 'sp-release',
            label: 'Problem Statements Release',
            detail: 'Vision & sensor fusion challenge briefs and duo teams released',
            date: '2026-09-03T18:30:00+05:30',
            opensAt: '2026-09-02T18:00:00+05:30',
        },
        {
            id: 'sp-p1',
            label: 'Phase 01 Submission Deadline',
            detail: 'Research, Architecture, System Design & Proposal due at 11:59 PM IST',
            date: '2026-09-08T23:59:00+05:30',
            opensAt: '2026-09-03T18:30:00+05:30',
        },
        {
            id: 'sp-p2',
            label: 'Phase 02 Submission Deadline',
            detail: 'Implementation, Codebase, Model Weights & Final Evaluation due on 15 September at 11:59 PM IST',
            date: '2026-09-15T23:59:00+05:30',
            opensAt: '2026-09-08T23:59:00+05:30',
        },
        {
            id: 'sp-results',
            label: 'Final Results Announcement',
            detail: 'Final selected crew roster published on 20 September night',
            date: '2026-09-20T23:59:00+05:30',
            opensAt: '2026-09-15T23:59:00+05:30',
        }
    ],
    challenges: [
        {
            id: 'ps-vision',
            number: '01',
            title: 'Vision-Based Object Detection',
            tagline: 'Design and implement a practical 2D multi-class object detection system for our autonomous vehicle using a ZED 2i camera and NVIDIA Jetson Orin NX.',
            domain: 'Computer Vision & Edge AI',
            badge: 'VISION & DEEP LEARNING',
            targetHardware: {
                compute: 'NVIDIA Jetson Orin NX',
                sensor: 'StereoLabs ZED 2i Camera',
                mode: '2D Object Detection (Depth / 3D not required)'
            },
            classes: [
                { name: 'Cone', icon: 'cone', color: 'border-amber-400 bg-amber-50 text-amber-900', note: 'Track boundary marker' },
                { name: 'Traffic barrier', icon: 'barrier', color: 'border-orange-400 bg-orange-50 text-orange-900', note: 'Road obstruction / barrier' },
                { name: 'Cow', icon: 'cow', color: 'border-stone-400 bg-stone-50 text-stone-900', note: 'Unpredictable livestock' },
                { name: 'Pedestrian', icon: 'pedestrian', color: 'border-blue-400 bg-blue-50 text-blue-900', note: 'Pedestrian on or near track' },
                { name: 'Bicyclist', icon: 'bicyclist', color: 'border-emerald-400 bg-emerald-50 text-emerald-900', note: 'Cyclist or just a Cycle as well' },
                { name: 'Red traffic light', icon: 'red-light', color: 'border-rose-500 bg-rose-50 text-rose-900', note: 'Color treated as separate class' },
                { name: 'Green traffic light', icon: 'green-light', color: 'border-green-500 bg-green-50 text-green-900', note: 'Color treated as separate class' },
                { name: 'Orange / amber light', icon: 'amber-light', color: 'border-amber-500 bg-amber-50 text-amber-900', note: 'Color treated as separate class' },
                { name: 'Two-wheeler', icon: 'bike', color: 'border-cyan-400 bg-cyan-50 text-cyan-900', note: 'Motorcycles / scooters' },
                { name: 'Speed limit sign 10', icon: 'speed-10', color: 'border-red-500 bg-red-50 text-red-900', note: '10 km/h speed limit sign' },
                { name: 'Speed limit sign 15', icon: 'speed-15', color: 'border-red-500 bg-red-50 text-red-900', note: '15 km/h speed limit sign' },
                { name: 'Speed limit sign 30', icon: 'speed-30', color: 'border-red-500 bg-red-50 text-red-900', note: '30 km/h speed limit sign' },
                { name: 'Cars', icon: 'car', color: 'border-indigo-400 bg-indigo-50 text-indigo-900', note: 'Passenger cars / 4-wheelers' }
            ],
            phases: {
                phase1: {
                    phaseNumber: '01',
                    title: 'Research, Architecture & System Proposal',
                    deadline: '8 September 2026 • 11:59 PM IST',
                    deadlineDate: '2026-09-08T23:59:00+05:30',
                    tagline: 'In this phase, we want to understand how you think, research, compare options and make sound engineering decisions.',
                    overview: 'Autonomous vehicles need to understand their surroundings in order to make informed decisions. A key part of this is the ability to identify and locate objects from camera data. Your task is to propose a vision-based object detection system for an autonomous vehicle using a ZED 2i camera and Jetson Orin NX.',
                    coreTask: [
                        'Detect and distinguish all 13 specified classes with 2D bounding boxes, class labels, and confidence scores.',
                        'Traffic lights (Red, Green, Amber) and Speed limit signs (10, 15, 30) must treat color and speed value as distinct individual classes.',
                        'Target computing platform is NVIDIA Jetson Orin NX with a ZED 2i camera. You are not restricted to any particular model, framework, dataset, or training approach.',
                        'The goal of Phase 1 is to design and justify an approach: investigate the problem, identify challenges, explore alternatives (YOLO, SSD, EfficientDet, RT-DETR, etc.), and develop a technically reasoned proposal.'
                    ],
                    keyQuestions: [
                        'What questions did you ask when you first saw the problem?',
                        'What did you research and why?',
                        'What alternatives did you consider and how did you compare them?',
                        'What assumptions did you make about hardware constraints and real-world environments?',
                        'What trade-offs influenced your final choice of model and dataset strategy?',
                        'What risks or failure cases do you anticipate (small traffic lights, occlusions, motion blur)?',
                        'What would you investigate next if your proposed approach did not work?'
                    ],
                    deliverables: [
                        {
                            name: '1. Technical Presentation',
                            format: 'PPT / PDF',
                            description: 'Concise presentation covering the **problem statement, research, model comparison, key trade-offs, proposed solution, and final decision**. Should communicate the technical reasoning clearly without going into excessive implementation detail.'
                        },
                        {
                            name: '2. Technical Design & Research Report',
                            format: 'PDF',
                            description: 'Detailed technical document covering **model comparison, dataset strategy, training & evaluation plan, deployment considerations for NVIDIA Jetson Orin NX, and engineering decision-making process** from Problem → Questions → Research → Alternatives → Decision. **References/bibliography** should be included at the end.'
                        },
                        {
                            name: '3. System / Workflow Diagram',
                            format: 'PNG / PDF / SVG',
                            description: 'Clear end-to-end system architecture showing the **camera input, preprocessing, object detection/inference, post-processing, and final output**, including relevant deployment components such as TensorRT, FP16/INT8, and Jetson Orin NX where applicable.'
                        }
                    ],
                    suggestedStructure: [
                        '1. Problem Understanding',
                        '2. Your Proposed Approach',
                        '3. Research & Findings',
                        '4. Model Comparison',
                        '5. Selected Model & Justification',
                        '6. Dataset Strategy',
                        '7. Training Strategy',
                        '8. Proposed System Architecture',
                        '9. Deployment Considerations (Jetson Orin NX)',
                        '10. Expected Challenges & Failure Cases',
                        '11. Evaluation Plan',
                        '12. References'
                    ],
                    evaluationFocus: [
                        'How clearly you break down an unfamiliar engineering problem.',
                        'Quality and depth of technical research and alternative comparisons.',
                        'Awareness of hardware constraints (Jetson Orin NX inference budget) and trade-offs.',
                        'Realism and defensibility of the proposed approach.',
                        'Identification of edge cases (motion blur, lighting, small traffic lights).'
                    ]
                },
                phase2: {
                    phaseNumber: '02',
                    title: 'Implementation, Training & Evaluation',
                    deadline: '15 September 2026 • 11:59 PM IST',
                    deadlineDate: '2026-09-15T23:59:00+05:30',
                    tagline: 'Take the approach you developed in Phase 1 and turn it into a working 2D object-detection system. Build, test, evaluate and improve your solution.',
                    overview: 'In Phase 2, you will implement, train, and benchmark the detector proposed in Phase 1. You are not required to follow your Phase 1 proposal blindly — if experiments show a different architecture or training regime is superior, document what changed and why.',
                    environmentNote: 'You do NOT need physical access to an NVIDIA Jetson Orin NX or ZED 2i camera. You may develop and test your detector on whatever hardware is available to you (laptop, Google Colab, GPU workstation). Jetson is the target deployment platform, not a requirement for personal setup.',
                    coreTask: [
                        'Implement, fine-tune, or train your 2D object detector to distinguish all 13 required classes.',
                        'Prepare a dataset by combining public datasets, annotating custom samples, or synthetic augmentation.',
                        'Produce bounding boxes, class labels, and confidence scores for every detection.',
                        'Evaluate using quantitative detection metrics (Precision, Recall, mAP@50, mAP@50:95) and efficiency metrics (FPS, inference latency in ms, model weight size in MB).'
                    ],
                    metricsTable: [
                        { area: 'Detection Quality', whatToReport: 'Precision, Recall, mAP (50 & 50-95), IoU thresholds across test sets' },
                        { area: 'Inference Performance', whatToReport: 'FPS, per-frame inference latency (ms), model parameter count, and weight file size (MB)' },
                        { area: 'Per-Class Performance', whatToReport: 'Breakdown of performance per class — identify which classes succeed and which struggle' },
                        { area: 'Failure Analysis', whatToReport: 'False positives, false negatives, small traffic light detection issues, and environmental edge cases' }
                    ],
                    jetsonConsiderations: [
                        'Expected computational cost and memory footprint on Jetson Orin NX (1024-core NVIDIA Ampere GPU).',
                        'Expected inference FPS at target input resolution.',
                        'Potential optimization through ONNX runtime, TensorRT FP16 / INT8 quantization.',
                        'Pipeline changes needed when migrating from development environment to the autonomous vehicle stack.'
                    ],
                    deliverables: [
                        { name: 'Source Code', format: 'Git Repository / ZIP', description: 'Complete, organized, runnable code with clean structure.' },
                        { name: 'Trained Model', format: 'Model Weights (.pt, .onnx, .engine)', description: 'Final trained weights with instructions to load and test.' },
                        { name: 'README', format: 'Markdown File', description: 'Setup, dependencies, environment, dataset preparation, training, and inference commands.' },
                        { name: 'Dataset Information', format: 'Documentation', description: 'Sources, classes, annotation approach, splits, and known limitations.' },
                        { name: 'Results & Visuals', format: 'Plots & Sample Detections', description: 'Quantitative evaluation charts and annotated detection sample images/videos.' },
                        { name: 'Technical Report', format: '3–5 Page PDF', description: 'Covers implementation, experimental results, challenges encountered, modifications from Phase 1, and limitations.' },
                        { name: 'Final Demonstration', format: 'Video Recording / Playback', description: 'Short screen recording demonstrating working detector with bounding boxes, labels, and confidence scores.' }
                    ],
                    evaluationFocus: [
                        'A working and reproducible object-detection system.',
                        'Thoughtful dataset choices, quality annotation, and imbalance mitigation.',
                        'Evidence-based quantitative evaluation rather than cherry-picked screenshots.',
                        'Real-world awareness of edge deployment constraints and latency targets.',
                        'Ability to iterate and adapt when original Phase 1 assumptions met practical constraints.'
                    ]
                }
            }
        },
        {
            id: 'ps-fusion',
            number: '02',
            title: 'Sensor Fusion & Track Reconstruction',
            tagline: 'Take noisy, backward-mounted perception data from our aBAJA buggy and reconstruct a clean 2D map of the cone-marked track in global coordinates.',
            domain: 'State Estimation & Autonomous Mapping',
            badge: 'SENSOR FUSION & SLAM',
            targetHardware: {
                vehicle: 'Team Asterix aBAJA Autonomous Buggy',
                sensor: 'Range & Bearing Perception Sensor (e.g. LiDAR / Depth Camera)',
                mounting: 'Rotated 180° facing backward due to roll-cage constraints'
            },
            complications: [
                {
                    title: '180° Backward-Mounted Sensor',
                    desc: 'Due to roll-cage constraints, the perception sensor is mounted facing completely backward (180° rotated relative to vehicle front). Every observation is reported in a flipped sensor frame.'
                },
                {
                    title: 'Measurement Noise & Ghost Hallucinations',
                    desc: 'Range and bearing measurements carry stochastic noise. In addition, the sensor occasionally hallucinates "ghost cones" that appear transiently for a few frames and disappear.'
                }
            ],
            phases: {
                phase1: {
                    phaseNumber: '01',
                    title: 'Coordinate Transforms, Noise Filtering & Offline Map Reconstruction',
                    deadline: '8 September 2026 • 11:59 PM IST',
                    deadlineDate: '2026-09-08T23:59:00+05:30',
                    tagline: 'Build an offline pipeline to ingest raw vehicle telemetry and backward sensor logs, reconcile frames, filter ghost cones, and output a clean 2D track map.',
                    overview: 'Our aBAJA buggy is navigating a track marked by traffic cones. It is equipped with a perception sensor reporting range and bearing to observed cones. You are given a vehicle telemetry log (global pose over time) and a sensor log of cone observations. Your task is to compute the true global position of every real cone, reject ghost detections, and produce a clean 2D map.',
                    givenInputs: [
                        'Telemetry log: Vehicle pose (x, y position and heading θ) in the global frame over time.',
                        'Sensor log: Cone detections (range r, bearing φ, timestamp t) in the backward-facing sensor frame.'
                    ],
                    coreTask: [
                        'Parse and time-align telemetry and sensor logs (handling differing sampling rates and clock offsets).',
                        'Transform each detection from backward-facing sensor frame into vehicle body frame (180° rigid transform), then into the global frame using vehicle pose.',
                        'Model measurement noise and reduce its effect (simple averaging, range-weighted averaging, Kalman filtering, or robust estimators).',
                        'Filter ghost cones using spatial consistency, observation persistence across frames, and cluster support in the global frame.',
                        'Perform data association and clustering (e.g. DBSCAN, nearest-neighbor, gating) to group multiple observations of the same cone into a single high-confidence point.',
                        'Validate the final map: check track plausibility, cone pairing along track boundaries, ablations (without 180° correction or ghost filter), and parameter sensitivity.'
                    ],
                    keyQuestions: [
                        'What questions did you ask when you first examined the telemetry and sensor logs?',
                        'How did you mathematically derive and verify that the 180° sensor mounting was handled correctly?',
                        'What alternatives did you consider for ghost-cone filtering and why did you choose your method?',
                        'What assumptions did you make about sensor noise covariance or track geometry (e.g. track width)?',
                        'What trade-offs influenced your choice of clustering radius and persistence thresholds?',
                        'What would happen if the vehicle reversed or stood still for several seconds?'
                    ],
                    deliverables: [
                        { name: 'Source Code', format: 'Complete Runnable Script/Package', description: 'Clean, runnable implementation ingesting telemetry and sensor logs and producing the cone map.' },
                        { name: 'Cleaned Cone Map', format: '2D Plot (PNG/PDF)', description: 'Plot of reconstructed track in global coordinates, with accepted cones marked and vehicle trajectory overlaid.' },
                        { name: 'Cone List Output', format: 'Structured File (CSV/JSON)', description: 'Listing of every accepted cone with its estimated global (x, y) coordinates.' },
                        { name: 'Pipeline Diagram', format: 'Diagram (PNG/SVG)', description: 'Clear visualization showing data flow from raw logs → transformed detections → filtered → clustered → final map.' },
                        { name: 'Comparative Analysis, Validation & References Report', format: 'Technical Report (PDF)', description: 'Comprehensive report covering: (1) Method Comparison — comparison of association and clustering methods considered (DBSCAN vs Nearest Neighbor vs Gating); (2) Validation & Ablations — proof of correctness, sanity checks, sensitivity to thresholds, and ablations (e.g. filter disabled); and (3) References — citations of robotics papers, SLAM textbooks, sensor fusion tutorials, and libraries used.' }
                    ],
                    suggestedStructure: [
                        '1. Problem Understanding',
                        '2. Data Inspection & Assumptions',
                        '3. Coordinate Frames & Transforms (Sensor → Body → Global)',
                        '4. Time Alignment Strategy',
                        '5. Noise Handling Approach',
                        '6. Ghost-Cone Filtering Approach',
                        '7. Data Association & Clustering',
                        '8. Final Pipeline Diagram',
                        '9. Validation & Sensitivity Analysis',
                        '10. Expected Failure Cases',
                        '11. Results — Final Cone Map',
                        '12. References'
                    ],
                    evaluationFocus: [
                        'Correctness and mathematical clarity of coordinate frame transformations.',
                        'Quality and elegance of ghost-cone rejection and noise filtering.',
                        'Justification of clustering and association parameters without overfitting.',
                        'Evidence-based validation (ablations, sanity checks, sensitivity curves).',
                        'Clear technical explanation of assumptions and failure modes.'
                    ]
                },
                phase2: {
                    phaseNumber: '02',
                    title: 'Online Streaming, Uncertainty & Jetson Deployment',
                    deadline: '15 September 2026 • 11:59 PM IST',
                    deadlineDate: '2026-09-15T23:59:00+05:30',
                    tagline: 'Take your offline pipeline and turn it into a robust, real-time online cone-mapping system fit for deployment on a moving autonomous buggy.',
                    overview: 'In Phase 1, you built an offline batch pipeline. In Phase 2, you will extend that pipeline into a streaming system that processes detections incrementally as they arrive, maintains a live cone map, reports per-cone uncertainty, and remains robust across multiple challenging test logs.',
                    environmentNote: 'Physical Jetson Orin NX is NOT required for development. You can evaluate by replaying logs in real time, generating synthetic stress-test logs, and injecting synthetic faults (dropped packets, out-of-order timestamps).',
                    coreTask: [
                        'Incremental Fusion: Process detections and telemetry as they arrive in real-time, fusing observations without recomputing the entire map from scratch.',
                        'Live Cone Map: Maintain a dynamic state where real cones gain confidence and lock in while ghost detections decay and get rejected.',
                        'Uncertainty Tracking: Represent per-cone uncertainty explicitly (e.g. 2D covariance matrix, observation count, existence probability) rather than plain points.',
                        'Robustness & Adversarial Testing: Test across multiple logs with varying noise levels, high ghost rates, dense cone clusters, and telemetry dropouts.',
                        'Resource Boundedness: Ensure memory usage does not grow indefinitely as the vehicle drives, and maintain a strict latency budget per incoming update.'
                    ],
                    metricsTable: [
                        { area: 'Map Accuracy', whatToReport: 'Position error vs ground truth/reference (RMSE, median error), internal consistency, drift over time' },
                        { area: 'Recall & Precision', whatToReport: 'Fraction of real cones mapped (recall), precision of mapped cones, and ghost-cone leak rate (%)' },
                        { area: 'Streaming Robustness', whatToReport: 'Performance across logs with varying noise/ghost density, sensitivity to filter parameters' },
                        { area: 'Latency & Memory', whatToReport: 'Per-update latency (ms), end-to-end processing delay, peak memory footprint vs number of cones' },
                        { area: 'Failure Analysis', whatToReport: 'Pipeline behavior under sparse observations, dense hairpin turns, sudden pose jumps, or sensor dropouts' }
                    ],
                    jetsonConsiderations: [
                        'Expected computational cost per update and scaling behavior as the map grows.',
                        'Memory footprint management over prolonged operation.',
                        'Language choice & runtime efficiency (Python prototyping vs C++ / ROS 2 Jazzy node deployment).',
                        'Integration surface: consuming ROS 2 sensor topics / shared memory and publishing map markers downstream to lateral controllers.',
                        'Real-time scheduling and determinism on NVIDIA Jetson Orin NX.'
                    ],
                    deliverables: [
                        { name: 'Online Source Code', format: 'Modular Codebase', description: 'Clean, runnable online pipeline with distinct modules for I/O, transforms, filtering, mapping, and benchmarking.' },
                        { name: 'Configuration File', format: 'YAML / JSON / Python Config', description: 'Tuned parameters (gating distances, filter variances, promotion thresholds) with explanatory comments.' },
                        { name: 'README & Replay Guide', format: 'Markdown File', description: 'Instructions on setting up dependencies, replaying streaming logs, running tests, and reproducing results.' },
                        { name: 'Evaluation Results', format: 'Metrics Report & Tables', description: 'Quantitative benchmarks across multiple logs, including ablation runs (filter disabled, transform disabled).' },
                        { name: 'Final Map(s)', format: 'Plots (PNG/PDF)', description: 'Reconstructed 2D maps for all evaluated logs with cones, covariance uncertainty ellipses, and vehicle path.' },
                        { name: 'Live Demonstration', format: 'Screen Recording Video', description: 'Playback showing incremental map building in real time as detections arrive, cones lock in, and ghosts decay.' },
                        { name: 'Technical Report', format: '3–5 Page PDF', description: 'Deep-dive covering online architecture, uncertainty formulation, stress-test results, Jetson deployment, and limitations.' },
                        { name: 'Phase 1 → Phase 2 Diff', format: 'Comparison Section', description: 'Explicit list of design changes from your Phase 1 proposal and the reasoning behind each adaptation.' }
                    ],
                    evaluationFocus: [
                        'A reproducible, real-time online cone-mapping pipeline.',
                        'Principled formulation of uncertainty and candidate promotion/demotion.',
                        'Rigorous multi-log testing, synthetic fault injection, and evidence-based metrics.',
                        'Awareness of edge compute constraints (bounded memory, CPU/GPU utilization, real-time deadlines).',
                        'Clear documentation of how your approach adapted between Phase 1 and Phase 2.'
                    ]
                }
            }
        }
    ],
    generalGuidance: {
        toolsAndAssistance: {
            title: 'Tools & AI Assistance Policy',
            subtitle: 'You are evaluated on your engineering thought process, not on artificial constraints.',
            content: 'You are completely free to use any tools, technologies and resources available to you. AI assistants (such as ChatGPT, Claude, Gemini, GitHub Copilot), research papers, open-source libraries, online tutorials, and documentation are all encouraged. You may also discuss concepts with peers and mentors. What matters is your ability to understand the problem, make sound engineering decisions, defend your choices, and explain what you have built.'
        }
    }
};

export const POWERTRAIN_TEST_DATA = {
    id: 'powertrain',
    name: 'Powertrain',
    headline: 'POWERTRAIN SUBSYSTEM RECRUITMENT TEST',
    blurb: 'Offline written evaluation covering Logical Reasoning, Network Analysis, Electronic Devices, and Digital Electronics.',
    lead: SUBSYSTEM_LEADS['powertrain'],
    timeline: [
        {
            id: 'pt-release',
            label: 'Test Syllabus & Guidelines Release',
            detail: 'Full 4-domain test topics, rules & cheat sheet specifications unlock today at 7:00 PM IST',
            date: '2026-09-03T19:00:00+05:30',
            opensAt: '2026-09-02T18:00:00+05:30',
        },
        {
            id: 'pt-test',
            label: 'Powertrain Recruitment Test',
            detail: 'Offline Written Test • 5:30 PM – 6:30 PM IST',
            date: '2026-09-11T17:30:00+05:30',
            opensAt: '2026-09-03T19:00:00+05:30',
        },
        {
            id: 'pt-interview',
            label: 'Interview & Presentation',
            detail: 'Technical interviews and candidate presentations on 15 September',
            date: '2026-09-15T18:00:00+05:30',
            opensAt: '2026-09-11T18:30:00+05:30',
        },
        {
            id: 'pt-results',
            label: 'Final Results Announcement',
            detail: 'Final selected crew roster published on 20 September night',
            date: '2026-09-20T23:59:00+05:30',
            opensAt: '2026-09-15T18:00:00+05:30',
        }
    ],
    testOverview: {
        title: 'BAJA Recruitment – Powertrain Subsystem Test',
        subtitle: 'Test Instructions, Rules & Syllabus Structure',
        eligibility: '2nd- and 3rd-year students interested in joining the Powertrain subsystem of Team Asterix.',
        date: '11 September 2026',
        time: '5:30 PM – 6:30 PM IST (Tentative — any changes will be communicated in advance)',
        duration: '60 minutes',
        totalQuestions: 45,
        mode: 'Offline Written Test',
        calculator: 'Standard Scientific / Numerical Calculator Allowed',
        phones: 'Strictly NOT Permitted'
    },
    sections: [
        {
            name: 'Logical Reasoning',
            questions: 15,
            percentage: '33%',
            color: 'bg-amber-400',
            description: 'Analytical ability, pattern recognition, spatial reasoning, and critical problem solving.'
        },
        {
            name: 'Network Analysis',
            questions: 10,
            percentage: '22%',
            color: 'bg-sky-400',
            description: 'Kirchhoff’s laws, RLC circuit transient analysis, AC/DC network theorems, power calculations, and impedance.'
        },
        {
            name: 'Electronic Devices',
            questions: 10,
            percentage: '22%',
            color: 'bg-emerald-400',
            description: 'Semiconductor physics, diodes, BJT/MOSFET characteristics, power semiconductor switching, and thermal dissipation.'
        },
        {
            name: 'Digital Electronics',
            questions: 10,
            percentage: '22%',
            color: 'bg-purple-400',
            description: 'Logic gates, Boolean algebra, combinational & sequential circuits, flip-flops, counters, and ADC/DAC principles.'
        }
    ],
    cheatSheetRules: {
        title: 'Handwritten Cheat Sheet — Official Guidelines',
        badge: '1 A4 SHEET ALLOWED',
        rules: [
            { text: 'Must be completely handwritten by the candidate.', allowed: true },
            { text: 'Must be exactly ONE single A4-sized paper sheet.', allowed: true },
            { text: 'Both sides of the single A4 sheet may be used for notes, formulas, and diagrams.', allowed: true },
            { text: 'Candidates may include any formulas, concepts, diagrams, or notes of their choice.', allowed: true },
            { text: 'Printed, photocopied, digitally rendered, or mechanically reproduced notes are STRICTLY PROHIBITED.', allowed: false },
            { text: 'No extra sheets, loose notes, reference books, textbooks, or formula booklets allowed.', allowed: false },
            { text: 'The cheat sheet must be prepared and brought by the candidate (will not be provided at venue).', allowed: true }
        ]
    },
    devicesAndCalculators: {
        calculators: {
            allowed: true,
            title: 'Calculators: Permitted',
            desc: 'Candidates may bring and use a standard scientific/numerical calculator for calculations. Programmable calculators or devices with wireless/cellular connectivity are not permitted.'
        },
        electronicDevices: {
            allowed: false,
            title: 'Electronic Devices: Strictly Banned',
            prohibitedList: [
                'Mobile phones (must be powered off and kept away)',
                'Smartwatches, fitness trackers, and smart bands',
                'Earphones, headphones, and wireless earbuds',
                'Tablets, e-readers, and laptops',
                'Any device capable of internet connectivity, messaging, or storage of unauthorized data'
            ],
            advice: 'Candidates are strongly advised to keep electronic devices in their hostels/homes. The recruitment team assumes no responsibility for the safety of personal belongings.'
        }
    },
    hallInstructions: [
        'Reporting Time: Arrive at the venue well before 5:30 PM to complete attendance and seating.',
        'Strict Timing: The test follows a rigid 60-minute duration. Late arrivals may face entry restrictions or loss of time.',
        'Stationery: Bring your own pens, pencils, eraser, scale, and writing materials. Borrowing or sharing stationery during the exam is forbidden.',
        'Rough Sheets: Rough Sheets will not be provided at the venue. You can bring up to 3 A4 plain white sheets if you prefer.',
        'Seating: Remain in your assigned seat throughout the test. Do not leave the hall without permission from the invigilator.',
        'Invigilator Guidance: Follow all announcements and instructions given by the invigilation team promptly.'
    ],
    academicIntegrity: {
        title: 'Academic Integrity & Fair Evaluation',
        desc: 'The recruitment test evaluates individual foundational understanding and real-time problem-solving skills. Any malpractice—including copying, communicating with peers, unauthorized notes, or external assistance—will lead to immediate disqualification from the Asterix recruitment cycle.'
    },
    candidateChecklist: [
        { item: 'College / Student ID Card (mandatory for venue entry)', id: 'chk-id' },
        { item: 'One handwritten A4 cheat sheet (both sides allowed)', id: 'chk-sheet' },
        { item: 'Standard scientific calculator (functional battery)', id: 'chk-calc' },
        { item: 'Personal stationery (pens, pencils, eraser, ruler)', id: 'chk-pen' },
        { item: 'Mobile phones & smartwatches switched off and packed away', id: 'chk-phone' },
        { item: 'Report at venue at least 15 minutes before 5:30 PM', id: 'chk-time' }
    ],
    finalNote: 'The test is designed to evaluate fundamental problem-solving and conceptual clarity rather than rote memorization. Revise your fundamentals in Logical Reasoning, Network Analysis, Electronic Devices, and Digital Electronics. Best of luck, future Asterix engineers!'
};

export const MECHANICAL_MYSTERY_DATA = {
    id: 'mechanical',
    name: 'Mechanical',
    headline: 'MECHANICAL PRESENTATION GUIDELINES & PROBLEM STATEMENTS',
    badge: 'ROUND 1: PRESENTATION',
    blurb: 'Evaluate technical understanding, research capability, and design approach towards converting our existing electric BAJA buggy into an autonomous vehicle.',
    lead: SUBSYSTEM_LEADS['mechanical'],
    timeline: [
        {
            id: 'mech-release',
            label: 'Presentation Guidelines & Problem Statements Release',
            detail: 'Round 1 presentation guidelines, BBW & SBW problem statements & duo teams unlock today at 7:00 PM IST',
            date: '2026-09-03T19:00:00+05:30',
            opensAt: '2026-09-02T18:00:00+05:30',
        },
        {
            id: 'mech-deadline',
            label: 'Mechanical Submission Deadline',
            detail: 'Duo solution proposals & presentations due on 16 September at 11:59 PM IST',
            date: '2026-09-16T23:59:00+05:30',
            opensAt: '2026-09-03T19:00:00+05:30',
        },
        {
            id: 'mech-results',
            label: 'Final Results Announcement',
            detail: 'Final selected crew roster published on 20 September night',
            date: '2026-09-20T23:59:00+05:30',
            opensAt: '2026-09-16T23:59:00+05:30',
        }
    ],
    teamFormat: {
        title: 'Team Formation: Teams of 2',
        badge: 'DUO TEAMS ALLOCATED',
        desc: 'All participants will be collaborating in allocated teams of two to research, engineer, and present their proposed conversion systems. For both problem statements, the final submission is a Technical Presentation (PPT / PDF).',
        finalSubmissionFormat: 'Technical Presentation (PPT / PDF)',
        pdfUrl: 'https://ik.imagekit.io/kitzwb4be/asterix/recruitment/mechanical_teams.pdf',
        pdfLocalUrl: '/recruitment/mechanical_teams.pdf',
        guidelinesPdfUrl: 'https://ik.imagekit.io/kitzwb4be/asterix/recruitment/mechanical_presentation_guidelines.pdf',
        guidelinesPdfLocalUrl: '/recruitment/mechanical_presentation_guidelines.pdf',
        teams: [
            {
                group: 'Group 01',
                members: [
                    { name: 'Priyan Lm', dept: 'MECH', phone: '6382905788' },
                    { name: 'Bharath Sri Ram', dept: 'MECH', phone: '9080440516' }
                ]
            },
            {
                group: 'Group 02',
                members: [
                    { name: 'Dharshan', dept: 'MECH', phone: '7904984217' },
                    { name: 'Y Sanjay', dept: 'MECH', phone: '7708243787' }
                ]
            },
            {
                group: 'Group 03',
                members: [
                    { name: 'Ramesh', dept: 'MECH', phone: '8925587202' },
                    { name: 'Subhashri', dept: 'MECH', phone: '9342696680' }
                ]
            },
            {
                group: 'Group 04',
                members: [
                    { name: 'Thamarikannan', dept: 'MECH', phone: '8248015187' },
                    { name: 'Nivasini', dept: 'MECH', phone: '6381907192' }
                ]
            },
            {
                group: 'Group 05',
                members: [
                    { name: 'Sudharsan M', dept: 'MECH', phone: '8072228334' },
                    { name: 'Sairam', dept: 'MECH', phone: '8760512744' }
                ]
            },
            {
                group: 'Group 06',
                members: [
                    { name: 'Dhivagar', dept: 'MECH', phone: '6280999274' },
                    { name: 'Ram Nivash', dept: 'MECH', phone: '8608031977' }
                ]
            },
            {
                group: 'Group 07',
                members: [
                    { name: 'Priteesh C', dept: 'MECH', phone: '6381017604' },
                    { name: 'M. Kowshika', dept: 'ICE', phone: '9025084072' }
                ]
            },
            {
                group: 'Group 08',
                members: [
                    { name: 'Kavin V', dept: 'MECH', phone: '9942312488' },
                    { name: 'Vishvan', dept: 'MECH', phone: '9994847863' }
                ]
            },
            {
                group: 'Group 09',
                members: [
                    { name: 'D. Raghul', dept: 'MECH', phone: '8438569107' },
                    { name: 'Gokul Prashath', dept: 'MECH', phone: '8870922180' }
                ]
            },
            {
                group: 'Group 10',
                members: [
                    { name: 'Raghavan', dept: 'MECH', phone: '9843539393' },
                    { name: 'Muhammad Shakkeel', dept: 'ICE', phone: '9353018039' }
                ]
            },
            {
                group: 'Group 11',
                members: [
                    { name: 'Paul Sibi', dept: 'MECH', phone: '8015912680' },
                    { name: 'R K Trilokeshvar', dept: 'VLSI', phone: '8695755665' }
                ]
            }
        ]
    },
    generalInstructions: [
        {
            num: '01',
            title: 'Understand the Existing Vehicle Systems',
            points: [
                'Study the current electric buggy design used in the SAE eBAJA competition.',
                'Gain a clear understanding of the hydraulic braking system and throttle control design implemented in the vehicle.'
            ]
        },
        {
            num: '02',
            title: 'Incorporate Safety and Reliability Principles',
            points: [
                'Always incorporate how manual override works for your proposed design.',
                'Design your proposed subsystem with redundant sensors and fail-safe mechanisms to ensure reliable operation.',
                'Refer to relevant safety standards and guidelines (ISO, IATF, SAE, etc.) applicable to your subsystem.'
            ]
        },
        {
            num: '03',
            title: 'Consider Environmental and Protection Factors',
            points: [
                'Ensure proper IP (Ingress Protection) rating when selecting electronic components.',
                'Include failsafe measures to handle system or power failures safely.'
            ]
        },
        {
            num: '04',
            title: 'Demonstrate Research and Design Thinking',
            points: [
                'Show evidence of independent research, design reasoning, and practical feasibility.',
                'Use sketches, simulations, or block diagrams to support your concept.',
                'BONUS: Show your interest by doing research on new developments like Regenerative braking, Adaptive Cruise Control, ADAS.'
            ]
        },
        {
            num: '05',
            title: 'Simulation & Design Evaluation Criteria',
            points: [
                'The simulation and design wherever applicable on top of critical thinking and logical reasoning will be considered as an important criterion for evaluation.'
            ]
        },
        {
            num: '06',
            title: 'Final Submission Format: Technical Presentation (PPT / PDF)',
            points: [
                'For both Problem Statement 1 (Actuator Selection) and Problem Statement 2 (Manual Override & Sensors Integration), the primary final deliverable is a Technical Presentation (PPT / PDF).',
                'Ensure your presentation includes your team members, problem formulation, calculations, selection trade-offs, CAD/mounting renders, and safety fail-safes.'
            ]
        }
    ],
    challenges: [
        {
            id: 'ps1',
            number: '01',
            title: 'PS1: Actuator Selection',
            finalSubmissionFormat: 'Technical Presentation (PPT / PDF)',
            tagline: 'Actuator sizing, response time analysis, circular trajectory accommodation, and mounting architecture.',
            parts: [
                {
                    partLabel: 'Part A — Brake-by-Wire (BBW)',
                    target: 'Design a simple actuator system to generate 2000 N force at the brake master cylinder with a bore diameter (19.05mm)',
                    checklist: [
                        'Explain how you will control the actuator.',
                        'Show how and where you will mount the actuator on the Baja buggy.',
                        'Required braking force and actuator torque/speed calculations, response time analysis',
                        'Comparison of different mechanisms (including the different types of motors, actuator drive mechanism, and feedback control)',
                        'The pedal travels in circular trajectory, how will you accommodate design if you choose linear actuator.'
                    ]
                },
                {
                    partLabel: 'Part B — Steer-by-Wire (SBW)',
                    target: 'Design a motorized steering system capable of providing 12 Nm torque at the steering column.',
                    checklist: [
                        'Select a suitable motor and reduction mechanism.',
                        'Explain how you will control left/right steering.',
                        'Add a method to limit steering angle.',
                        'Show how and where you will mount the system on the Baja buggy.'
                    ]
                }
            ]
        },
        {
            id: 'ps2',
            number: '02',
            title: 'PS2: Manual Override And Sensors integration',
            finalSubmissionFormat: 'Technical Presentation (PPT / PDF)',
            tagline: 'Autonomous takeover override, motor isolation, steering turning angle adaptation, and sensor integration.',
            parts: [
                {
                    partLabel: 'Part A — BBW',
                    target: 'Design a BBW system that allows the driver to brake normally if the actuator fails and a basic sensor system for autonomous braking.',
                    checklist: [
                        'Explain how the autonomous braking will override.',
                        'Explain how manual braking is restored.',
                        'Show where the mechanism will be mounted on the Baja.',
                        'Select suitable sensors for brake pressure, wheel speed and vehicle deceleration.'
                    ]
                },
                {
                    partLabel: 'Part B — SBW',
                    target: 'Design an SBW system that allows the driver to take manual control immediately when autonomous steering is switched off.',
                    checklist: [
                        'Explain how the autonomous control will get overrided',
                        'Explain how the motor will be isolated.',
                        'Show how the mechanism will be mounted to the steering column/chassis.',
                        'Current steering turning angle is 30 degree, how will you change to 35 degree',
                        'Explain how will you engage the motor and steering column',
                        'Select a suitable steering-angle sensor/encoder.'
                    ]
                }
            ]
        }
    ]
};


