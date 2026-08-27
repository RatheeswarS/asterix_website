import { useState } from 'react';
import { useWebsiteData } from '../context/WebsiteDataContext';

export default function OurStoryCurvedWave() {
    const { siteData } = useWebsiteData();
    const [isExpanded, setIsExpanded] = useState(false);
    const storyParagraphs = (siteData.story || "").split(/\n\n+/).filter(Boolean);

    return (
        <section id="story" className="py-28 px-4 sm:px-8 bg-slate-900 text-white border-t-4 border-slate-900 relative overflow-hidden z-10 select-none">

            {/* Animated SVG Sinusoidal Wave Text Path (Cyberbites Exact Signature Effect) */}
            <div data-assemble="down" className="w-full overflow-hidden opacity-90 mb-14">
                <svg className="w-full h-28 sm:h-40 md:h-48" viewBox="0 0 1200 200" fill="none">
                    <path
                        id="storyCurve"
                        d="M 0,100 C 300,10 600,190 900,100 C 1200,10 1500,190 1800,100 C 2100,10 2400,190 2700,100"
                        fill="none"
                    />
                    <text className="font-black text-2xl sm:text-3xl tracking-widest fill-sky-400 uppercase font-mono">
                        <textPath href="#storyCurve" startOffset="0%">
                            OUR STORY ✦ FROM TRAINING PROGRAM TO CHENNAI ✦ SAEINDIA a-BAJA 2026 ✦ THE FIRST DRAFT ✦ OUR STORY ✦ FROM TRAINING PROGRAM TO CHENNAI ✦
                            <animate
                                attributeName="startOffset"
                                from="0%"
                                to="-100%"
                                dur="28s"
                                repeatCount="indefinite"
                            />
                        </textPath>
                    </text>
                </svg>
            </div>

            <div className="max-w-4xl mx-auto">

                {/* Main Story Box (Essay Format) */}
                <div data-assemble="card" className="bg-white text-slate-900 border-4 border-slate-900 shadow-[12px_12px_0px_#0284c7] p-6 sm:p-12 md:p-14 relative">

                    {/* Section Header */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 border-b-3 border-slate-900 pb-6">
                        <div>
                            <span className="text-xs font-mono font-black text-sky-600 tracking-widest uppercase block mb-1">
                                // CHRONICLES • HOW IT ALL BEGAN
                            </span>
                            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 uppercase leading-none">
                                OUR STORY
                            </h2>
                        </div>

                        <a
                            href={siteData.hero.joinFormUrl || "https://forms.gle/6hHG6aXqrunnfj7V6"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cyber-button px-7 py-3.5 text-xs font-black tracking-wider uppercase inline-block self-start md:self-auto cursor-pointer whitespace-nowrap shadow-[4px_4px_0px_#0f172a]"
                        >
                            JOIN OUR CREW →
                        </a>
                    </div>

                    {/* Essay Container (Cut after 4 lines when collapsed, full story when expanded) */}
                    <div className="relative">
                        <div
                            className={`transition-all duration-500 ease-in-out ${isExpanded
                                ? "max-h-none opacity-100"
                                : "max-h-[118px] overflow-hidden select-none"
                                }`}
                        >
                            <div className="text-base sm:text-lg text-slate-700 font-medium leading-relaxed space-y-5">
                                {storyParagraphs.map((para, idx) => (
                                    <p 
                                        key={idx} 
                                        className={idx === 0 ? "font-bold text-slate-900 text-lg sm:text-xl" : ""}
                                    >
                                        {para}
                                    </p>
                                ))}
                            </div>
                        </div>

                        {/* Fade overlay when collapsed */}
                        {!isExpanded && (
                            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/85 to-transparent pointer-events-none" />
                        )}
                    </div>

                    {/* Show More / Show Less Button */}
                    <div className="mt-5 pt-4 border-t-2 border-slate-100 flex items-center justify-between">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-900 font-black text-xs uppercase tracking-wider text-slate-900 shadow-[3px_3px_0px_#0f172a] hover:bg-sky-100 hover:shadow-[1px_1px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                        >
                            <span>{isExpanded ? "SHOW LESS ↑" : "READ FULL STORY (SHOW MORE) ↓"}</span>
                        </button>


                    </div>

                    {/* Milestones Strip */}
                    <div data-assemble="stagger" className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t-3 border-slate-900 text-center font-mono">
                        <div className="p-4 bg-sky-50 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                            <span className="text-2xl sm:text-3xl font-black text-slate-900 block">YEAR 1</span>
                            <span className="text-[10px] font-bold text-slate-600 uppercase">Training Genesis</span>
                        </div>
                        <div className="p-4 bg-sky-50 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                            <span className="text-2xl sm:text-3xl font-black text-slate-900 block">5</span>
                            <span className="text-[10px] font-bold text-slate-600 uppercase">Core Subsystems</span>
                        </div>
                        <div className="p-4 bg-sky-50 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                            <span className="text-2xl sm:text-3xl font-black text-slate-900 block">AIR 13</span>
                            <span className="text-[10px] font-bold text-slate-600 uppercase">a-BAJA 2026 Finish</span>
                        </div>
                        <div className="p-4 bg-amber-300 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                            <span className="text-2xl sm:text-3xl font-black text-slate-900 block">GEN 2</span>
                            <span className="text-[10px] font-bold text-slate-900 uppercase">The Next Build</span>
                        </div>
                    </div>

                </div>

            </div>

        </section>
    );
}
