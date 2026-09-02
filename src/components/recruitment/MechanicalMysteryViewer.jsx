import { useState } from 'react';
import { MECHANICAL_MYSTERY_DATA } from '../../data/recruitmentProblemStatements';

/**
 * Hand-drawn SVG scribbles & doodle components.
 * Fulfills the mystery element where only the user's specific headings exist,
 * and all other placeholder text/details are covered in chaotic doodles & scribbles.
 */
function ScribbleLines({ className = '', height = 70, stroke = '#0284c7' }) {
    return (
        <svg
            className={`w-full overflow-visible pointer-events-none ${className}`}
            height={height}
            viewBox="0 0 400 70"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Line 1 scribble */}
            <path
                d="M 5 12 Q 25 4, 45 15 T 85 10 T 125 18 T 165 7 T 205 16 T 245 9 T 285 17 T 325 8 T 365 15 T 395 10"
                stroke={stroke}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-75"
            />
            {/* Loop scribble */}
            <path
                d="M 12 18 C 30 2, 40 28, 55 12 C 70 2, 85 26, 105 14 C 125 4, 140 28, 160 12 C 180 2, 195 24, 215 14 C 235 4, 250 26, 270 14 C 290 4, 305 24, 325 12 C 345 2, 360 26, 385 15"
                stroke="#0f172a"
                strokeWidth="2"
                strokeLinecap="round"
                className="opacity-50"
            />
            {/* Line 2 scribble */}
            <path
                d="M 8 36 Q 35 26, 60 40 T 110 32 T 160 42 T 210 30 T 260 44 T 310 32 T 360 42 T 390 35"
                stroke={stroke}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-70"
            />
            {/* Line 3 scribble */}
            <path
                d="M 15 58 Q 45 50, 75 62 T 135 52 T 195 64 T 255 52 T 315 62 T 375 54"
                stroke="#0f172a"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-60"
            />
        </svg>
    );
}

function ScribbleChaosBox({ className = '' }) {
    return (
        <div className={`relative p-4 border-2 border-dashed border-slate-400 bg-slate-100/60 overflow-hidden ${className}`}>
            <div className="absolute top-2 right-2 text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest select-none">
                [ SCRIBBLED / REDACTED ]
            </div>
            <svg
                className="w-full h-24 sm:h-28 overflow-visible"
                viewBox="0 0 500 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Chaotic back-and-forth scratch */}
                <path
                    d="M 10 20 L 40 80 L 70 15 L 100 85 L 130 10 L 160 90 L 190 15 L 220 85 L 250 10 L 280 88 L 310 18 L 340 82 L 370 12 L 400 85 L 430 15 L 460 80 L 490 25"
                    stroke="#0284c7"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-40"
                />
                {/* Spiral/loop doodles */}
                <path
                    d="M 20 45 C 50 10, 60 80, 90 45 C 120 10, 130 80, 160 45 C 190 10, 200 80, 230 45 C 260 10, 270 80, 300 45 C 330 10, 340 80, 370 45 C 400 10, 410 80, 440 45 C 470 10, 480 80, 495 50"
                    stroke="#0f172a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="opacity-65"
                />
                {/* Wild wavy bottom scrawl */}
                <path
                    d="M 15 75 Q 35 60, 55 78 T 95 68 T 135 80 T 175 66 T 215 82 T 255 68 T 295 82 T 335 68 T 375 80 T 415 65 T 455 82 T 485 70"
                    stroke="#f59e0b"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    className="opacity-60"
                />
            </svg>
        </div>
    );
}

function DoodleCoil() {
    return (
        <svg className="w-14 h-8 overflow-visible" viewBox="0 0 60 30" fill="none">
            <path
                d="M 5 20 C 10 5, 20 5, 15 20 C 20 5, 30 5, 25 20 C 30 5, 40 5, 35 20 C 40 5, 50 5, 45 20 T 58 18"
                stroke="#0284c7"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="opacity-75"
            />
        </svg>
    );
}

