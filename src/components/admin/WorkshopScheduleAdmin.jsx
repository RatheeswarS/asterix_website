import { useState } from 'react';
import { useWebsiteData } from '../../context/WebsiteDataContext';
import { WORKSHOP_TRACKS } from '../../../server/src/config/workshopPackages.js';

const btn = 'press font-mono font-black text-[11px] uppercase border border-slate-900 cursor-pointer px-3 py-1.5 transition-all';
const btnPrimary = `${btn} bg-sky-500 hover:bg-sky-400 text-white`;
const btnQuiet = `${btn} bg-white hover:bg-slate-100 text-slate-900`;
const btnDanger = `${btn} bg-rose-400 hover:bg-rose-300 text-slate-900`;
const input = 'w-full px-2.5 py-1.5 border border-slate-900 bg-white text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-sky-500';
const labelClass = 'block text-[10px] font-mono font-black uppercase text-slate-700 mb-1';

// Unique id for a new schedule row. Kept outside the component so the linter
// does not mistake this click-time call for an impure call during render.
function newScheduleId(trackId) {
    return `sch-${trackId}-${Date.now().toString(36)}`;
}

export default function WorkshopScheduleAdmin({ currentUser, isAdmin, showStatus, onImageUpload }) {
    const { siteData, updateWorkshop } = useWebsiteData();
    const workshop = siteData.workshop || { tracks: WORKSHOP_TRACKS };
    const tracks = workshop.tracks || WORKSHOP_TRACKS;

    const trackKeys = Object.keys(WORKSHOP_TRACKS);
    const [selectedTrackId, setSelectedTrackId] = useState(trackKeys[0] || 'software');
    const [isUploading, setIsUploading] = useState(false);

    // Active track data with fallback to canonical defaults
    const currentTrack = {
        ...WORKSHOP_TRACKS[selectedTrackId],
        ...(tracks[selectedTrackId] || {})
    };

    // Helper to update current track's fields
    const patchTrack = (fields) => {
        updateWorkshop({
            tracks: {
                ...tracks,
                [selectedTrackId]: {
                    ...currentTrack,
                    ...fields
                }
            }
        });
    };

    // Milestone list helpers
    const schedule = Array.isArray(currentTrack.schedule) ? currentTrack.schedule : [];

    const setSchedule = (next) => patchTrack({ schedule: next });

    const patchScheduleItem = (index, fields) => {
        setSchedule(schedule.map((item, i) => (i === index ? { ...item, ...fields } : item)));
    };

    const removeScheduleItem = (index) => {
        setSchedule(schedule.filter((_, i) => i !== index));
        showStatus?.('Session milestone removed.');
    };

    const moveScheduleItem = (index, delta) => {
        const target = index + delta;
        if (target < 0 || target >= schedule.length) return;
        const next = [...schedule];
        const [moved] = next.splice(index, 1);
        next.splice(target, 0, moved);
        setSchedule(next);
    };

    const addScheduleItem = () => {
        const nextIdx = schedule.length;
        const newItem = {
            id: newScheduleId(selectedTrackId),
            label: `Week ${nextIdx}`,
            days: currentTrack.days || 'Tue & Thu',
            date: 'TBD',
            title: 'New Session Topic',
            venue: 'To be announced',
            reportingInstructions: 'Arrive 10 minutes prior to session timing.'
        };
        setSchedule([...schedule, newItem]);
        showStatus?.('New milestone added.');
    };

    // PDF Upload Handler
    const handlePdfFileSelect = async (e) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setIsUploading(true);
        try {
            await onImageUpload(
                e,
                (url) => {
                    patchTrack({ syllabus: url });
                    showStatus?.('Syllabus PDF uploaded and updated successfully.');
                },
                '/asterix/workshop',
                `${selectedTrackId}_syllabus`
            );
        } catch (err) {
            console.error('PDF upload error:', err);
        } finally {
            setIsUploading(false);
        }
    };

    const resetToDefaultPdf = () => {
        const defaultPdf = WORKSHOP_TRACKS[selectedTrackId]?.syllabus || `/workshop/${selectedTrackId}-syllabus.pdf`;
        patchTrack({ syllabus: defaultPdf });
        showStatus?.('Syllabus reset to default PDF.');
    };

    // If user is not an administrator, render access denied guard
    if (!isAdmin) {
        return (
            <div className="p-5 bg-rose-50 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] space-y-3">
                <div className="flex items-center gap-2 text-rose-700 font-mono font-black text-xs uppercase">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                    <span>RESTRICTED ACCESS</span>
                </div>
                <h3 className="text-xl font-black uppercase text-slate-900">
                    Administrator Privileges Required
                </h3>
                <p className="text-xs font-mono font-bold text-slate-600 leading-relaxed">
                    You are signed in as <strong className="text-slate-900">{currentUser?.name || 'User'}</strong> with access level <strong className="text-slate-900">{currentUser?.accessLevel || currentUser?.role || 'Member'}</strong>. Editing workshop syllabus documents, timing schedules, venue details, and reporting instructions is strictly restricted to Administrators.
                </p>
                <div className="pt-2 text-[11px] font-mono text-slate-500">
                    Please contact an administrator if you require permission to manage workshop curriculum details.
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="border-b-2 border-slate-200 pb-4">
                <h2 className="text-2xl font-black uppercase text-slate-900">Workshop Management</h2>
                <p className="text-xs font-bold text-slate-500 font-mono mt-1">
                    Manage workshop curriculum PDFs, batch timings, milestone venues, reporting instructions, and weekly schedules.
                </p>
            </div>

            {/* Track Switcher Tabs */}
            <div className="flex flex-wrap gap-2">
                {trackKeys.map((key) => {
                    const t = WORKSHOP_TRACKS[key];
                    const active = selectedTrackId === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setSelectedTrackId(key)}
                            className={`px-4 py-2 border border-slate-900 font-mono text-xs font-black uppercase cursor-pointer transition-all ${
                                active
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-white hover:bg-slate-50 text-slate-800'
                            }`}
                        >
                            {t.name}
                        </button>
                    );
                })}
            </div>

            {/* SECTION 1: SYLLABUS DOCUMENT MANAGEMENT */}
            <div className="p-5 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <h3 className="text-lg font-black uppercase text-slate-900">
                        Syllabus Document (PDF)
                    </h3>
                    {currentTrack.syllabus && (
                        <a
                            href={currentTrack.syllabus}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="press text-xs font-mono font-bold text-sky-600 hover:text-sky-800 underline flex items-center gap-1"
                        >
                            View Active PDF &rarr;
                        </a>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className={labelClass}>Active Syllabus File URL / Path</label>
                        <input
                            type="text"
                            value={currentTrack.syllabus || ''}
                            onChange={(e) => patchTrack({ syllabus: e.target.value })}
                            placeholder="e.g. /workshop/software-perception-syllabus.pdf or https://..."
                            className={input}
                        />
                    </div>

                    <div className="flex gap-2">
                        <label className={`${btnPrimary} flex-1 text-center truncate`}>
                            <span>{isUploading ? 'Uploading...' : 'Upload PDF'}</span>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handlePdfFileSelect}
                                disabled={isUploading}
                                className="hidden"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={resetToDefaultPdf}
                            className={btnQuiet}
                            title="Reset to default local syllabus PDF"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* SECTION 2: ONGOING WEEK OVERRIDE */}
            <div className="p-5 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] space-y-4">
                <div className="border-b border-slate-200 pb-3">
                    <h3 className="text-lg font-black uppercase text-slate-900">
                        Ongoing Week Selection
                    </h3>
                    <p className="text-xs font-mono font-bold text-slate-500 mt-1">
                        The live website automatically detects and highlights the ongoing week in real-time based on the session dates and IST clock. You can also manually set or override the active week below.
                    </p>
                </div>

                <div className="max-w-md">
                    <label className={labelClass}>
                        Active / Ongoing Week
                    </label>
                    <select
                        value={currentTrack.ongoingWeek || 'Week 0'}
                        onChange={(e) => patchTrack({ ongoingWeek: e.target.value })}
                        className={`${input} font-black uppercase bg-white cursor-pointer`}
                    >
                        {schedule.map((item) => (
                            <option key={item.id || item.label} value={item.label}>
                                {item.label} — {item.title} ({item.date || 'TBD'})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* SECTION 3: COMBINED TIMINGS, FORMATS & PLAN MILESTONES FRAME */}
            <div className="p-5 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] space-y-6">
                
                {/* Subheading 1: Timings, Days & Session Formats */}
                <div className="space-y-4">
                    <div className="border-b border-slate-200 pb-3">
                        <h3 className="text-lg font-black uppercase text-slate-900">
                            Timings, Days & Session Formats
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>Daily Session Timing</label>
                            <input
                                type="text"
                                value={currentTrack.timing || ''}
                                onChange={(e) => patchTrack({ timing: e.target.value })}
                                placeholder="e.g. 5:10 PM – 6:50 PM"
                                className={input}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Schedule Days</label>
                            <input
                                type="text"
                                value={currentTrack.days || ''}
                                onChange={(e) => patchTrack({ days: e.target.value })}
                                placeholder="e.g. Tuesday & Thursday"
                                className={input}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Overall Dates & Duration</label>
                            <input
                                type="text"
                                value={currentTrack.dates || ''}
                                onChange={(e) => patchTrack({ dates: e.target.value })}
                                placeholder="e.g. From 1 Oct 2026 · 4 weeks"
                                className={input}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Orientation / Pre-Session Kickoff</label>
                            <input
                                type="text"
                                value={currentTrack.startLabel || ''}
                                onChange={(e) => patchTrack({ startLabel: e.target.value })}
                                placeholder="e.g. Pre-session talk 29 Sep 2026 · first session Thu 1 Oct 2026"
                                className={input}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Format & Structure</label>
                            <input
                                type="text"
                                value={currentTrack.format || ''}
                                onChange={(e) => patchTrack({ format: e.target.value })}
                                placeholder="e.g. 8 core sessions over 4 weeks + 2 bonus sessions"
                                className={input}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Target Audience</label>
                            <input
                                type="text"
                                value={currentTrack.audience || ''}
                                onChange={(e) => patchTrack({ audience: e.target.value })}
                                placeholder="e.g. Beginners welcome. No prior knowledge needed."
                                className={input}
                            />
                        </div>
                    </div>
                </div>

                {/* Subheading 2: Plan Milestones (Separate Days, Dates, Venue & Instructions) */}
                <div className="space-y-4 pt-4 border-t-2 border-slate-100">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                        <div>
                            <h3 className="text-lg font-black uppercase text-slate-900">
                                Plan Milestones & Session Venues
                            </h3>
                            <p className="text-xs font-mono font-bold text-slate-500 mt-0.5">
                                Set session dates, topics, physical venue/lab location, and reporting prerequisites for each milestone.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={addScheduleItem}
                            className={btnQuiet}
                        >
                            + Add Milestone
                        </button>
                    </div>

                    <div className="space-y-3">
                        {schedule.map((item, index) => {
                            const isCurrent = (currentTrack.ongoingWeek || '').toLowerCase() === (item.label || '').toLowerCase();

                            return (
                                <div
                                    key={item.id || index}
                                    className={`p-4 border-2 border-slate-900 transition-colors space-y-3 ${
                                        isCurrent ? 'bg-sky-50 shadow-[2px_2px_0px_#0284c7]' : 'bg-slate-50'
                                    }`}
                                >
                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                                        <div className="sm:col-span-2">
                                            <label className="block text-[9px] font-mono font-black uppercase text-slate-500 mb-0.5">
                                                Week / Label
                                            </label>
                                            <div className="flex items-center gap-1.5">
                                                <input
                                                    type="text"
                                                    value={item.label || ''}
                                                    onChange={(e) => patchScheduleItem(index, { label: e.target.value })}
                                                    placeholder="e.g. Week 1"
                                                    className={input}
                                                />
                                                {isCurrent && (
                                                    <span className="px-1 py-0.5 text-[8px] font-mono font-black bg-emerald-400 text-slate-900 border border-slate-900 uppercase shrink-0">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block text-[9px] font-mono font-black uppercase text-slate-500 mb-0.5">
                                                Days Column
                                            </label>
                                            <input
                                                type="text"
                                                value={item.days || ''}
                                                onChange={(e) => patchScheduleItem(index, { days: e.target.value })}
                                                placeholder="e.g. Tue & Thu"
                                                className={input}
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block text-[9px] font-mono font-black uppercase text-slate-500 mb-0.5">
                                                Dates Column
                                            </label>
                                            <input
                                                type="text"
                                                value={item.date || ''}
                                                onChange={(e) => patchScheduleItem(index, { date: e.target.value })}
                                                placeholder="e.g. 6 & 8 Oct"
                                                className={input}
                                            />
                                        </div>

                                        <div className="sm:col-span-4">
                                            <label className="block text-[9px] font-mono font-black uppercase text-slate-500 mb-0.5">
                                                Session Topic Title
                                            </label>
                                            <input
                                                type="text"
                                                value={item.title || ''}
                                                onChange={(e) => patchScheduleItem(index, { title: e.target.value })}
                                                placeholder="e.g. System Design & Vehicle Architecture"
                                                className={input}
                                            />
                                        </div>

                                        <div className="sm:col-span-2 flex items-center justify-end gap-1 pt-2 sm:pt-0">
                                            <button
                                                type="button"
                                                onClick={() => moveScheduleItem(index, -1)}
                                                disabled={index === 0}
                                                className={`${btnQuiet} px-2 py-1 text-xs disabled:opacity-30`}
                                                title="Move up"
                                            >
                                                &uarr;
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => moveScheduleItem(index, 1)}
                                                disabled={index === schedule.length - 1}
                                                className={`${btnQuiet} px-2 py-1 text-xs disabled:opacity-30`}
                                                title="Move down"
                                            >
                                                &darr;
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeScheduleItem(index)}
                                                className={`${btnDanger} px-2 py-1 text-xs`}
                                                title="Delete milestone"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    </div>

                                    {/* Milestone Specific Venue & Reporting Instructions */}
                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2 border-t border-slate-200">
                                        <div className="sm:col-span-5">
                                            <label className="block text-[9px] font-mono font-black uppercase text-slate-600 mb-0.5">
                                                📍 Session Venue
                                            </label>
                                            <input
                                                type="text"
                                                value={item.venue !== undefined ? item.venue : 'To be announced'}
                                                onChange={(e) => patchScheduleItem(index, { venue: e.target.value })}
                                                placeholder="e.g. Autonomous Systems & Robotics Lab (Room 302, PSG iTech)"
                                                className={input}
                                            />
                                        </div>

                                        <div className="sm:col-span-7">
                                            <label className="block text-[9px] font-mono font-black uppercase text-slate-600 mb-0.5">
                                                📋 Reporting Instructions & Prerequisites
                                            </label>
                                            <input
                                                type="text"
                                                value={item.reportingInstructions !== undefined ? item.reportingInstructions : 'Arrive 10 minutes prior to session timing.'}
                                                onChange={(e) => patchScheduleItem(index, { reportingInstructions: e.target.value })}
                                                placeholder="e.g. Bring laptops with chargers. Ubuntu 22.04 LTS recommended."
                                                className={input}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
