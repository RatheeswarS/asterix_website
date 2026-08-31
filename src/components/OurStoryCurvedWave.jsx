import { useState, useRef, useLayoutEffect } from 'react';
import { useWebsiteData } from '../context/WebsiteDataContext';

const COLLAPSED_HEIGHT = 118;

export default function OurStoryCurvedWave({ onOpenRecruitment }) {
    const { siteData } = useWebsiteData();
    const [isExpanded, setIsExpanded] = useState(false);
    const storyParagraphs = (siteData.story || "").split(/\n\n+/).filter(Boolean);

    // `max-height` cannot transition to or from `none`, so the previous
    // max-h-[118px] -> max-h-none swap snapped open with no animation. Measure
    // the real content height and animate between two concrete pixel values.
    const contentRef = useRef(null);
    const [contentHeight, setContentHeight] = useState(0);

    useLayoutEffect(() => {
        const el = contentRef.current;
        if (!el) return;

        const measure = () => setContentHeight(el.scrollHeight);
        measure();

        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, [storyParagraphs.length]);

    return (
        <section id="story" className="py-28 px-4 sm:px-8 bg-slate-900 text-white border-t-4 border-slate-900 relative overflow-hidden z-10 select-none">

            {/* Animated SVG Sinusoidal Wave Text Path (Cyberbites Exact Signature Effect) */}
            {/* The text runs along a path far wider than the viewBox, so it is
                always cut at the frame edge -- mid-word, which reads as broken
                rather than continuous on a narrow screen. Fading both edges
                turns the cut into a ribbon running off into the margin. */}
            <div
                data-assemble="down"
                className="w-full overflow-hidden opacity-90 mb-14
                           [mask-image:linear-gradient(to_right,transparent_0%,#000_12%,#000_88%,transparent_100%)]
                           [-webkit-mask-image:linear-gradient(to_right,transparent_0%,#000_12%,#000_88%,transparent_100%)]"
            >
                <svg className="w-full h-28 sm:h-40 md:h-48" viewBox="0 0 1200 200" fill="none">
                    <path
                        id="storyCurve"
                        d="M 0,100 C 300,10 600,190 900,100 C 1200,10 1500,190 1800,100 C 2100,10 2400,190 2700,100"
                        fill="none"
                    />
                    <text className="font-black text-2xl sm:text-3xl tracking-widest fill-sky-400 uppercase font-mono">
                        <textPath href="#storyCurve" startOffset="0%">
                            OUR STORY ✦ FROM TRAINING PROGRAM TO CHENNAI ✦ SAEINDIA a-BAJA 2026 ✦ THE FIRST DRAFT ✦ OUR STORY ✦ FROM TRAINING PROGRAM TO CHENNAI ✦
                            {/* A one-way 0% -> -100% sweep teleports back to
                                the start on every repeat. Sweeping out and
                                back with eased turnarounds never snaps. */}
                            <animate
                                attributeName="startOffset"
                                values="0%;-34%;0%"
                                keyTimes="0;0.5;1"
                                calcMode="spline"
                                keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
                                dur="44s"
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
                                CHRONICLES • HOW IT ALL BEGAN
                            </span>
                            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 uppercase leading-none">
                                OUR STORY
                            </h2>
                        </div>

                        <button
                            onClick={() => {
                                if (onOpenRecruitment) onOpenRecruitment();
                                else window.location.hash = '#join';
                            }}
                            className="press cyber-button px-7 py-3.5 text-xs font-black tracking-wider uppercase inline-block self-start md:self-auto cursor-pointer whitespace-nowrap shadow-[4px_4px_0px_#0f172a]"
                        >
                            JOIN OUR CREW →
                        </button>
                    </div>

                    {/* Essay Container (Cut after 4 lines when collapsed, full story when expanded) */}
                    <div className="relative">
                        <div
                            id="story-essay"
                            className="overflow-hidden transition-[max-height] duration-[var(--dur-slow)] ease-[var(--ease-brutal)]"
                            style={{
                                maxHeight: isExpanded
                                    ? `${Math.max(contentHeight, COLLAPSED_HEIGHT)}px`
                                    : `${COLLAPSED_HEIGHT}px`
                            }}
                        >
                            <div
                                ref={contentRef}
                                className="text-base sm:text-lg text-slate-700 font-medium leading-relaxed space-y-5"
                            >
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

                        {/* Fade overlay when collapsed. Kept mounted and faded
                            by opacity so it does not pop out of existence the
                            instant the essay starts expanding. */}
                        <div
                            className={`absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/85 to-transparent pointer-events-none transition-opacity duration-[var(--dur-slow)] ease-[var(--ease-brutal)] ${isExpanded ? 'opacity-0' : 'opacity-100'
                                }`}
                        />
                    </div>

                    {/* Show More / Show Less Button */}
                    <div className="mt-5 pt-4 border-t-2 border-slate-100 flex items-center justify-between">
                        {/* This used to apply the pressed-in look on hover,
                            which left nothing for the actual click to do.
                            Hover lifts, :active presses. */}
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            aria-expanded={isExpanded}
                            aria-controls="story-essay"
                            className="press inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-900 font-black text-xs uppercase tracking-wider text-slate-900 shadow-[3px_3px_0px_#0f172a] hover:bg-sky-100 hover:shadow-[5px_5px_0px_#0f172a] hover:-translate-x-[1px] hover:-translate-y-[1px] cursor-pointer"
                        >
                            <span>
                                {isExpanded ? "SHOW LESS" : "READ FULL STORY (SHOW MORE)"}
                                <span aria-hidden="true">{isExpanded ? " ↑" : " ↓"}</span>
                            </span>
                        </button>


                    </div>

                    {/* Milestones Strip */}
                    <div data-assemble="stagger" className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t-3 border-slate-900 text-center font-mono">
                        <div className="p-4 bg-sky-50 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                            <span className="text-2xl sm:text-3xl font-black text-slate-900 block">YEAR 1</span>
                            <span className="text-[10px] font-bold text-slate-600 uppercase">Training Genesis</span>
                        </div>
                        <div className="p-4 bg-sky-50 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                            <span className="text-2xl sm:text-3xl font-black text-slate-900 block">4</span>
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
