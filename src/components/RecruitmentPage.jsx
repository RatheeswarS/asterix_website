import { useState, useEffect } from 'react';
import { useWebsiteData } from '../context/WebsiteDataContext';
import {
    useRecruitmentCountdown,
    RecruitmentCountdownBoard,
    RecruitmentCountdownStrip,
} from './RecruitmentCountdown';
import teamLogo from '../assets/Screenshot 2026-08-26 232320.png';
import imgWelding from '../assets/gallery/02_workshop_welding.jpg';
import imgLidar from '../assets/gallery/03_lidar_sensor_tuning.jpg';
import imgPaddock from '../assets/gallery/01_team_paddock.jpg';

export default function RecruitmentPage({ onBack }) {
    useEffect(() => {
        window.scrollTo(0, 0);
        if (window.lenis) {
            window.lenis.scrollTo(0, { immediate: true });
        }
    }, []);

    const { siteData } = useWebsiteData();
    const { recruitment, hero } = siteData;
    const [activeSubsystemTab, setActiveSubsystemTab] = useState('software-perception');
    const [isCountdownDocked, setIsCountdownDocked] = useState(false);

    const appLink = recruitment?.applicationLink || hero?.joinFormUrl || 'https://forms.gle/6hHG6aXqrunnfj7V6';

    // One timer feeds both the inline board and the docked header strip.
    const countdown = useRecruitmentCountdown(recruitment?.deadlines);

    const problemStatements = recruitment?.problemStatements || [
        {
            id: 'software-perception',
            subsystem: 'Software & Perception',
            title: 'Classical OpenCV Lane Extraction & Stanley Steering Controller',
            description: 'Design a real-time C++ or Python pipeline to crop stereo camera feeds, execute Bird\'s-Eye View perspective transformation, fit 2nd-order lane polynomials, and calculate Stanley lateral steering error for a 3.0m track width under variable illumination.',
            deliverables: 'GitHub repository or ZIP containing source code, test video results, and a 1-page architecture design document.'
        },
        {
            id: 'powertrain',
            subsystem: 'Powertrain',
            title: 'CVT Shift Curve Optimization & Dynamic Torque Reduction',
            description: 'Model the flyweight and secondary spring characteristics paired with a 305cc Vanguard engine. Optimize shift engagement to deliver maximum torque under rock-crawl surge without sacrificing 45 km/h top straightaway speed.',
            deliverables: 'Mathematical calculations, shift ratio curves (Excel/MATLAB/Python), and reduction gearbox casing CAD brief.'
        },
        {
            id: 'mechanical',
            subsystem: 'Mechanical',
            title: 'Roll Cage Torsional Rigidity & Suspension Kinematics Design',
            description: 'Design an AISI 4130 tubular roll cage compliant with SAE BAJA technical inspection rules. Conduct frontal, lateral, and rollover impact FEA. Simultaneously model double wishbone suspension geometry to achieve minimal scrub radius and anti-dive.',
            deliverables: 'CAD STEP file, ANSYS FEA impact stress report, and kinematics coordinate spreadsheet.'
        },
        {
            id: 'leads',
            subsystem: 'Leads & Management',
            title: 'Corporate Sponsorship Pitch Deck & Paddock Logistics Masterplan',
            description: 'Create a persuasive 5-slide corporate sponsorship presentation targeting automotive and tech leaders. Develop a comprehensive budget and paddock timeline for testing, fabrication, and competition travel.',
            deliverables: '5-slide PDF pitch deck, budget spreadsheet, and 12-month milestone Gantt chart.'
        }
    ];

    const currentStatement = problemStatements.find(p => p.id === activeSubsystemTab || p.subsystem?.toLowerCase().includes(activeSubsystemTab)) || problemStatements[0];

    const handleDownloadStatement = (statement) => {
        const text = `=====================================================
TEAM ASTERIX - CREW RECRUITMENT 2026-27
PROBLEM STATEMENT: ${statement.subsystem?.toUpperCase()}
=====================================================
Title: ${statement.title}

OBJECTIVE & PROBLEM DESCRIPTION:
${statement.description}

SUBMISSION DELIVERABLES:
${statement.deliverables || 'Code, CAD, or Document submission according to task brief.'}

HOW TO SUBMIT:
1. Complete the application form at: ${appLink}
2. Upload your solution link or file through the application portal.
3. Shortlisted candidates will be invited for in-person technical interviews at the Asterix Workshop.

Questions? Reach out to asterix.psgitech@gmail.com
Good luck, Engineer!
=====================================================`;
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Asterix_Problem_Statement_${statement.subsystem?.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-amber-400 selection:text-slate-900">
            
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-4 border-slate-900 shadow-[0_4px_0px_#0f172a]">
                <div className="px-4 sm:px-8 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={teamLogo} alt="Team Asterix" className="h-9 w-auto object-contain" />
                        <div className="hidden sm:block">
                            <span className="font-mono text-xs font-black uppercase text-amber-600 block leading-tight">
                                CREW SELECTION & RECRUITMENT
                            </span>
                            <span className="font-black text-sm uppercase text-slate-900 leading-tight">
                                TEAM ASTERIX INDUCTION PORTAL
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={onBack}
                        className="press px-4 py-2 border-2 border-slate-900 bg-sky-100 hover:bg-sky-500 hover:text-white font-mono font-black text-xs uppercase shadow-[2px_2px_0px_#0f172a] cursor-pointer flex items-center gap-1.5"
                    >
                        <span>← Back to Website</span>
                    </button>
                </div>

                {/* Same countdown, docked. Rides along once the board scrolls past. */}
                <RecruitmentCountdownStrip
                    countdown={countdown}
                    applyLink={appLink}
                    docked={isCountdownDocked}
                />
            </header>

            {/* Hero Section */}
            <section className="py-16 sm:py-20 px-4 sm:px-8 bg-slate-900 text-white border-b-4 border-slate-900 relative overflow-hidden">
                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="flex flex-wrap items-center gap-3 mb-4 font-mono text-xs font-black">
                        <span className="px-3 py-1 bg-amber-300 text-slate-900 border-2 border-slate-900 shadow-[3px_3px_0px_#0284c7]">
                            ⚡ CLASS OF 2026-27 RECRUITMENT
                        </span>
                        <span className="px-3 py-1 bg-emerald-400 text-slate-900 border-2 border-slate-900 shadow-[3px_3px_0px_#0284c7]">
                            ● STATUS: {recruitment?.status || 'APPLICATIONS OPEN'}
                        </span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-none mb-6">
                        BUILD THE <span className="text-stroke-white text-transparent">BEAST</span>
                    </h1>
                    <p className="text-base sm:text-xl text-slate-300 font-bold max-w-3xl leading-relaxed">
                        Got the passion? We got the track. Team Asterix is selecting motivated engineering students across all years to design, build, test, and race our next-generation SAEINDIA BAJA autonomous & all-terrain vehicles.
                    </p>

                    <div className="mt-8 flex flex-wrap items-center gap-4 font-mono text-xs font-black">
                        <a
                            href={appLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="press px-6 py-3.5 bg-amber-300 hover:bg-amber-400 text-slate-900 border-3 border-slate-900 shadow-[4px_4px_0px_#000] cursor-pointer flex items-center gap-2"
                        >
                            <span>APPLY FOR CREW NOW ↗</span>
                        </a>
                        <a
                            href="#problem-statements"
                            className="press px-6 py-3.5 bg-sky-400 hover:bg-sky-300 text-slate-900 border-3 border-slate-900 shadow-[4px_4px_0px_#000] cursor-pointer flex items-center gap-2"
                        >
                            <span>VIEW PROBLEM STATEMENTS ↓</span>
                        </a>
                        <a
                            href="#results"
                            className="press px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-900 border-3 border-slate-900 shadow-[4px_4px_0px_#000] cursor-pointer flex items-center gap-2"
                        >
                            <span>CHECK LIVE RESULTS ↓</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* Section 1: Recruitment Process Roadmap */}
            <section className="py-16 px-4 sm:px-8 max-w-6xl mx-auto">
                <div className="mb-12">
                    <span className="text-xs font-mono font-black uppercase text-sky-600 tracking-widest block mb-1">
                        THE ROADMAP TO THE PADDOCK
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black uppercase text-slate-900 tracking-tight">
                        RECRUITMENT PROCESS
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Step 1 */}
                    <div className="p-6 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] relative">
                        <span className="px-2 py-1 bg-sky-100 border-2 border-slate-900 font-mono font-black text-xs block w-fit mb-4">
                            STAGE 01
                        </span>
                        <h3 className="text-xl font-black uppercase text-slate-900 mb-2">
                            Application Form
                        </h3>
                        <p className="text-xs font-medium text-slate-600 leading-relaxed">
                            Submit your background, past engineering projects, and choose your preferred subsystem: Software & Perception, Powertrain, Mechanical, or Leads.
                        </p>
                    </div>

                    {/* Step 2 */}
                    <div className="p-6 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] relative">
                        <span className="px-2 py-1 bg-amber-200 border-2 border-slate-900 font-mono font-black text-xs block w-fit mb-4">
                            STAGE 02
                        </span>
                        <h3 className="text-xl font-black uppercase text-slate-900 mb-2">
                            Problem Statement
                        </h3>
                        <p className="text-xs font-medium text-slate-600 leading-relaxed">
                            Tackle a subsystem-specific engineering challenge: write OpenCV/Stanley code, calculate CVT reduction ratios, or design chassis FEA models.
                        </p>
                    </div>

                    {/* Step 3 */}
                    <div className="p-6 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] relative">
                        <span className="px-2 py-1 bg-emerald-200 border-2 border-slate-900 font-mono font-black text-xs block w-fit mb-4">
                            STAGE 03
                        </span>
                        <h3 className="text-xl font-black uppercase text-slate-900 mb-2">
                            Technical Review
                        </h3>
                        <p className="text-xs font-medium text-slate-600 leading-relaxed">
                            Shortlisted candidates attend an in-person technical evaluation with our subsystem leads to defend their design decisions and problem solutions.
                        </p>
                    </div>

                    {/* Step 4 */}
                    <div className="p-6 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] relative">
                        <span className="px-2 py-1 bg-indigo-200 border-2 border-slate-900 font-mono font-black text-xs block w-fit mb-4">
                            STAGE 04
                        </span>
                        <h3 className="text-xl font-black uppercase text-slate-900 mb-2">
                            Workshop Trial
                        </h3>
                        <p className="text-xs font-medium text-slate-600 leading-relaxed">
                            Hands-on workshop induction, tool safety briefing, and onboarding into active vehicle fabrication and testing for the national competition.
                        </p>
                    </div>
                </div>
            </section>

            {/* Section 1.5: Deadline Timing Tower */}
            {countdown.hasSchedule && (
                <RecruitmentCountdownBoard
                    countdown={countdown}
                    applyLink={appLink}
                    onDockChange={setIsCountdownDocked}
                />
            )}

            {/* Section 2: Problem Statements Section */}
            <section id="problem-statements" className="py-16 px-4 sm:px-8 bg-sky-50/60 border-y-4 border-slate-900">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-10">
                        <span className="text-xs font-mono font-black uppercase text-sky-600 tracking-widest block mb-1">
                            ENGINEERING EVALUATION BRIEFS
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-black uppercase text-slate-900 tracking-tight">
                            PROBLEM STATEMENTS
                        </h2>
                        <p className="text-sm font-bold text-slate-600 mt-2">
                            Select a subsystem to review its specific assignment and download the official problem brief.
                        </p>
                    </div>

                    {/* Subsystem Selection Pills */}
                    <div className="flex flex-wrap gap-2 mb-8">
                        {problemStatements.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setActiveSubsystemTab(p.id)}
                                className={`px-4 py-2.5 border-3 border-slate-900 font-mono font-black text-xs uppercase transition-all cursor-pointer ${
                                    activeSubsystemTab === p.id
                                        ? 'bg-slate-900 text-white shadow-[3px_3px_0px_#0284c7]'
                                        : 'bg-white hover:bg-slate-100 text-slate-900 shadow-[2px_2px_0px_#0f172a]'
                                }`}
                            >
                                {p.subsystem}
                            </button>
                        ))}
                    </div>

                    {/* Active Statement Detail Card */}
                    <div className="p-8 sm:p-12 bg-white border-4 border-slate-900 shadow-[10px_10px_0px_#0f172a]">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pb-6 border-b-3 border-slate-900">
                            <div>
                                <span className="px-2.5 py-1 bg-amber-300 border-2 border-slate-900 font-mono font-black text-[10px] uppercase shadow-[2px_2px_0px_#0f172a] block w-fit mb-2">
                                    {currentStatement.subsystem} TASK BRIEF
                                </span>
                                <h3 className="text-2xl sm:text-3xl font-black uppercase text-slate-900">
                                    {currentStatement.title}
                                </h3>
                            </div>
                            <button
                                onClick={() => handleDownloadStatement(currentStatement)}
                                className="press px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-mono font-black text-xs uppercase border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] cursor-pointer whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5"
                            >
                                <span>Download Brief</span>
                                <span>↓</span>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="text-xs font-mono font-black uppercase text-slate-500 mb-2">
                                    Problem Description & Requirements:
                                </h4>
                                <p className="text-sm sm:text-base font-bold text-slate-800 leading-relaxed">
                                    {currentStatement.description}
                                </p>
                            </div>

                            <div className="p-4 bg-sky-50 border-2 border-slate-900">
                                <h4 className="text-xs font-mono font-black uppercase text-sky-800 mb-1">
                                    Expected Deliverables:
                                </h4>
                                <p className="text-xs font-mono text-slate-700">
                                    {currentStatement.deliverables || 'Structured solution document, CAD models (STEP), source code repository, or presentation deck.'}
                                </p>
                            </div>

                            <div className="pt-4 border-t-2 border-slate-200 flex flex-wrap items-center justify-between gap-4">
                                <span className="text-xs font-mono font-bold text-slate-500">
                                    Ready to submit? Include your solution link inside the application form.
                                </span>
                                <a
                                    href={appLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="press px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-mono font-black text-xs uppercase cursor-pointer"
                                >
                                    Submit Solution in Application →
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 3: Recruitment Posters & Workshop Showcase */}
            <section className="py-16 px-4 sm:px-8 max-w-6xl mx-auto">
                <div className="mb-10">
                    <span className="text-xs font-mono font-black uppercase text-sky-600 tracking-widest block mb-1">
                        LIFE IN THE PADDOCK
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black uppercase text-slate-900 tracking-tight">
                        POSTERS & WORKSHOP ACTION
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Poster 1 */}
                    <div className="border-4 border-slate-900 bg-white shadow-[6px_6px_0px_#0f172a] overflow-hidden group">
                        <div className="h-64 overflow-hidden border-b-3 border-slate-900 relative">
                            <img src={imgWelding} alt="Chassis Fabrication" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <span className="absolute top-3 right-3 px-2 py-0.5 bg-amber-300 border-2 border-slate-900 font-mono font-black text-[10px] uppercase shadow-[2px_2px_0px_#0f172a]">
                                MECHANICAL
                            </span>
                        </div>
                        <div className="p-5">
                            <h3 className="text-lg font-black uppercase text-slate-900 mb-1">
                                Chassis Fabrication & FEA
                            </h3>
                            <p className="text-xs font-medium text-slate-600">
                                Learn TIG welding, tubular notch geometry, and ANSYS impact structural optimization.
                            </p>
                        </div>
                    </div>

                    {/* Poster 2 */}
                    <div className="border-4 border-slate-900 bg-white shadow-[6px_6px_0px_#0f172a] overflow-hidden group">
                        <div className="h-64 overflow-hidden border-b-3 border-slate-900 relative">
                            <img src={imgLidar} alt="ROS 2 Perception" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <span className="absolute top-3 right-3 px-2 py-0.5 bg-sky-400 text-white border-2 border-slate-900 font-mono font-black text-[10px] uppercase shadow-[2px_2px_0px_#0f172a]">
                                SOFTWARE & AI
                            </span>
                        </div>
                        <div className="p-5">
                            <h3 className="text-lg font-black uppercase text-slate-900 mb-1">
                                Autonomous Stack & Computer Vision
                            </h3>
                            <p className="text-xs font-medium text-slate-600">
                                Build real-time ROS 2 Jazzy nodes, OpenCV camera warping, and Stanley steering control.
                            </p>
                        </div>
                    </div>

                    {/* Poster 3 */}
                    <div className="border-4 border-slate-900 bg-white shadow-[6px_6px_0px_#0f172a] overflow-hidden group">
                        <div className="h-64 overflow-hidden border-b-3 border-slate-900 relative">
                            <img src={imgPaddock} alt="Paddock Race Execution" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <span className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-300 border-2 border-slate-900 font-mono font-black text-[10px] uppercase shadow-[2px_2px_0px_#0f172a]">
                                RACE OPS
                            </span>
                        </div>
                        <div className="p-5">
                            <h3 className="text-lg font-black uppercase text-slate-900 mb-1">
                                Race Engineering & Telemetry
                            </h3>
                            <p className="text-xs font-medium text-slate-600">
                                Run trackside scrutineering, pit stops, and telemetry analysis at national BAJA tracks.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 4: Live Results & Shortlist Announcements */}
            <section id="results" className="py-16 px-4 sm:px-8 bg-slate-900 text-white border-t-4 border-slate-900">
                <div className="max-w-5xl mx-auto">
                    <div className="mb-10 text-center">
                        <span className="text-xs font-mono font-black uppercase text-amber-400 tracking-widest block mb-1">
                            OFFICIAL SELECTION UPDATES
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight">
                            RESULTS & SHORTLISTS
                        </h2>
                    </div>

                    <div className="space-y-6">
                        {(recruitment?.results || [
                            {
                                title: 'Round 1 Written / Problem Statement Review',
                                date: 'Ongoing Evaluation',
                                status: 'Review In Progress',
                                announcement: 'Evaluations are currently underway across all 4 subsystems. Shortlisted candidates will be notified via email and interview schedules will be updated here in real time.'
                            }
                        ]).map((res, idx) => (
                            <div key={idx} className="p-6 sm:p-8 bg-slate-800 border-3 border-slate-700 shadow-[6px_6px_0px_#0284c7]">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-700">
                                    <h3 className="text-xl font-black uppercase text-white">
                                        {res.title}
                                    </h3>
                                    <span className="px-3 py-1 bg-amber-400 text-slate-900 font-mono font-black text-xs uppercase w-fit">
                                        {res.status || 'Active Update'}
                                    </span>
                                </div>
                                <p className="text-sm font-bold text-slate-300 leading-relaxed mb-4">
                                    {res.announcement}
                                </p>
                                <span className="text-[11px] font-mono font-bold text-slate-400">
                                    Published: {res.date} • Team Asterix Selection Committee
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 text-center">
                        <a
                            href={appLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="press inline-block px-8 py-4 bg-amber-300 hover:bg-amber-400 text-slate-900 font-mono font-black text-sm uppercase border-3 border-slate-900 shadow-[4px_4px_0px_#0284c7] cursor-pointer"
                        >
                            SUBMIT YOUR RECRUITMENT APPLICATION ↗
                        </a>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
                    <span>© 2026 TEAM ASTERIX • RECRUITMENT & INDUCTION PORTAL</span>
                    <button
                        onClick={onBack}
                        className="press press-flat text-sky-400 hover:text-white underline cursor-pointer"
                    >
                        ← Return to Main Site
                    </button>
                </div>
            </section>

        </div>
    );
}
