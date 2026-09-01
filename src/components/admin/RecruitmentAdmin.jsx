import { useState, useEffect, useCallback } from 'react';
import { AUTH_TOKEN_KEY } from '../../context/WebsiteDataContext';
import { istInputValue, istInputToIso, formatIstFull } from '../../lib/istTime';
import {
    adminFetchConfig,
    adminSaveConfig,
    adminFetchApplications,
    adminUpdateApplication,
    adminBulkAdvance,
    adminFetchTeams,
    adminDrawTeams,
    adminPublishResults,
    adminExportCsv
} from '../../lib/recruitmentApi';

/**
 * Recruitment administration.
 *
 * Extracted from `AdminDashboard`, which was already past two thousand lines,
 * and pointed at `/api/recruitment/*` rather than at the site-data blob. The
 * schedule has to live behind its own endpoint because the server reads it to
 * decide whether a submission window is open -- a deadline that a general
 * content save could overwrite is not really a deadline.
 */

const SUB_TABS = [
    { id: 'schedule', label: 'Schedule' },
    { id: 'briefs', label: 'Briefs' },
    { id: 'applications', label: 'Applications' },
    { id: 'teams', label: 'Teams' },
    { id: 'results', label: 'Results' }
];

const STAGE_OPTIONS = {
    'software-perception': ['APPLIED', 'TEAM_ASSIGNED', 'PHASE_1_SUBMITTED', 'PHASE_2_SUBMITTED', 'INTERVIEW', 'CONCLUDED'],
    powertrain: ['APPLIED', 'TEST_ABSENT', 'TEST_FAILED', 'TEST_PASSED', 'TEAM_ASSIGNED', 'SOLUTION_SUBMITTED', 'INTERVIEW', 'CONCLUDED'],
    mechanical: ['APPLIED', 'SOLUTION_SUBMITTED', 'INTERVIEW', 'CONCLUDED']
};

const STATUS_OPTIONS = ['ACTIVE', 'WITHDRAWN', 'REJECTED', 'SELECTED'];

const btn = 'press font-mono font-black text-[11px] uppercase border-2 border-slate-900 cursor-pointer px-3 py-1.5';
const btnPrimary = `${btn} bg-sky-500 hover:bg-sky-400 text-white shadow-[2px_2px_0px_#0f172a]`;
const btnQuiet = `${btn} bg-white hover:bg-slate-100 text-slate-900 shadow-[2px_2px_0px_#0f172a]`;
const btnDanger = `${btn} bg-rose-400 hover:bg-rose-300 text-slate-900 shadow-[2px_2px_0px_#0f172a]`;
const input = 'w-full px-2 py-1.5 border-2 border-slate-900 bg-white text-xs';

