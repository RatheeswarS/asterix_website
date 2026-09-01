import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    useRecruitmentCountdown,
    RecruitmentCountdownBoard,
    RecruitmentCountdownStrip,
} from './RecruitmentCountdown';
import TrackSelector from './recruitment/TrackSelector';
import TrackTimeline from './recruitment/TrackTimeline';
import ApplyForm from './recruitment/ApplyForm';
import StatusLookup from './recruitment/StatusLookup';
import ResultsBoard from './recruitment/ResultsBoard';
import { fetchRecruitmentConfig, loadCredential, warmUpBackend } from '../lib/recruitmentApi';
import { formatIstFull } from '../lib/istTime';
import teamLogo from '../assets/Screenshot 2026-08-26 232320.png';

/**
 * The recruitment portal.
 *
 * The 2026-27 cycle runs three genuinely different selection processes on three
 * separate clocks, so the page is organised by track rather than by a single
 * shared roadmap: pick a subsystem and you get that subsystem's timeline, its
 * brief, its application form and its results, and nothing belonging to the
 * other two.
 *
 * The schedule comes from `/api/recruitment/config`, which is also what the
 * server enforces against. Gated problem statements never appear in that
 * response at all -- an entitled candidate receives theirs through the status
 * lookup instead -- so no amount of poking at this page reveals a brief the
 * viewer has not earned.
 */

/* Results are deliberately not one of these. They are published once, for every
   track at the same time, and the page already carries a single "Results &
   Shortlists" section at the bottom. Giving the tab bar its own copy rendered
   the same board twice on one screen. The tab row instead offers an anchor down
   to that one section. */
const VIEWS = [
    { id: 'timeline', label: 'Process & Dates' },
    { id: 'apply', label: 'Apply' },
    { id: 'status', label: 'My Application' }
];

