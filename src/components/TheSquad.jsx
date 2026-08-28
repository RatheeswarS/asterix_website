import React, { useState, useEffect } from 'react';
import ScrollStack from './ScrollStack';
import { useWebsiteData } from '../context/WebsiteDataContext';

export default function TheSquad({ onSelectSubsystem }) {
    const { siteData } = useWebsiteData();
    const subsystems = siteData.subsystems;
    const [activeIdx, setActiveIdx] = useState(0);
    const [cardWidth, setCardWidth] = useState(840);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 640) {
                setCardWidth(width - 32);
            } else if (width < 1024) {
                setCardWidth(Math.min(width - 64, 720));
            } else {
                setCardWidth(840);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const activeSystem = subsystems[activeIdx] || subsystems[0];

    return (
        <section
            id="squad"
            className="border-t-4 border-slate-900 relative z-10 select-none bg-slate-50/50"
        >
            {/* Section Header */}
            <div className="pt-24 pb-10 px-4 sm:px-8 max-w-7xl mx-auto">
                <div data-assemble="header" className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-6xl sm:text-7xl md:text-8xl font-black text-slate-900 leading-none uppercase tracking-tight">
                                THE
                            </h2>
                            <h2 className="text-6xl sm:text-7xl md:text-8xl font-black text-stroke-black text-transparent leading-none uppercase tracking-tight">
                                SQUAD
                            </h2>
                            <span className="animate-spin-slow text-amber-400 text-4xl hidden sm:inline-block">★</span>
                        </div>
                        <p className="text-sm sm:text-base font-bold text-slate-600 mt-3 max-w-xl">
                            Scroll down to cycle through the engineering decks. Click any card to inspect the crew.
                        </p>
                    </div>

                    {/* Active Deck Status Indicator */}
                    <div className="hidden sm:flex items-center gap-3 font-mono">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                            CURRENT DECK:
                        </span>
                        <span className="px-3 py-1 bg-white border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] text-xs font-black uppercase text-sky-600">
                            {activeSystem.name}
                        </span>
                    </div>
                </div>
            </div>

            {/* React Bits Pro <ScrollStack /> Component with Cartoon / Retro-Brutalist Theme */}
            <ScrollStack
                variant="deck"
                scrollLength={0.85}
                peek={32}
                scaleStep={0.05}
                blur={2}
                dim={0.16}
                smooth={0.16}
                depth={4}
                cardWidth={cardWidth}
                cardHeight={0.62}
                borderRadius={18}
                perspective={1200}
                showProgress={true}
                showCounter={true}
                onIndexChange={(idx) => setActiveIdx(idx)}
                className="my-2"
            >
                {subsystems.map((system, idx) => (
                    <article
                        key={system.id}
                        onClick={() => {
                            if (onSelectSubsystem) {
                                onSelectSubsystem(system.id);
                            }
                        }}
                        className="group relative w-full h-full rounded-2xl bg-white border-4 border-slate-900 shadow-[10px_10px_0px_#0f172a] sm:shadow-[14px_14px_0px_#0f172a] p-6 sm:p-8 md:p-10 flex flex-col justify-between overflow-hidden cursor-pointer select-none transition-transform duration-200 hover:-translate-y-1 hover:shadow-[14px_14px_0px_#0284c7]"
                    >
                        {/* Top Color Accent Stripe */}
                        <div
                            className={`h-5 sm:h-6 -mx-6 sm:-mx-8 md:-mx-10 -mt-6 sm:-mt-8 md:-mt-10 mb-6 sm:mb-8 ${system.color} border-b-4 border-slate-900 flex items-center justify-between px-6`}
                        >
                            <span className="text-[10px] font-mono font-black text-slate-900/60 uppercase tracking-widest">
                                DECK 0{idx + 1}
                            </span>
                            <span className="text-[10px] font-mono font-black text-slate-900/60 uppercase">
                                TEAM ASTERIX
                            </span>
                        </div>

                        {/* Card Content Area */}
                        <div className="flex-1 flex flex-col justify-start">
                            {/* Badges Row */}
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                <span className="px-3 py-1 bg-slate-900 text-white font-mono font-black text-[11px] sm:text-xs uppercase tracking-wider rounded-sm shadow-[2px_2px_0px_#0f172a]">
                                    {system.badge}
                                </span>
                                <span className="px-3 py-1 bg-sky-100 border-2 border-slate-900 font-mono font-black text-[11px] sm:text-xs text-slate-900 rounded-sm shadow-[2px_2px_0px_#0f172a]">
                                    {system.stat}
                                </span>
                            </div>

                            {/* Subsystem Name */}
                            <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tight mb-3 group-hover:text-sky-600 transition-colors">
                                {system.name}
                            </h3>

                            {/* Description */}
                            <p className="text-sm sm:text-base text-slate-700 font-bold leading-relaxed mb-4 max-w-2xl line-clamp-3 sm:line-clamp-4">
                                {system.shortDesc || system.tagline}
                            </p>

                            {/* Engineering Specifications Highlights (Visible on tablets & desktops) */}
                            {system.specifications && system.specifications.length > 0 && (
                                <div className="hidden sm:flex flex-wrap gap-2 mt-auto pt-2">
                                    {system.specifications.slice(0, 3).map((spec, sIdx) => (
                                        <span
                                            key={sIdx}
                                            className="px-2.5 py-1 bg-slate-100 border-2 border-slate-900 text-[10px] sm:text-[11px] font-mono text-slate-800 rounded shadow-[1px_1px_0px_#0f172a]"
                                        >
                                            <strong className="font-black text-slate-900">{spec.label}:</strong> {spec.value}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Card Bottom Bar */}
                        <div className="pt-5 mt-4 border-t-3 border-slate-900 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-900 animate-pulse" />
                                <span className="text-xs sm:text-sm font-mono font-black text-slate-600 uppercase tracking-wider">
                                    {system.id === 'leads'
                                        ? `${system.teamMembers?.length || 4} CORE LEADS`
                                        : `${system.teamMembers?.length || 3} ASSIGNED ENGINEERS`}
                                </span>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onSelectSubsystem) {
                                        onSelectSubsystem(system.id);
                                    }
                                }}
                                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-sky-500 hover:bg-slate-900 text-white font-black text-xs sm:text-sm uppercase border-3 border-slate-900 shadow-[3px_3px_0px_#0f172a] hover:shadow-[1px_1px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
                            >
                                VIEW CREW →
                            </button>
                        </div>
                    </article>
                ))}
            </ScrollStack>

            {/* Quick Subsystem Direct Navigation Grid (Allows direct 1-click access to all 5 subsystems) */}
            <div className="py-16 px-4 sm:px-8 max-w-7xl mx-auto border-t-3 border-slate-900 mt-8">
                <span data-assemble="header" className="text-xs font-mono font-black text-slate-500 uppercase tracking-widest block mb-6 text-center">
                    // OR DIRECTLY SELECT A SUBSYSTEM TO INSPECT
                </span>

                <div data-assemble="stagger" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono">
                    {subsystems.map((s, idx) => (
                        <button
                            key={s.id}
                            onClick={() => onSelectSubsystem(s.id)}
                            className="press p-3 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] hover:bg-sky-500 hover:text-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#0f172a] text-left flex flex-col justify-between cursor-pointer transition-all"
                        >
                            <span className="text-[10px] font-black opacity-60">0{idx + 1}</span>
                            <span className="text-xs font-black uppercase mt-2 leading-tight">
                                {s.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}
