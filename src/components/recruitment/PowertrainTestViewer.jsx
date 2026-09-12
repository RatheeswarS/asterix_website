import { useState } from 'react';
import { POWERTRAIN_CHALLENGE_DATA } from '../../data/recruitmentProblemStatements';

export default function PowertrainTestViewer() {
    const data = POWERTRAIN_CHALLENGE_DATA;
    const [activePsId, setActivePsId] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'technical', 'deliverables', 'rules'
    const [searchQuery, setSearchQuery] = useState('');
    const [isTeamListExpanded, setIsTeamListExpanded] = useState(false);
    const [copiedPs, setCopiedPs] = useState(false);

    const activeChallenge = activePsId ? data.challenges.find((c) => c.id === activePsId) : null;

    const filterTeams = (teams) => {
        if (!searchQuery.trim()) return teams;
        const q = searchQuery.toLowerCase().trim();
        return teams.filter(
            (t) =>
                t.group.toLowerCase().includes(q) ||
                t.members?.some(
                    (m) =>
                        m.name.toLowerCase().includes(q) ||
                        m.dept.toLowerCase().includes(q) ||
                        (m.rollNo && m.rollNo.toLowerCase().includes(q)) ||
                        (m.regNo && m.regNo.includes(q)) ||
                        (m.email && m.email.toLowerCase().includes(q)) ||
                        (m.phone && m.phone.includes(q))
                )
        );
    };

    const handleCopyChallenge = () => {
        if (!activeChallenge) return;
        const text = `Team Asterix — Powertrain Recruitment Challenge\nProblem Statement ${activeChallenge.number}: ${activeChallenge.title}\nDomain: ${activeChallenge.domain}\nDeadline: ${activeChallenge.deadlineLabel}\nMandatory Demo: ${activeChallenge.mandatoryDemo}\n\nContext:\n${activeChallenge.context}\n\nTask:\n${activeChallenge.task}`;
        navigator.clipboard?.writeText?.(text);
        setCopiedPs(true);
        setTimeout(() => setCopiedPs(false), 2000);
    };

    return (
        <div className="space-y-8">
            {/* Header Banner Card */}
            <div className="bg-slate-900 text-white border-4 border-slate-900 shadow-[8px_8px_0px_#0284c7] p-6 sm:p-8 relative overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <span className="px-3 py-1 bg-amber-300 text-slate-900 border-2 border-slate-900 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#0284c7]">
                        ⚡ {data.badge}
                    </span>
                    <span className="font-mono text-xs font-bold text-amber-300 bg-slate-800 px-3 py-1 border border-slate-700">
                        Written Test Phase Completed • Design &amp; Implementation Round Active
                    </span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-black uppercase text-white tracking-tight mb-3">
                    {data.headline}
                </h2>
                <p className="text-sm font-bold text-slate-300 max-w-3xl leading-relaxed mb-6">
                    {data.blurb}
                </p>

                {/* Subsystem Coordinators strip */}
                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                        <span className="text-slate-400 font-bold uppercase tracking-wider">Subsystem Leads:</span>
                        {data.coordinators.map((coord, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 border border-slate-700">
                                <span className="text-amber-400 font-black">{coord.name}</span>
                                <span className="text-slate-400">({coord.role})</span>
                                <a href={`tel:${coord.phone}`} className="text-sky-400 hover:underline font-bold ml-1">
                                    {coord.phone}
                                </a>
                            </div>
                        ))}
                    </div>

                    <a
                        href={data.rulebook.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="press inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-300 hover:bg-amber-400 text-slate-900 border-2 border-slate-900 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#0284c7] no-underline cursor-pointer"
                    >
                        <span>📖 Open aBAJA Rulebook (PDF)</span>
                        <span>↗</span>
                    </a>
                </div>
            </div>

            {/* Duo Team Allocation Notice Banner */}
            <div className="bg-amber-300 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-5 sm:p-6 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-slate-900 text-amber-300 font-mono text-xs font-black uppercase">
                                👥 {data.teamFormat.badge}
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-800">
                                Teams of 2 • {data.teamFormat.teams?.length || 16} Allocated Duos (32 Candidates)
                            </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black uppercase text-slate-900 tracking-tight">
                            {data.teamFormat.title}
                        </h3>
                        <p className="text-xs sm:text-sm font-bold text-slate-800 max-w-2xl leading-relaxed">
                            {data.teamFormat.desc}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <a
                            href={data.teamFormat.pdfUrl || '/recruitment/powertrain_teams.pdf'}
                            target="_blank"
                            rel="noopener noreferrer"
                            download="Asterix_Powertrain_Teams.pdf"
                            className="press inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white hover:bg-sky-600 border-2 border-slate-900 font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#0284c7] no-underline cursor-pointer"
                        >
                            <span>📄 Download Teams List (PDF)</span>
                            <span>↗</span>
                        </a>
                        <button
                            type="button"
                            onClick={() => setIsTeamListExpanded((prev) => !prev)}
                            className="press inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 border-2 border-slate-900 font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#0f172a] cursor-pointer"
                        >
                            <span>{isTeamListExpanded ? '▲ Hide Teams Roster' : `▼ View Teams Roster (${data.teamFormat.teams?.length || 16} Duos)`}</span>
                        </button>
                    </div>
                </div>

                {/* Expandable Searchable Team Roster */}
                {isTeamListExpanded && (
                    <div className="pt-4 border-t-2 border-slate-900/40 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <span className="font-mono text-xs font-black uppercase text-slate-900">
                                Allocated Duo Pairs ({data.teamFormat.teams?.length || 16} Groups • 32 Shortlisted Candidates)
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, roll, reg no, or dept..."
                                className="w-full sm:w-80 px-3 py-1.5 bg-white border-2 border-slate-900 font-mono text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-[2px_2px_0px_#0f172a]"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filterTeams(data.teamFormat.teams).map((grp) => (
                                <div key={grp.group} className="bg-white border-2 border-slate-900 p-3 shadow-[3px_3px_0px_#0f172a]">
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className="px-2 py-0.5 bg-sky-200 border border-slate-900 font-mono text-[10px] font-black uppercase">
                                            {grp.group}
                                        </span>
                                        <span className="font-mono text-[9px] font-black uppercase px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-300">
                                            DUO PAIR
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {grp.members?.map((m, idx) => (
                                            <div key={idx} className="flex items-start justify-between gap-2 text-xs border-b border-slate-100 last:border-b-0 pb-1.5 last:pb-0">
                                                <div>
                                                    <strong className="text-slate-900 block leading-tight">{m.name}</strong>
                                                    <span className="font-mono text-[10px] text-slate-500 uppercase">
                                                        {m.dept} • {m.year || 'II YEAR'} • {m.rollNo}
                                                    </span>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="font-mono text-[10px] font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 border border-sky-200 block">
                                                        {m.regNo || m.phone}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Problem Statement Switcher Cards */}
            <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-5 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <span className="px-3 py-1 bg-sky-300 text-slate-900 border-2 border-slate-900 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#0f172a]">
                        ⚡ CHOOSE 1 OF 3 CHALLENGES
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-600">
                        {activeChallenge ? 'Click another card to switch or re-click to close' : 'Click a card below to display its details'}
                    </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black uppercase text-slate-900 tracking-tight mb-2">
                    ELECTRICAL ENGINEERING PROBLEM STATEMENTS
                </h2>
                <p className="text-xs sm:text-sm font-bold text-slate-600 max-w-3xl mb-6 leading-relaxed">
                    Each team chooses exactly ONE problem statement. The prototype or simulation specified for your chosen problem statement is mandatory.
                </p>

                {/* 3 Challenge Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {data.challenges.map((c) => {
                        const isSelected = activeChallenge && c.id === activeChallenge.id;
                        return (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                    setActivePsId(activePsId === c.id ? null : c.id);
                                    setActiveTab('overview');
                                }}
                                className={`text-left p-4 sm:p-5 border-3 border-slate-900 cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                                    isSelected
                                        ? 'bg-slate-900 text-white shadow-[6px_6px_0px_#0284c7] -translate-y-1'
                                        : 'bg-white hover:bg-sky-50 text-slate-900 shadow-[3px_3px_0px_#0f172a]'
                                }`}
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span
                                            className={`font-mono text-[10px] font-black uppercase px-2 py-0.5 border ${
                                                isSelected
                                                    ? 'bg-amber-400 text-slate-900 border-slate-900'
                                                    : 'bg-slate-100 text-slate-800 border-slate-300'
                                            }`}
                                        >
                                            PROBLEM STATEMENT {c.number}
                                        </span>
                                        <span
                                            className={`px-1.5 py-0.5 text-[10px] font-mono font-black uppercase border ${
                                                c.deadlineDay === 'Wednesday'
                                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                                                    : 'bg-amber-100 text-amber-900 border-amber-400'
                                            }`}
                                        >
                                            DUE {c.deadlineDay.toUpperCase()}
                                        </span>
                                    </div>

                                    <h3 className="text-base sm:text-lg font-black uppercase tracking-tight leading-snug">
                                        {c.title}
                                    </h3>
                                    <p
                                        className={`text-xs font-bold mt-2 line-clamp-3 leading-relaxed ${
                                            isSelected ? 'text-slate-300' : 'text-slate-600'
                                        }`}
                                    >
                                        {c.tagline}
                                    </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-700/40">
                                    <div className="font-mono text-[10px] font-bold text-sky-400 mb-1">
                                        🎯 {c.badge}
                                    </div>
                                    <span className={`font-mono text-[11px] font-black ${isSelected ? 'text-amber-300' : 'text-sky-700'}`}>
                                        {isSelected ? '✓ Statement Selected (Details Displayed Below)' : '👉 Click to Open Full Brief & Specs ↓'}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Prompt when no statement is selected */}
            {!activeChallenge && (
                <div className="bg-slate-50 border-4 border-dashed border-slate-300 p-8 sm:p-10 text-center space-y-3 shadow-inner">
                    <div className="w-12 h-12 mx-auto rounded-full bg-amber-300 border-2 border-slate-900 flex items-center justify-center font-mono font-black text-xl text-slate-900 shadow-[3px_3px_0px_#0f172a]">
                        👆
                    </div>
                    <h3 className="text-base sm:text-lg font-black uppercase text-slate-800 tracking-tight font-mono">
                        Select Any Problem Statement Above to View Details
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-slate-500 max-w-xl mx-auto leading-relaxed">
                        Click on <strong>PS 01</strong> (Hardware Prototype), <strong>PS 02</strong> (Temperature Simulation), or <strong>PS 03</strong> (Ready-to-Drive) above to expand its problem brief, technical specifications, the 7 required deliverables, and evaluation rubric below.
                    </p>
                </div>
            )}

            {/* Active Challenge Detailed View */}
            {activeChallenge && (
                <div className="bg-sky-50 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-5 sm:p-7 space-y-6">
                    {/* Header & Deadline Banner */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-3 border-slate-900 pb-5">
                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-black uppercase px-2.5 py-0.5 bg-amber-300 text-slate-900 border-2 border-slate-900">
                                    STATEMENT {activeChallenge.number}
                                </span>
                                <span className="font-mono text-xs font-bold text-sky-800 bg-sky-100 px-2 py-0.5 border border-sky-300">
                                    {activeChallenge.domain}
                                </span>
                                <span className="font-mono text-xs font-black text-rose-800 bg-rose-100 px-2 py-0.5 border border-rose-300">
                                    ⏰ {activeChallenge.deadlineLabel}
                                </span>
                            </div>

                            <h3 className="text-2xl sm:text-3xl font-black uppercase text-slate-900 tracking-tight">
                                {activeChallenge.title}
                            </h3>
                            <p className="text-xs sm:text-sm font-bold text-slate-700 max-w-3xl">
                                <strong>Mandatory Demonstration:</strong> {activeChallenge.mandatoryDemo}
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <a
                                href={`#submit?track=powertrain&ps=${activeChallenge.id}`}
                                className="press inline-flex items-center gap-2 px-4 py-2 bg-amber-300 hover:bg-amber-400 text-slate-900 border-2 border-slate-900 font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#0f172a] no-underline cursor-pointer"
                            >
                                <span>🎯 Register / Lock In This PS</span>
                                <span>↗</span>
                            </a>
                            <button
                                type="button"
                                onClick={handleCopyChallenge}
                                className="press px-3 py-2 bg-white text-slate-900 hover:bg-slate-100 border-2 border-slate-900 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#0f172a] cursor-pointer"
                            >
                                {copiedPs ? '✓ Copied!' : '📋 Copy Brief'}
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex flex-wrap gap-2 border-b-2 border-slate-300 pb-2">
                        {[
                            { id: 'overview', label: '01. Overview & Tasks' },
                            { id: 'technical', label: '02. Technical Specs & Hardware/Simulation' },
                            { id: 'deliverables', label: '03. 7 Deliverables & Evaluation (100%)' },
                            { id: 'rules', label: '04. Rules & AI Policy' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 border-2 border-slate-900 font-mono text-xs font-black uppercase transition-all cursor-pointer ${
                                    activeTab === tab.id
                                        ? 'bg-slate-900 text-white shadow-[3px_3px_0px_#0284c7]'
                                        : 'bg-white hover:bg-slate-100 text-slate-800 shadow-[2px_2px_0px_#0f172a]'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab 1: Overview & Tasks */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Problem Context */}
                            <div className="bg-white border-3 border-slate-900 p-5 shadow-[4px_4px_0px_#0f172a] space-y-2">
                                <span className="font-mono text-xs font-black uppercase text-sky-700 block">
                                    // 1. Problem Context
                                </span>
                                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed">
                                    {activeChallenge.context}
                                </p>
                            </div>

                            {/* Your Task */}
                            <div className="bg-white border-3 border-slate-900 p-5 shadow-[4px_4px_0px_#0f172a] space-y-3">
                                <span className="font-mono text-xs font-black uppercase text-sky-700 block">
                                    // 2. Your Core Task
                                </span>
                                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed whitespace-pre-line">
                                    {activeChallenge.task}
                                </p>
                            </div>

                            {/* PS 01 specific: Questions to investigate & Innovation */}
                            {activeChallenge.id === 'ps1' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-white border-3 border-slate-900 p-5 shadow-[4px_4px_0px_#0f172a] space-y-3">
                                        <h4 className="font-black text-sm uppercase text-slate-900 font-mono">
                                            🔍 Questions You Should Investigate
                                        </h4>
                                        <ul className="space-y-2">
                                            {activeChallenge.questionsToInvestigate?.map((q, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-xs font-bold text-slate-800">
                                                    <span className="text-sky-600 font-mono font-black shrink-0">▸</span>
                                                    <span>{q}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="bg-amber-100 border-3 border-slate-900 p-5 shadow-[4px_4px_0px_#0f172a] space-y-3">
                                        <h4 className="font-black text-sm uppercase text-amber-950 font-mono">
                                            💡 Innovation Freedom
                                        </h4>
                                        <p className="text-xs font-bold text-slate-800 leading-relaxed">
                                            {activeChallenge.innovation}
                                        </p>
                                        <div className="p-3 bg-white border-2 border-slate-900 text-xs font-bold text-slate-700">
                                            <strong>Key Note:</strong> The three sensors do not need to be of the same type, and no combination is prescribed. Show us your engineering reasoning.
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* PS 02 specific: Key conditions & Test Scenarios */}
                            {activeChallenge.id === 'ps2' && (
                                <div className="space-y-6">
                                    <div className="bg-white border-3 border-slate-900 p-5 shadow-[4px_4px_0px_#0f172a] space-y-3">
                                        <h4 className="font-black text-sm uppercase text-slate-900 font-mono">
                                            ⚙️ Key Conditions You Must Account For
                                        </h4>
                                        <ul className="space-y-2">
                                            {activeChallenge.keyConditions?.map((cond, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-xs font-bold text-slate-800">
                                                    <span className="text-sky-600 font-mono font-black shrink-0">{idx + 1}.</span>
                                                    <span>{cond}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="bg-white border-3 border-slate-900 p-5 shadow-[4px_4px_0px_#0f172a] space-y-3">
                                        <h4 className="font-black text-sm uppercase text-slate-900 font-mono">
                                            📊 Mandatory Test Scenarios (4 Cases)
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {activeChallenge.testScenarios?.map((ts, idx) => (
                                                <div key={idx} className="p-3 bg-slate-50 border-2 border-slate-900 space-y-1 text-xs">
                                                    <strong className="text-slate-900 block font-mono uppercase">{ts.scenario}</strong>
                                                    <p className="text-slate-700 font-bold"><strong>Action:</strong> {ts.action}</p>
                                                    <p className="text-sky-800 font-bold"><strong>Observe:</strong> {ts.observe}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* PS 03 specific: Starting Sequence & Actions */}
                            {activeChallenge.id === 'ps3' && (
                                <div className="space-y-6">
                                    <div className="bg-white border-3 border-slate-900 p-5 shadow-[4px_4px_0px_#0f172a] space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="font-black text-sm uppercase text-slate-900 font-mono">
                                                🔒 Mandatory Starting Sequence (as per aBAJA SAEINDIA Rulebook)
                                            </h4>
                                            <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-amber-300 border border-slate-900">
                                                All 6 Required
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-700">
                                            The Tractive system shall be activated (AIR gets energized) only when:
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {activeChallenge.startingSequence?.map((seq, idx) => (
                                                <div key={idx} className="p-2.5 bg-slate-50 border-2 border-slate-900 text-xs font-bold text-slate-900 flex items-start gap-2">
                                                    <span className="font-mono font-black text-emerald-700">✓</span>
                                                    <span>{seq}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="bg-white border-3 border-slate-900 p-5 shadow-[4px_4px_0px_#0f172a] space-y-2">
                                            <h4 className="font-black text-sm uppercase text-slate-900 font-mono">
                                                ⚡ Actions Upon Activation
                                            </h4>
                                            <ul className="space-y-2">
                                                {activeChallenge.activatedActions?.map((act, idx) => (
                                                    <li key={idx} className="text-xs font-bold text-slate-800 flex items-start gap-2">
                                                        <span className="text-sky-600 font-mono font-black">▸</span>
                                                        <span>{act}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="bg-sky-100 border-3 border-slate-900 p-5 shadow-[4px_4px_0px_#0f172a] space-y-2 text-xs font-bold text-slate-800">
                                            <h4 className="font-black text-sm uppercase text-slate-900 font-mono">
                                                📖 Rulebook Terminology
                                            </h4>
                                            <p>{activeChallenge.terminology}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 2: Technical Specs & Hardware/Simulation */}
                    {activeTab === 'technical' && (
                        <div className="space-y-6">
                            {/* PS 01 Hardware Components Table */}
                            {activeChallenge.id === 'ps1' && (
                                <div className="space-y-4">
                                    <div className="bg-white border-3 border-slate-900 p-5 shadow-[4px_4px_0px_#0f172a] space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <h4 className="font-black text-base uppercase text-slate-900 font-mono">
                                                🛠️ Hardware Components Required
                                            </h4>
                                            <span className="font-mono text-xs font-bold text-slate-500">
                                                {activeChallenge.borrowNotice}
                                            </span>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse text-xs">
                                                <thead>
                                                    <tr className="bg-slate-900 text-white font-mono">
                                                        <th className="p-2.5 border border-slate-900">Component</th>
                                                        <th className="p-2.5 border border-slate-900 w-24">Qty</th>
                                                        <th className="p-2.5 border border-slate-900">Notes / Details</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {activeChallenge.hardwareComponents?.map((comp, idx) => (
                                                        <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 font-bold">
                                                            <td className="p-2.5 border border-slate-300 text-slate-900">{comp.component}</td>
                                                            <td className="p-2.5 border border-slate-300 font-mono text-sky-700">{comp.qty}</td>
                                                            <td className="p-2.5 border border-slate-300 text-slate-700">{comp.notes}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Demonstration Requirements */}
                                    <div className="bg-white border-3 border-slate-900 p-5 shadow-[4px_4px_0px_#0f172a] space-y-3">
                                        <h4 className="font-black text-sm uppercase text-slate-900 font-mono">
                                            🎯 Your Live Demonstration Must Show
                                        </h4>
                                        <ul className="space-y-2">
                                            {activeChallenge.demonstrationMustShow?.map((item, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-xs font-bold text-slate-800">
                                                    <span className="text-emerald-600 font-mono font-black">✓</span>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* PS 02 Simulation Specs & Baseline */}
                            {activeChallenge.id === 'ps2' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="bg-white border-3 border-slate-900 p-5 shadow-[4px_4px_0px_#0f172a] space-y-3">
                                            <h4 className="font-black text-sm uppercase text-slate-900 font-mono">
                                                💻 Simulation Tools &amp; Deliverable Requirements
                                            </h4>
                                            <div className="space-y-2 text-xs font-bold text-slate-800">
                                                <p><strong>Recommended Tool:</strong> {activeChallenge.simulationSpecs?.recommended}</p>
                                                <p><strong>Accepted Alternatives:</strong> {activeChallenge.simulationSpecs?.alternatives}</p>
                                                <p><strong>Must Include:</strong> {activeChallenge.simulationSpecs?.mustInclude}</p>
                                            </div>
                                        </div>

                                        <div className="bg-white border-3 border-slate-900 p-5 shadow-[4px_4px_0px_#0f172a] space-y-3">
                                            <h4 className="font-black text-sm uppercase text-slate-900 font-mono">
                                                📉 Baseline On/Off Controller Comparison
                                            </h4>
                                            <p className="text-xs font-bold text-slate-800 leading-relaxed">
                                                {activeChallenge.baselineComparison}
                                            </p>
                                        </div>
                                    </div>

                                    {/* PID Note & Metrics */}
                                    <div className="bg-amber-50 border-3 border-slate-900 p-5 shadow-[4px_4px_0px_#0f172a] space-y-2">
                                        <h4 className="font-black text-sm uppercase text-slate-900 font-mono">
                                            ❓ Is PID Required?
                                        </h4>
                                        <p className="text-xs font-bold text-slate-800 leading-relaxed">
                                            {activeChallenge.pidExplanation}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* PS 03 Electrical Interface & 12V Supply */}
                            {activeChallenge.id === 'ps3' && (
                                <div className="space-y-6">
                                    <div className="bg-white border-3 border-slate-900 p-5 shadow-[4px_4px_0px_#0f172a] space-y-3">
                                        <h4 className="font-black text-sm uppercase text-slate-900 font-mono">
                                            🔌 {activeChallenge.electricalInterface?.title}
                                        </h4>
                                        <p className="text-xs font-bold text-slate-700 leading-relaxed">
                                            {activeChallenge.electricalInterface?.desc}
                                        </p>
                                        <div className="space-y-1.5 pt-2">
                                            {activeChallenge.electricalInterface?.addressPoints?.map((pt, idx) => (
                                                <div key={idx} className="flex items-start gap-2 text-xs font-bold text-slate-800">
                                                    <span className="text-sky-600 font-mono font-black shrink-0">▸</span>
                                                    <span>{pt}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="bg-white border-3 border-slate-900 p-5 shadow-[4px_4px_0px_#0f172a] space-y-3">
                                            <h4 className="font-black text-sm uppercase text-slate-900 font-mono">
                                                🔋 {activeChallenge.supplyRequirement?.title}
                                            </h4>
                                            <p className="text-xs font-bold text-slate-700 leading-relaxed">
                                                {activeChallenge.supplyRequirement?.desc}
                                            </p>
                                            <div className="p-3 bg-slate-50 border-2 border-slate-900 text-xs font-bold text-slate-800 space-y-1">
                                                <strong className="block text-sky-800 font-mono">Simulation:</strong>
                                                <p>{activeChallenge.supplyRequirement?.simDetails}</p>
                                            </div>
                                            <div className="p-3 bg-rose-50 border-2 border-rose-300 text-xs font-bold text-rose-900 space-y-1">
                                                <strong className="block font-mono">Hardware (if built):</strong>
                                                <p>{activeChallenge.supplyRequirement?.hardwareDetails}</p>
                                            </div>
                                        </div>

                                        <div className="bg-white border-3 border-slate-900 p-5 shadow-[4px_4px_0px_#0f172a] space-y-3">
                                            <h4 className="font-black text-sm uppercase text-slate-900 font-mono">
                                                🖥️ Two-Part Simulation Requirement
                                            </h4>
                                            <div className="space-y-3">
                                                {activeChallenge.simulationParts?.map((sp, idx) => (
                                                    <div key={idx} className="p-3 bg-slate-50 border-2 border-slate-900 text-xs font-bold">
                                                        <div className="flex items-center justify-between gap-2 mb-1">
                                                            <strong className="text-slate-900 font-mono uppercase">{sp.part}</strong>
                                                            <span className="px-2 py-0.5 bg-slate-900 text-white font-mono text-[10px]">{sp.tool}</span>
                                                        </div>
                                                        <p className="text-slate-700">{sp.whatItMustShow}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Common Failsafe Guidelines */}
                            <div className="bg-amber-100 border-3 border-slate-900 p-5 shadow-[4px_4px_0px_#0f172a] space-y-2">
                                <h4 className="font-black text-sm uppercase text-amber-950 font-mono">
                                    🛡️ Failsafe Verification Requirement
                                </h4>
                                <p className="text-xs font-bold text-slate-800 leading-relaxed">
                                    {activeChallenge.failsafeVerification}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: 7 Deliverables & Evaluation */}
                    {activeTab === 'deliverables' && (
                        <div className="space-y-6">
                            <div className="bg-white border-3 border-slate-900 p-5 shadow-[4px_4px_0px_#0f172a] space-y-4">
                                <div>
                                    <span className="font-mono text-xs font-black uppercase text-sky-700 block mb-1">
                                        EVALUATION CRITERIA &amp; BREAKDOWN
                                    </span>
                                    <h4 className="font-black text-xl uppercase text-slate-900">
                                        7 Mandatory Deliverables (100% Total)
                                    </h4>
                                    <p className="text-xs font-bold text-slate-600 mt-1">
                                        All teams, regardless of the problem statement chosen, must provide the following seven deliverables.
                                    </p>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-slate-900 text-white font-mono">
                                                <th className="p-2.5 border border-slate-900 w-12 text-center">No.</th>
                                                <th className="p-2.5 border border-slate-900 w-44">Deliverable</th>
                                                <th className="p-2.5 border border-slate-900">What It Should Contain</th>
                                                <th className="p-2.5 border border-slate-900 w-24 text-center">Weightage</th>
                                                <th className="p-2.5 border border-slate-900 w-48">Submission Mode</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.deliverablesTable?.map((d, idx) => (
                                                <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 font-bold">
                                                    <td className="p-2.5 border border-slate-300 font-mono text-center text-slate-500">{d.no}</td>
                                                    <td className="p-2.5 border border-slate-300 text-slate-900 font-black">{d.deliverable}</td>
                                                    <td className="p-2.5 border border-slate-300 text-slate-700">{d.whatItShouldContain}</td>
                                                    <td className="p-2.5 border border-slate-300 font-mono text-center text-rose-700 bg-rose-50/60 font-black">{d.weightage}</td>
                                                    <td className="p-2.5 border border-slate-300 font-mono text-[11px] text-slate-600">{d.submissionMode}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-slate-100 font-mono font-black">
                                                <td colSpan={3} className="p-2.5 border border-slate-300 text-right uppercase text-slate-900">
                                                    Total Evaluation Score:
                                                </td>
                                                <td className="p-2.5 border border-slate-300 text-center text-emerald-700 bg-emerald-100">
                                                    100%
                                                </td>
                                                <td className="p-2.5 border border-slate-300 text-slate-500 text-[10px]">
                                                    Final Crew Selection
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Submission Guidelines card */}
                            <div className="bg-amber-300 border-3 border-slate-900 p-5 shadow-[4px_4px_0px_#0f172a] space-y-2">
                                <h4 className="font-black text-sm uppercase text-slate-900 font-mono">
                                    🚀 Technical Presentation Submission Protocol
                                </h4>
                                <ul className="space-y-1.5 text-xs font-bold text-slate-900">
                                    <li>• Only the <strong>Technical Presentation (PPT / PDF)</strong> is uploaded on the website.</li>
                                    <li>• Deliverables 2 to 6 (System Architecture, Circuit Diagram, Comparison, Testing Plan, Failsafes) must be included <strong>inside</strong> the presentation slides.</li>
                                    <li>• Deliverable 7 (Prototype / Simulation Demonstration) is <strong>demonstrated LIVE</strong> during the evaluation round. Bring your hardware or simulation files ready to run.</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Tab 4: Rules & AI Policy */}
                    {activeTab === 'rules' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* What We Look For */}
                                <div className="bg-emerald-50 border-3 border-emerald-600 p-5 shadow-[4px_4px_0px_#0f172a] space-y-3">
                                    <h4 className="font-black text-sm uppercase text-emerald-950 font-mono">
                                        ✨ What We Look For (Strong Submission)
                                    </h4>
                                    <ul className="space-y-2">
                                        {data.whatWeLookFor?.map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-xs font-bold text-emerald-950">
                                                <span className="text-emerald-700 font-mono font-black shrink-0">✓</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* What We Do Not Reward */}
                                <div className="bg-rose-50 border-3 border-rose-600 p-5 shadow-[4px_4px_0px_#0f172a] space-y-3">
                                    <h4 className="font-black text-sm uppercase text-rose-950 font-mono">
                                        ✕ What We Do NOT Reward
                                    </h4>
                                    <ul className="space-y-2">
                                        {data.whatWeDoNotReward?.map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-xs font-bold text-rose-950">
                                                <span className="text-rose-600 font-mono font-black shrink-0">✕</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* AI Assistance Policy */}
                            <div className="bg-white border-3 border-slate-900 p-5 shadow-[4px_4px_0px_#0f172a] space-y-2">
                                <h4 className="font-black text-sm uppercase text-slate-900 font-mono">
                                    🤖 Tools &amp; AI Assistance Policy
                                </h4>
                                <p className="text-xs font-bold text-slate-700 leading-relaxed">
                                    You are completely free to use any tools, technologies and resources available to you. AI assistants such as ChatGPT, Claude, Gemini and GitHub Copilot are explicitly allowed, along with search engines, research papers, datasheets, tutorials and simulation tools. You may use AI to learn concepts, generate or review code, troubleshoot errors, compare components, or explore alternatives. What matters is your engineering reasoning and your ability to explain every decision in your own words.
                                </p>
                            </div>

                            {/* General Rules List */}
                            <div className="bg-white border-3 border-slate-900 p-5 shadow-[4px_4px_0px_#0f172a] space-y-3">
                                <h4 className="font-black text-sm uppercase text-slate-900 font-mono">
                                    📜 Official Rules &amp; Regulations
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {data.generalRules?.map((rule, idx) => (
                                        <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 flex items-start gap-2">
                                            <span className="font-mono text-[10px] text-sky-600 font-black">{idx + 1}.</span>
                                            <span>{rule}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bottom CTA Bar */}
                    <div className="p-4 bg-slate-900 text-white border-3 border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[4px_4px_0px_#0284c7]">
                        <div className="space-y-0.5 text-center sm:text-left">
                            <span className="font-mono text-xs font-black uppercase text-amber-300">
                                Ready to Submit Your Team&apos;s Chosen Statement?
                            </span>
                            <p className="text-xs font-bold text-slate-300">
                                Register your team&apos;s choice on the portal before starting development.
                            </p>
                        </div>

                        <a
                            href={`#submit?track=powertrain&ps=${activeChallenge.id}`}
                            className="press inline-flex items-center gap-2 px-5 py-2.5 bg-amber-300 hover:bg-amber-400 text-slate-900 border-2 border-slate-900 font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#000] no-underline cursor-pointer shrink-0"
                        >
                            <span>🎯 Choose PS 0{activeChallenge.number} in Submission Portal</span>
                            <span>↗</span>
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