export default function MechanicalMysteryViewer() {
    const data = MECHANICAL_MYSTERY_DATA;
    const [activeDossierId, setActiveDossierId] = useState(data.challenges[0].id);

    const activeDossier = data.challenges.find((c) => c.id === activeDossierId) || data.challenges[0];

    return (
        <div className="space-y-8">
            {/* Header Banner - Classified Mystery Theme */}
            <div className="bg-slate-900 text-white border-4 border-slate-900 shadow-[8px_8px_0px_#0284c7] p-5 sm:p-7 relative overflow-hidden">
                <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-amber-300 text-slate-900 border-2 border-amber-400 font-mono text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#0f172a]">
                            🕵️ {data.badge}
                        </span>
                        <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/50 font-mono text-[11px] font-black uppercase">
                            CLASSIFIED
                        </span>
                    </div>

                    <span className="font-mono text-xs font-bold text-amber-400 tracking-widest uppercase">
                        LEVEL 4 CLEARANCE
                    </span>
                </div>

                <h2 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight leading-none mb-3">
                    {data.headline}
                </h2>
                <p className="text-sm font-bold text-slate-300 max-w-2xl leading-relaxed">
                    {data.blurb}
                </p>

                {/* Team Formation Alert Banner: Exactly as requested: Teams of 2 */}
                <div className="mt-6 p-4 sm:p-5 bg-amber-300 text-slate-900 border-3 border-slate-900 shadow-[4px_4px_0px_#0284c7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-xs uppercase tracking-widest px-2 py-0.5 bg-slate-900 text-white">
                                {data.teamFormat.badge}
                            </span>
                            <span className="font-black text-sm uppercase text-slate-900">
                                {data.teamFormat.title}
                            </span>
                        </div>
                        <p className="text-sm font-black text-slate-900">
                            {data.teamFormat.desc}
                        </p>
                    </div>

                    <span className="text-3xl sm:text-4xl shrink-0 self-end sm:self-center">
                        👥
                    </span>
                </div>
            </div>

            {/* 3 Problem Statements Navigation */}
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-black uppercase tracking-widest text-slate-600">
                        3 PROBLEM STATEMENTS
                    </span>
                    <span className="font-mono text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 border border-sky-300">
                        Teams of 2 • 2 Sections per PS
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {data.challenges.map((ps) => {
                        const isActive = ps.id === activeDossier.id;
                        return (
                            <button
                                key={ps.id}
                                type="button"
                                onClick={() => setActiveDossierId(ps.id)}
                                className={`text-left p-4 sm:p-5 border-3 border-slate-900 cursor-pointer transition-all duration-150 relative ${
                                    isActive
                                        ? 'bg-slate-900 text-white shadow-[6px_6px_0px_#0284c7] -translate-y-1'
                                        : 'bg-white hover:bg-slate-100 text-slate-900 shadow-[3px_3px_0px_#0f172a]'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span
                                        className={`font-mono text-[11px] font-black uppercase px-2 py-0.5 border ${
                                            isActive
                                                ? 'bg-amber-300 text-slate-900 border-amber-300'
                                                : 'bg-slate-100 text-slate-700 border-slate-300'
                                        }`}
                                    >
                                        {ps.codename}
                                    </span>
                                    <DoodleCoil />
                                </div>

                                <h3 className="text-lg font-black uppercase tracking-tight leading-snug">
                                    {ps.title}
                                </h3>

                                {/* Random scribble doodle inside the card */}
                                <div className="mt-3 pt-2 border-t border-dashed border-slate-300/40">
                                    <ScribbleLines height={36} stroke={isActive ? '#38bdf8' : '#0284c7'} />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Active Problem Statement Detail Viewer */}
            <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-5 sm:p-7 space-y-6">
                <div className="border-b-3 border-slate-900 pb-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black uppercase px-2.5 py-1 bg-amber-300 text-slate-900 border-2 border-slate-900">
                                {activeDossier.codename}
                            </span>
                            <span className="font-mono text-xs font-black uppercase text-slate-500">
                                2 SECTIONS REQUIRED
                            </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 border border-rose-300">
                            TEAMS OF 2
                        </span>
                    </div>

                    <h3 className="text-2xl sm:text-4xl font-black uppercase text-slate-900 tracking-tight">
                        {activeDossier.title}
                    </h3>

                    {/* Scribbles under heading */}
                    <div className="mt-3 max-w-xl">
                        <ScribbleLines height={45} stroke="#0284c7" />
                    </div>
                </div>

                {/* The Two Required Sections: Longitudinal Control & Lateral Control */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Section 01: Longitudinal Control */}
                    <div className="bg-sky-50 border-3 border-slate-900 shadow-[4px_4px_0px_#0f172a] p-5 space-y-4">
                        <div className="flex items-center justify-between gap-2 border-b-2 border-slate-900 pb-3">
                            <div>
                                <span className="font-mono text-[11px] font-black uppercase text-sky-700 block">
                                    SECTION 01
                                </span>
                                <h4 className="text-xl font-black uppercase text-slate-900 leading-snug">
                                    {activeDossier.sectionLongitudinal.title}
                                </h4>
                            </div>
                            <span className="text-2xl">⚡</span>
                        </div>

                        {/* Random Scribbles and Doodles all over the section body */}
                        <div className="space-y-3">
                            <ScribbleChaosBox />
                            <ScribbleLines height={55} stroke="#0284c7" />
                            <ScribbleLines height={45} stroke="#0f172a" />
                        </div>
                    </div>

                    {/* Section 02: Lateral Control */}
                    <div className="bg-amber-50/70 border-3 border-slate-900 shadow-[4px_4px_0px_#0f172a] p-5 space-y-4">
                        <div className="flex items-center justify-between gap-2 border-b-2 border-slate-900 pb-3">
                            <div>
                                <span className="font-mono text-[11px] font-black uppercase text-amber-800 block">
                                    SECTION 02
                                </span>
                                <h4 className="text-xl font-black uppercase text-slate-900 leading-snug">
                                    {activeDossier.sectionLateral.title}
                                </h4>
                            </div>
                            <span className="text-2xl">🔄</span>
                        </div>

                        {/* Random Scribbles and Doodles all over the section body */}
                        <div className="space-y-3">
                            <ScribbleChaosBox />
                            <ScribbleLines height={55} stroke="#f59e0b" />
                            <ScribbleLines height={45} stroke="#0f172a" />
                        </div>
                    </div>
                </div>

                {/* Mystery Evaluation Protocol Card: Exactly as requested */}
                <div className="bg-slate-900 text-white border-3 border-slate-900 p-5 sm:p-6 shadow-[6px_6px_0px_#0284c7] relative overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-rose-600 text-white font-mono text-[10px] font-black uppercase tracking-widest">
                                🔒 {data.evaluationNotice.status}
                            </span>
                            <span className="font-mono text-xs font-black uppercase text-amber-300">
                                {data.evaluationNotice.badge}
                            </span>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-slate-400">
                            CONFIDENTIAL
                        </span>
                    </div>

                    <h4 className="text-xl font-black uppercase tracking-tight text-white mb-2">
                        {data.evaluationNotice.title}
                    </h4>

                    <p className="text-sm font-black text-slate-200 leading-relaxed max-w-3xl">
                        {data.evaluationNotice.desc}
                    </p>

                    {/* Mystery scribble doodles over the rubric */}
                    <div className="mt-4 pt-3 border-t border-slate-800">
                        <ScribbleLines height={40} stroke="#38bdf8" />
                    </div>
                </div>

                {/* Footer Notice - Apply Button Removed */}
                <div className="pt-4 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs font-bold text-slate-600">
                    <div>
                        👥 Everyone will be split into teams of 2.
                    </div>
                    <div className="text-sky-700 font-black">
                        Timeline &amp; challenge portal open tomorrow at 6:30 PM IST
                    </div>
                </div>
            </div>
        </div>
    );
}
