import { useState, useEffect, useMemo, useCallback } from 'react';

/* =========================================================
   RECRUITMENT COUNTDOWN — "PIT LANE TIMING TOWER"
   ---------------------------------------------------------
   The recruitment cycle is already a numbered four-stage sequence on the
   page (STAGE 01..04), so the countdown is modelled as a race weekend
   session schedule rather than a single generic timer: the next stage that
   has not closed goes "on the board", every other stage stays listed with
   its own status, and a hairline rail underneath shows how much of the
   current window has burned off.

   One timer drives everything. The board and the docked navbar strip both
   read the same `useRecruitmentCountdown` result, so a page with both
   visible still ticks a single interval.
========================================================= */

const IST = 'Asia/Kolkata';

/** Deadlines the page falls back to when none are configured in the admin. */
export const FALLBACK_DEADLINES = [
    {
        id: 'stage-01',
        stage: '01',
        label: 'Applications Close',
        detail: 'Submit the crew application form with your subsystem preference.',
        date: '2026-09-07T23:59:00+05:30',
        opensAt: '2026-08-24T09:00:00+05:30',
    },
    {
        id: 'stage-02',
        stage: '02',
        label: 'Problem Statement Submission',
        detail: 'Upload code, CAD, FEA or deck for your chosen subsystem brief.',
        date: '2026-09-21T23:59:00+05:30',
    },
    {
        id: 'stage-03',
        stage: '03',
        label: 'Technical Review Slots',
        detail: 'In-person design defence with the subsystem leads.',
        date: '2026-10-05T18:00:00+05:30',
    },
    {
        id: 'stage-04',
        stage: '04',
        label: 'Workshop Trial & Induction',
        detail: 'Tool safety briefing and hands-on fabrication induction.',
        date: '2026-10-19T18:00:00+05:30',
    },
];

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const parseDate = (value) => {
    if (!value) return null;
    const ms = new Date(value).getTime();
    return Number.isNaN(ms) ? null : ms;
};

const pad = (n) => String(Math.max(0, Math.floor(n))).padStart(2, '0');

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: IST,
});

const shortFormatter = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    timeZone: IST,
});

const formatFull = (ms) => `${dateFormatter.format(new Date(ms)).replace(/,/g, '')} IST`;
const formatShort = (ms) => shortFormatter.format(new Date(ms));

/**
 * Splits the schedule into closed / on-the-board / upcoming and returns the
 * remaining time for whichever stage is currently on the board.
 *
 * Ticks once a second, and only while a live deadline is actually counting
 * down -- once every stage has closed the interval is torn down instead of
 * burning a wakeup a second forever.
 */
