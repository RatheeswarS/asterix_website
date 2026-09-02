import { useState, useEffect } from 'react';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const pad = (n) => String(Math.max(0, n)).padStart(2, '0');

export default function SubsystemLockedCard({
    title = 'Problem Statements Release Countdown',
    badge = 'EMBARGOED CONTENT',
    releaseDate = '2026-09-03T18:30:00+05:30',
    description = 'Content is sealed under recruitment protocol. Full problem statements and guidelines will unlock tomorrow at 6:30 PM IST.',
    teaserPoints = [],
    onUnlock
}) {
    const targetMs = new Date(releaseDate).getTime();
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => {
            const current = Date.now();
            setNow(current);
            if (current >= targetMs && onUnlock) {
                onUnlock();
            }
        }, 1000);
        return () => clearInterval(id);
    }, [targetMs, onUnlock]);

    const remaining = Math.max(0, targetMs - now);

    const parts = {
        days: Math.floor(remaining / DAY),
        hours: Math.floor((remaining % DAY) / HOUR),
        minutes: Math.floor((remaining % HOUR) / MINUTE),
        seconds: Math.floor((remaining % MINUTE) / 1000),
    };

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
                    UNLOCKS TOMORROW • 6:30 PM IST
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

            {/* Countdown Clock - Neo-Brutalist Big Tiles */}
            <div className="p-6 bg-slate-800/80 border-3 border-slate-700 shadow-[6px_6px_0px_#0f172a] mb-8">
                <span className="font-mono text-[11px] font-black uppercase tracking-widest text-slate-400 block mb-4">
                    // TIME UNTIL UNLOCK
                </span>

                <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                    {/* Days */}
                    <div className="flex flex-col items-center">
                        <div className="w-16 sm:w-24 py-3 sm:py-4 bg-white border-3 border-slate-900 shadow-[3px_3px_0px_#0284c7] flex items-center justify-center">
                            <span className="font-mono font-black text-2xl sm:text-4xl text-slate-900 tabular-nums">
                                {pad(parts.days)}
                            </span>
                        </div>
                        <span className="mt-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Days
                        </span>
                    </div>

                    <span className="text-2xl font-black text-slate-500 hidden sm:inline">:</span>

                    {/* Hours */}
                    <div className="flex flex-col items-center">
                        <div className="w-16 sm:w-24 py-3 sm:py-4 bg-white border-3 border-slate-900 shadow-[3px_3px_0px_#0284c7] flex items-center justify-center">
                            <span className="font-mono font-black text-2xl sm:text-4xl text-slate-900 tabular-nums">
                                {pad(parts.hours)}
                            </span>
                        </div>
                        <span className="mt-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Hours
                        </span>
                    </div>

                    <span className="text-2xl font-black text-slate-500 hidden sm:inline">:</span>

                    {/* Mins */}
                    <div className="flex flex-col items-center">
                        <div className="w-16 sm:w-24 py-3 sm:py-4 bg-white border-3 border-slate-900 shadow-[3px_3px_0px_#0284c7] flex items-center justify-center">
                            <span className="font-mono font-black text-2xl sm:text-4xl text-slate-900 tabular-nums">
                                {pad(parts.minutes)}
                            </span>
                        </div>
                        <span className="mt-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Mins
                        </span>
                    </div>

                    <span className="text-2xl font-black text-slate-500 hidden sm:inline">:</span>

                    {/* Secs */}
                    <div className="flex flex-col items-center">
                        <div className="w-16 sm:w-24 py-3 sm:py-4 bg-amber-300 border-3 border-slate-900 shadow-[3px_3px_0px_#0284c7] flex items-center justify-center">
                            <span className="font-mono font-black text-2xl sm:text-4xl text-slate-900 tabular-nums animate-pulse">
                                {pad(parts.seconds)}
                            </span>
                        </div>
                        <span className="mt-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-amber-400">
                            Secs
                        </span>
                    </div>
                </div>
            </div>

            {/* Teaser Points */}
            {teaserPoints.length > 0 && (
                <div className="border-t-2 border-slate-800 pt-6">
                    <span className="font-mono text-xs font-black uppercase tracking-widest text-sky-400 block mb-3">
                        // WHAT UNLOCKS AT 6:30 PM TOMORROW
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
