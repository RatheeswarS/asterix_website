import { useState } from 'react';
import { MECHANICAL_MYSTERY_DATA } from '../../data/recruitmentProblemStatements';

export default function MechanicalMysteryViewer() {
    const data = MECHANICAL_MYSTERY_DATA;
    const [activePsId, setActivePsId] = useState(data.challenges[0].id);
    const [searchQuery, setSearchQuery] = useState('');
    const [isTeamListExpanded, setIsTeamListExpanded] = useState(false);
    const [copiedPs, setCopiedPs] = useState(false);

    const activePs = data.challenges.find((c) => c.id === activePsId) || data.challenges[0];

    const filterTeams = (teams) => {
        if (!searchQuery.trim()) return teams;
        const q = searchQuery.toLowerCase().trim();
        return teams.filter(
            (t) =>
                t.group.toLowerCase().includes(q) ||
                t.member1.toLowerCase().includes(q) ||
                t.member2.toLowerCase().includes(q)
        );
    };

    const handleCopyPs = () => {
        const text = `Asterix Autonomous Vehicle — Mechanical Presentation\n${activePs.title}\n\n` +
            activePs.parts.map((p) => `${p.partLabel}\nTarget: ${p.target}\nRequirements:\n` + p.checklist.map((c, i) => `  ${i + 1}. ${c}`).join('\n')).join('\n\n');
        navigator.clipboard?.writeText?.(text);
        setCopiedPs(true);
        setTimeout(() => setCopiedPs(false), 2000);
    };

    return (
        <div className="space-y-8">
            {/* Header Card */}
            <div className="bg-slate-900 text-white border-4 border-slate-900 shadow-[8px_8px_0px_#0284c7] p-6 sm:p-8 relative overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <span className="px-3 py-1 bg-amber-300 text-slate-900 border-2 border-slate-900 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#0284c7]">
                        ⚡ {data.badge}
                    </span>
                    <span className="font-mono text-xs font-bold text-sky-400">
                        SAE eBAJA Autonomous Buggy Conversion
                    </span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-black uppercase text-white tracking-tight mb-3">
                    {data.headline}
                </h2>
                <p className="text-sm font-bold text-slate-300 max-w-3xl leading-relaxed">
                    {data.blurb}
                </p>
            </div>

            {/* Duo Team Allocation Notice & PDF Download Banner */}
            <div className="bg-amber-300 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-5 sm:p-6 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-slate-900 text-amber-300 font-mono text-xs font-black uppercase">
                                👥 {data.teamFormat.badge}
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-800">
                                11 Allocated Pairs
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
                            href={data.teamFormat.guidelinesPdfUrl || '/recruitment/mechanical_presentation_guidelines.pdf'}
                            target="_blank"
                            rel="noopener noreferrer"
                            download="Mechanical_Presentation_Guidelines.pdf"
                            className="press inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white hover:bg-sky-600 border-2 border-slate-900 font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#0284c7] no-underline cursor-pointer"
                        >
                            <span>📄 Presentation Guidelines (PDF)</span>
                            <span>↗</span>
                        </a>
                        <a
                            href={data.teamFormat.pdfUrl || '/recruitment/mechanical_teams.pdf'}
                            target="_blank"
                            rel="noopener noreferrer"
                            download="Mechanical_Teams_List.pdf"
                            className="press inline-flex items-center gap-2 px-4 py-2.5 bg-sky-400 text-slate-900 hover:bg-sky-500 border-2 border-slate-900 font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#0f172a] no-underline cursor-pointer"
                        >
                            <span>👥 Download Teams List (PDF)</span>
                            <span>↗</span>
                        </a>
                        <button
                            type="button"
                            onClick={() => setIsTeamListExpanded((prev) => !prev)}
                            className="press inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 border-2 border-slate-900 font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#0f172a] cursor-pointer"
                        >
                            <span>{isTeamListExpanded ? '▲ Hide Teams Roster' : '▼ View Teams Roster (11 Duos)'}</span>
                        </button>
                    </div>
                </div>

                {/* Expandable Searchable Team Roster */}
                {isTeamListExpanded && (
                    <div className="pt-4 border-t-2 border-slate-900/40 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <span className="font-mono text-xs font-black uppercase text-slate-900">
                                Allocated Duo Teams (11 Groups)
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search candidate name or team..."
                                className="w-full sm:w-72 px-3 py-1.5 bg-white border-2 border-slate-900 font-mono text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-[2px_2px_0px_#0f172a]"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filterTeams(data.teamFormat.teams).map((grp) => (
                                <div key={grp.group} className="bg-white border-2 border-slate-900 p-3.5 shadow-[3px_3px_0px_#0f172a]">
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className="px-2 py-0.5 bg-amber-200 border border-slate-900 font-mono text-[11px] font-black uppercase">
                                            {grp.group}
                                        </span>
                                        <span className="font-mono text-[10px] font-bold text-slate-500">
                                            DUO PAIR
                                        </span>
                                    </div>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-slate-400 font-mono">1.</span>
                                            <strong className="text-slate-900 uppercase font-black">{grp.member1}</strong>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-slate-400 font-mono">2.</span>
                                            <strong className="text-slate-900 uppercase font-black">{grp.member2}</strong>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* General Instructions Card */}
            <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-5 sm:p-7 space-y-5">
                <div className="flex items-center justify-between gap-2 border-b-2 border-slate-200 pb-3">
                    <div>
                        <span className="font-mono text-xs font-black uppercase text-sky-600 block mb-0.5">
                            ROUND 1 PRESENTATION REQUIREMENTS
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black uppercase text-slate-900">
                            General Instructions for Participants
                        </h3>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-500 hidden sm:inline">
                        5 Core Directives
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.generalInstructions.map((inst) => (
                        <div
                            key={inst.num}
                            className="p-4 bg-slate-50 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a]"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-black">
                                    {inst.num}
                                </span>
                                <h4 className="font-mono font-black text-xs uppercase text-slate-900">
                                    {inst.title}
                                </h4>
                            </div>
                            <ul className="space-y-1.5 text-xs font-bold text-slate-700">
                                {inst.points.map((pt, idx) => (
                                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                                        <span className="text-sky-600 font-black mt-0.5">✦</span>
                                        <span>{pt}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Problem Statements Navigation Pills */}
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-black uppercase tracking-widest text-slate-600">
                        SELECT PROBLEM STATEMENT
                    </span>
                    <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 border border-sky-300">
                        Part A (BBW) + Part B (SBW)
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.challenges.map((ps) => {
                        const isActive = ps.id === activePs.id;
                        return (
                            <button
                                key={ps.id}
                                type="button"
                                onClick={() => setActivePsId(ps.id)}
                                className={`text-left p-5 border-3 border-slate-900 cursor-pointer transition-all duration-150 relative ${
                                    isActive
                                        ? 'bg-slate-900 text-white shadow-[6px_6px_0px_#0284c7] -translate-y-0.5'
                                        : 'bg-white hover:bg-slate-100 text-slate-900 shadow-[3px_3px_0px_#0f172a]'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span
                                        className={`font-mono text-[11px] font-black uppercase px-2 py-0.5 border ${
                                            isActive
                                                ? 'bg-amber-300 text-slate-900 border-amber-300'
                                                : 'bg-slate-100 text-slate-700 border-slate-300'
                                        }`}
                                    >
                                        PROBLEM STATEMENT {ps.number}
                                    </span>
                                    <span className={`font-mono text-[11px] font-bold ${isActive ? 'text-sky-300' : 'text-slate-500'}`}>
                                        BBW &amp; SBW
                                    </span>
                                </div>

                                <h3 className="text-xl font-black uppercase tracking-tight leading-snug">
                                    {ps.title}
                                </h3>
                                <p className={`text-xs font-bold mt-2 leading-relaxed ${isActive ? 'text-slate-300' : 'text-slate-600'}`}>
                                    {ps.tagline}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Active Problem Statement Detail Viewer */}
            <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-5 sm:p-7 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-3 border-slate-900 pb-4">
                    <div>
                        <span className="font-mono text-xs font-black uppercase text-amber-600 block mb-1">
                            DETAILED SPECIFICATIONS // {activePs.number}
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-black uppercase text-slate-900 tracking-tight">
                            {activePs.title}
                        </h3>
                    </div>

                    <button
                        type="button"
                        onClick={handleCopyPs}
                        className="press inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 border-2 border-slate-900 font-mono text-xs font-black uppercase cursor-pointer self-start sm:self-auto"
                    >
                        <span>{copiedPs ? '✓ Copied Brief' : '📋 Copy Requirements'}</span>
                    </button>
                </div>

                {/* The Two Parts: Part A (BBW) & Part B (SBW) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {activePs.parts.map((part, idx) => (
                        <div
                            key={idx}
                            className="bg-slate-50 border-3 border-slate-900 p-5 shadow-[4px_4px_0px_#0f172a] space-y-4"
                        >
                            <div className="flex items-center justify-between gap-2 border-b-2 border-slate-200 pb-2">
                                <h4 className="text-lg font-black uppercase text-slate-900 tracking-tight">
                                    {part.partLabel}
                                </h4>
                                <span className="px-2 py-0.5 bg-sky-200 text-slate-900 border border-slate-900 font-mono text-[10px] font-black uppercase">
                                    {idx === 0 ? 'BRAKING' : 'STEERING'}
                                </span>
                            </div>

                            <div className="p-3 bg-white border-2 border-slate-900 text-xs font-bold text-slate-800 leading-relaxed">
                                <strong className="text-slate-900 block font-mono text-[11px] uppercase mb-1">
                                    Engineering Objective:
                                </strong>
                                {part.target}
                            </div>

                            <div className="space-y-2">
                                <span className="font-mono text-xs font-black uppercase tracking-wider text-slate-700 block">
                                    Deliverables &amp; Design Checklist:
                                </span>
                                <ul className="space-y-2 text-xs font-bold text-slate-700">
                                    {part.checklist.map((item, cIdx) => (
                                        <li
                                            key={cIdx}
                                            className="p-2.5 bg-white border border-slate-300 flex items-start gap-2.5"
                                        >
                                            <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-mono text-[10px] font-black shrink-0 mt-0.5">
                                                {cIdx + 1}
                                            </span>
                                            <span className="leading-relaxed">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Phase 1 Submission Protocol & Drive Portal Notice */}
                <div className="mt-6 p-5 bg-sky-50 border-3 border-slate-900 shadow-[4px_4px_0px_#0f172a] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-slate-900 text-sky-300 font-mono text-xs font-black uppercase">
                                📁 ROUND 1 / PHASE 1 SUBMISSION PROTOCOL
                            </span>
                            <span className="font-mono text-xs font-bold text-sky-800">
                                Google Drive &amp; Website Portal
                            </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-rose-600">
                            Deadline: 16 September 2026, 11:59 PM IST
                        </span>
                    </div>

                    <h4 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-tight">
                        Required Documents &amp; Submission Workflow
                    </h4>

                    <ul className="space-y-2 text-xs font-bold text-slate-800 leading-relaxed">
                        <li className="flex items-start gap-2">
                            <span className="text-sky-600 font-black mt-0.5">✦</span>
                            <span>
                                <strong>Google Drive Folder:</strong> Each of the required presentation slides, engineering calculation sheets, CAD / simulation files, and mechanism block diagrams must be organized inside a single Google Drive folder created by your team.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-sky-600 font-black mt-0.5">✦</span>
                            <span>
                                <strong>Link Permissions:</strong> Set the folder sharing access to <strong>&quot;Anyone with the link can view&quot;</strong> so the faculty and lead evaluators can access your submission seamlessly.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-sky-600 font-black mt-0.5">✦</span>
                            <span>
                                <strong>On-Site Submission Portal:</strong> Your Google Drive folder link must be submitted directly through a dedicated portal hosted right here on this website. <strong>The submission portal will be opened soon</strong> prior to the deadline.
                            </span>
                        </li>
                    </ul>

                    <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] font-mono font-bold text-slate-600 gap-2">
                        <span>Portal Status: <strong className="text-amber-700 uppercase">Opening Soon on this Website</strong></span>
                        <span>Prepare your presentation slides &amp; Google Drive link in advance</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