export function useRecruitmentCountdown(deadlines, clockOffsetMs = 0) {
    const schedule = useMemo(() => {
        // An admin who deletes every stage means "nothing is scheduled", so an
        // empty array stays empty. Only a missing field -- never configured --
        // falls back, otherwise clearing the list would republish the built-in
        // placeholder dates as if they were real deadlines.
        const source = Array.isArray(deadlines) ? deadlines : FALLBACK_DEADLINES;
        const parsed = source
            .map((d, i) => ({
                ...d,
                stage: d.stage || pad(i + 1),
                at: parseDate(d.date),
                opensAtMs: parseDate(d.opensAt),
            }))
            .filter((d) => d.at !== null)
            .sort((a, b) => a.at - b.at);

        // Each stage's window starts when the one before it closed, so the
        // progress rail measures the time entrants actually had.
        return parsed.map((d, i) => ({
            ...d,
            windowStart: d.opensAtMs ?? (i > 0 ? parsed[i - 1].at : d.at - 14 * DAY),
        }));
    }, [deadlines]);

    /* `clockOffsetMs` carries the difference between this browser's clock and
       the server's, measured when the schedule was fetched. The server is the
       only thing that actually decides whether a window is open, so a visitor
       whose laptop is a day fast must not be shown an open form the API will
       refuse -- nor a closed one it would have accepted. */
    /* The tick is stored raw and the offset added during render, so a newly
       measured offset applies on the next paint without a second state update
       chasing the first. */
    const [tick, setTick] = useState(() => Date.now());
    const now = tick + clockOffsetMs;

    const active = useMemo(() => schedule.find((d) => d.at > now) || null, [schedule, now]);
    const isLive = active !== null;

    /* This clock is not only the countdown: the track cards and the timeline
       read it to decide which stage is open. So it keeps ticking after the last
       deadline passes, just slowly -- tearing it down entirely froze `now` at
       mount time, and a tab left open across a boundary went on showing a stage
       as live long after the server had closed it. */
    useEffect(() => {
        const period = isLive ? 1000 : 30000;
        const id = setInterval(() => setTick(Date.now()), period);
        return () => clearInterval(id);
    }, [isLive]);

    const remaining = active ? Math.max(0, active.at - now) : 0;

    const parts = {
        days: Math.floor(remaining / DAY),
        hours: Math.floor((remaining % DAY) / HOUR),
        minutes: Math.floor((remaining % HOUR) / MINUTE),
        seconds: Math.floor((remaining % MINUTE) / 1000),
    };

    // Fraction of the current stage's window that has already elapsed.
    let elapsedPct = 0;
    if (active) {
        const span = active.at - active.windowStart;
        elapsedPct = span > 0 ? Math.min(100, Math.max(0, ((now - active.windowStart) / span) * 100)) : 0;
    }

    // Urgency drives the accent, so the board escalates on its own without
    // anyone editing the page.
    let urgency = 'open';
    if (!active) urgency = 'closed';
    else if (remaining < DAY) urgency = 'final';
    else if (remaining < 7 * DAY) urgency = 'soon';

    return {
        schedule: schedule.map((d) => ({
            ...d,
            state: d.at <= now ? 'closed' : d.id === active?.id ? 'live' : 'upcoming',
        })),
        active,
        remaining,
        parts,
        elapsedPct,
        urgency,
        now,
        // Nothing scheduled at all -- the page drops the board rather than
        // showing an empty timing tower.
        hasSchedule: schedule.length > 0,
    };
}

/** Accent set per urgency. Kept as whole class strings so Tailwind sees them. */
const ACCENT = {
    open: {
        chip: 'bg-emerald-400 text-slate-900',
        rail: 'bg-emerald-400',
        tileShadow: 'shadow-[4px_4px_0px_#34d399]',
        dot: 'bg-emerald-400',
        note: 'text-emerald-300',
    },
    soon: {
        chip: 'bg-amber-300 text-slate-900',
        rail: 'bg-amber-300',
        tileShadow: 'shadow-[4px_4px_0px_#fcd34d]',
        dot: 'bg-amber-300',
        note: 'text-amber-300',
    },
    final: {
        chip: 'bg-rose-400 text-slate-900',
        rail: 'bg-rose-400',
        tileShadow: 'shadow-[4px_4px_0px_#fb7185]',
        dot: 'bg-rose-400',
        note: 'text-rose-300',
    },
    closed: {
        chip: 'bg-slate-300 text-slate-900',
        rail: 'bg-slate-500',
        tileShadow: 'shadow-[4px_4px_0px_#475569]',
        dot: 'bg-slate-400',
        note: 'text-slate-400',
    },
};

const URGENCY_NOTE = {
    open: 'Board is green. Plenty of window left.',
    soon: 'Under a week on the clock.',
    final: 'Final day. Submissions close tonight.',
    closed: 'All published stages have closed.',
};

/**
 * `applyLink` used to be an external Google Form URL, so both apply buttons
 * hardcoded `target="_blank"`. It is now an in-page anchor, and opening `#apply`
 * in a new tab lands the reader on a blank page. These props keep working for
 * either kind of destination.
 */
const linkProps = (href) =>
    href?.startsWith('#')
        ? { href, arrow: '↓' }
        : { href, target: '_blank', rel: 'noopener noreferrer', arrow: '↗' };

const Tile = ({ value, unit, accent, pulse }) => (
    <div className="flex flex-col items-center">
        <div
            className={`w-16 sm:w-20 py-3 sm:py-4 bg-white border-3 border-slate-900 ${accent.tileShadow} flex items-center justify-center`}
        >
            <span
                className={`font-mono font-black text-3xl sm:text-4xl leading-none tabular-nums text-slate-900 ${
                    pulse ? 'countdown-tick' : ''
                }`}
            >
                {value}
            </span>
        </div>
        <span className="mt-2 font-mono font-black text-[10px] uppercase tracking-widest text-slate-400">
            {unit}
        </span>
    </div>
);

