import { useEffect } from 'react';

export default function SubsystemLockedCard({
    title = 'Problem Statements Release Countdown',
    badge = 'EMBARGOED CONTENT',
    releaseDate = '2026-09-03T18:30:00+05:30',
    unlockTimeLabel = 'UNLOCKS TOMORROW • 6:30 PM IST',
    teaserTitle = '// WHAT UNLOCKS AT RELEASE',
    description = 'Content is sealed under recruitment protocol. Full problem statements and guidelines will unlock tomorrow at 6:30 PM IST.',
    teaserPoints = [],
    onUnlock
}) {
    const targetMs = new Date(releaseDate).getTime();

    useEffect(() => {
        if (!onUnlock) return;
        const remaining = Math.max(10, targetMs - Date.now());
        const timer = setTimeout(() => onUnlock(), remaining);
        return () => clearTimeout(timer);
    }, [targetMs, onUnlock]);

    return (
        <div className="bg-slate-900 text-white border-4 border-slate-900 shadow-[8px_8px_0px_#0284c7] p-6 sm:p-10 relative overflow-hidden">
            {/* Background glow accent */}
            <div className="absolute -right-16 -top-16 w-56 h-56 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-amber-300 text-slate-900 border-2 border-slate-900 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#0284c7]">
                        🔒 {badge}
                    </span>
                    <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/50 font-mono text-[11px] font-black uppercase">
                        SEALED BRIEF
                    </span>
                </div>
                <span className="font-mono text-xs font-bold text-amber-400 tracking-widest uppercase">
                    {unlockTimeLabel}
                </span>
            </div>

            <div className="max-w-3xl mb-8">
                <h3 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight mb-3">
                    {title}
                </h3>
                <p className="text-sm sm:text-base font-bold text-slate-300 leading-relaxed">
                    {description}
                </p>
            </div>



            {/* Teaser Points */}
            {teaserPoints.length > 0 && (
                <div className="border-t-2 border-slate-800 pt-6">
                    <span className="font-mono text-xs font-black uppercase tracking-widest text-sky-400 block mb-3">
                        {teaserTitle}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {teaserPoints.map((pt, i) => (
                            <div
                                key={i}
                                className="p-3.5 bg-slate-800/60 border border-slate-700 flex items-start gap-2.5 text-xs font-bold text-slate-200"
                            >
                                <span className="text-amber-400 font-mono font-black">✦</span>
                                <span className="leading-relaxed">{pt}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
