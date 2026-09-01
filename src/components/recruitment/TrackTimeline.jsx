import { formatIstFull } from '../../lib/istTime';

/**
 * The full process for one track, in order, with each stage's own window.
 *
 * The countdown board above it answers "how long until the next thing"; this
 * answers "what is the whole shape of this track and where am I in it", which
 * is the question a candidate deciding whether to apply actually has.
 */

const parse = (value) => {
    const ms = new Date(value).getTime();
    return Number.isNaN(ms) ? null : ms;
};

function stageState(stage, now) {
    const opens = parse(stage.opensAt);
    const closes = parse(stage.closesAt);
    if (closes !== null && now > closes) return 'closed';
    if (opens !== null && now < opens) return 'upcoming';
    return 'live';
}

const STATE_STYLE = {
    live: {
        row: 'bg-white border-slate-900',
        badge: 'bg-emerald-400 text-slate-900 border-slate-900',
        label: 'Open now',
        marker: 'bg-emerald-400'
    },
    upcoming: {
        row: 'bg-white border-slate-300',
        badge: 'bg-white text-slate-500 border-slate-300',
        label: 'Upcoming',
        marker: 'bg-slate-300'
    },
    closed: {
        row: 'bg-slate-100 border-slate-300',
        badge: 'bg-slate-200 text-slate-500 border-slate-300',
        label: 'Closed',
        marker: 'bg-slate-400'
    }
};

export default function TrackTimeline({ track, highlightPhase, now }) {
    const stages = track?.stages || [];

    if (stages.length === 0) {
        return (
            <p className="p-4 bg-slate-100 border-2 border-dashed border-slate-400 font-mono text-xs font-bold text-slate-500">
                No stages have been published for this track yet.
            </p>
        );
    }

    return (
        <ol className="space-y-3">
            {stages.map((stage, index) => {
                const state = stageState(stage, now);
                const style = STATE_STYLE[state];
                const isSubmission = Boolean(stage.submissionPhase);
                const isYours = highlightPhase && stage.submissionPhase === highlightPhase;

                return (
                    <li
                        key={stage.id}
                        className={`p-4 border-3 ${style.row} ${isYours ? 'ring-4 ring-amber-300' : ''}`}
                    >
                        <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                            <span
                                className={`w-9 h-9 shrink-0 flex items-center justify-center border-2 border-slate-900 font-mono font-black text-xs ${style.marker}`}
                                aria-hidden="true"
                            >
                                {String(index + 1).padStart(2, '0')}
                            </span>

                            <div className="flex-1 min-w-[12rem]">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h4 className={`font-black uppercase text-sm ${state === 'closed' ? 'text-slate-500' : 'text-slate-900'}`}>
                                        {stage.label}
                                    </h4>
                                    <span className={`px-2 py-0.5 border font-mono font-black text-[10px] uppercase ${style.badge}`}>
                                        {style.label}
                                    </span>
                                    {isSubmission && (
                                        <span className="px-2 py-0.5 border border-sky-600 bg-sky-50 text-sky-700 font-mono font-black text-[10px] uppercase">
                                            Submission
                                        </span>
                                    )}
                                </div>
                                {stage.detail && (
                                    <p className="text-xs font-medium text-slate-600 leading-relaxed">
                                        {stage.detail}
                                    </p>
                                )}
                            </div>

                            <div className="font-mono text-[11px] text-right shrink-0 min-w-[11rem]">
                                <span className="block font-black uppercase text-slate-400">Closes</span>
                                <span className={`block font-bold ${state === 'closed' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                                    {formatIstFull(stage.closesAt) || 'Not scheduled'}
                                </span>
                            </div>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