/**
 * The full timing tower. `onDockChange` fires when the board leaves or
 * re-enters the viewport so the page can dock the compact strip into the
 * sticky header.
 */
export function RecruitmentCountdownBoard({ countdown, applyLink, onDockChange }) {
    const { active, parts, elapsedPct, urgency, schedule } = countdown;
    const accent = ACCENT[urgency];

    // React 19 callback ref: returning the teardown means the observer is
    // rebuilt whenever the node or the handler changes, with no null-call to
    // miss and no observer left watching a detached board.
    const attachBoard = useCallback(
        (node) => {
            if (!node || typeof IntersectionObserver === 'undefined' || !onDockChange) return undefined;
            const observer = new IntersectionObserver(
                ([entry]) => onDockChange(!entry.isIntersecting && entry.boundingClientRect.top < 0),
                // The sticky header covers the top ~72px, so the board counts as
                // gone once it has slid under it -- not once it clears the viewport.
                { threshold: 0, rootMargin: '-72px 0px 0px 0px' }
            );
            observer.observe(node);
            return () => observer.disconnect();
        },
        [onDockChange]
    );

    const srSummary = active
        ? `${active.label} closes in ${parts.days} days, ${parts.hours} hours and ${parts.minutes} minutes.`
        : 'All published recruitment stages have closed.';

    return (
        <section
            ref={attachBoard}
            aria-labelledby="countdown-heading"
            className="bg-slate-900 text-white border-y-4 border-slate-900"
        >
            <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-14">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <span
                        id="countdown-heading"
                        className="text-xs font-mono font-black uppercase text-sky-400 tracking-widest"
                    >
                        NEXT DEADLINE ON THE BOARD
                    </span>
                    <span
                        className={`px-3 py-1 border-2 border-slate-900 font-mono font-black text-[11px] uppercase ${accent.chip} shadow-[3px_3px_0px_#0284c7] flex items-center gap-2`}
                    >
                        <span className="w-1.5 h-1.5 bg-slate-900 rounded-full" aria-hidden="true" />
                        {active ? `Stage ${active.stage} running` : 'Board clear'}
                    </span>
                </div>

                <div className="grid lg:grid-cols-[1fr_auto] gap-8 lg:gap-12 items-end">
                    <div>
                        <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight leading-none">
                            {active ? active.label : 'Recruitment stages closed'}
                        </h2>
                        <p className="mt-3 font-mono text-xs sm:text-sm font-bold text-slate-400">
                            {active
                                ? `Closes ${formatFull(active.at)}`
                                : 'Watch the results board below for the next cycle.'}
                        </p>
                        {active?.detail && (
                            <p className="mt-2 text-sm font-bold text-slate-300 max-w-xl leading-relaxed">
                                {active.detail}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex gap-3 sm:gap-4" aria-hidden="true">
                            <Tile value={pad(parts.days)} unit="Days" accent={accent} />
                            <Tile value={pad(parts.hours)} unit="Hrs" accent={accent} />
                            <Tile value={pad(parts.minutes)} unit="Min" accent={accent} />
                            <Tile value={pad(parts.seconds)} unit="Sec" accent={accent} pulse />
                        </div>
                        <p className="sr-only" role="timer" aria-live="off">
                            {srSummary}
                        </p>
                    </div>
                </div>

                {/* Elapsed rail -- how much of this stage's window has burned off. */}
                <div className="mt-10">
                    <div className="h-1.5 w-full bg-slate-700 overflow-hidden">
                        <div
                            className={`h-full ${accent.rail} countdown-rail`}
                            style={{ width: `${elapsedPct}%` }}
                        />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] font-bold">
                        <span className="text-slate-500 uppercase tracking-widest">
                            {Math.round(elapsedPct)}% of this window elapsed
                        </span>
                        <span className={`uppercase tracking-widest ${accent.note}`}>
                            {URGENCY_NOTE[urgency]}
                        </span>
                    </div>
                </div>

                {/* Session schedule -- every stage, its date and its status. */}
                <div className="mt-10 border-t-2 border-slate-800 pt-6">
                    <span className="font-mono font-black text-[11px] uppercase tracking-widest text-slate-500 block mb-4">
                        // Session schedule
                    </span>
                    <ul className="divide-y divide-slate-800">
                        {schedule.map((item) => (
                            <li
                                key={item.id}
                                className="py-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs"
                            >
                                <span
                                    className={`font-black tabular-nums ${
                                        item.state === 'live' ? 'text-white' : 'text-slate-600'
                                    }`}
                                >
                                    {item.stage}
                                </span>
                                <span
                                    className={`flex-1 min-w-[10rem] font-bold uppercase tracking-wide ${
                                        item.state === 'closed'
                                            ? 'text-slate-600 line-through decoration-slate-700'
                                            : item.state === 'live'
                                              ? 'text-white'
                                              : 'text-slate-300'
                                    }`}
                                >
                                    {item.label}
                                </span>
                                <span className="text-slate-500 tabular-nums">{formatShort(item.at)}</span>
                                <span
                                    className={`px-2 py-0.5 border font-black text-[10px] uppercase tracking-widest ${
                                        item.state === 'live'
                                            ? `${accent.chip} border-slate-900`
                                            : item.state === 'closed'
                                              ? 'border-slate-700 text-slate-600'
                                              : 'border-slate-700 text-slate-400'
                                    }`}
                                >
                                    {item.state === 'live'
                                        ? 'On the board'
                                        : item.state === 'closed'
                                          ? 'Closed'
                                          : 'Upcoming'}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                {active && (() => {
                    const { arrow, ...anchor } = linkProps(applyLink);
                    return (
                        <div className="mt-8">
                            <a
                                {...anchor}
                                className="press inline-flex items-center gap-2 px-6 py-3.5 bg-amber-300 hover:bg-amber-400 text-slate-900 border-3 border-slate-900 font-mono font-black text-xs uppercase shadow-[4px_4px_0px_#0284c7] cursor-pointer"
                            >
                                <span>Apply before the flag drops {arrow}</span>
                            </a>
                        </div>
                    );
                })()}
            </div>
        </section>
    );
}

/**
 * Compact one-line version that docks under the sticky header once the board
 * has scrolled past, so the deadline stays on screen for the rest of the page.
 */
export function RecruitmentCountdownStrip({ countdown, applyLink, docked }) {
    const { active, parts, elapsedPct, urgency } = countdown;
    const accent = ACCENT[urgency];
    const show = docked && Boolean(active);
    const { arrow: applyArrow, ...apply } = linkProps(applyLink);

    return (
        <div
            className={`countdown-dock overflow-hidden bg-slate-900 text-white ${
                show ? 'countdown-dock-open' : ''
            }`}
            aria-hidden={!show}
        >
            <div className="max-w-6xl mx-auto px-4 sm:px-8 py-2 flex items-center gap-3 sm:gap-4">
                <span
                    className={`w-2 h-2 shrink-0 ${accent.dot} ${
                        urgency === 'final' ? 'countdown-tick' : ''
                    }`}
                    aria-hidden="true"
                />
                <span className="font-mono font-black text-[10px] sm:text-[11px] uppercase tracking-widest text-slate-400 truncate">
                    {active?.label}
                </span>
                <span className="font-mono font-black text-xs sm:text-sm tabular-nums ml-auto shrink-0">
                    {pad(parts.days)}<span className="text-slate-500">d</span>{' '}
                    {pad(parts.hours)}<span className="text-slate-500">h</span>{' '}
                    {pad(parts.minutes)}<span className="text-slate-500">m</span>{' '}
                    {pad(parts.seconds)}<span className="text-slate-500">s</span>
                </span>
                <a
                    {...apply}
                    tabIndex={show ? 0 : -1}
                    className="press press-flat hidden sm:inline-block shrink-0 font-mono font-black text-[11px] uppercase text-amber-300 hover:text-amber-200 underline underline-offset-4 cursor-pointer"
                >
                    Apply {applyArrow}
                </a>
            </div>
            <div className="h-0.5 w-full bg-slate-800">
                <div className={`h-full ${accent.rail} countdown-rail`} style={{ width: `${elapsedPct}%` }} />
            </div>
        </div>
    );
}
