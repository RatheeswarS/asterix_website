import { useState } from 'react';
import { useWebsiteData } from '../../context/WebsiteDataContext';
import { istInputValue, istInputToIso, formatIstFull } from '../../lib/istTime';

/**
 * Recruitment administration — static content editor, split per subsystem.
 *
 * Each subsystem (Software & Perception, Powertrain, Mechanical) recruits on its
 * own terms, so this tab edits three fixed tracks. Shared header fields sit at
 * the top; below them a subsystem selector chooses which track's name, blurb,
 * Google Form, timeline and problem statements you are editing. All of it lives
 * in the `siteData.recruitment` blob and saves through the one debounced sync the
 * dashboard already uses — there is no separate endpoint or token.
 */

const btn = 'press font-mono font-black text-[11px] uppercase border-2 border-slate-900 cursor-pointer px-3 py-1.5';
const btnQuiet = `${btn} bg-white hover:bg-slate-100 text-slate-900 shadow-[2px_2px_0px_#0f172a]`;
const btnDanger = `${btn} bg-rose-400 hover:bg-rose-300 text-slate-900 shadow-[2px_2px_0px_#0f172a]`;
const input = 'w-full px-2 py-1.5 border-2 border-slate-900 bg-white text-xs';
const labelClass = 'block text-[10px] font-mono font-black uppercase text-slate-600 mb-1';