export default function RecruitmentPage({ onBack }) {
    const [config, setConfig] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    /* Difference between this browser's clock and the server's, measured on
       every config fetch. Everything on this page that says "open" or "closed"
       is computed against the server's clock through this, because the server
       is what actually accepts or refuses a submission. */
    const [clockOffsetMs, setClockOffsetMs] = useState(0);
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    const [selectedTrackId, setSelectedTrackId] = useState(null);
    const [isCountdownDocked, setIsCountdownDocked] = useState(false);
    const [storedCredential] = useState(() => loadCredential());
    // A candidate who has already applied lands on their own application
    // rather than on the marketing copy they have read once already.
    const [view, setView] = useState(storedCredential ? 'status' : 'timeline');

    useEffect(() => {
        window.scrollTo(0, 0);
        if (window.lenis) {
            window.lenis.scrollTo(0, { immediate: true });
        }
        // Render's free tier sleeps after ~15 minutes idle; waking it now means
        // the first real request is not the one that waits a minute.
        warmUpBackend();
    }, []);

    const loadConfig = useCallback(async (isSilent = false) => {
        if (!isSilent) setIsLoading(true);
        const sentAt = Date.now();
        try {
            const data = await fetchRecruitmentConfig();
            const receivedAt = Date.now();
            if (data.serverTime) {
                const serverMs = new Date(data.serverTime).getTime();
                if (!Number.isNaN(serverMs)) {
                    /* The server stamps `serverTime` when it builds the response,
                       so the round trip is split in half to place that instant
                       against the local clock. On a Render cold start the trip
                       can be a minute; halving it keeps the estimate honest
                       rather than pushing the offset a full minute out. */
                    setClockOffsetMs(serverMs + (receivedAt - sentAt) / 2 - receivedAt);
                }
            }
            setConfig(data);
            setLoadError('');
            setLastSyncedAt(new Date(receivedAt));
            setSelectedTrackId((current) => current || data.tracks[0]?.id || null);
        } catch (err) {
            // A failed background poll keeps the schedule already on screen.
            if (!isSilent) setLoadError(err.message);
        } finally {
            if (!isSilent) setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadConfig(false); }, [loadConfig]);

    /* The admin edits the schedule through `/api/recruitment/config`, and this
       page used to read it once at mount -- so a deadline moved during an open
       session stayed wrong on every tab already looking at it. It now re-reads
       on a slow poll and whenever the tab is brought back to the front, which
       matches how the main site's data context already behaves. */
    useEffect(() => {
        const poll = setInterval(() => loadConfig(true), 60000);
        const onFocus = () => {
            if (document.visibilityState !== 'hidden') loadConfig(true);
        };
        const onCustomUpdate = () => loadConfig(true);

        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onFocus);
        window.addEventListener('asterix_recruitment_config_updated', onCustomUpdate);
        return () => {
            clearInterval(poll);
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onFocus);
            window.removeEventListener('asterix_recruitment_config_updated', onCustomUpdate);
        };
    }, [loadConfig]);

    const tracks = useMemo(() => config?.tracks || [], [config]);
    const selectedTrack = useMemo(
        () => tracks.find((t) => t.id === selectedTrackId) || tracks[0] || null,
        [tracks, selectedTrackId]
    );

    /* The countdown engine already models opens/closes windows, urgency and
       live/upcoming/closed state. Feeding it one track's stages gives each
       track its own clock without a second implementation. */
    const deadlines = useMemo(() => {
        if (!selectedTrack) return [];
        return (selectedTrack.stages || []).map((stage, index) => ({
            id: stage.id,
            stage: String(index + 1).padStart(2, '0'),
            label: stage.label,
            detail: stage.detail,
            date: stage.closesAt,
            opensAt: stage.opensAt
        }));
    }, [selectedTrack]);

    const countdown = useRecruitmentCountdown(deadlines, clockOffsetMs);

    const handleSelectTrack = (id) => {
        setSelectedTrackId(id);
        setIsCountdownDocked(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-amber-400 selection:text-slate-900">

            {/* Top navigation */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-4 border-slate-900 shadow-[0_4px_0px_#0f172a]">
                <div className="px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <img src={teamLogo} alt="Team Asterix" className="h-9 w-auto object-contain" />
                        <div className="hidden sm:block">
                            <span className="font-mono text-xs font-black uppercase text-amber-600 block leading-tight">
                                CREW SELECTION &amp; RECRUITMENT
                            </span>
                            <span className="font-black text-sm uppercase text-slate-900 leading-tight">
                                TEAM ASTERIX INDUCTION PORTAL
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={onBack}
                        className="press px-4 py-2 border-2 border-slate-900 bg-sky-100 hover:bg-sky-500 hover:text-white font-mono font-black text-xs uppercase shadow-[2px_2px_0px_#0f172a] cursor-pointer shrink-0"
                    >
                        ← Back to Website
                    </button>
                </div>

                <RecruitmentCountdownStrip
                    countdown={countdown}
                    applyLink="#apply"
                    docked={isCountdownDocked}
                />
            </header>

            {/* Hero */}
            <section className="py-12 sm:py-16 px-4 sm:px-8 bg-slate-900 text-white border-b-4 border-slate-900">
                <div className="max-w-6xl mx-auto">
                    <span className="px-3 py-1 bg-amber-300 text-slate-900 border-2 border-slate-900 shadow-[3px_3px_0px_#0284c7] font-mono text-xs font-black inline-block mb-4">
                        ⚡ {config?.headline || 'CLASS OF 2026-27 RECRUITMENT'}
                    </span>

                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-none mb-5">
                        BUILD THE <span className="text-stroke-white text-transparent">BEAST</span>
                    </h1>
                    <p className="text-base sm:text-lg text-slate-300 font-bold max-w-3xl leading-relaxed">
                        {config?.intro
                            || 'Three subsystems, three different selection processes, one shared deadline.'}
                    </p>

                    {/* Standing notice. Someone landing here before applications
                        open would otherwise find three closed forms and assume
                        they had missed the whole thing. */}
                    {config?.notice && (
                        <div className="mt-7 p-4 sm:p-5 bg-amber-300 text-slate-900 border-3 border-slate-900 shadow-[5px_5px_0px_#0284c7] max-w-3xl">
                            <span className="font-mono font-black text-[11px] uppercase tracking-widest block mb-1">
                                ⚑ Before you apply
                            </span>
                            <p className="text-sm font-bold leading-relaxed">{config.notice}</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Track selection */}
            <section className="py-12 px-4 sm:px-8 max-w-6xl mx-auto">
                <div className="mb-8">
                    <span className="text-xs font-mono font-black uppercase text-sky-600 tracking-widest block mb-1">
                        CHOOSE YOUR SUBSYSTEM
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black uppercase text-slate-900 tracking-tight">
                        THREE TRACKS, THREE PROCESSES
                    </h2>
                    <p className="text-sm font-bold text-slate-600 mt-2 max-w-3xl">
                        Each subsystem selects differently and runs on its own clock. Pick yours to see its
                        stages, its deadlines and its brief.
                    </p>
                </div>

                {isLoading && (
                    <p className="p-6 bg-white border-4 border-slate-900 font-mono text-sm font-bold text-slate-600">
                        Loading the recruitment schedule…
                        <span className="block mt-1 text-xs font-normal text-slate-500">
                            The API sleeps when idle, so a cold start can take up to a minute.
                        </span>
                    </p>
                )}

                {loadError && !isLoading && (
                    <div className="p-6 bg-rose-50 border-4 border-rose-500">
                        <p className="font-mono text-sm font-black text-rose-800 mb-2">
                            Could not load the recruitment schedule.
                        </p>
                        <p className="font-mono text-xs text-rose-700 mb-4">{loadError}</p>
                        <button
                            type="button"
                            onClick={() => loadConfig(false)}
                            className="press px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-mono font-black text-xs uppercase border-2 border-slate-900 cursor-pointer"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {!isLoading && !loadError && tracks.length > 0 && (
                    <TrackSelector
                        tracks={tracks}
                        selectedId={selectedTrack?.id}
                        onSelect={handleSelectTrack}
                        now={countdown.now}
                    />
                )}
            </section>

            {/* Countdown for the selected track */}
            {selectedTrack && countdown.hasSchedule && (
                <RecruitmentCountdownBoard
                    countdown={countdown}
                    applyLink="#apply"
                    onDockChange={setIsCountdownDocked}
                />
            )}

            {/* Per-track detail */}
            {selectedTrack && (
                <section id="apply" className="py-12 px-4 sm:px-8 bg-sky-50/60 border-y-4 border-slate-900">
                    <div className="max-w-5xl mx-auto">
                        <div className="mb-6">
                            <span className="text-xs font-mono font-black uppercase text-sky-600 tracking-widest block mb-1">
                                {selectedTrack.name}
                            </span>
                            <h2 className="text-2xl sm:text-4xl font-black uppercase text-slate-900 tracking-tight">
                                {selectedTrack.brief?.title || 'Selection Process'}
                            </h2>
                            {selectedTrack.brief?.description && (
                                <p className="text-sm font-bold text-slate-600 mt-2 max-w-3xl">
                                    {selectedTrack.brief.description}
                                </p>
                            )}
                            {selectedTrack.brief?.stayTuned && (
                                <p className="text-sm font-bold text-slate-600 mt-2 max-w-3xl">
                                    The selection process and its dates are below. The problem statement
                                    itself is released at the time shown.
                                </p>
                            )}
                        </div>

                        {/* View tabs */}
                        <div className="flex flex-wrap gap-2 mb-8">
                            {VIEWS.map((v) => (
                                <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => setView(v.id)}
                                    aria-pressed={view === v.id}
                                    className={`px-4 py-2.5 border-3 border-slate-900 font-mono font-black text-xs uppercase transition-all cursor-pointer ${
                                        view === v.id
                                            ? 'bg-slate-900 text-white shadow-[3px_3px_0px_#0284c7]'
                                            : 'bg-white hover:bg-slate-100 text-slate-900 shadow-[2px_2px_0px_#0f172a]'
                                    }`}
                                >
                                    {v.label}
                                </button>
                            ))}

                            <a
                                href="#results"
                                className="px-4 py-2.5 border-3 border-slate-900 bg-white hover:bg-slate-100 text-slate-900 font-mono font-black text-xs uppercase shadow-[2px_2px_0px_#0f172a] cursor-pointer"
                            >
                                Results ↓
                            </a>
                        </div>

                        {view === 'timeline' && (
                            <div className="space-y-6">
                                <TrackTimeline track={selectedTrack} now={countdown.now} />

                                {/* Before the release moment this stands in for the whole
                                    brief. The server sends nothing about the statement
                                    until then, so there is nothing here to reveal by
                                    reading the page source. */}
                                {selectedTrack.brief?.stayTuned ? (
                                    <div className="p-6 sm:p-8 bg-amber-300 text-slate-900 border-4 border-slate-900 shadow-[8px_8px_0px_#0284c7]">
                                        <span className="font-mono font-black text-[11px] uppercase tracking-widest block mb-2">
                                            ⚡ Problem statement
                                        </span>
                                        <h4 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-2">
                                            Stay tuned
                                        </h4>
                                        <p className="text-sm font-bold leading-relaxed max-w-2xl">
                                            {config?.stayTunedMessage
                                                || 'The problem statements have not been released yet.'}
                                        </p>
                                        {config?.briefsLaunchAt && (
                                            <p className="font-mono text-xs font-black uppercase mt-3">
                                                Releases {formatIstFull(config.briefsLaunchAt)}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-5 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a]">
                                        <h4 className="font-black uppercase text-sm text-slate-900 mb-2">
                                            What you will be asked to hand in
                                        </h4>
                                        <p className="text-xs font-mono text-slate-700 mb-3">
                                            {selectedTrack.brief?.deliverables || 'Published with the problem statement.'}
                                        </p>
                                        <p className="text-xs font-bold text-slate-500">
                                            {selectedTrack.brief?.gated
                                                ? 'The full problem statement is released through your own application page once you reach the stage that unlocks it — it is not published here.'
                                                : 'The full problem statement is available to everyone on this track.'}
                                        </p>
                                    </div>
                                )}

                                {/* Written-test syllabus. Public on a gated track too:
                                    nobody can revise for a secret. */}
                                {selectedTrack.brief?.portions && (
                                    <div className="p-5 sm:p-6 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a]">
                                        <h4 className="font-black uppercase text-sm text-slate-900 mb-3">
                                            Written test portions
                                        </h4>
                                        <pre className="text-xs sm:text-sm font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
                                            {selectedTrack.brief.portions}
                                        </pre>
                                    </div>
                                )}

                                {/* The statement itself, once it is both released and
                                    ungated. A gated track still routes it through the
                                    candidate own application page. */}
                                {selectedTrack.brief?.bodyMarkdown && (
                                    <div className="p-5 sm:p-6 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a]">
                                        <h4 className="font-black uppercase text-sm text-slate-900 mb-3">
                                            Problem statement
                                        </h4>
                                        <pre className="text-xs sm:text-sm font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
                                            {selectedTrack.brief.bodyMarkdown}
                                        </pre>
                                        {selectedTrack.brief.fileUrl && (
                                            <a
                                                href={selectedTrack.brief.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="press inline-block mt-4 px-4 py-2 bg-slate-900 hover:bg-sky-600 text-white font-mono font-black text-xs uppercase border-2 border-slate-900 cursor-pointer no-underline"
                                            >
                                                Open the attachment ↗
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {view === 'apply' && (
                            <ApplyForm
                                track={selectedTrack}
                                now={countdown.now}
                                onApplied={() => setView('status')}
                            />
                        )}

                        {view === 'status' && (
                            <StatusLookup
                                tracks={tracks}
                                initialCredential={storedCredential}
                                onTrackDetected={(id) => setSelectedTrackId(id)}
                            />
                        )}

                    </div>
                </section>
            )}

            {/* All-track results */}
            <section id="results" className="py-14 px-4 sm:px-8 bg-slate-900 text-white">
                <div className="max-w-5xl mx-auto">
                    <div className="mb-8 text-center">
                        <span className="text-xs font-mono font-black uppercase text-amber-400 tracking-widest block mb-1">
                            OFFICIAL SELECTION UPDATES
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight">
                            RESULTS &amp; SHORTLISTS
                        </h2>
                    </div>

                    <ResultsBoard tracks={tracks} resultsNote={config?.resultsNote} />
                </div>

                <div className="max-w-6xl mx-auto mt-14 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
                    <span>
                        © 2026 TEAM ASTERIX • RECRUITMENT &amp; INDUCTION PORTAL
                        {countdown.now > 0 && (
                            <span className="block sm:inline sm:ml-2 text-slate-600">
                                Server clock {formatIstFull(new Date(countdown.now).toISOString())}
                                {lastSyncedAt && ` · schedule synced ${lastSyncedAt.toLocaleTimeString()}`}
                            </span>
                        )}
                    </span>
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
