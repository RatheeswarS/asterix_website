import { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import { apiUrl } from '../../lib/api';
import {
    SOFTWARE_PERCEPTION_DATA,
    MECHANICAL_MYSTERY_DATA
} from '../../data/recruitmentProblemStatements';

export default function SubmissionsAdmin({ showStatus }) {
    const [submissions, setSubmissions] = useState([]);
    const [groupedTeams, setGroupedTeams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterSubsystem, setFilterSubsystem] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedGroupKey, setExpandedGroupKey] = useState(null);
    const [viewMode, setViewMode] = useState('submissions'); // 'submissions' or 'missing'

    const fetchSubmissions = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
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
            if (showStatus) showStatus('Failed to load submissions: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    }, [showStatus]);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            if (isMounted) await fetchSubmissions();
        };
        load();
        return () => { isMounted = false; };
    }, [fetchSubmissions]);

    // Map history per team to show versioning
    const groupHistoryMap = useMemo(() => {
        const map = {};
        submissions.forEach((s) => {
            const k = `${s.subsystem.toLowerCase()}:::${s.group.toLowerCase()}`;
            if (!map[k]) map[k] = [];
            map[k].push(s);
        });
        return map;
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
        return list;
    }, []);

    // Filter submissions
    const filteredSubmissions = useMemo(() => {
        return submissions.filter((sub) => {
            if (filterSubsystem !== 'all' && sub.subsystem !== filterSubsystem) return false;
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase().trim();
            return (
                sub.group.toLowerCase().includes(q) ||
                sub.submitterName.toLowerCase().includes(q) ||
                sub.submitterPhone.includes(q) ||
                (sub.problemStatement && sub.problemStatement.toLowerCase().includes(q)) ||
                (sub.partnerName && sub.partnerName.toLowerCase().includes(q)) ||
                (sub.githubUrl && sub.githubUrl.toLowerCase().includes(q)) ||
                sub.driveUrl.toLowerCase().includes(q)
            );
        });
    }, [submissions, filterSubsystem, searchQuery]);

    // Find missing groups that haven't submitted yet
    const missingGroups = useMemo(() => {
        const submittedKeys = new Set(submissions.map((s) => `${s.subsystem.toLowerCase()}:::${s.group.toLowerCase()}`));
        return canonicalRoster.filter((rosterItem) => {
            if (filterSubsystem !== 'all' && rosterItem.subsystem !== filterSubsystem) return false;
            const key = `${rosterItem.subsystem.toLowerCase()}:::${rosterItem.group.toLowerCase()}`;
            return !submittedKeys.has(key);
        });
    }, [canonicalRoster, submissions, filterSubsystem]);

    // CSV Export Handler
    const handleExportCsv = () => {
        if (submissions.length === 0) {
            if (showStatus) showStatus('No submissions to export.');
            return;
        }

        const headers = [
            'Subsystem',
            'Cohort',
            'Group',
            'Problem Statement',
            'Submitter Name',
            'Submitter Phone',
            'Partner Name',
            'Google Drive Link',
            'GitHub Link',
            'Notes',
            'Submitted At (IST)',
            'Submission ID'
        ];

        const rows = submissions.map((s) => [
            `"${s.subsystem.toUpperCase()}"`,
            `"${s.cohort}"`,
            `"${s.group}"`,
            `"${s.problemStatement ? s.problemStatement.toUpperCase() : 'PS1'}"`,
            `"${s.submitterName}"`,
            `"${s.submitterPhone}"`,
            `"${s.partnerName || ''}"`,
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
        link.setAttribute('download', `asterix_phase1_submissions_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Copy all links
    const handleCopyAllLinks = () => {
        if (filteredSubmissions.length === 0) return;
        const text = filteredSubmissions
            .map((s) => `${s.subsystem.toUpperCase()} [${(s.problemStatement || 'PS1').toUpperCase()}] - ${s.group} (${s.submitterName}): Drive: ${s.driveUrl}${s.githubUrl ? ` | GitHub: ${s.githubUrl}` : ''}`)
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
                        <span>📥 Phase 01 Drive Submissions</span>
                        <span className="text-xs px-2 py-0.5 bg-sky-100 text-sky-800 border border-sky-300 font-mono font-bold">
                            Live Audit Log
                        </span>
                    </h2>
                    <p className="text-xs font-bold text-slate-500 font-mono mt-1">
                        Review, verify, and inspect all submitted Google Drive folders. All historical submissions are safely preserved.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={fetchSubmissions}
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
                    <strong className="text-2xl font-black font-mono text-slate-900">{submissions.length}</strong>
                </div>
                <div className="p-3.5 bg-white border-3 border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                    <span className="font-mono text-[10px] font-bold text-slate-500 uppercase block">Unique Teams Submitted</span>
                    <strong className="text-2xl font-black font-mono text-sky-700">{groupedTeams.length}</strong>
                </div>
                <div className="p-3.5 bg-white border-3 border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                    <span className="font-mono text-[10px] font-bold text-slate-500 uppercase block">Pending / Missing Teams</span>
                    <strong className="text-2xl font-black font-mono text-rose-600">{missingGroups.length}</strong>
                </div>
                <div className="p-3.5 bg-white border-3 border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                    <span className="font-mono text-[10px] font-bold text-slate-500 uppercase block">Total Allocated Roster</span>
                    <strong className="text-2xl font-black font-mono text-slate-700">{canonicalRoster.length}</strong>
                </div>
            </div>

            {/* Subsystem Tabs & Search */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap gap-2">
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
                            className={`px-3 py-1.5 border-2 border-slate-900 font-mono text-xs font-black uppercase cursor-pointer transition-all ${
                                filterSubsystem === tab.id
                                    ? 'bg-slate-900 text-white shadow-[2px_2px_0px_#0284c7]'
                                    : 'bg-white hover:bg-slate-100 text-slate-800'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* View Switcher: Submissions vs Missing Tracker */}
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setViewMode('submissions')}
                        className={`px-3 py-1.5 border-2 border-slate-900 font-mono text-xs font-black uppercase cursor-pointer ${
                            viewMode === 'submissions'
                                ? 'bg-sky-500 text-white shadow-[2px_2px_0px_#0f172a]'
                                : 'bg-white hover:bg-slate-100 text-slate-800'
                        }`}
                    >
                        Submissions Table ({filteredSubmissions.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('missing')}
                        className={`px-3 py-1.5 border-2 border-slate-900 font-mono text-xs font-black uppercase cursor-pointer ${
                            viewMode === 'missing'
                                ? 'bg-rose-500 text-white shadow-[2px_2px_0px_#0f172a]'
                                : 'bg-white hover:bg-slate-100 text-slate-800'
                        }`}
                    >
                        Missing Tracker ({missingGroups.length})
                    </button>
                </div>
            </div>

            {/* Search Box */}
            <div className="p-3 bg-slate-50 border-2 border-slate-900 flex items-center gap-3">
                <span className="font-mono text-xs font-black uppercase text-slate-600">Search:</span>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search candidate name, group number, or phone..."
                    className="flex-1 p-2 bg-white border-2 border-slate-900 text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="px-2 py-1 text-xs font-mono font-bold text-slate-500 hover:text-slate-900"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* View 1: Submissions Table */}
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
                                No candidate submissions match the current track filter or search query.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse font-sans text-xs">
                                <thead>
                                    <tr className="bg-slate-900 text-white font-mono uppercase text-[11px] border-b-2 border-slate-900">
                                        <th className="p-3 border-r border-slate-700">Track &amp; Group</th>
                                        <th className="p-3 border-r border-slate-700">Submitter &amp; Partner</th>
                                        <th className="p-3 border-r border-slate-700">Phone</th>
                                        <th className="p-3 border-r border-slate-700">Drive Folder Link</th>
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

                                        return (
                                            <Fragment key={sub._id || idx}>
                                                <tr
                                                    className={`border-b border-slate-200 hover:bg-sky-50/50 ${
                                                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                                                }`}
                                            >
                                                <td className="p-3 border-r border-slate-200">
                                                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                                        <span className="px-2 py-0.5 bg-amber-200 border border-slate-900 font-mono text-[10px] font-black uppercase block w-fit">
                                                            {sub.subsystem}
                                                        </span>
                                                        {sub.problemStatement && (
                                                            <span className="px-1.5 py-0.5 bg-sky-200 border border-slate-900 font-mono text-[10px] font-black uppercase block w-fit">
                                                                {sub.problemStatement.toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
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
                                                                Partner: {sub.partnerName}
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
                                                        className="text-sky-700 font-bold hover:underline"
                                                    >
                                                        {sub.submitterPhone}
                                                    </a>
                                                </td>

                                                <td className="p-3 border-r border-slate-200 max-w-xs space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <a
                                                            href={sub.driveUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="press px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-mono text-[11px] font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#0284c7] shrink-0"
                                                        >
                                                            <span>📂 Open Drive</span>
                                                            <span>↗</span>
                                                        </a>
                                                        <span className="text-[11px] text-slate-500 truncate select-all" title={sub.driveUrl}>
                                                            {sub.driveUrl}
                                                        </span>
                                                    </div>
                                                    {sub.githubUrl && (
                                                        <div className="flex items-center gap-2">
                                                            <a
                                                                href={sub.githubUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="press px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 font-mono text-[11px] font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#f59e0b] shrink-0"
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
                                                        const teamKey = `${sub.subsystem.toLowerCase()}:::${sub.group.toLowerCase()}`;
                                                        const historyForTeam = groupHistoryMap[teamKey] || [];
                                                        const hasMultiple = historyForTeam.length > 1;
                                                        const isExpanded = expandedGroupKey === teamKey;

                                                        return (
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 font-mono text-[10px] font-black uppercase">
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
                                            {expandedGroupKey === `${sub.subsystem.toLowerCase()}:::${sub.group.toLowerCase()}` && (
                                                <tr className="bg-amber-50/70 border-b-2 border-slate-900 font-mono text-[11px]">
                                                    <td colSpan={6} className="p-4 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <strong className="text-slate-900 uppercase">
                                                                Full Submission History for {sub.group} ({sub.subsystem})
                                                            </strong>
                                                            <span className="text-slate-500 font-bold">
                                                                All historical links safely preserved
                                                            </span>
                                                        </div>
                                                        <div className="space-y-1.5 pt-1">
                                                            {(groupHistoryMap[`${sub.subsystem.toLowerCase()}:::${sub.group.toLowerCase()}`] || []).map((h, hIdx, arr) => (
                                                                <div
                                                                    key={h._id || hIdx}
                                                                    className="p-2.5 bg-white border border-slate-300 flex flex-wrap items-center justify-between gap-2"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="px-1.5 py-0.5 bg-slate-900 text-white text-[9px] font-black uppercase">
                                                                            Version #{arr.length - hIdx}
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
                                                                        <a
                                                                            href={h.driveUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="px-2 py-0.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] uppercase"
                                                                        >
                                                                            Drive ↗
                                                                        </a>
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
                                            )}
                                        </Fragment>
                                    );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* View 2: Missing Submissions Tracker */}
            {viewMode === 'missing' && (
                <div className="bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-mono text-lg font-black uppercase text-rose-600">
                                Allocated Teams Awaiting Submission ({missingGroups.length})
                            </h3>
                            <p className="text-xs font-bold text-slate-500">
                                Contact these candidates directly before the Phase 01 deadline closes.
                            </p>
                        </div>
                    </div>

                    {missingGroups.length === 0 ? (
                        <div className="p-8 text-center bg-emerald-50 border-2 border-emerald-400 text-emerald-900 font-mono font-black text-sm">
                            🎉 100% SUBMISSION RATE! All allocated teams have submitted their Google Drive links.
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
