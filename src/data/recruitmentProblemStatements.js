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

export const SOFTWARE_PERCEPTION_DATA = {
    id: 'software-perception',
    name: 'Software & Perception',
    headline: 'AUTONOMOUS PERCEPTION & STATE ESTIMATION',
    blurb: 'Two comprehensive recruitment challenges. Choose your domain, design your pipeline in Phase 1, and implement your solution in Phase 2.',
    timeline: [
        {
            id: 'sp-release',
            label: 'Problem Statements Release',
            detail: 'Vision & sensor fusion challenge briefs unlock tomorrow at 6:30 PM IST',
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
            detail: 'Implementation, Codebase, Model Weights & Final Evaluation due at 11:59 PM IST',
            date: '2026-09-14T23:59:00+05:30',
            opensAt: '2026-09-08T23:59:00+05:30',
        },
        {
            id: 'sp-results',
            label: 'Final Results Announcement',
            detail: 'Final selected crew roster published on 20 September night',
            date: '2026-09-20T23:59:00+05:30',
            opensAt: '2026-09-14T23:59:00+05:30',
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
                { name: 'Bicyclist', icon: 'bicyclist', color: 'border-emerald-400 bg-emerald-50 text-emerald-900', note: 'Cyclist / slow-moving obstacle' },
                { name: 'Red traffic light', icon: 'red-light', color: 'border-rose-500 bg-rose-50 text-rose-900', note: 'Color treated as separate class' },
                { name: 'Green traffic light', icon: 'green-light', color: 'border-green-500 bg-green-50 text-green-900', note: 'Color treated as separate class' },
                { name: 'Orange / amber light', icon: 'amber-light', color: 'border-amber-500 bg-amber-50 text-amber-900', note: 'Color treated as separate class' },
                { name: 'Two-wheeler', icon: 'bike', color: 'border-cyan-400 bg-cyan-50 text-cyan-900', note: 'Motorcycles / scooters' }
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
                        'Detect and distinguish all 9 specified classes with 2D bounding boxes, class labels, and confidence scores.',
                        'Traffic lights must treat color as part of the class (red, green, and orange/amber are 3 distinct classes).',
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
                        { name: 'Technical Presentation', format: 'Slide Deck (PDF/Slides)', description: 'Concise presentation explaining research, reasoning, trade-offs, and proposed solution.' },
                        { name: 'System / Workflow Diagram', format: 'Diagram (PNG/PDF/SVG)', description: 'Clear end-to-end diagram showing camera input, preprocessing, detector, and postprocessing.' },
                        { name: 'Model Comparison', format: 'Comparative Matrix', description: 'Evaluation of models considered (YOLO variants, RT-DETR, EfficientDet) with reasoning behind selection.' },
                        { name: 'Dataset Strategy', format: 'Written Section / Table', description: 'Public datasets considered, class coverage, custom data collection/annotation plan, and class imbalance handling.' },
                        { name: 'Training & Evaluation Plan', format: 'Structured Plan', description: 'Proposed strategy for transfer learning, augmentation, splits, precision/recall/mAP metrics, and latency measurement.' },
                        { name: 'Deployment Considerations', format: 'Architecture Notes', description: 'How the solution will fit NVIDIA Jetson Orin NX constraints (FP16/INT8, TensorRT, memory budget).' },
                        { name: 'Engineering Process', format: 'Summary Report', description: 'Explanation of your decision-making path: Problem → Questions → Research → Alternatives → Decision.' },
                        { name: 'References', format: 'Bibliography', description: 'Research papers, documentation, repositories, and benchmarks used.' }
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
                    deadline: '14 September 2026 • 11:59 PM IST',
                    deadlineDate: '2026-09-14T23:59:00+05:30',
                    tagline: 'Take the approach you developed in Phase 1 and turn it into a working 2D object-detection system. Build, test, evaluate and improve your solution.',
                    overview: 'In Phase 2, you will implement, train, and benchmark the detector proposed in Phase 1. You are not required to follow your Phase 1 proposal blindly — if experiments show a different architecture or training regime is superior, document what changed and why.',
                    environmentNote: 'You do NOT need physical access to an NVIDIA Jetson Orin NX or ZED 2i camera. You may develop and test your detector on whatever hardware is available to you (laptop, Google Colab, GPU workstation). Jetson is the target deployment platform, not a requirement for personal setup.',
                    coreTask: [
                        'Implement, fine-tune, or train your 2D object detector to distinguish all 9 required classes.',
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
                        { name: 'Technical Write-up', format: 'Short Report (PDF)', description: 'Explaining pipeline: coordinate transformations, time alignment, noise reduction, and ghost rejection.' },
                        { name: 'Pipeline Diagram', format: 'Diagram (PNG/SVG)', description: 'Clear visualization showing data flow from raw logs → transformed detections → filtered → clustered → final map.' },
                        { name: 'Method Comparison', format: 'Comparative Analysis', description: 'Comparison of association and clustering methods considered (DBSCAN vs Nearest Neighbor vs Gating).' },
                        { name: 'Validation & Ablations', format: 'Report Section / Plots', description: 'Proof of correctness: sanity checks, sensitivity to thresholds, and ablations (e.g. filter disabled).' },
                        { name: 'References', format: 'Citations', description: 'Robotics papers, SLAM textbooks, sensor fusion tutorials, and libraries used.' }
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
                    deadline: '14 September 2026 • 11:59 PM IST',
                    deadlineDate: '2026-09-14T23:59:00+05:30',
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
    timeline: [
        {
            id: 'pt-release',
            label: 'Test Syllabus & Guidelines Release',
            detail: 'Full 4-domain test topics, rules & cheat sheet specifications unlock tomorrow at 6:30 PM IST',
            date: '2026-09-03T18:30:00+05:30',
            opensAt: '2026-09-02T18:00:00+05:30',
        },
        {
            id: 'pt-test',
            label: 'Powertrain Recruitment Test',
            detail: 'Offline Written Test • 5:30 PM – 6:30 PM IST',
            date: '2026-09-11T17:30:00+05:30',
            opensAt: '2026-09-03T18:30:00+05:30',
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
    headline: 'CLASSIFIED • MECHANICAL DYNAMICS & CONTROL',
    badge: 'CLASSIFIED DOSSIER',
    blurb: 'Three problem statements. Longitudinal control and lateral control. Teams of 2. Evaluation criteria mysterious and not announced.',
    timeline: [
        {
            id: 'mech-release',
            label: 'Classified Problem Dossiers Release',
            detail: '3 Problem statements & duo team allocations unlock tomorrow at 6:30 PM IST',
            date: '2026-09-03T18:30:00+05:30',
            opensAt: '2026-09-02T18:00:00+05:30',
        },
        {
            id: 'mech-deadline',
            label: 'Mechanical Submission Deadline',
            detail: 'Duo solution proposals due on 16 September at 11:59 PM IST',
            date: '2026-09-16T23:59:00+05:30',
            opensAt: '2026-09-03T18:30:00+05:30',
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
        badge: 'TEAMS OF 2',
        desc: 'Everyone will be split into teams of 2.'
    },
    evaluationNotice: {
        status: 'MYSTERIOUS // NOT ANNOUNCED',
        badge: 'MYSTERY EVALUATION',
        title: 'Evaluation Criteria: Mysterious & Not Announced',
        desc: 'Evaluation criteria for mechanical would be mysterious and not announced.'
    },
    challenges: [
        {
            id: 'mech-ps-01',
            number: '01',
            codename: 'PROBLEM STATEMENT 01',
            title: 'Problem Statement 01',
            sectionLongitudinal: {
                title: 'Section 01: Longitudinal Control'
            },
            sectionLateral: {
                title: 'Section 02: Lateral Control'
            }
        },
        {
            id: 'mech-ps-02',
            number: '02',
            codename: 'PROBLEM STATEMENT 02',
            title: 'Problem Statement 02',
            sectionLongitudinal: {
                title: 'Section 01: Longitudinal Control'
            },
            sectionLateral: {
                title: 'Section 02: Lateral Control'
            }
        },
        {
            id: 'mech-ps-03',
            number: '03',
            codename: 'PROBLEM STATEMENT 03',
            title: 'Problem Statement 03',
            sectionLongitudinal: {
                title: 'Section 01: Longitudinal Control'
            },
            sectionLateral: {
                title: 'Section 02: Lateral Control'
            }
        }
    ]
};


