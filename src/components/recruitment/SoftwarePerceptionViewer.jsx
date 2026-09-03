import { useState, useEffect } from 'react';
import { SOFTWARE_PERCEPTION_DATA } from '../../data/recruitmentProblemStatements';

const PHASE_1_DEADLINE_MS = new Date('2026-09-08T23:59:00+05:30').getTime();

export default function SoftwarePerceptionViewer({ isAdmin = false }) {
    const data = SOFTWARE_PERCEPTION_DATA;
    const [isPhase2Unlocked, setIsPhase2Unlocked] = useState(() => isAdmin || Date.now() > PHASE_1_DEADLINE_MS);
    const [activeChallengeId, setActiveChallengeId] = useState(null);
    const [activePhaseKey, setActivePhaseKey] = useState('phase1');
    const [activeSectionTab, setActiveSectionTab] = useState('overview');
    const [copiedDeliverables, setCopiedDeliverables] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isTeamListExpanded, setIsTeamListExpanded] = useState(false);

    useEffect(() => {
        if (isPhase2Unlocked) return;
        const remaining = Math.max(10, PHASE_1_DEADLINE_MS - Date.now());
        const timer = setTimeout(() => setIsPhase2Unlocked(true), remaining);
        return () => clearTimeout(timer);
    }, [isPhase2Unlocked]);


    const challenge = activeChallengeId ? data.challenges.find((c) => c.id === activeChallengeId) : null;
    const currentPhaseKey = challenge && isPhase2Unlocked ? activePhaseKey : 'phase1';
    const phase = challenge ? challenge.phases[currentPhaseKey] : null;

    const handleCopyDeliverables = () => {
        if (!phase) return;
        const text = phase.deliverables
            .map((d, i) => `${i + 1}. ${d.name} (${d.format}): ${d.description}`)
            .join('\n');
        navigator.clipboard?.writeText?.(text);
        setCopiedDeliverables(true);
        setTimeout(() => setCopiedDeliverables(false), 2000);
    };

    const filterTeams = (teams) => {
        if (!searchQuery.trim()) return teams;
        const q = searchQuery.toLowerCase().trim();
        return teams.filter(t =>
            t.group.toLowerCase().includes(q) ||
            t.members.some(m => m.name.toLowerCase().includes(q) || m.dept.toLowerCase().includes(q) || m.phone.includes(q))
        );
    };

    return (
        <div className="space-y-8">
            {/* Team Allocation Notice & PDF Download Banner — Placed ABOVE Problem Statements */}
            <div className="bg-amber-300 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-5 sm:p-6 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-slate-900 text-amber-300 font-mono text-xs font-black uppercase">
                                👥 {data.teamFormat?.badge || 'TEAMS OF TWO'}
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-800">
                                Mandatory Duo Collaboration
                            </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black uppercase text-slate-900 tracking-tight">
                            {data.teamFormat?.title || 'Software & Perception Team Allocations'}
                        </h3>
                        <p className="text-xs sm:text-sm font-bold text-slate-800 max-w-2xl leading-relaxed">
                            {data.teamFormat?.desc || 'Candidates will be working in allocated teams of two to design the architecture, complete deliverables, and submit solutions.'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <a
                            href={data.teamFormat?.pdfUrl || '/recruitment/software_perception_teams.pdf'}
                            target="_blank"
                            rel="noopener noreferrer"
                            download="Asterix_Software_Perception_Teams.pdf"
                            className="press inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white hover:bg-sky-600 border-2 border-slate-900 font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#0284c7] no-underline cursor-pointer"
                        >
                            <span>📄 Download Team List (PDF)</span>
                            <span>↗</span>
                        </a>
                        <button
                            type="button"
                            onClick={() => setIsTeamListExpanded(prev => !prev)}
                            className="press inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 border-2 border-slate-900 font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#0f172a] cursor-pointer"
                        >
                            <span>{isTeamListExpanded ? '▲ Hide Team Roster' : '▼ View Team Roster (17 Groups)'}</span>
                        </button>
                    </div>
                </div>

                {/* Expandable Searchable Team Roster */}
                {isTeamListExpanded && (
                    <div className="pt-4 border-t-2 border-slate-900/40 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <span className="font-mono text-xs font-black uppercase text-slate-900">
                                Allocated Team Duos (14 II-Year Groups • 3 III-Year Groups)
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, group, or dept..."
                                className="w-full sm:w-72 px-3 py-1.5 bg-white border-2 border-slate-900 font-mono text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-[2px_2px_0px_#0f172a]"
                            />
                        </div>

                        {/* II Year Teams Grid */}
                        <div className="space-y-2">
                            <span className="font-mono text-xs font-black uppercase text-slate-800 tracking-wider block">
                                — II Year Students ({data.teamFormat?.teamsIIYear?.length || 14} Groups)
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filterTeams(data.teamFormat?.teamsIIYear || []).map((grp) => (
                                    <div key={grp.group} className="bg-white border-2 border-slate-900 p-3 shadow-[3px_3px_0px_#0f172a]">
                                        <span className="px-2 py-0.5 bg-sky-200 border border-slate-900 font-mono text-[10px] font-black uppercase inline-block mb-2">
                                            {grp.group}
                                        </span>
                                        <div className="space-y-2">
                                            {grp.members.map((m, idx) => (
                                                <div key={idx} className="flex items-start justify-between gap-2 text-xs border-b border-slate-100 last:border-b-0 pb-1 last:pb-0">
                                                    <div>
                                                        <strong className="text-slate-900 block leading-tight">{m.name}</strong>
                                                        <span className="font-mono text-[10px] text-slate-500">{m.dept}</span>
                                                    </div>
                                                    <a href={`tel:${m.phone}`} className="font-mono text-[11px] font-bold text-sky-700 hover:underline shrink-0">
                                                        {m.phone}
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* III Year Teams Grid */}
                        <div className="space-y-2 pt-2">
                            <span className="font-mono text-xs font-black uppercase text-slate-800 tracking-wider block">
                                — III Year Students ({data.teamFormat?.teamsIIIYear?.length || 3} Groups)
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filterTeams(data.teamFormat?.teamsIIIYear || []).map((grp) => (
                                    <div key={grp.group} className="bg-white border-2 border-slate-900 p-3 shadow-[3px_3px_0px_#0f172a]">
                                        <span className="px-2 py-0.5 bg-amber-200 border border-slate-900 font-mono text-[10px] font-black uppercase inline-block mb-2">
                                            {grp.group}
                                        </span>
                                        <div className="space-y-2">
                                            {grp.members.map((m, idx) => (
                                                <div key={idx} className="flex items-start justify-between gap-2 text-xs border-b border-slate-100 last:border-b-0 pb-1 last:pb-0">
                                                    <div>
                                                        <strong className="text-slate-900 block leading-tight">{m.name}</strong>
                                                        <span className="font-mono text-[10px] text-slate-500">{m.dept}</span>
                                                    </div>
                                                    <a href={`tel:${m.phone}`} className="font-mono text-[11px] font-bold text-sky-700 hover:underline shrink-0">
                                                        {m.phone}
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Header / Challenge Picker */}
            <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-5 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <span className="px-3 py-1 bg-sky-300 text-slate-900 border-2 border-slate-900 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#0f172a]">
                        ⚡ {data.headline}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-600">
                        2 Problem Statements • Select to View Details
                    </span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-black uppercase text-slate-900 tracking-tight mb-2">
                    SELECT YOUR RECRUITMENT CHALLENGE
                </h2>
                <p className="text-sm font-bold text-slate-600 max-w-3xl mb-6 leading-relaxed">
                    {data.blurb} Choose either problem statement below to review the specifications, phased requirements, and deliverables.
                </p>

                {/* Problem Statement Switcher Pills */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.challenges.map((c) => {
                        const isSelected = challenge && c.id === challenge.id;
                        return (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                    setActiveChallengeId(activeChallengeId === c.id ? null : c.id);
                                    setActiveSectionTab('overview');
                                }}
                                className={`text-left p-4 sm:p-5 border-3 border-slate-900 cursor-pointer transition-all duration-150 ${
                                    isSelected
                                        ? 'bg-slate-900 text-white shadow-[6px_6px_0px_#0284c7] -translate-y-0.5'
                                        : 'bg-white hover:bg-sky-50 text-slate-900 shadow-[3px_3px_0px_#0f172a]'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span
                                        className={`font-mono text-[11px] font-black uppercase px-2 py-0.5 border ${
                                            isSelected
                                                ? 'bg-amber-400 text-slate-900 border-slate-900'
                                                : 'bg-slate-100 text-slate-800 border-slate-300'
                                        }`}
                                    >
                                        PROBLEM STATEMENT {c.number}
                                    </span>
                                    <span className={`font-mono text-[10px] font-bold ${isSelected ? 'text-sky-300' : 'text-slate-500'}`}>
                                        {c.domain}
                                    </span>
                                </div>
                                <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight leading-snug">
                                    {c.title}
                                </h3>
                                <p
                                    className={`text-xs font-bold mt-2 line-clamp-2 leading-relaxed ${
                                        isSelected ? 'text-slate-300' : 'text-slate-600'
                                    }`}
                                >
                                    {c.tagline}
                                </p>
                                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono font-bold">
                                    <span className={isSelected ? 'text-amber-300' : 'text-sky-600'}>
                                        {isSelected ? '✓ Statement Selected (Details Shown Below)' : 'Click to View Problem Statement →'}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* If no challenge selected: show informative placeholder */}
            {!challenge && (
                <div className="p-8 sm:p-12 bg-white border-4 border-dashed border-slate-400 text-center space-y-3 shadow-[6px_6px_0px_#0f172a]">
                    <span className="text-4xl block">👇</span>
                    <h3 className="text-xl sm:text-2xl font-black uppercase text-slate-900 font-mono">
                        CHOOSE A PROBLEM STATEMENT ABOVE
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-slate-600 max-w-lg mx-auto leading-relaxed">
                        Click on either <strong>Problem Statement 01 (Vision-Based Object Detection)</strong> or <strong>Problem Statement 02 (Sensor Fusion &amp; Track Reconstruction)</strong> above to reveal the complete technical specifications, sequential phases, deliverables checklist, and Phase 1 submission protocol.
                    </p>
                </div>
            )}

            {/* Active Challenge Banner & Phase Stepper — Only shown when a challenge is selected */}
            {challenge && (
            <div className="bg-sky-50 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-5 sm:p-7 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-3 border-slate-900 pb-5">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-black uppercase px-2 py-0.5 bg-amber-300 text-slate-900 border-2 border-slate-900">
                                STATEMENT {challenge.number}
                            </span>
                            <span className="font-mono text-xs font-bold text-sky-700">
                                {challenge.badge}
                            </span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-black uppercase text-slate-900 tracking-tight">
                            {challenge.title}
                        </h3>
                    </div>

                    {/* Hardware badges */}
                    <div className="flex flex-wrap gap-2 text-[11px] font-mono font-black text-slate-800">
                        {challenge.targetHardware?.compute && (
                            <span className="px-2.5 py-1 bg-white border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
                                🖥️ {challenge.targetHardware.compute}
                            </span>
                        )}
                        {challenge.targetHardware?.sensor && (
                            <span className="px-2.5 py-1 bg-white border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
                                📷 {challenge.targetHardware.sensor}
                            </span>
                        )}
                    </div>
                </div>

                {/* Phase Stepper Navigation */}
                <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="font-mono text-xs font-black uppercase tracking-widest text-slate-600">
                            CHALLENGE PHASES &amp; TIMELINE
                        </span>
                        <span className="font-mono text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 border border-amber-400">
                            Both phases must be submitted to complete evaluation
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Phase 1 Button */}
                        <button
                            type="button"
                            onClick={() => setActivePhaseKey('phase1')}
                            className={`p-4 border-3 border-slate-900 text-left cursor-pointer transition-all duration-150 ${
                                activePhaseKey === 'phase1'
                                    ? 'bg-amber-300 text-slate-900 shadow-[5px_5px_0px_#0284c7] font-black'
                                    : 'bg-white hover:bg-slate-100 text-slate-800 shadow-[2px_2px_0px_#0f172a]'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="font-mono text-xs font-black uppercase tracking-wide">
                                    PHASE 01 • PROPOSAL
                                </span>
                                <span className="px-2 py-0.5 text-[10px] font-mono font-black bg-rose-600 text-white uppercase rounded-none">
                                    DUE 8TH NIGHT 11:59 PM IST
                                </span>
                            </div>
                            <div className="font-black text-sm uppercase text-slate-900 leading-snug">
                                {challenge.phases.phase1.title}
                            </div>
                            <div className="text-xs font-bold text-slate-700 mt-1">
                                Research, Architecture, Model Comparison &amp; Plan
                            </div>
                        </button>

                        {/* Phase 2 Button - Locked until Phase 1 deadline */}
                        <button
                            type="button"
                            onClick={() => {
                                if (!isPhase2Unlocked) return;
                                setActivePhaseKey('phase2');
                            }}
                            disabled={!isPhase2Unlocked}
                            className={`p-4 border-3 text-left transition-all duration-150 relative ${
                                !isPhase2Unlocked
                                    ? 'bg-slate-200/80 border-slate-400 text-slate-500 cursor-not-allowed select-none shadow-[2px_2px_0px_#94a3b8]'
                                    : activePhaseKey === 'phase2'
                                    ? 'bg-amber-300 border-slate-900 text-slate-900 shadow-[5px_5px_0px_#0284c7] font-black cursor-pointer'
                                    : 'bg-white hover:bg-slate-100 border-slate-900 text-slate-800 shadow-[2px_2px_0px_#0f172a] cursor-pointer'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="font-mono text-xs font-black uppercase tracking-wide flex items-center gap-1.5">
                                    {!isPhase2Unlocked ? '🔒 PHASE 02 • LOCKED' : 'PHASE 02 • IMPLEMENTATION'}
                                </span>
                                <span className={`px-2 py-0.5 text-[10px] font-mono font-black uppercase rounded-none ${
                                    !isPhase2Unlocked ? 'bg-slate-700 text-slate-200' : 'bg-rose-600 text-white'
                                }`}>
                                    {!isPhase2Unlocked ? 'UNLOCKS 8 SEPT 11:59 PM' : 'DUE 14TH NIGHT 11:59 PM IST'}
                                </span>
                            </div>
                            <div className={`font-black text-sm uppercase leading-snug ${
                                !isPhase2Unlocked ? 'text-slate-600' : 'text-slate-900'
                            }`}>
                                {!isPhase2Unlocked ? 'Phase 02 Challenge Shrouded' : challenge.phases.phase2.title}
                            </div>
                            <div className={`text-xs font-bold mt-1 ${
                                !isPhase2Unlocked ? 'text-slate-500' : 'text-slate-700'
                            }`}>
                                {!isPhase2Unlocked
                                    ? 'Detailed implementation brief will unlock after Phase 01 deadline closes.'
                                    : 'Codebase, Model Training / Online Pipeline & Results'}
                            </div>
                        </button>
                    </div>
                </div>

                {/* Section Navigation Buttons — Neo-Brutalist Tactile Click Buttons */}
                <div className="pt-4 border-t-3 border-slate-900 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 bg-amber-400 border border-slate-900 inline-block animate-pulse"></span>
                            SELECT SECTION DETAILS TO VIEW:
                        </span>
                        <span className="font-mono text-[11px] font-bold text-slate-500">
                            Click any button below to switch content
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
                        {[
                            { id: 'overview', icon: '📋', label: 'Overview & Task', tag: 'Core Objective' },
                            { id: 'technical', icon: '⚙️', label: 'Technical Scope', tag: 'Specific Questions' },
                            { id: 'metrics', icon: '📊', label: 'Testing & Metrics', tag: 'Evaluation Criteria' },
                            { id: 'deployment', icon: '🖥️', label: 'Target Jetson Deployment', tag: 'Hardware Specs' },
                            { id: 'deliverables', icon: '📁', label: 'Final Deliverables', tag: 'Google Drive & Portal' },
                            { id: 'evaluation', icon: '🎯', label: 'What We Look For', tag: 'Engineering Rubric' },
                            { id: 'policy', icon: '🤖', label: 'AI & Tools Policy', tag: 'Transparency Rules' },
                        ].map((tab) => {
                            const isActive = activeSectionTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveSectionTab(tab.id)}
                                    className={`group relative p-3 sm:p-3.5 border-3 border-slate-900 text-left transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                                        isActive
                                            ? 'bg-slate-900 text-white shadow-[4px_4px_0px_#0284c7] -translate-y-1'
                                            : 'bg-white hover:bg-amber-50 hover:-translate-y-0.5 text-slate-900 shadow-[3px_3px_0px_#0f172a] active:translate-y-0 active:shadow-[1px_1px_0px_#0f172a]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-1.5 mb-2">
                                        <span className="text-base sm:text-lg">{tab.icon}</span>
                                        <span
                                            className={`px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider ${
                                                isActive
                                                    ? 'bg-amber-300 text-slate-900 border border-slate-900'
                                                    : 'bg-slate-100 group-hover:bg-amber-300 text-slate-700 group-hover:text-slate-900 border border-slate-300'
                                            }`}
                                        >
                                            {isActive ? '✓ ACTIVE' : 'CLICK ME ↗'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-mono font-black text-xs uppercase tracking-tight block leading-snug">
                                            {tab.label}
                                        </span>
                                        <span
                                            className={`font-mono text-[10px] block mt-0.5 truncate ${
                                                isActive ? 'text-sky-300 font-bold' : 'text-slate-500 font-semibold'
                                            }`}
                                        >
                                            {tab.tag}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content Section: Overview & Task */}
                {activeSectionTab === 'overview' && (
                    <div className="bg-white border-3 border-slate-900 p-5 sm:p-6 space-y-6">
                        <div className="p-4 bg-sky-100/70 border-2 border-slate-900">
                            <span className="font-mono font-black text-[11px] uppercase tracking-widest text-sky-800 block mb-1">
                                Phase {phase.phaseNumber} Objective
                            </span>
                            <p className="text-sm font-bold text-slate-800 leading-relaxed">
                                {phase.overview}
                            </p>
                        </div>

                        {/* If Vision challenge: Display 9 required classes */}
                        {challenge.id === 'ps-vision' && challenge.classes && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-black text-sm uppercase text-slate-900 font-mono tracking-wide">
                                        Required Detection Classes (9 Classes)
                                    </h4>
                                    <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-300">
                                        Traffic light colors must be separate classes
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                                    {challenge.classes.map((cls, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-2.5 border-2 border-slate-900 ${cls.color} flex flex-col justify-between`}
                                        >
                                            <span className="font-mono font-black text-xs uppercase leading-tight">
                                                {cls.name}
                                            </span>
                                            <span className="text-[10px] font-bold opacity-80 mt-1">
                                                {cls.note}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs font-bold text-slate-600 font-mono">
                                    Output per detection: <strong>2D Bounding Box</strong> [x_min, y_min, x_max, y_max], <strong>Class Label</strong>, and <strong>Confidence Score [0.0 - 1.0]</strong>.
                                </p>
                            </div>
                        )}

                        {/* If Sensor Fusion challenge: Display complications */}
                        {challenge.id === 'ps-fusion' && challenge.complications && (
                            <div className="space-y-3">
                                <h4 className="font-black text-sm uppercase text-slate-900 font-mono tracking-wide">
                                    Key Complications to Overcome
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {challenge.complications.map((comp, idx) => (
                                        <div
                                            key={idx}
                                            className="p-4 bg-amber-50 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a]"
                                        >
                                            <span className="font-mono font-black text-xs uppercase text-amber-900 block mb-1">
                                                Complication {idx + 1}: {comp.title}
                                            </span>
                                            <p className="text-xs font-bold text-slate-700 leading-relaxed">
                                                {comp.desc}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Core Task Bullets */}
                        <div className="space-y-3">
                            <h4 className="font-black text-sm uppercase text-slate-900 font-mono tracking-wide">
                                Key Responsibilities in Phase {phase.phaseNumber}
                            </h4>
                            <ul className="space-y-2">
                                {phase.coreTask.map((task, idx) => (
                                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm font-bold text-slate-700">
                                        <span className="text-sky-600 font-black shrink-0 font-mono">▸</span>
                                        <span>{task}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Content Section: Technical Scope & Questions */}
                {activeSectionTab === 'technical' && (
                    <div className="bg-white border-3 border-slate-900 p-5 sm:p-6 space-y-6">
                        {phase.keyQuestions && (
                            <div className="space-y-3">
                                <div className="p-3 bg-amber-100/70 border-2 border-slate-900">
                                    <span className="font-mono font-black text-xs uppercase text-amber-900 block">
                                        🤔 Show Us How You Think
                                    </span>
                                    <p className="text-xs font-bold text-slate-700 mt-0.5">
                                        We are not only interested in what you choose; we want to understand how you arrived at that decision.
                                    </p>
                                </div>

                                <h4 className="font-black text-sm uppercase text-slate-900 font-mono tracking-wide mt-4">
                                    Questions Your Submission Should Answer
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {phase.keyQuestions.map((q, idx) => (
                                        <div
                                            key={idx}
                                            className="p-3 bg-slate-50 border-2 border-slate-900 text-xs font-bold text-slate-800 flex items-start gap-2"
                                        >
                                            <span className="font-mono font-black text-sky-600">Q{idx + 1}.</span>
                                            <span>{q}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Suggested Structure */}
                        {phase.suggestedStructure && (
                            <div className="space-y-3 pt-4 border-t-2 border-slate-200">
                                <h4 className="font-black text-sm uppercase text-slate-900 font-mono tracking-wide">
                                    Suggested Document / Deck Outline
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                    {phase.suggestedStructure.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="px-3 py-2 bg-sky-50 border border-slate-900 font-mono text-[11px] font-bold text-slate-800"
                                        >
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Content Section: Testing & Evaluation Metrics */}
                {activeSectionTab === 'metrics' && (
                    <div className="bg-white border-3 border-slate-900 p-5 sm:p-6 space-y-5">
                        <div>
                            <h4 className="font-black text-base uppercase text-slate-900 font-mono tracking-wide mb-1">
                                Evaluation Metrics &amp; Benchmarks
                            </h4>
                            <p className="text-xs font-bold text-slate-600">
                                Evaluate your system with quantitative experiments, not only visual inspection.
                            </p>
                        </div>

                        {phase.metricsTable ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse border-2 border-slate-900">
                                    <thead>
                                        <tr className="bg-slate-900 text-white font-mono text-xs uppercase">
                                            <th className="p-3 border-2 border-slate-900">Evaluation Area</th>
                                            <th className="p-3 border-2 border-slate-900">What to Measure &amp; Report</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-xs font-bold">
                                        {phase.metricsTable.map((row, idx) => (
                                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-sky-50/50'}>
                                                <td className="p-3 border-2 border-slate-900 font-mono font-black text-slate-900">
                                                    {row.area}
                                                </td>
                                                <td className="p-3 border-2 border-slate-900 text-slate-700">
                                                    {row.whatToReport}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-4 bg-sky-50 border-2 border-slate-900 space-y-2">
                                <span className="font-mono font-black text-xs uppercase text-slate-900">
                                    Phase 1 Evaluation Formulation
                                </span>
                                <p className="text-xs font-bold text-slate-700 leading-relaxed">
                                    In Phase 1, you must formulate your evaluation criteria in advance: outline which metrics (Precision, Recall, mAP@50, IoU, FPS, latency) you will measure during Phase 2, how you will partition train/val/test splits, and how you will measure real-world failure cases.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Content Section: Target Jetson Deployment */}
                {activeSectionTab === 'deployment' && (
                    <div className="bg-white border-3 border-slate-900 p-5 sm:p-6 space-y-5">
                        <div className="p-4 bg-amber-300 text-slate-900 border-2 border-slate-900 font-bold text-xs leading-relaxed">
                            <strong>Note on Development Hardware:</strong> You are NOT required to have physical access to an NVIDIA Jetson Orin NX or ZED 2i camera. You may develop, train, and test using whatever laptop, workstation, or cloud GPU (Google Colab/Kaggle) is available to you. Jetson Orin NX is the target deployment hardware for our vehicle.
                        </div>

                        <div>
                            <h4 className="font-black text-sm uppercase text-slate-900 font-mono tracking-wide mb-3">
                                Deployment Constraints to Consider (NVIDIA Jetson Orin NX)
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { title: 'Edge Hardware Profile', desc: '1024-core NVIDIA Ampere GPU with 32 Tensor Cores, ARM Cortex-A78AE CPU, up to 16GB unified LPDDR5 memory.' },
                                    { title: 'Model Optimization', desc: 'Investigate TensorRT conversion, ONNX export, FP16 half-precision, or INT8 quantization for real-time inference speedup.' },
                                    { title: 'Inference Latency & Budget', desc: 'Autonomous driving requires rapid reaction times. Your pipeline should maintain stable frame rates without unbounded CPU/GPU queue spikes.' },
                                    { title: 'Pipeline Integration', desc: 'How your perception output hooks into our ROS 2 Jazzy node graph (publishing bounding boxes or cone markers to vehicle controllers).' }
                                ].map((item, idx) => (
                                    <div key={idx} className="p-4 bg-slate-50 border-2 border-slate-900">
                                        <span className="font-mono font-black text-xs uppercase text-sky-700 block mb-1">
                                            {item.title}
                                        </span>
                                        <p className="text-xs font-bold text-slate-700 leading-relaxed">
                                            {item.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Content Section: Final Deliverables */}
                {activeSectionTab === 'deliverables' && (
                    <div className="bg-white border-3 border-slate-900 p-5 sm:p-6 space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h4 className="font-black text-base uppercase text-slate-900 font-mono tracking-wide">
                                    Phase {phase.phaseNumber} Required Deliverables
                                </h4>
                                <span className="font-mono text-xs font-bold text-rose-600">
                                    Deadline: {phase.deadline}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={handleCopyDeliverables}
                                className="press px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 font-mono font-black text-xs uppercase cursor-pointer"
                            >
                                {copiedDeliverables ? '✓ Copied to Clipboard!' : '📋 Copy Deliverables Checklist'}
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse border-2 border-slate-900">
                                <thead>
                                    <tr className="bg-slate-900 text-white font-mono text-xs uppercase">
                                        <th className="p-3 border-2 border-slate-900 w-1/4">Deliverable</th>
                                        <th className="p-3 border-2 border-slate-900 w-1/4">Format / Type</th>
                                        <th className="p-3 border-2 border-slate-900">Requirement &amp; Description</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs font-bold">
                                    {phase.deliverables.map((item, idx) => (
                                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-sky-50/50'}>
                                            <td className="p-3 border-2 border-slate-900 font-mono font-black text-slate-900">
                                                {item.name}
                                            </td>
                                            <td className="p-3 border-2 border-slate-900 font-mono text-sky-700">
                                                {item.format}
                                            </td>
                                            <td className="p-3 border-2 border-slate-900 text-slate-700">
                                                {item.description}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Phase 1 Submission Instructions & Drive Portal Notice */}
                        <div className="p-4 bg-sky-50 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] space-y-2.5">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-slate-900 text-sky-300 font-mono text-xs font-black uppercase">
                                    📁 SUBMISSION PROTOCOL
                                </span>
                                <span className="font-mono text-xs font-bold text-sky-800">
                                    Google Drive Link &amp; On-Site Portal
                                </span>
                            </div>
                            <ul className="space-y-1.5 text-xs font-bold text-slate-800 leading-relaxed">
                                <li className="flex items-start gap-2">
                                    <span className="text-sky-600 font-black mt-0.5">✦</span>
                                    <span>
                                        <strong>Google Drive Folder:</strong> All required documents (System Architecture Proposal PDF, calculations, block diagrams, code files) must be compiled inside a dedicated Google Drive folder for your duo.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-sky-600 font-black mt-0.5">✦</span>
                                    <span>
                                        <strong>Access Permissions:</strong> Ensure link access is set to <strong>&quot;Anyone with the link can view&quot;</strong> before submission so evaluators can inspect your work.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-sky-600 font-black mt-0.5">✦</span>
                                    <span>
                                        <strong>Website Submission Portal:</strong> Your Google Drive link must be submitted through the <strong>dedicated submission portal on this same website</strong>, which will be <strong>opened soon</strong> prior to the deadline.
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Content Section: Evaluation & Rubric */}
                {activeSectionTab === 'evaluation' && (
                    <div className="bg-white border-3 border-slate-900 p-5 sm:p-6 space-y-5">
                        <div>
                            <h4 className="font-black text-base uppercase text-slate-900 font-mono tracking-wide mb-1">
                                Evaluation Criteria — What We Are Looking For
                            </h4>
                            <p className="text-xs font-bold text-slate-600">
                                This challenge is not about how much you can do without assistance. It is about how you think, research, evaluate trade-offs, and engineer solutions.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {phase.evaluationFocus.map((focus, idx) => (
                                <div
                                    key={idx}
                                    className="p-4 bg-amber-50/70 border-2 border-slate-900 flex items-start gap-3"
                                >
                                    <span className="font-mono font-black text-lg text-amber-700">
                                        0{idx + 1}
                                    </span>
                                    <p className="text-xs font-bold text-slate-800 leading-relaxed pt-0.5">
                                        {focus}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Content Section: AI & Tools Policy */}
                {activeSectionTab === 'policy' && (
                    <div className="bg-white border-3 border-slate-900 p-5 sm:p-6 space-y-5">
                        <div className="p-5 bg-emerald-300 text-slate-900 border-3 border-slate-900 shadow-[5px_5px_0px_#0f172a]">
                            <span className="font-mono font-black text-xs uppercase tracking-widest block mb-1">
                                🤖 {data.generalGuidance.toolsAndAssistance.title}
                            </span>
                            <h4 className="text-lg font-black uppercase mb-2">
                                {data.generalGuidance.toolsAndAssistance.subtitle}
                            </h4>
                            <p className="text-sm font-bold leading-relaxed">
                                {data.generalGuidance.toolsAndAssistance.content}
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 border-2 border-slate-900 text-xs font-bold text-slate-700 space-y-2">
                            <span className="font-mono font-black text-[11px] uppercase text-slate-900 block">
                                Transparent Engineering
                            </span>
                            <p>
                                You are encouraged to use state-of-the-art tools, open-source models, and developer assistants. However, you are expected to deeply understand and defend every decision, equation, and code module you submit.
                            </p>
                        </div>
                    </div>
                )}

                {/* Action footer */}
                <div className="pt-4 border-t-3 border-slate-900 flex flex-wrap items-center justify-between gap-4 font-mono text-xs font-bold text-slate-700">
                    <div>
                        Phase {phase.phaseNumber} Deadline: <strong className="text-slate-900">{phase.deadline}</strong>
                    </div>
                    <div className="text-sky-700 font-black">
                        Submission portal will be opened soon on this website (Upload Google Drive link)
                    </div>
                </div>
            </div>
            )}
        </div>
    );
}
