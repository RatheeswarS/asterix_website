import { useWebsiteData } from '../../context/WebsiteDataContext';
import { istInputValue, istInputToIso, formatIstFull } from '../../lib/istTime';

/**
 * Recruitment administration — static content editor.
 *
 * The recruitment portal no longer runs its own application pipeline: people
 * apply through the Google Form, and this tab only edits what the portal
 * displays around it — the intro copy, the induction timeline, and the
 * per-subsystem problem statements. All of it lives in the same `siteData`
 * blob as every other section, so it saves and syncs through the one debounced
 * path the dashboard already uses; there is no separate endpoint or token here.
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
    const timeline = Array.isArray(recruitment.timeline) ? recruitment.timeline : [];
    const problemStatements = Array.isArray(recruitment.problemStatements)
        ? recruitment.problemStatements
        : [];

    const subsystemNames = (siteData.subsystems || []).map((s) => s.name).filter(Boolean);
    const applyFallback = (siteData.hero?.joinFormUrl || '').trim();

    /* Generic list helpers. Each hands a whole new array back to the context so
       the debounced sync sees a single change, and the move helper clamps at the
       ends rather than wrapping. */
    const setList = (key, next) => updateRecruitment({ [key]: next });
    const patchItem = (key, list, index, fields) =>
        setList(key, list.map((item, i) => (i === index ? { ...item, ...fields } : item)));
    const removeItem = (key, list, index) => setList(key, list.filter((_, i) => i !== index));
    const moveItem = (key, list, index, delta) => {
        const target = index + delta;
        if (target < 0 || target >= list.length) return;
        const next = [...list];
        const [moved] = next.splice(index, 1);
        next.splice(target, 0, moved);
        setList(key, next);
    };

    const addTimelineItem = () => {
        setList('timeline', [...timeline, { id: newId('tl'), label: '', detail: '', date: '' }]);
        showStatus?.('Timeline milestone added.');
    };
    const addProblemStatement = () => {
        setList('problemStatements', [
            ...problemStatements,
            { id: newId('ps'), subsystem: '', title: '', summary: '', body: '', fileUrl: '' }
        ]);
        showStatus?.('Problem statement added.');
    };

    return (
        <div className="space-y-6">
            <div className="border-b-2 border-slate-200 pb-4">
                <h2 className="text-2xl font-black uppercase text-slate-900">Recruitment Portal</h2>
                <p className="text-xs font-bold text-slate-500 font-mono mt-1">
                    Static content for <code className="text-sky-600">#join</code>. Applications go through the
                    Google Form — this only edits the intro, the timeline and the problem statements shown
                    around it. Changes sync automatically; use <strong>☁ Sync Cloud</strong> above to push
                    immediately.
                </p>
            </div>

            {/* Intro & apply link */}
            <div className="p-5 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] space-y-3">
                <h3 className="text-lg font-black uppercase text-slate-900">Header &amp; application link</h3>
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
                        <label className={labelClass}>Google Form URL</label>
                        <input
                            className={`${input} font-mono`}
                            placeholder={applyFallback || 'https://forms.gle/…'}
                            value={recruitment.applyUrl || ''}
                            onChange={(e) => updateRecruitment({ applyUrl: e.target.value })}
                        />
                        <p className="text-[10px] font-mono font-bold text-slate-500 mt-1">
                            {recruitment.applyUrl?.trim()
                                ? 'Used for every “Apply” button on the portal.'
                                : applyFallback
                                    ? `Blank — falling back to the Hero tab’s Join Form URL (${applyFallback}).`
                                    : 'Blank, and no Hero Join Form URL is set, so the Apply buttons stay hidden.'}
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

            {/* Timeline */}
            <div className="p-5 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] space-y-4">
                <div>
                    <h3 className="text-lg font-black uppercase text-slate-900">Induction timeline</h3>
                    <p className="text-[11px] font-mono font-bold text-slate-500 mt-1">
                        Each milestone with a date appears on the portal, and the countdown targets the next
                        one — the problem-statement submission deadline is just the milestone you name it.
                        With no dated milestones, the countdown is hidden rather than showing an invented date.
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
                                    onChange={(e) => patchItem('timeline', timeline, index, { label: e.target.value })}
                                />
                                <input
                                    className={input}
                                    value={item.detail || ''}
                                    placeholder="One line shown under the label (optional)"
                                    onChange={(e) => patchItem('timeline', timeline, index, { detail: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Date &amp; time (IST)</label>
                                <input
                                    type="datetime-local"
                                    className={input}
                                    value={istInputValue(item.date)}
                                    onChange={(e) => patchItem('timeline', timeline, index, { date: istInputToIso(e.target.value) })}
                                />
                                <p className="text-[10px] font-mono font-bold text-slate-500 mt-1">
                                    {item.date ? formatIstFull(item.date) : 'No date set — this milestone stays hidden.'}
                                </p>
                            </div>
                            <div className="flex lg:flex-col items-center gap-1">
                                <button
                                    type="button"
                                    disabled={index === 0}
                                    onClick={() => moveItem('timeline', timeline, index, -1)}
                                    className="press px-1.5 py-0.5 bg-white hover:bg-slate-100 disabled:opacity-30 border-2 border-slate-900 cursor-pointer"
                                    title="Move earlier"
                                >
                                    ▲
                                </button>
                                <button
                                    type="button"
                                    disabled={index === timeline.length - 1}
                                    onClick={() => moveItem('timeline', timeline, index, 1)}
                                    className="press px-1.5 py-0.5 bg-white hover:bg-slate-100 disabled:opacity-30 border-2 border-slate-900 cursor-pointer"
                                    title="Move later"
                                >
                                    ▼
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeItem('timeline', timeline, index)}
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
                    + Add a milestone
                </button>
            </div>

            {/* Problem statements */}
            <div className="p-5 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] space-y-4">
                <div>
                    <h3 className="text-lg font-black uppercase text-slate-900">Problem statements</h3>
                    <p className="text-[11px] font-mono font-bold text-slate-500 mt-1">
                        Each entry becomes a card on the portal. List one per subsystem, or as many as you
                        need. Nothing appears publicly until you add it here.
                    </p>
                </div>

                <datalist id="asterix-subsystem-names">
                    {subsystemNames.map((name) => <option key={name} value={name} />)}
                </datalist>

                {problemStatements.length === 0 && (
                    <p className="p-3 bg-slate-100 border-2 border-dashed border-slate-400 font-mono text-xs font-bold text-slate-500">
                        No problem statements yet. The portal shows a “stay tuned” note until you add one.
                    </p>
                )}

                <div className="space-y-4">
                    {problemStatements.map((ps, index) => (
                        <div key={ps.id || index} className="p-4 bg-sky-50 border-2 border-slate-900 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-mono font-black text-[11px] uppercase text-sky-700">
                                    Statement #{index + 1}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        disabled={index === 0}
                                        onClick={() => moveItem('problemStatements', problemStatements, index, -1)}
                                        className="press px-1.5 py-0.5 bg-white hover:bg-slate-100 disabled:opacity-30 border-2 border-slate-900 cursor-pointer"
                                        title="Move up"
                                    >
                                        ▲
                                    </button>
                                    <button
                                        type="button"
                                        disabled={index === problemStatements.length - 1}
                                        onClick={() => moveItem('problemStatements', problemStatements, index, 1)}
                                        className="press px-1.5 py-0.5 bg-white hover:bg-slate-100 disabled:opacity-30 border-2 border-slate-900 cursor-pointer"
                                        title="Move down"
                                    >
                                        ▼
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeItem('problemStatements', problemStatements, index)}
                                        className={btnDanger}
                                        title="Delete this problem statement"
                                    >
                                        Delete ✕
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Subsystem / tag</label>
                                    <input
                                        className={input}
                                        list="asterix-subsystem-names"
                                        placeholder="e.g. Software & Perception"
                                        value={ps.subsystem || ''}
                                        onChange={(e) => patchItem('problemStatements', problemStatements, index, { subsystem: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Title</label>
                                    <input
                                        className={input}
                                        placeholder="Short title for the brief"
                                        value={ps.title || ''}
                                        onChange={(e) => patchItem('problemStatements', problemStatements, index, { title: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Summary (one or two lines)</label>
                                <textarea
                                    rows={2}
                                    className={input}
                                    value={ps.summary || ''}
                                    onChange={(e) => patchItem('problemStatements', problemStatements, index, { summary: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Full problem statement</label>
                                <textarea
                                    rows={8}
                                    className={`${input} font-mono`}
                                    placeholder="The full brief. Line breaks and spacing are preserved on the portal."
                                    value={ps.body || ''}
                                    onChange={(e) => patchItem('problemStatements', problemStatements, index, { body: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Attachment URL (optional)</label>
                                <input
                                    className={`${input} font-mono`}
                                    placeholder="https://drive.google.com/…"
                                    value={ps.fileUrl || ''}
                                    onChange={(e) => patchItem('problemStatements', problemStatements, index, { fileUrl: e.target.value })}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <button type="button" onClick={addProblemStatement} className={btnQuiet}>
                    + Add a problem statement
                </button>
            </div>
        </div>
    );
}