export default function RecruitmentAdmin({ showStatus }) {
    const [subTab, setSubTab] = useState('schedule');
    const [config, setConfig] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);

    const report = useCallback((err) => {
        setError(err.message || String(err));
    }, []);

    const loadConfig = useCallback(async () => {
        if (!token) return;
        setBusy(true);
        try {
            setConfig(await adminFetchConfig(token));
            setError('');
        } catch (err) {
            report(err);
        } finally {
            setBusy(false);
        }
    }, [token, report]);

    useEffect(() => { loadConfig(); }, [loadConfig]);

    if (!token) {
        return (
            <div className="p-6 bg-amber-50 border-4 border-amber-500">
                <h3 className="font-black uppercase text-slate-900 mb-1">Sign in first</h3>
                <p className="text-xs font-bold text-slate-600 font-mono">
                    Recruitment data is only reachable with an authenticated session. Log out and back in
                    if this persists.
                </p>
            </div>
        );
    }

    const patchTrack = (trackId, fields) => {
        setConfig((prev) => ({
            ...prev,
            tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, ...fields } : t))
        }));
    };

    const patchStage = (trackId, stageIndex, fields) => {
        setConfig((prev) => ({
            ...prev,
            tracks: prev.tracks.map((t) =>
                t.id === trackId
                    ? { ...t, stages: t.stages.map((s, i) => (i === stageIndex ? { ...s, ...fields } : s)) }
                    : t
            )
        }));
    };

    /* Stages were fixed at whatever the seed shipped: the schedule could be
       retimed but not reshaped, so adding a shortlist announcement or dropping
       a round meant a code change. `submissionPhase` stays read-only, though --
       the phase ids are namespaced per track and the server matches submissions
       against them, so a typo here would silently orphan real work. */
    const withStages = (trackId, fn) => {
        setConfig((prev) => ({
            ...prev,
            tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, stages: fn([...(t.stages || [])]) } : t))
        }));
    };

    const addStage = (trackId) => withStages(trackId, (stages) => [
        ...stages,
        {
            // Suffixed with a timestamp because stage ids are the React key and
            // the server's own handle on a stage; two stages sharing one would
            // make edits land on the wrong row.
            id: `${trackId.slice(0, 2)}-stage-${Date.now().toString(36)}`,
            label: 'New stage',
            detail: '',
            opensAt: '',
            closesAt: '',
            submissionPhase: null
        }
    ]);

    const removeStage = (trackId, index) => withStages(trackId, (stages) => {
        const stage = stages[index];
        if (stage?.submissionPhase && !window.confirm(
            `"${stage.label}" is the window the server accepts ${stage.submissionPhase} submissions against.

`
            + 'Deleting it stops that phase being submittable at all. Continue?'
        )) {
            return stages;
        }
        return stages.filter((_, i) => i !== index);
    });

    const moveStage = (trackId, index, delta) => withStages(trackId, (stages) => {
        const target = index + delta;
        if (target < 0 || target >= stages.length) return stages;
        const [moved] = stages.splice(index, 1);
        stages.splice(target, 0, moved);
        return stages;
    });

    const saveConfig = async () => {
        setBusy(true);
        try {
            await adminSaveConfig(token, {
                headline: config.headline,
                intro: config.intro,
                notice: config.notice,
                resultsNote: config.resultsNote,
                briefsLaunchAt: config.briefsLaunchAt || '',
                stayTunedMessage: config.stayTunedMessage || '',
                tracks: config.tracks
            });
            window.dispatchEvent(new Event('asterix_recruitment_config_updated'));
            showStatus?.('Recruitment schedule saved.');
            setError('');
            await loadConfig();
        } catch (err) {
            report(err);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="border-b-2 border-slate-200 pb-4">
                <h2 className="text-2xl font-black uppercase text-slate-900">Recruitment Control</h2>
                <p className="text-xs font-bold text-slate-500 font-mono mt-1">
                    Per-track schedules, gated briefs, applications, random team draws and result publishing.
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                {SUB_TABS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setSubTab(t.id)}
                        className={`px-4 py-2 border-2 border-slate-900 font-mono font-black text-xs uppercase cursor-pointer ${
                            subTab === t.id
                                ? 'bg-slate-900 text-white shadow-[2px_2px_0px_#0284c7]'
                                : 'bg-white hover:bg-slate-100 text-slate-900'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {error && (
                <p role="alert" className="p-3 bg-rose-100 border-2 border-rose-500 font-mono text-xs font-bold text-rose-800">
                    {error}
                </p>
            )}

            {!config && busy && (
                <p className="p-4 bg-slate-100 border-2 border-slate-400 font-mono text-xs font-bold text-slate-600">
                    Loading recruitment configuration…
                </p>
            )}

            {config && subTab === 'schedule' && (
                <ScheduleTab
                    config={config}
                    busy={busy}
                    onPatchTrack={patchTrack}
                    onPatchStage={patchStage}
                    onAddStage={addStage}
                    onRemoveStage={removeStage}
                    onMoveStage={moveStage}
                    onSave={saveConfig}
                    onSetConfig={setConfig}
                />
            )}

            {config && subTab === 'briefs' && (
                <BriefsTab config={config} busy={busy} onPatchTrack={patchTrack} onSave={saveConfig} />
            )}

            {config && subTab === 'applications' && (
                <ApplicationsTab token={token} config={config} showStatus={showStatus} onError={report} />
            )}

            {config && subTab === 'teams' && (
                <TeamsTab token={token} config={config} showStatus={showStatus} onError={report} />
            )}

            {config && subTab === 'results' && (
                <ResultsTab token={token} config={config} showStatus={showStatus} onError={report} onReload={loadConfig} />
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */

function ScheduleTab({ config, busy, onPatchTrack, onPatchStage, onAddStage, onRemoveStage, onMoveStage, onSave, onSetConfig }) {
    /* Mirrors `briefsAreLive` on the server: an empty or unparseable date means
       released, so an unset field can never hide the statements indefinitely.
       The clock is state rather than a `Date.now()` read during render, so the
       badge flips on its own when the moment passes instead of staying wrong
       until something else happens to re-render the tab. */
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(id);
    }, []);
    const launchMs = new Date(config.briefsLaunchAt || 0).getTime();
    const briefsLive = !config.briefsLaunchAt || Number.isNaN(launchMs) || now >= launchMs;

    return (
        <div className="space-y-6">
            <div className="p-5 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] space-y-3">
                <div>
                    <label className="block text-xs font-mono font-black uppercase text-slate-700 mb-1">Headline</label>
                    <input
                        className={input}
                        value={config.headline || ''}
                        onChange={(e) => onSetConfig((p) => ({ ...p, headline: e.target.value }))}
                    />
                </div>
                <div>
                    <label className="block text-xs font-mono font-black uppercase text-slate-700 mb-1">Intro</label>
                    <textarea
                        rows={2}
                        className={input}
                        value={config.intro || ''}
                        onChange={(e) => onSetConfig((p) => ({ ...p, intro: e.target.value }))}
                    />
                </div>
                <div>
                    <label className="block text-xs font-mono font-black uppercase text-slate-700 mb-1">
                        Notice banner
                    </label>
                    <textarea
                        rows={2}
                        className={input}
                        placeholder="Shown in a highlighted box above the track cards. Leave empty to hide it."
                        value={config.notice || ''}
                        onChange={(e) => onSetConfig((p) => ({ ...p, notice: e.target.value }))}
                    />
                    <p className="text-[11px] font-mono font-bold text-slate-500 mt-1">
                        Currently announcing the orientation. Clear this once applications are open.
                    </p>
                </div>
            </div>

            {/* One control for the whole cycle: when the problem statements stop
                reading "stay tuned". Kept at the top of the tab because it is the
                thing most likely to be changed in a hurry. */}
            <div className="p-5 bg-amber-50 border-4 border-slate-900 shadow-[6px_6px_0px_#f59e0b] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-black uppercase text-slate-900">Problem statement release</h3>
                    <span className={`px-2 py-1 border-2 border-slate-900 font-mono font-black text-[10px] uppercase ${
                        briefsLive ? 'bg-emerald-400 text-slate-900' : 'bg-slate-200 text-slate-600'
                    }`}>
                        {briefsLive ? 'Released' : 'Stay tuned'}
                    </span>
                </div>
                <p className="text-[11px] font-mono font-bold text-slate-600">
                    Until this moment passes, every track&apos;s problem statement is withheld by the server and
                    the portal shows the message below in its place. Track cards, timelines and the
                    application forms stay visible throughout.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] font-mono font-black uppercase text-slate-600 mb-1">
                            Statements go live (IST)
                        </label>
                        <input
                            type="datetime-local"
                            className={input}
                            value={istInputValue(config.briefsLaunchAt)}
                            onChange={(e) => onSetConfig((p) => ({ ...p, briefsLaunchAt: istInputToIso(e.target.value) }))}
                        />
                        <p className="text-[10px] font-mono font-bold text-slate-500 mt-1">
                            {config.briefsLaunchAt
                                ? formatIstFull(config.briefsLaunchAt)
                                : 'Empty means released right now.'}
                        </p>
                    </div>
                    <div className="flex items-end gap-2">
                        <button
                            type="button"
                            onClick={() => onSetConfig((p) => ({ ...p, briefsLaunchAt: '' }))}
                            className={btnPrimary}
                            title="Clears the date so the statements publish immediately on save."
                        >
                            Release now
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-mono font-black uppercase text-slate-600 mb-1">
                        &ldquo;Stay tuned&rdquo; message
                    </label>
                    <textarea
                        rows={2}
                        className={input}
                        placeholder="Shown where each problem statement will appear, until the moment above."
                        value={config.stayTunedMessage || ''}
                        onChange={(e) => onSetConfig((p) => ({ ...p, stayTunedMessage: e.target.value }))}
                    />
                </div>
            </div>

            {config.tracks.map((track) => (
                <div key={track.id} className="p-5 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-slate-200">
                        <h3 className="text-lg font-black uppercase text-slate-900">{track.name}</h3>
                        <label className="flex items-center gap-2 font-mono text-[11px] font-black uppercase text-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={track.enabled !== false}
                                onChange={(e) => onPatchTrack(track.id, { enabled: e.target.checked })}
                                className="w-4 h-4 border-2 border-slate-900 accent-slate-900 cursor-pointer"
                            />
                            Recruiting this cycle
                        </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-mono font-black uppercase text-slate-600 mb-1">
                                Track name (shown on the portal)
                            </label>
                            <input
                                className={input}
                                value={track.name || ''}
                                onChange={(e) => onPatchTrack(track.id, { name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-mono font-black uppercase text-slate-600 mb-1">
                                Card blurb
                            </label>
                            <input
                                className={input}
                                value={track.blurb || ''}
                                onChange={(e) => onPatchTrack(track.id, { blurb: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-mono font-black uppercase text-slate-600 mb-1">
                                Applications open (IST)
                            </label>
                            <input
                                type="datetime-local"
                                className={input}
                                value={istInputValue(track.applyOpensAt)}
                                onChange={(e) => onPatchTrack(track.id, { applyOpensAt: istInputToIso(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-mono font-black uppercase text-slate-600 mb-1">
                                Applications close (IST)
                            </label>
                            <input
                                type="datetime-local"
                                className={input}
                                value={istInputValue(track.applyClosesAt)}
                                onChange={(e) => onPatchTrack(track.id, { applyClosesAt: istInputToIso(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div>
                        <span className="block text-xs font-mono font-black uppercase text-slate-900 mb-1">Stages</span>
                        <p className="text-[11px] font-mono font-bold text-slate-500 mb-3">
                            Stages carrying a submission phase are the ones the server accepts work against.
                            Closing one immediately stops new submissions, whatever a candidate&apos;s own clock says.
                        </p>

                        <div className="space-y-3">
                            {track.stages.map((stage, index) => (
                                <div key={stage.id} className="p-3 bg-sky-50 border-2 border-slate-900 grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-3">
                                    <div className="space-y-2">
                                        <input
                                            className={input}
                                            value={stage.label || ''}
                                            placeholder="Stage label"
                                            onChange={(e) => onPatchStage(track.id, index, { label: e.target.value })}
                                        />
                                        <input
                                            className={input}
                                            value={stage.detail || ''}
                                            placeholder="One line shown under the label"
                                            onChange={(e) => onPatchStage(track.id, index, { detail: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <label className="block text-[10px] font-mono font-black uppercase text-slate-600 mb-0.5">Opens (IST)</label>
                                            <input
                                                type="datetime-local"
                                                className={input}
                                                value={istInputValue(stage.opensAt)}
                                                onChange={(e) => onPatchStage(track.id, index, { opensAt: istInputToIso(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-mono font-black uppercase text-slate-600 mb-0.5">Closes (IST)</label>
                                            <input
                                                type="datetime-local"
                                                className={input}
                                                value={istInputValue(stage.closesAt)}
                                                onChange={(e) => onPatchStage(track.id, index, { closesAt: istInputToIso(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div className="font-mono text-[10px] font-black uppercase text-slate-500 lg:w-32 space-y-2">
                                        <div>
                                            <span className="block mb-1">Phase</span>
                                            <span className="px-2 py-1 bg-white border-2 border-slate-300 block break-all">
                                                {stage.submissionPhase || 'none'}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            <button
                                                type="button"
                                                disabled={index === 0}
                                                onClick={() => onMoveStage(track.id, index, -1)}
                                                className="press px-1.5 py-0.5 bg-white hover:bg-slate-100 disabled:opacity-30 border-2 border-slate-900 cursor-pointer"
                                                title="Move earlier in the process"
                                            >
                                                ▲
                                            </button>
                                            <button
                                                type="button"
                                                disabled={index === track.stages.length - 1}
                                                onClick={() => onMoveStage(track.id, index, 1)}
                                                className="press px-1.5 py-0.5 bg-white hover:bg-slate-100 disabled:opacity-30 border-2 border-slate-900 cursor-pointer"
                                                title="Move later in the process"
                                            >
                                                ▼
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onRemoveStage(track.id, index)}
                                                className="press px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 border-2 border-slate-900 text-rose-700 cursor-pointer"
                                                title="Delete this stage"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => onAddStage(track.id)}
                            className={`${btnQuiet} mt-3`}
                        >
                            + Add a stage to {track.name}
                        </button>
                    </div>
                </div>
            ))}

            <button type="button" disabled={busy} onClick={onSave} className={btnPrimary}>
                {busy ? 'Saving…' : 'Save schedule →'}
            </button>
        </div>
    );
}

/* ------------------------------------------------------------------ */

function BriefsTab({ config, busy, onPatchTrack, onSave }) {
    const patchBrief = (track, fields) => onPatchTrack(track.id, { brief: { ...track.brief, ...fields } });

    return (
        <div className="space-y-6">
            {config.tracks.map((track) => (
                <div key={track.id} className="p-5 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-slate-200">
                        <h3 className="text-lg font-black uppercase text-slate-900">{track.name}</h3>
                        <label className="flex items-center gap-2 font-mono text-[11px] font-black uppercase text-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={track.brief?.gated !== false}
                                onChange={(e) => patchBrief(track, { gated: e.target.checked })}
                                className="w-4 h-4 border-2 border-slate-900 accent-slate-900 cursor-pointer"
                            />
                            Gated
                        </label>
                    </div>

                    <p className="text-[11px] font-mono font-bold text-slate-500">
                        Gated means the body below never appears in the public config. Only an applicant on
                        this track who has reached{' '}
                        <strong className="text-slate-900">{track.brief?.gatedToStage || 'TEAM_ASSIGNED'}</strong>{' '}
                        receives it, through their own application page.
                    </p>

                    <div>
                        <label className="block text-[10px] font-mono font-black uppercase text-slate-600 mb-1">Title</label>
                        <input className={input} value={track.brief?.title || ''} onChange={(e) => patchBrief(track, { title: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-mono font-black uppercase text-slate-600 mb-1">
                            Public description (always visible)
                        </label>
                        <textarea rows={2} className={input} value={track.brief?.description || ''} onChange={(e) => patchBrief(track, { description: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-mono font-black uppercase text-slate-600 mb-1">Deliverables</label>
                        <textarea rows={2} className={input} value={track.brief?.deliverables || ''} onChange={(e) => patchBrief(track, { deliverables: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-mono font-black uppercase text-slate-600 mb-1">
                            Problem statement body {track.brief?.gated !== false && <span className="text-rose-600">(withheld from the public config)</span>}
                        </label>
                        <textarea rows={10} className={`${input} font-mono`} value={track.brief?.bodyMarkdown || ''} onChange={(e) => patchBrief(track, { bodyMarkdown: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-mono font-black uppercase text-slate-600 mb-1">
                            Written test portions (optional, always public once released)
                        </label>
                        <textarea
                            rows={6}
                            className={`${input} font-mono`}
                            placeholder="The syllabus candidates revise from. Shown to everyone on this track from the release moment, even when the statement above stays gated. Leave empty for tracks with no written test."
                            value={track.brief?.portions || ''}
                            onChange={(e) => patchBrief(track, { portions: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-mono font-black uppercase text-slate-600 mb-1">
                            Attachment URL (optional)
                        </label>
                        <input className={input} placeholder="https://drive.google.com/…" value={track.brief?.fileUrl || ''} onChange={(e) => patchBrief(track, { fileUrl: e.target.value })} />
                    </div>
                </div>
            ))}

            <button type="button" disabled={busy} onClick={onSave} className={btnPrimary}>
                {busy ? 'Saving…' : 'Save briefs →'}
            </button>
        </div>
    );
}

/* ------------------------------------------------------------------ */

function ApplicationsTab({ token, config, showStatus, onError }) {
    const [filters, setFilters] = useState({ track: '', stage: '', status: '', q: '' });
    const [data, setData] = useState({ items: [], total: 0 });
    const [busy, setBusy] = useState(false);
    const [bulkCodes, setBulkCodes] = useState('');

    const load = useCallback(async () => {
        setBusy(true);
        try {
            setData(await adminFetchApplications(token, filters));
        } catch (err) {
            onError(err);
        } finally {
            setBusy(false);
        }
    }, [token, filters, onError]);

    useEffect(() => { load(); }, [load]);

    const update = async (id, payload) => {
        try {
            await adminUpdateApplication(token, id, payload);
            showStatus?.('Application updated.');
            load();
        } catch (err) {
            onError(err);
        }
    };

    const runBulkAdvance = async (passed) => {
        const refCodes = bulkCodes.split(/[\s,;]+/).map((c) => c.trim()).filter(Boolean);
        if (refCodes.length === 0) return;
        try {
            const result = await adminBulkAdvance(token, { track: 'powertrain', refCodes, passed });
            showStatus?.(result.message);
            setBulkCodes('');
            load();
        } catch (err) {
            onError(err);
        }
    };

    return (
        <div className="space-y-5">
            <div className="p-4 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] grid grid-cols-1 sm:grid-cols-4 gap-3">
                <select className={input} value={filters.track} onChange={(e) => setFilters({ ...filters, track: e.target.value, stage: '' })}>
                    <option value="">All tracks</option>
                    {config.tracks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <select className={input} value={filters.stage} onChange={(e) => setFilters({ ...filters, stage: e.target.value })}>
                    <option value="">All stages</option>
                    {(STAGE_OPTIONS[filters.track] || [...new Set(Object.values(STAGE_OPTIONS).flat())]).map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
                <select className={input} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                    <option value="">All statuses</option>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input className={input} placeholder="Name, email, ref, roll" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs font-black uppercase text-slate-600">
                    {busy ? 'Loading…' : `${data.total} application(s)`}
                </span>
                <button type="button" onClick={load} className={btnQuiet}>Refresh</button>
                <button
                    type="button"
                    onClick={() => adminExportCsv(token, filters.track).catch(onError)}
                    className={btnQuiet}
                >
                    Export CSV
                </button>
            </div>

            {/* Powertrain written-test entry */}
            <div className="p-4 bg-amber-50 border-4 border-slate-900">
                <h4 className="font-black uppercase text-sm text-slate-900 mb-1">Powertrain written test</h4>
                <p className="text-[11px] font-mono font-bold text-slate-600 mb-3">
                    Paste the reference codes of everyone who cleared the test. Codes belonging to another
                    track are ignored rather than advanced.
                </p>
                <textarea
                    rows={3}
                    className={`${input} font-mono`}
                    placeholder="ASX-PT-0101, ASX-PT-0244, ASX-PT-0388"
                    value={bulkCodes}
                    onChange={(e) => setBulkCodes(e.target.value)}
                />
                <div className="flex flex-wrap gap-2 mt-3">
                    <button type="button" onClick={() => runBulkAdvance(true)} className={btnPrimary}>Mark as cleared</button>
                    <button type="button" onClick={() => runBulkAdvance(false)} className={btnDanger}>Mark as not cleared</button>
                </div>
            </div>

            <div className="overflow-x-auto border-4 border-slate-900">
                <table className="w-full text-xs bg-white">
                    <thead className="bg-slate-900 text-white font-mono">
                        <tr>
                            {['Ref', 'Name', 'Track', 'Stage', 'Status', 'Subs', 'Actions'].map((h) => (
                                <th key={h} className="px-3 py-2 text-left font-black uppercase text-[10px] whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.items.length === 0 && !busy && (
                            <tr><td colSpan={7} className="px-3 py-6 text-center font-mono font-bold text-slate-500">No applications match these filters.</td></tr>
                        )}
                        {data.items.map((a) => (
                            <tr key={a.id} className="border-t-2 border-slate-200 align-top">
                                <td className="px-3 py-2 font-mono font-black whitespace-nowrap">{a.refCode}</td>
                                <td className="px-3 py-2">
                                    <span className="font-bold block">{a.name}</span>
                                    <span className="font-mono text-[10px] text-slate-500 block">{a.email}</span>
                                    {a.rollNumber && <span className="font-mono text-[10px] text-slate-500 block">{a.rollNumber}</span>}
                                </td>
                                <td className="px-3 py-2 font-mono text-[10px] whitespace-nowrap">{a.track}</td>
                                <td className="px-3 py-2">
                                    <select
                                        className="px-1.5 py-1 border-2 border-slate-300 text-[10px] font-mono bg-white cursor-pointer"
                                        value={a.stage}
                                        onChange={(e) => update(a.id, { stage: e.target.value })}
                                    >
                                        {(STAGE_OPTIONS[a.track] || []).map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </td>
                                <td className="px-3 py-2">
                                    <select
                                        className="px-1.5 py-1 border-2 border-slate-300 text-[10px] font-mono bg-white cursor-pointer"
                                        value={a.status}
                                        onChange={(e) => update(a.id, { status: e.target.value })}
                                    >
                                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </td>
                                <td className="px-3 py-2">
                                    {a.submissions.length === 0
                                        ? <span className="font-mono text-[10px] text-slate-400">—</span>
                                        : (
                                            <a
                                                href={a.submissions.at(-1).url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-mono text-[10px] text-sky-700 underline"
                                            >
                                                {a.submissions.length} · latest ↗
                                            </a>
                                        )}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                    <button
                                        type="button"
                                        onClick={() => update(a.id, { status: 'SELECTED', stage: 'CONCLUDED' })}
                                        className="press px-2 py-1 bg-emerald-400 hover:bg-emerald-300 border-2 border-slate-900 font-mono font-black text-[10px] uppercase cursor-pointer"
                                    >
                                        Select
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */

function TeamsTab({ token, config, showStatus, onError }) {
    const teamTracks = config.tracks.filter((t) => t.id !== 'mechanical');
    const [track, setTrack] = useState(teamTracks[0]?.id || '');
    const [teamSize, setTeamSize] = useState(4);
    const [seed, setSeed] = useState('');
    const [teams, setTeams] = useState([]);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        if (!track) return;
        setBusy(true);
        try {
            setTeams(await adminFetchTeams(token, track));
        } catch (err) {
            onError(err);
        } finally {
            setBusy(false);
        }
    }, [token, track, onError]);

    useEffect(() => { load(); }, [load]);

    const draw = async (confirmRedraw) => {
        setBusy(true);
        try {
            const result = await adminDrawTeams(token, {
                track,
                teamSize: Number(teamSize),
                seed: seed.trim() || undefined,
                confirmRedraw
            });
            showStatus?.(result.message);
            setSeed(result.seed);
            await load();
        } catch (err) {
            if (err.body?.requiresConfirmation) {
                if (window.confirm(`${err.message}\n\nProceed and re-draw?`)) {
                    await draw(true);
                    return;
                }
            } else {
                onError(err);
            }
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="p-5 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] space-y-3">
                <h4 className="font-black uppercase text-sm text-slate-900">Random team draw</h4>
                <p className="text-[11px] font-mono font-bold text-slate-600">
                    Software &amp; Perception draws from everyone who applied. Powertrain draws only from
                    those marked as having cleared the written test. The two pools are never combined, and
                    the route refuses a draw that would mix them.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-[10px] font-mono font-black uppercase text-slate-600 mb-1">Track</label>
                        <select className={input} value={track} onChange={(e) => setTrack(e.target.value)}>
                            {teamTracks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-mono font-black uppercase text-slate-600 mb-1">Team size</label>
                        <input type="number" min={1} max={12} className={input} value={teamSize} onChange={(e) => setTeamSize(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-mono font-black uppercase text-slate-600 mb-1">Seed (optional)</label>
                        <input className={`${input} font-mono`} placeholder="Blank generates one" value={seed} onChange={(e) => setSeed(e.target.value)} />
                    </div>
                </div>

                <button type="button" disabled={busy} onClick={() => draw(false)} className={btnPrimary}>
                    {busy ? 'Drawing…' : 'Draw teams →'}
                </button>
            </div>

            <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-black uppercase text-slate-600">{teams.length} team(s)</span>
                <button type="button" onClick={load} className={btnQuiet}>Refresh</button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {teams.map((team) => (
                    <div key={team.id} className="p-4 bg-white border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a]">
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <h5 className="font-black uppercase text-slate-900">{team.teamCode}</h5>
                            <span className="px-2 py-0.5 bg-slate-900 text-white font-mono font-black text-[10px] uppercase">
                                {team.stage}
                            </span>
                        </div>
                        <ul className="space-y-1 mb-3">
                            {team.members.map((m) => (
                                <li key={m.refCode} className="font-mono text-[11px] text-slate-700">
                                    {m.refCode} · {m.name}
                                </li>
                            ))}
                        </ul>
                        {team.submissions.length > 0 && (
                            <a
                                href={team.submissions.at(-1).url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-[11px] text-sky-700 underline block mb-2"
                            >
                                Latest submission ({team.submissions.length}) ↗
                            </a>
                        )}
                        <p className="font-mono text-[10px] text-slate-400 break-all">
                            seed {team.drawSeed} · drawn {formatIstFull(team.drawnAt)}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */

function ResultsTab({ token, config, showStatus, onError, onReload }) {
    const [drafts, setDrafts] = useState(() =>
        Object.fromEntries(config.tracks.map((t) => [t.id, t.resultsBody || '']))
    );

    const publish = async (trackId, published) => {
        try {
            const result = await adminPublishResults(token, {
                track: trackId,
                published,
                resultsBody: drafts[trackId]
            });
            showStatus?.(result.message);
            onReload();
        } catch (err) {
            onError(err);
        }
    };

    return (
        <div className="space-y-6">
            <p className="p-3 bg-sky-50 border-2 border-sky-600 font-mono text-[11px] font-bold text-sky-900">
                Nothing here reaches a visitor until it is published. An unpublished result is withheld by
                the server, not merely hidden by the page, so the 20 September embargo holds even against
                someone reading the API directly.
            </p>

            {config.tracks.map((track) => (
                <div key={track.id} className="p-5 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-slate-200">
                        <h3 className="text-lg font-black uppercase text-slate-900">{track.name}</h3>
                        <span className={`px-2 py-1 border-2 border-slate-900 font-mono font-black text-[10px] uppercase ${
                            track.resultsPublished ? 'bg-emerald-400 text-slate-900' : 'bg-slate-200 text-slate-600'
                        }`}>
                            {track.resultsPublished ? 'Published' : 'Not published'}
                        </span>
                    </div>

                    <textarea
                        rows={6}
                        className={input}
                        placeholder="Who advanced, what happens next, when to arrive."
                        value={drafts[track.id] ?? ''}
                        onChange={(e) => setDrafts({ ...drafts, [track.id]: e.target.value })}
                    />

                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => publish(track.id, true)} className={btnPrimary}>
                            Save &amp; publish
                        </button>
                        <button type="button" onClick={() => publish(track.id, false)} className={btnDanger}>
                            Unpublish
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
