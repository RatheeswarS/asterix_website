import { formatIstShort } from '../../lib/istTime';

/**
 * The three subsystem tracks, each showing where it currently stands.
 *
 * This replaces the single four-stage roadmap the page used to show every
 * visitor. The three processes are genuinely different shapes -- one runs a
 * written test first, one draws teams up front, one is individual throughout --
 * so a shared roadmap could only ever be wrong for two of them.
 */

const ACCENT = {
    'software-perception': {
        chip: 'bg-sky-400 text-white',
        shadow: 'shadow-[6px_6px_0px_#0284c7]',
        selected: 'shadow-[10px_10px_0px_#0284c7]'
    },
    powertrain: {
        chip: 'bg-amber-300 text-slate-900',
        shadow: 'shadow-[6px_6px_0px_#f59e0b]',
        selected: 'shadow-[10px_10px_0px_#f59e0b]'
    },
    mechanical: {
        chip: 'bg-emerald-400 text-slate-900',
        shadow: 'shadow-[6px_6px_0px_#10b981]',
        selected: 'shadow-[10px_10px_0px_#10b981]'
    }
};

const FALLBACK_ACCENT = {
    chip: 'bg-slate-300 text-slate-900',
    shadow: 'shadow-[6px_6px_0px_#0f172a]',
    selected: 'shadow-[10px_10px_0px_#0f172a]'
};

const parse = (value) => {
    const ms = new Date(value).getTime();
    return Number.isNaN(ms) ? null : ms;
};

/** The stage running right now, and the next one that has not closed. */
export function trackStatus(track, now = Date.now()) {
    const stages = track?.stages || [];
    const running = stages.find((s) => {
        const opens = parse(s.opensAt);
        const closes = parse(s.closesAt);
        return (opens === null || now >= opens) && (closes === null || now <= closes);
    }) || null;
    const upcoming = stages.find((s) => {
        const closes = parse(s.closesAt);
        return closes === null || closes > now;
    }) || null;
    const allClosed = stages.length > 0 && !upcoming;
    return { running, upcoming, allClosed };
}

export default function TrackSelector({ tracks, selectedId, onSelect, now }) {

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tracks.map((track) => {
                const accent = ACCENT[track.id] || FALLBACK_ACCENT;
                const { running, upcoming, allClosed } = trackStatus(track, now);
                const isSelected = track.id === selectedId;

                return (
                    <button
                        key={track.id}
                        type="button"
                        onClick={() => onSelect(track.id)}
                        aria-pressed={isSelected}
                        className={`press text-left p-6 bg-white border-4 border-slate-900 cursor-pointer transition-all ${
                            isSelected ? accent.selected : accent.shadow
                        } ${isSelected ? '-translate-x-0.5 -translate-y-0.5' : ''}`}
                    >
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className={`px-2 py-1 border-2 border-slate-900 font-mono font-black text-[10px] uppercase ${accent.chip}`}>
                                {track.teamBased ? 'Team based' : 'Individual'}
                            </span>
                            {track.hasWrittenTest && (
                                <span className="px-2 py-1 border-2 border-slate-900 bg-rose-300 text-slate-900 font-mono font-black text-[10px] uppercase">
                                    Written test
                                </span>
                            )}
                        </div>

                        <h3 className="text-xl font-black uppercase text-slate-900 leading-tight mb-2">
                            {track.name}
                        </h3>
                        <p className="text-xs font-medium text-slate-600 leading-relaxed mb-4 min-h-[3rem]">
                            {track.blurb}
                        </p>

                        <div className="pt-3 border-t-2 border-slate-200 space-y-1.5 font-mono text-[11px]">
                            <div className="flex items-start justify-between gap-2">
                                <span className="font-black uppercase text-slate-400 shrink-0">Now</span>
                                <span className="font-bold text-slate-900 text-right">
                                    {allClosed ? 'All stages closed' : running ? running.label : 'Between stages'}
                                </span>
                            </div>
                            <div className="flex items-start justify-between gap-2">
                                <span className="font-black uppercase text-slate-400 shrink-0">Next due</span>
                                <span className="font-bold text-slate-900 text-right">
                                    {upcoming ? `${upcoming.label} · ${formatIstShort(upcoming.closesAt)}` : '—'}
                                </span>
                            </div>
                            <div className="flex items-start justify-between gap-2">
                                <span className="font-black uppercase text-slate-400 shrink-0">Applications</span>
                                <span className={`font-black uppercase text-right ${track.applyOpen ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {track.applyOpen ? 'Open' : 'Closed'}
                                </span>
                            </div>
                        </div>

                        <span className={`mt-4 block font-mono font-black text-[11px] uppercase ${isSelected ? 'text-slate-900' : 'text-sky-600'}`}>
                            {isSelected ? '● Viewing this track' : 'View this track →'}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
