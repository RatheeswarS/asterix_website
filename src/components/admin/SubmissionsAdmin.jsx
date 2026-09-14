import { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import { apiUrl } from '../../lib/api';
import {
    SOFTWARE_PERCEPTION_DATA,
    MECHANICAL_MYSTERY_DATA,
    POWERTRAIN_CHALLENGE_DATA
} from '../../data/recruitmentProblemStatements';

import { AUTH_TOKEN_KEY } from '../../context/WebsiteDataContext';

export default function SubmissionsAdmin({ showStatus }) {
    const [submissions, setSubmissions] = useState([]);
    const [groupedTeams, setGroupedTeams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterSubsystem, setFilterSubsystem] = useState('all');
    const [filterPhase, setFilterPhase] = useState('all'); // 'all', 'phase1', 'phase2'
    const [filterCohort, setFilterCohort] = useState('all'); // 'all', 'II Year', 'III Year'
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedGroupKey, setExpandedGroupKey] = useState(null);
    const [viewMode, setViewMode] = useState('submissions'); // 'submissions', 'phase2-matrix', or 'missing'

    const fetchSubmissions = useCallback(async (isSilent = false) => {
        if (!isSilent) setIsLoading(true);
        try {
            const token = sessionStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem('admin_token');
            const res = await fetch(apiUrl('/api/submissions'), {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!res.ok) {
                throw new Error('Failed to fetch submissions');
            }
            const data = await res.json();
            setSubmissions(data.submissions || []);
            setGroupedTeams(data.groupedTeams || []);
        } catch (err) {
            console.error('Error loading submissions:', err);
            if (!isSilent && showStatus) showStatus('Failed to load submissions: ' + err.message);
        } finally {
            if (!isSilent) setIsLoading(false);
        }
    }, [showStatus]);

    useEffect(() => {
        let isMounted = true;
        fetchSubmissions(false);

        // Periodic background silent refresh every 10s without flickering the table
        const timer = setInterval(() => {
            if (isMounted) fetchSubmissions(true);
        }, 10000);

        return () => {
            isMounted = false;
            clearInterval(timer);
        };
    }, [fetchSubmissions]);

    // Map full history per team (differentiating subsystem, cohort, phase, and group)
    const groupHistoryMap = useMemo(() => {
        const map = {};
        submissions.forEach((s) => {
            const cohortKey = (s.cohort || 'General').toLowerCase().trim();
            const phaseKey = (s.phase || 'phase1').toLowerCase().trim();
            const k = `${s.subsystem.toLowerCase().trim()}:::${phaseKey}:::${cohortKey}:::${s.group.toLowerCase().trim()}`;
            if (!map[k]) map[k] = [];
            map[k].push(s);
        });
        return map;
    }, [submissions]);

    // Distinct list of ONLY the latest submission per team per phase
    const latestSubmissions = useMemo(() => {
        const seen = new Set();
        const latestList = [];

        submissions.forEach((s) => {
            const cohortKey = (s.cohort || 'General').toLowerCase().trim();
            const phaseKey = (s.phase || 'phase1').toLowerCase().trim();
            const k = `${s.subsystem.toLowerCase().trim()}:::${phaseKey}:::${cohortKey}:::${s.group.toLowerCase().trim()}`;
            if (!seen.has(k)) {
                seen.add(k);
                latestList.push(s);
            }
        });

        return latestList;
    }, [submissions]);

    // Build canonical rosters to check for missing groups
    const canonicalRoster = useMemo(() => {
        const list = [];
        // Software II Year
        SOFTWARE_PERCEPTION_DATA.teamFormat?.teamsIIYear?.forEach((t) => {
            list.push({
                subsystem: 'software',
                cohort: 'II Year',
                group: t.group,
                members: t.members
            });
        });
        // Software III Year
        SOFTWARE_PERCEPTION_DATA.teamFormat?.teamsIIIYear?.forEach((t) => {
            list.push({
                subsystem: 'software',
                cohort: 'III Year',
                group: t.group,
                members: t.members
            });
        });
        // Mechanical
        MECHANICAL_MYSTERY_DATA.teamFormat?.teams?.forEach((t) => {
            list.push({
                subsystem: 'mechanical',
                cohort: 'General',
                group: t.group,
                members: t.members
            });
        });
        // Powertrain
        POWERTRAIN_CHALLENGE_DATA.teamFormat?.teams?.forEach((t) => {
            list.push({
                subsystem: 'powertrain',
                cohort: 'General',
                group: t.group,
                members: t.members
            });
        });
        return list;
    }, []);

    // Filter only the latest submissions
    const filteredSubmissions = useMemo(() => {
        return latestSubmissions.filter((sub) => {
            if (filterSubsystem !== 'all' && sub.subsystem !== filterSubsystem) return false;
            
            const subPhase = (sub.phase || 'phase1').toLowerCase().trim();
            if (filterPhase === 'phase1' && !subPhase.includes('phase1') && !subPhase.includes('phase 1')) return false;
            if (filterPhase === 'phase2' && !subPhase.includes('phase2') && !subPhase.includes('phase 2') && !subPhase.includes('round 2')) return false;

            if (filterCohort !== 'all' && sub.cohort !== filterCohort) return false;

            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase().trim();
            return (
                sub.group.toLowerCase().includes(q) ||
                (sub.cohort && sub.cohort.toLowerCase().includes(q)) ||
                sub.submitterName.toLowerCase().includes(q) ||
                sub.submitterPhone.includes(q) ||
                (sub.problemStatement && sub.problemStatement.toLowerCase().includes(q)) ||
                (sub.partnerName && sub.partnerName.toLowerCase().includes(q)) ||
                (sub.githubUrl && sub.githubUrl.toLowerCase().includes(q)) ||
                sub.driveUrl.toLowerCase().includes(q) ||
                (sub.notes && sub.notes.toLowerCase().includes(q))
            );
        });
    }, [latestSubmissions, filterSubsystem, filterPhase, filterCohort, searchQuery]);

    // Build Software Phase 2 Matrix: Map all Software Phase 1 teams to their Phase 2 status
    const softwarePhase2Matrix = useMemo(() => {
        // Collect all Software Phase 1 submissions
        const p1Submissions = submissions.filter(
            (s) => s.subsystem === 'software' && (s.phase || 'phase1').toLowerCase().includes('phase1')
        );

        // Collect all Software Phase 2 submissions
        const p2Submissions = submissions.filter(
            (s) => s.subsystem === 'software' && (s.phase || '').toLowerCase().includes('phase2')
        );

        // Map latest P2 per group
        const latestP2Map = {};
        p2Submissions.forEach((s) => {
            const k = `${(s.cohort || 'II Year').toLowerCase().trim()}:::${s.group.toLowerCase().trim()}`;
            if (!latestP2Map[k]) {
                latestP2Map[k] = s;
            }
        });

        // Unique Phase 1 teams
        const seenP1 = new Set();
        const matrixList = [];

        p1Submissions.forEach((p1) => {
            const cohort = p1.cohort || 'II Year';
            const k = `${cohort.toLowerCase().trim()}:::${p1.group.toLowerCase().trim()}`;
            if (!seenP1.has(k)) {
                seenP1.add(k);

                // Find roster members if available
                const rosterList = cohort === 'III Year'
                    ? SOFTWARE_PERCEPTION_DATA.teamFormat?.teamsIIIYear
                    : SOFTWARE_PERCEPTION_DATA.teamFormat?.teamsIIYear;
                const rosterMatch = rosterList?.find((t) => t.group === p1.group);

                const p2 = latestP2Map[k] || null;

                matrixList.push({
                    key: k,
                    group: p1.group,
                    cohort,
                    members: rosterMatch?.members || [
                        { name: p1.submitterName, phone: p1.submitterPhone, dept: 'Software' },
                        { name: p1.partnerName || 'Partner', phone: '', dept: p1.partnerDept || '' }
                    ],
                    p1Submission: p1,
                    p2Submission: p2,
                    isPhase2Submitted: Boolean(p2)
                });
            }
        });

        return matrixList.sort((a, b) => {
            if (a.isPhase2Submitted === b.isPhase2Submitted) {
                return a.group.localeCompare(b.group);
            }
            return a.isPhase2Submitted ? -1 : 1; // Submitted first
        });
    }, [submissions]);

    // Find missing groups that haven't submitted yet (based on current phase & subsystem filter)
    const missingGroups = useMemo(() => {
        const submittedKeys = new Set(
            filteredSubmissions.map((s) => {
                const cohortKey = (s.cohort || 'General').toLowerCase().trim();
                return `${s.subsystem.toLowerCase().trim()}:::${cohortKey}:::${s.group.toLowerCase().trim()}`;
            })
        );
        return canonicalRoster.filter((rosterItem) => {
            if (filterSubsystem !== 'all' && rosterItem.subsystem !== filterSubsystem) return false;
            const cohortKey = (rosterItem.cohort || 'General').toLowerCase().trim();
            const key = `${rosterItem.subsystem.toLowerCase().trim()}:::${cohortKey}:::${rosterItem.group.toLowerCase().trim()}`;
            return !submittedKeys.has(key);
        });
    }, [canonicalRoster, filteredSubmissions, filterSubsystem]);

    // Statistics & Metrics
    const stats = useMemo(() => {
        const p1Count = submissions.filter((s) => (s.phase || 'phase1').toLowerCase().includes('phase1')).length;
        const p2Count = submissions.filter((s) => (s.phase || '').toLowerCase().includes('phase2')).length;
        const swP1Count = softwarePhase2Matrix.length;
        const swP2Count = softwarePhase2Matrix.filter((m) => m.isPhase2Submitted).length;
        const swTurnoutPercent = swP1Count > 0 ? Math.round((swP2Count / swP1Count) * 100) : 0;

        return {
            totalSubmissions: submissions.length,
            uniqueTeams: groupedTeams.length,
            phase1Total: p1Count,
            phase2Total: p2Count,
            swPhase1Teams: swP1Count,
            swPhase2Teams: swP2Count,
            swTurnoutPercent
        };
    }, [submissions, groupedTeams, softwarePhase2Matrix]);

    // CSV Export Handler
    const handleExportCsv = () => {
        if (submissions.length === 0) {
            if (showStatus) showStatus('No submissions to export.');
            return;
        }

        const headers = [
            'Phase',
            'Subsystem',
            'Cohort',
            'Group',
            'Problem Statement',
            'Submitter Name',
            'Submitter Phone',
            'Partner Name',
            'Partner Dept',
            'Google Drive Link',
            'GitHub Repository Link',
            'Notes',
            'Submitted At (IST)',
            'Submission ID'
        ];

        const rows = submissions.map((s) => [
            `"${s.phase ? s.phase.toUpperCase() : 'PHASE 1'}"`,
            `"${s.subsystem.toUpperCase()}"`,
            `"${s.cohort}"`,
            `"${s.group}"`,
            `"${s.problemStatement ? s.problemStatement.toUpperCase() : 'PS1'}"`,
            `"${s.submitterName}"`,
            `"${s.submitterPhone}"`,
            `"${s.partnerName || ''}"`,
            `"${s.partnerDept || ''}"`,
            `"${s.driveUrl}"`,
            `"${s.githubUrl || ''}"`,
            `"${(s.notes || '').replace(/"/g, '""')}"`,
            `"${new Date(s.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}"`,
            `"${s._id}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `asterix_recruitment_submissions_${filterPhase}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Copy all links
    const handleCopyAllLinks = () => {
        if (filteredSubmissions.length === 0) return;
        const text = filteredSubmissions
            .map((s) => `[${(s.phase || 'PHASE 1').toUpperCase()}] ${s.subsystem.toUpperCase()} [${(s.problemStatement || 'PS1').toUpperCase()}] - ${s.group} (${s.submitterName}): Drive: ${s.driveUrl}${s.githubUrl ? ` | GitHub: ${s.githubUrl}` : ''}`)
            .join('\n');
        navigator.clipboard?.writeText?.(text);
        if (showStatus) showStatus(`✓ Copied ${filteredSubmissions.length} submission links to clipboard!`);
    };

    return (
        <div className="space-y-6">
            {/* Header & Stats */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-slate-200 pb-4">
                <div>
                    <h2 className="text-2xl font-black uppercase text-slate-900 flex items-center gap-2">
                        <span>📥 Recruitment Submissions Audit Log</span>
                        <span className="text-xs px-2 py-0.5 bg-sky-100 text-sky-800 border border-sky-300 font-mono font-bold">
                            Phase 01 &amp; Phase 02 Live
                        </span>
                    </h2>
                    <p className="text-xs font-bold text-slate-500 font-mono mt-1">
                        Inspect, verify, and grade all candidate Google Drive folders and GitHub repositories across all phases and tracks.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => fetchSubmissions(false)}
                        className="press px-3 py-1.5 bg-white hover:bg-slate-100 border-2 border-slate-900 font-mono font-black text-xs uppercase flex items-center gap-1 shadow-[2px_2px_0px_#0f172a] cursor-pointer"
                        title="Reload latest submissions"
                    >
                        <span>⟳ Refresh</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="press px-3.5 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-900 border-2 border-slate-900 font-mono font-black text-xs uppercase shadow-[2px_2px_0px_#0f172a] cursor-pointer"
                    >
                        📊 Export CSV
                    </button>

                    <button
                        type="button"
                        onClick={handleCopyAllLinks}
                        className="press px-3.5 py-1.5 bg-amber-300 hover:bg-amber-400 text-slate-900 border-2 border-slate-900 font-mono font-black text-xs uppercase shadow-[2px_2px_0px_#0f172a] cursor-pointer"
                    >
                        📋 Copy Links
                    </button>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-white border-3 border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                    <span className="font-mono text-[10px] font-bold text-slate-500 uppercase block">Total Submissions</span>
                    <strong className="text-2xl font-black font-mono text-slate-900">{stats.totalSubmissions}</strong>
                </div>
                <div className="p-3.5 bg-white border-3 border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                    <span className="font-mono text-[10px] font-bold text-slate-500 uppercase block">Phase 1 Submissions</span>
                    <strong className="text-2xl font-black font-mono text-sky-700">{stats.phase1Total}</strong>
                </div>
                <div className="p-3.5 bg-white border-3 border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                    <span className="font-mono text-[10px] font-bold text-slate-500 uppercase block">Phase 2 Submissions</span>
                    <strong className="text-2xl font-black font-mono text-amber-600">{stats.phase2Total}</strong>
                </div>
                <div className="p-3.5 bg-white border-3 border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                    <span className="font-mono text-[10px] font-bold text-slate-500 uppercase block">Software Phase 2 Turnout</span>
                    <strong className="text-2xl font-black font-mono text-emerald-600">
                        {stats.swPhase2Teams} / {stats.swPhase1Teams} ({stats.swTurnoutPercent}%)
                    </strong>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-slate-50 p-4 border-3 border-slate-900 space-y-3">
                {/* Row 1: Subsystem Tabs & Phase Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black uppercase text-slate-700 mr-1">Track:</span>
                        {[
                            { id: 'all', label: 'All Tracks' },
                            { id: 'software', label: 'Software & Perception' },
                            { id: 'mechanical', label: 'Mechanical' },
                            { id: 'powertrain', label: 'Powertrain / Other' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setFilterSubsystem(tab.id)}
                                className={`px-2.5 py-1 border-2 border-slate-900 font-mono text-xs font-black uppercase cursor-pointer transition-all ${
                                    filterSubsystem === tab.id
                                        ? 'bg-slate-900 text-white shadow-[2px_2px_0px_#0284c7]'
                                        : 'bg-white hover:bg-slate-100 text-slate-800'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black uppercase text-slate-700 mr-1">Phase:</span>
                        {[
                            { id: 'all', label: 'All Phases' },
                            { id: 'phase1', label: 'Phase 01' },
                            { id: 'phase2', label: 'Phase 02 (Active)' }
                        ].map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => setFilterPhase(p.id)}
                                className={`px-2.5 py-1 border-2 border-slate-900 font-mono text-xs font-black uppercase cursor-pointer transition-all ${
                                    filterPhase === p.id
                                        ? 'bg-amber-300 text-slate-950 shadow-[2px_2px_0px_#000]'
                                        : 'bg-white hover:bg-slate-100 text-slate-800'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Row 2: Search Box & View Mode Switcher */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                    <div className="flex-1 min-w-[240px] flex items-center gap-2 bg-white border-2 border-slate-900 px-3 py-1.5">
                        <span className="font-mono text-xs font-black uppercase text-slate-500">Search:</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search candidate name, group number, phone, drive or github link..."
                            className="flex-1 bg-transparent text-xs font-bold font-mono focus:outline-none"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="text-xs font-mono font-bold text-slate-500 hover:text-slate-900"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setViewMode('submissions')}
                            className={`px-3 py-1.5 border-2 border-slate-900 font-mono text-xs font-black uppercase cursor-pointer transition-all ${
                                viewMode === 'submissions'
                                    ? 'bg-sky-500 text-white shadow-[2px_2px_0px_#0f172a]'
                                    : 'bg-white hover:bg-slate-100 text-slate-800'
                            }`}
                        >
                            📋 Submissions Table ({filteredSubmissions.length})
                        </button>

                        <button
                            type="button"
                            onClick={() => setViewMode('phase2-matrix')}
                            className={`px-3 py-1.5 border-2 border-slate-900 font-mono text-xs font-black uppercase cursor-pointer transition-all ${
                                viewMode === 'phase2-matrix'
                                    ? 'bg-amber-400 text-slate-950 font-black shadow-[2px_2px_0px_#0f172a]'
                                    : 'bg-white hover:bg-slate-100 text-slate-800'
                            }`}
                        >
                            ⚡ Phase 2 Progress Matrix ({stats.swPhase2Teams}/{stats.swPhase1Teams})
                        </button>

                        <button
                            type="button"
                            onClick={() => setViewMode('missing')}
                            className={`px-3 py-1.5 border-2 border-slate-900 font-mono text-xs font-black uppercase cursor-pointer transition-all ${
                                viewMode === 'missing'
                                    ? 'bg-rose-500 text-white shadow-[2px_2px_0px_#0f172a]'
                                    : 'bg-white hover:bg-slate-100 text-slate-800'
                            }`}
                        >
                            ⚠️ Missing Tracker ({missingGroups.length})
                        </button>
                    </div>
                </div>
            </div>

            {/* View 1: Main Submissions Table */}
            {viewMode === 'submissions' && (
                <div className="bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a]">
                    {isLoading ? (
                        <div className="p-12 text-center font-mono font-bold text-slate-500">
                            Loading submissions from database...
                        </div>
                    ) : filteredSubmissions.length === 0 ? (
                        <div className="p-12 text-center space-y-2">
                            <span className="text-3xl block">📭</span>
                            <h3 className="text-base font-black uppercase font-mono text-slate-900">
                                No Submissions Found
                            </h3>
                            <p className="text-xs font-bold text-slate-500 max-w-sm mx-auto">
                                No candidate submissions match the current track, phase, or search filters.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse font-sans text-xs">
                                <thead>
                                    <tr className="bg-slate-900 text-white font-mono uppercase text-[11px] border-b-2 border-slate-900">
                                        <th className="p-3 border-r border-slate-700">Phase &amp; Track</th>
                                        <th className="p-3 border-r border-slate-700">Duo Group</th>
                                        <th className="p-3 border-r border-slate-700">Submitter &amp; Partner</th>
                                        <th className="p-3 border-r border-slate-700">Contact</th>
                                        <th className="p-3 border-r border-slate-700">Deliverables Links</th>
                                        <th className="p-3 border-r border-slate-700">Submitted At (IST)</th>
                                        <th className="p-3 text-center">Version</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSubmissions.map((sub, idx) => {
                                        const dateStr = new Date(sub.createdAt).toLocaleString('en-IN', {
                                            timeZone: 'Asia/Kolkata',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        });

                                        const isP2 = (sub.phase || '').toLowerCase().includes('phase2') || (sub.phase || '').toLowerCase().includes('phase 2');

                                        return (
                                            <Fragment key={sub._id || idx}>
                                                <tr
                                                    className={`border-b border-slate-200 hover:bg-sky-50/50 ${
                                                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                                                    }`}
                                                >
                                                    <td className="p-3 border-r border-slate-200 whitespace-nowrap">
                                                        <div className="flex flex-col gap-1">
                                                            <span className={`px-2 py-0.5 border font-mono text-[10px] font-black uppercase block w-fit ${
                                                                isP2
                                                                    ? 'bg-amber-300 text-slate-950 border-slate-950 font-black'
                                                                    : 'bg-sky-100 text-sky-900 border-sky-300'
                                                            }`}>
                                                                {isP2 ? 'PHASE 02' : 'PHASE 01'}
                                                            </span>
                                                            <span className="font-mono text-[11px] font-bold text-slate-700 uppercase">
                                                                {sub.subsystem}
                                                            </span>
                                                            {sub.problemStatement && (
                                                                <span className="px-1.5 py-0.2 bg-slate-100 border border-slate-300 font-mono text-[9px] font-black uppercase text-slate-600 block w-fit">
                                                                    {sub.problemStatement.toUpperCase()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="p-3 border-r border-slate-200">
                                                        <strong className="text-slate-900 block font-mono text-xs">{sub.group}</strong>
                                                        {sub.cohort && sub.cohort !== 'General' && (
                                                            <span className="text-[10px] font-bold text-slate-500 font-mono">
                                                                {sub.cohort}
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="p-3 border-r border-slate-200">
                                                        <div>
                                                            <strong className="text-slate-900 block">{sub.submitterName}</strong>
                                                            {sub.partnerName && (
                                                                <span className="text-[11px] text-slate-500 font-bold block">
                                                                    Partner: {sub.partnerName} {sub.partnerDept ? `(${sub.partnerDept})` : ''}
                                                                </span>
                                                            )}
                                                            {sub.notes && (
                                                                <span className="text-[10px] text-sky-800 italic block mt-0.5">
                                                                    &ldquo;{sub.notes}&rdquo;
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="p-3 border-r border-slate-200 font-mono">
                                                        <a
                                                            href={`tel:${sub.submitterPhone}`}
                                                            className="text-sky-700 font-bold hover:underline block"
                                                        >
                                                            {sub.submitterPhone}
                                                        </a>
                                                    </td>

                                                    <td className="p-3 border-r border-slate-200 max-w-xs space-y-1.5">
                                                        {sub.driveUrl && (
                                                            <div className="flex items-center gap-2">
                                                                <a
                                                                    href={sub.driveUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="press px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-mono text-[11px] font-black uppercase flex items-center gap-1 shadow-[2px_2px_0px_#0284c7] shrink-0"
                                                                >
                                                                    <span>📂 Drive</span>
                                                                    <span>↗</span>
                                                                </a>
                                                                <span className="text-[11px] text-slate-500 truncate select-all" title={sub.driveUrl}>
                                                                    {sub.driveUrl}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {sub.githubUrl && (
                                                            <div className="flex items-center gap-2">
                                                                <a
                                                                    href={sub.githubUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="press px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 font-mono text-[11px] font-black uppercase flex items-center gap-1 shadow-[2px_2px_0px_#f59e0b] shrink-0"
                                                                >
                                                                    <span>🐙 GitHub</span>
                                                                    <span>↗</span>
                                                                </a>
                                                                <span className="text-[11px] text-slate-500 truncate select-all" title={sub.githubUrl}>
                                                                    {sub.githubUrl}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className="p-3 border-r border-slate-200 font-mono text-slate-700 whitespace-nowrap">
                                                        {dateStr}
                                                    </td>

                                                    <td className="p-3 text-center">
                                                        {(() => {
                                                            const cohortKey = (sub.cohort || 'General').toLowerCase().trim();
                                                            const phaseKey = (sub.phase || 'phase1').toLowerCase().trim();
                                                            const teamKey = `${sub.subsystem.toLowerCase().trim()}:::${phaseKey}:::${cohortKey}:::${sub.group.toLowerCase().trim()}`;
                                                            const historyForTeam = groupHistoryMap[teamKey] || [];
                                                            const hasMultiple = historyForTeam.length > 1;
                                                            const isExpanded = expandedGroupKey === teamKey;

                                                            return (
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-400 font-mono text-[10px] font-black uppercase">
                                                                        v{historyForTeam.length}
                                                                    </span>
                                                                    {hasMultiple && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setExpandedGroupKey(isExpanded ? null : teamKey)}
                                                                            className="px-2 py-0.5 bg-amber-200 hover:bg-amber-300 border border-slate-900 font-mono text-[9px] font-black uppercase cursor-pointer"
                                                                        >
                                                                            {isExpanded ? 'Hide' : `History (${historyForTeam.length})`}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                </tr>
                                                {(() => {
                                                    const cohortKey = (sub.cohort || 'General').toLowerCase().trim();
                                                    const phaseKey = (sub.phase || 'phase1').toLowerCase().trim();
                                                    const teamKey = `${sub.subsystem.toLowerCase().trim()}:::${phaseKey}:::${cohortKey}:::${sub.group.toLowerCase().trim()}`;
                                                    if (expandedGroupKey !== teamKey) return null;

                                                    return (
                                                        <tr className="bg-amber-50/70 border-b-2 border-slate-900 font-mono text-[11px]">
                                                            <td colSpan={7} className="p-4 space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <strong className="text-slate-900 uppercase">
                                                                        Revision History for {sub.group} ({sub.subsystem} • {sub.phase || 'Phase 1'} • {sub.cohort || 'General'})
                                                                    </strong>
                                                                    <span className="text-slate-500 font-bold">
                                                                        All revisions preserved
                                                                    </span>
                                                                </div>
                                                                <div className="space-y-1.5 pt-1">
                                                                    {(groupHistoryMap[teamKey] || []).map((h, hIdx, arr) => (
                                                                        <div
                                                                            key={h._id || hIdx}
                                                                            className="p-2.5 bg-white border border-slate-300 flex flex-wrap items-center justify-between gap-2"
                                                                        >
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="px-1.5 py-0.5 bg-slate-900 text-white text-[9px] font-black uppercase">
                                                                                    Revision #{arr.length - hIdx}
                                                                                </span>
                                                                                {h.problemStatement && (
                                                                                    <span className="px-1.5 py-0.5 bg-sky-100 text-sky-800 border border-sky-300 text-[9px] font-black uppercase">
                                                                                        {h.problemStatement.toUpperCase()}
                                                                                    </span>
                                                                                )}
                                                                                <span>
                                                                                    <strong>{h.submitterName}</strong> ({h.submitterPhone})
                                                                                </span>
                                                                                {h.notes && (
                                                                                    <span className="text-slate-500 italic">
                                                                                        &ldquo;{h.notes}&rdquo;
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-slate-500 text-[10px]">
                                                                                    {new Date(h.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                                                                </span>
                                                                                {h.driveUrl && (
                                                                                    <a
                                                                                        href={h.driveUrl}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="px-2 py-0.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] uppercase"
                                                                                    >
                                                                                        Drive ↗
                                                                                    </a>
                                                                                )}
                                                                                {h.githubUrl && (
                                                                                    <a
                                                                                        href={h.githubUrl}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-[10px] uppercase"
                                                                                    >
                                                                                        GitHub ↗
                                                                                    </a>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })()}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* View 2: Software Phase 2 Progress Matrix */}
            {viewMode === 'phase2-matrix' && (
                <div className="space-y-4">
                    <div className="bg-white border-4 border-slate-900 p-5 shadow-[6px_6px_0px_#0f172a] space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h3 className="font-mono text-lg font-black uppercase text-slate-900 flex items-center gap-2">
                                    <span>⚡ Software Phase 02 Submission Progress Matrix</span>
                                    <span className="text-xs px-2 py-0.5 bg-amber-200 border border-slate-900 font-black">
                                        Deadline: Tomorrow Night 11:59 PM IST
                                    </span>
                                </h3>
                                <p className="text-xs font-bold text-slate-600">
                                    All candidate teams qualified through Phase 1 submissions. Inspect who has submitted their Phase 2 Codebase &amp; Drive links vs who is pending.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 font-mono text-xs font-black">
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-400">
                                    Submitted: {stats.swPhase2Teams}
                                </span>
                                <span className="px-3 py-1 bg-rose-100 text-rose-900 border border-rose-400">
                                    Pending: {stats.swPhase1Teams - stats.swPhase2Teams}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {softwarePhase2Matrix.map((item) => {
                            const isSubmitted = item.isPhase2Submitted;
                            const p2 = item.p2Submission;
                            const p1 = item.p1Submission;

                            return (
                                <div
                                    key={item.key}
                                    className={`p-4 border-3 border-slate-900 space-y-3 shadow-[4px_4px_0px_#0f172a] transition-all ${
                                        isSubmitted ? 'bg-white' : 'bg-rose-50/60'
                                    }`}
                                >
                                    {/* Card Header */}
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                        <div className="flex items-center gap-2">
                                            <strong className="font-mono text-base font-black text-slate-900">
                                                {item.group}
                                            </strong>
                                            <span className="px-2 py-0.5 bg-slate-900 text-white font-mono text-[10px] font-black uppercase">
                                                {item.cohort}
                                            </span>
                                        </div>

                                        <span className={`px-2.5 py-1 font-mono text-[10px] font-black uppercase border ${
                                            isSubmitted
                                                ? 'bg-emerald-300 text-slate-950 border-slate-950'
                                                : 'bg-rose-600 text-white border-rose-700'
                                        }`}>
                                            {isSubmitted ? '✓ PHASE 2 SUBMITTED' : '⏳ AWAITING PHASE 2'}
                                        </span>
                                    </div>

                                    {/* Candidates & Phone info */}
                                    <div className="grid grid-cols-2 gap-2 text-xs font-sans">
                                        {item.members.map((m, mIdx) => (
                                            <div key={mIdx} className="bg-slate-50 border border-slate-300 p-2 space-y-0.5">
                                                <strong className="block text-slate-900 text-xs truncate" title={m.name}>
                                                    {m.name}
                                                </strong>
                                                <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                                                    <span>{m.dept || 'Software'}</span>
                                                    {m.phone ? (
                                                        <a href={`tel:${m.phone}`} className="text-sky-700 font-bold hover:underline">
                                                            {m.phone}
                                                        </a>
                                                    ) : null}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Phase 1 Summary Tag */}
                                    <div className="p-2 bg-sky-50 border border-sky-200 font-mono text-[11px] text-slate-700 flex items-center justify-between">
                                        <span>Phase 1 PS: <strong>{(p1.problemStatement || 'PS1').toUpperCase()}</strong></span>
                                        {p1.driveUrl && (
                                            <a
                                                href={p1.driveUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sky-700 font-bold hover:underline"
                                            >
                                                View P1 Drive ↗
                                            </a>
                                        )}
                                    </div>

                                    {/* Phase 2 Submission Details or Follow-up Action */}
                                    {isSubmitted && p2 ? (
                                        <div className="p-3 bg-amber-50/80 border-2 border-slate-900 space-y-2 font-mono text-xs">
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="font-black text-slate-900">
                                                    Phase 2 PS: {(p2.problemStatement || 'PS1').toUpperCase()}
                                                </span>
                                                <span className="text-slate-500 text-[10px]">
                                                    {new Date(p2.createdAt).toLocaleString('en-IN', {
                                                        timeZone: 'Asia/Kolkata',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {p2.driveUrl && (
                                                    <a
                                                        href={p2.driveUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="press px-3 py-1 bg-slate-900 text-white hover:bg-slate-800 font-mono text-[11px] font-black uppercase flex items-center gap-1 shadow-[2px_2px_0px_#0284c7]"
                                                    >
                                                        <span>📂 Open Drive</span>
                                                        <span>↗</span>
                                                    </a>
                                                )}
                                                {p2.githubUrl && (
                                                    <a
                                                        href={p2.githubUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="press px-3 py-1 bg-slate-900 text-amber-300 hover:bg-slate-800 font-mono text-[11px] font-black uppercase flex items-center gap-1 shadow-[2px_2px_0px_#f59e0b]"
                                                    >
                                                        <span>🐙 Open GitHub</span>
                                                        <span>↗</span>
                                                    </a>
                                                )}
                                            </div>

                                            {p2.notes && (
                                                <div className="text-[10px] text-slate-600 italic border-t border-slate-200 pt-1">
                                                    &ldquo;{p2.notes}&rdquo;
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-rose-100 border border-rose-300 flex items-center justify-between text-xs font-bold font-mono text-rose-900">
                                            <span>⏳ Candidate team has not submitted Phase 2.</span>
                                            {item.members[0]?.phone && (
                                                <a
                                                    href={`tel:${item.members[0].phone}`}
                                                    className="px-2 py-1 bg-slate-900 text-white hover:bg-slate-800 font-mono text-[10px] font-black uppercase"
                                                >
                                                    📞 Call Lead
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* View 3: Missing Submissions Tracker */}
            {viewMode === 'missing' && (
                <div className="bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-mono text-lg font-black uppercase text-rose-600">
                                Allocated Teams Awaiting Submission ({missingGroups.length})
                            </h3>
                            <p className="text-xs font-bold text-slate-500">
                                Contact these candidates directly before the recruitment portal deadlines close.
                            </p>
                        </div>
                    </div>

                    {missingGroups.length === 0 ? (
                        <div className="p-8 text-center bg-emerald-50 border-2 border-emerald-400 text-emerald-900 font-mono font-black text-sm">
                            🎉 100% SUBMISSION RATE! All allocated teams for this filter have submitted their links.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {missingGroups.map((grp, idx) => (
                                <div
                                    key={idx}
                                    className="p-3.5 bg-rose-50/50 border-2 border-rose-300 space-y-2 font-sans"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="px-2 py-0.5 bg-slate-900 text-white font-mono text-[10px] font-black uppercase">
                                            {grp.subsystem}
                                        </span>
                                        <span className="font-mono text-xs font-black text-rose-700">
                                            {grp.group}
                                        </span>
                                    </div>

                                    <div className="space-y-1.5 pt-1">
                                        {grp.members?.map((m, mIdx) => (
                                            <div key={mIdx} className="text-xs border-b border-rose-100 last:border-b-0 pb-1">
                                                <strong className="text-slate-900 block">{m.name}</strong>
                                                <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                                                    <span>{m.dept}</span>
                                                    <a href={`tel:${m.phone}`} className="text-sky-700 font-bold hover:underline">
                                                        {m.phone}
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