const newId = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export default function RecruitmentAdmin({ showStatus }) {
    const { siteData, updateRecruitment } = useWebsiteData();
    const recruitment = siteData.recruitment || {};
    const tracks = Array.isArray(recruitment.tracks) ? recruitment.tracks : [];

    const [selectedId, setSelectedId] = useState(tracks[0]?.id || null);
    const track = tracks.find((t) => t.id === selectedId) || tracks[0] || null;

    const sharedFallback =
        (recruitment.applyUrl || '').trim() || (siteData.hero?.joinFormUrl || '').trim();

    /* Every edit maps the whole tracks array back through updateRecruitment, so
       the debounced sync sees one change and the blob stays normalised. */
    const patchTrack = (id, fields) =>
        updateRecruitment({ tracks: tracks.map((t) => (t.id === id ? { ...t, ...fields } : t)) });

    const setTrackList = (key, next) => patchTrack(track.id, { [key]: next });
    const patchListItem = (key, list, index, fields) =>
        setTrackList(key, list.map((item, i) => (i === index ? { ...item, ...fields } : item)));
    const removeListItem = (key, list, index) =>
        setTrackList(key, list.filter((_, i) => i !== index));
    const moveListItem = (key, list, index, delta) => {
        const target = index + delta;
        if (target < 0 || target >= list.length) return;
        const next = [...list];
        const [moved] = next.splice(index, 1);
        next.splice(target, 0, moved);
        setTrackList(key, next);
    };

    const timeline = Array.isArray(track?.timeline) ? track.timeline : [];
    const problemStatements = Array.isArray(track?.problemStatements) ? track.problemStatements : [];

    const addTimelineItem = () => {
        setTrackList('timeline', [...timeline, { id: newId('tl'), label: '', detail: '', date: '' }]);
        showStatus?.('Timeline milestone added.');
    };
    const addProblemStatement = () => {
        setTrackList('problemStatements', [
            ...problemStatements,
            { id: newId('ps'), title: '', summary: '', body: '', fileUrl: '' }
        ]);
        showStatus?.('Problem statement added.');
    };

    return (
        <div className="space-y-6">
            <div className="border-b-2 border-slate-200 pb-4">
                <h2 className="text-2xl font-black uppercase text-slate-900">Recruitment Portal</h2>
                <p className="text-xs font-bold text-slate-500 font-mono mt-1">
                    Static content for <code className="text-sky-600">#join</code>, split per subsystem.
                    Applications run through each subsystem&apos;s Google Form — this edits the intro, the
                    per-subsystem timelines and the problem statements shown around them. Changes sync
                    automatically; use <strong>☁ Sync Cloud</strong> above to push immediately.
                </p>
            </div>

            {/* Shared header */}
            <div className="p-5 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] space-y-3">
                <h3 className="text-lg font-black uppercase text-slate-900">Portal header (shared)</h3>
                <div>
                    <label className={labelClass}>Headline badge</label>
                    <input
                        className={input}
                        value={recruitment.headline || ''}
                        onChange={(e) => updateRecruitment({ headline: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClass}>Intro paragraph</label>
                    <textarea
                        rows={3}
                        className={input}
                        value={recruitment.intro || ''}
                        onChange={(e) => updateRecruitment({ intro: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClass}>Notice banner (optional — leave blank to hide)</label>
                    <textarea
                        rows={2}
                        className={input}
                        placeholder="e.g. Orientation is on 12 Sept — applications open right after."
                        value={recruitment.notice || ''}
                        onChange={(e) => updateRecruitment({ notice: e.target.value })}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className={labelClass}>Shared Google Form URL (fallback)</label>
                        <input
                            className={`${input} font-mono`}
                            placeholder={(siteData.hero?.joinFormUrl || '').trim() || 'https://forms.gle/…'}
                            value={recruitment.applyUrl || ''}
                            onChange={(e) => updateRecruitment({ applyUrl: e.target.value })}
                        />
                        <p className="text-[10px] font-mono font-bold text-slate-500 mt-1">
                            Used by any subsystem whose own form URL is blank. Blank here too falls back to
                            the Hero tab&apos;s Join Form URL.
                        </p>
                    </div>
                    <div>
                        <label className={labelClass}>Apply button label</label>
                        <input
                            className={input}
                            placeholder="Apply on the Google Form"
                            value={recruitment.applyLabel || ''}
                            onChange={(e) => updateRecruitment({ applyLabel: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Subsystem selector */}
            {tracks.length === 0 ? (
                <p className="p-4 bg-amber-50 border-2 border-amber-500 font-mono text-xs font-bold text-slate-600">
                    No recruitment tracks are configured. Reload the dashboard; the three subsystems seed
                    automatically.
                </p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {tracks.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setSelectedId(t.id)}
                            className={`px-4 py-2 border-2 border-slate-900 font-mono font-black text-xs uppercase cursor-pointer ${
                                t.id === track?.id
                                    ? 'bg-slate-900 text-white shadow-[2px_2px_0px_#0284c7]'
                                    : 'bg-white hover:bg-slate-100 text-slate-900'
                            }`}
                        >
                            {t.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Selected subsystem */}
            {track && (
                <div className="space-y-6">
                    {/* Track identity + form */}
                    <div className="p-5 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] space-y-3">
                        <h3 className="text-lg font-black uppercase text-slate-900">{track.name}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Display name</label>
                                <input
                                    className={input}
                                    value={track.name || ''}
                                    onChange={(e) => patchTrack(track.id, { name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Google Form URL for {track.name}</label>
                                <input
                                    className={`${input} font-mono`}
                                    placeholder={sharedFallback || 'https://forms.gle/…'}
                                    value={track.applyUrl || ''}
                                    onChange={(e) => patchTrack(track.id, { applyUrl: e.target.value })}
                                />
                                <p className="text-[10px] font-mono font-bold text-slate-500 mt-1">
                                    {track.applyUrl?.trim()
                                        ? 'This subsystem uses its own form.'
                                        : sharedFallback
                                            ? `Blank — falling back to the shared form (${sharedFallback}).`
                                            : 'Blank, and no shared form is set, so this subsystem’s Apply buttons stay hidden.'}
                                </p>
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Blurb (optional — one line under the title)</label>
                            <input
                                className={input}
                                value={track.blurb || ''}
                                onChange={(e) => patchTrack(track.id, { blurb: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="p-5 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] space-y-4">
                        <div>
                            <h3 className="text-lg font-black uppercase text-slate-900">
                                {track.name} — timeline
                            </h3>
                            <p className="text-[11px] font-mono font-bold text-slate-500 mt-1">
                                Each milestone with a date appears on this subsystem&apos;s tab, and its
                                countdown targets the next one. With no dated milestones the countdown is
                                hidden rather than showing an invented date.
                            </p>
                        </div>

                        {timeline.length === 0 && (
                            <p className="p-3 bg-slate-100 border-2 border-dashed border-slate-400 font-mono text-xs font-bold text-slate-500">
                                No milestones yet. Add the submission deadline (and any earlier dates) below.
                            </p>
                        )}

                        <div className="space-y-3">
                            {timeline.map((item, index) => (
                                <div
                                    key={item.id || index}
                                    className="p-3 bg-sky-50 border-2 border-slate-900 grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-3"
                                >
                                    <div className="space-y-2">
                                        <input
                                            className={input}
                                            value={item.label || ''}
                                            placeholder="Milestone label (e.g. Problem statement due)"
                                            onChange={(e) => patchListItem('timeline', timeline, index, { label: e.target.value })}
                                        />
                                        <input
                                            className={input}
                                            value={item.detail || ''}
                                            placeholder="One line shown under the label (optional)"
                                            onChange={(e) => patchListItem('timeline', timeline, index, { detail: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Date &amp; time (IST)</label>
                                        <input
                                            type="datetime-local"
                                            className={input}
                                            value={istInputValue(item.date)}
                                            onChange={(e) => patchListItem('timeline', timeline, index, { date: istInputToIso(e.target.value) })}
                                        />
                                        <p className="text-[10px] font-mono font-bold text-slate-500 mt-1">
                                            {item.date ? formatIstFull(item.date) : 'No date set — this milestone stays hidden.'}
                                        </p>
                                    </div>
                                    <div className="flex lg:flex-col items-center gap-1">
                                        <button
                                            type="button"
                                            disabled={index === 0}
                                            onClick={() => moveListItem('timeline', timeline, index, -1)}
                                            className="press px-1.5 py-0.5 bg-white hover:bg-slate-100 disabled:opacity-30 border-2 border-slate-900 cursor-pointer"
                                            title="Move earlier"
                                        >
                                            ▲
                                        </button>
                                        <button
                                            type="button"
                                            disabled={index === timeline.length - 1}
                                            onClick={() => moveListItem('timeline', timeline, index, 1)}
                                            className="press px-1.5 py-0.5 bg-white hover:bg-slate-100 disabled:opacity-30 border-2 border-slate-900 cursor-pointer"
                                            title="Move later"
                                        >
                                            ▼
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeListItem('timeline', timeline, index)}
                                            className="press px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 border-2 border-slate-900 text-rose-700 cursor-pointer"
                                            title="Delete this milestone"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button type="button" onClick={addTimelineItem} className={btnQuiet}>
                            + Add a milestone to {track.name}
                        </button>
                    </div>

                    {/* Problem statements */}
                    <div className="p-5 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] space-y-4">
                        <div>
                            <h3 className="text-lg font-black uppercase text-slate-900">
                                {track.name} — problem statements
                            </h3>
                            <p className="text-[11px] font-mono font-bold text-slate-500 mt-1">
                                Each entry becomes a card on this subsystem&apos;s tab. Add one or as many as
                                you need; nothing appears publicly until you add it.
                            </p>
                        </div>

                        {problemStatements.length === 0 && (
                            <p className="p-3 bg-slate-100 border-2 border-dashed border-slate-400 font-mono text-xs font-bold text-slate-500">
                                No problem statements yet. The tab shows a “stay tuned” note until you add one.
                            </p>
                        )}

                        <div className="space-y-4">
                            {problemStatements.map((ps, index) => (
                                <div key={ps.id || index} className="p-4 bg-sky-50 border-2 border-slate-900 space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="font-mono font-black text-[11px] uppercase text-sky-700">
                                            {track.name} · statement #{index + 1}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                disabled={index === 0}
                                                onClick={() => moveListItem('problemStatements', problemStatements, index, -1)}
                                                className="press px-1.5 py-0.5 bg-white hover:bg-slate-100 disabled:opacity-30 border-2 border-slate-900 cursor-pointer"
                                                title="Move up"
                                            >
                                                ▲
                                            </button>
                                            <button
                                                type="button"
                                                disabled={index === problemStatements.length - 1}
                                                onClick={() => moveListItem('problemStatements', problemStatements, index, 1)}
                                                className="press px-1.5 py-0.5 bg-white hover:bg-slate-100 disabled:opacity-30 border-2 border-slate-900 cursor-pointer"
                                                title="Move down"
                                            >
                                                ▼
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeListItem('problemStatements', problemStatements, index)}
                                                className={btnDanger}
                                                title="Delete this problem statement"
                                            >
                                                Delete ✕
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Title</label>
                                        <input
                                            className={input}
                                            placeholder="Short title for the brief"
                                            value={ps.title || ''}
                                            onChange={(e) => patchListItem('problemStatements', problemStatements, index, { title: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass}>Summary (one or two lines)</label>
                                        <textarea
                                            rows={2}
                                            className={input}
                                            value={ps.summary || ''}
                                            onChange={(e) => patchListItem('problemStatements', problemStatements, index, { summary: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass}>Full problem statement</label>
                                        <textarea
                                            rows={8}
                                            className={`${input} font-mono`}
                                            placeholder="The full brief. Line breaks and spacing are preserved on the portal."
                                            value={ps.body || ''}
                                            onChange={(e) => patchListItem('problemStatements', problemStatements, index, { body: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass}>Attachment / Reference Link URL (optional)</label>
                                        <input
                                            className={`${input} font-mono`}
                                            placeholder="https://drive.google.com/… or https://..."
                                            value={ps.fileUrl || ''}
                                            onChange={(e) => patchListItem('problemStatements', problemStatements, index, { fileUrl: e.target.value })}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button type="button" onClick={addProblemStatement} className={btnQuiet}>
                            + Add a problem statement to {track.name}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
