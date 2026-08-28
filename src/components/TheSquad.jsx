import { useState, useEffect } from 'react';
import CardSwap, { Card } from './CardSwap';
import { useWebsiteData } from '../context/WebsiteDataContext';

export default function TheSquad({ onSelectSubsystem }) {
    const { siteData } = useWebsiteData();
    const subsystems = siteData.subsystems;
    const [cardSize, setCardSize] = useState({
        width: 480,
        height: 360,
        cardDistance: 28,
        verticalDistance: 28
    });

    useEffect(() => {
        const updateSize = () => {
            const isMobile = window.innerWidth < 640;
            setCardSize({
                width: isMobile ? Math.min(window.innerWidth - 48, 330) : 480,
                height: isMobile ? 330 : 360,
                cardDistance: isMobile ? 18 : 28,
                verticalDistance: isMobile ? 18 : 28
            });
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    return (
        <section id="squad" className="py-28 px-4 sm:px-8 bg-transparent border-t-4 border-slate-900 relative overflow-hidden z-10 select-none">

            <div className="max-w-7xl mx-auto">

                {/* Header (Cyberbites Stacked "THE SQUAD" Style) */}
                <div data-assemble="header" className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-6xl sm:text-7xl md:text-8xl font-black text-slate-900 leading-none uppercase">
                                THE
                            </h2>
                            <h2 className="text-6xl sm:text-7xl md:text-8xl font-black text-stroke-black text-transparent leading-none uppercase">
                                SQUAD
                            </h2>
                            <span className="animate-spin-slow text-amber-400 text-4xl hidden sm:inline-block">★</span>
                        </div>
                        <p className="text-sm sm:text-base font-bold text-slate-600 mt-3 max-w-xl">
                            Click any card to view the team.
                        </p>
                    </div>


                </div>

                {/* React Bits <CardSwap /> Component Integration Container */}
                <div className="relative w-full h-[520px] sm:h-[580px] my-6 flex items-center justify-center overflow-visible">

                    <CardSwap
                        width={cardSize.width}
                        height={cardSize.height}
                        cardDistance={cardSize.cardDistance}
                        verticalDistance={cardSize.verticalDistance}
                        delay={4200}
                        pauseOnHover={true}
                        skewAmount={0}
                        easing="elastic"
                        onCardClick={(idx) => {
                            const selected = subsystems[idx % subsystems.length];
                            if (selected && onSelectSubsystem) {
                                onSelectSubsystem(selected.id);
                            }
                        }}
                    >
                        {subsystems.map((system, idx) => (
                            <Card
                                key={system.id}
                                customClass="cursor-pointer group p-6 flex flex-col justify-between overflow-hidden"
                            >
                                {/* Top Color Accent Stripe */}
                                <div className={`h-3.5 -mx-6 -mt-6 mb-5 ${system.color} border-b-3 border-slate-900 flex items-center justify-between px-4`} />

                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="px-2.5 py-0.5 bg-slate-900 text-white font-mono font-black text-[10px] uppercase">
                                            {system.badge}
                                        </span>
                                        <span className="px-2 py-0.5 bg-sky-100 border border-slate-900 font-mono font-black text-[10px] text-slate-900">
                                            {system.stat}
                                        </span>
                                    </div>

                                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight mb-2 group-hover:text-sky-600 transition-colors">
                                        {system.name}
                                    </h3>

                                    <p className="text-xs sm:text-sm text-slate-600 font-bold leading-relaxed line-clamp-3">
                                        {system.shortDesc}
                                    </p>
                                </div>

                                <div className="pt-4 border-t-2 border-slate-900 flex items-center justify-between">
                                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                                        {system.id === 'leads' ? `${system.teamMembers.length} CORE LEADS` : `${system.teamMembers.length} ASSIGNED ENGINEERS`}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectSubsystem(system.id);
                                        }}
                                        className="px-3.5 py-1.5 bg-sky-500 hover:bg-slate-900 text-white font-black text-xs uppercase border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] transition-all"
                                    >
                                        VIEW CREW →
                                    </button>
                                </div>
                            </Card>
                        ))}
                    </CardSwap>

                </div>

                {/* Quick Subsystem Direct Navigation Grid (Allows direct 1-click access to all 5 subsystems) */}
                <div className="mt-16 pt-12 border-t-3 border-slate-900">
                    <span className="text-xs font-mono font-black text-slate-500 uppercase tracking-widest block mb-6 text-center">
                        // OR DIRECTLY SELECT A SUBSYSTEM TO INSPECT
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono">
                        {subsystems.map((s, idx) => (
                            <button
                                key={s.id}
                                onClick={() => onSelectSubsystem(s.id)}
                                className="press p-3 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] hover:bg-sky-500 hover:text-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#0f172a] text-left flex flex-col justify-between cursor-pointer"
                            >
                                <span className="text-[10px] font-black opacity-60">0{idx + 1}</span>
                                <span className="text-xs font-black uppercase mt-2 leading-tight">
                                    {s.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

            </div>

        </section>
    );
}
