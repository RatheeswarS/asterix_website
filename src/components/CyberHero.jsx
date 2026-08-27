export default function CyberHero({ onOpenModelViewer }) {
    return (
        <section id="hero" className="min-h-screen pt-28 sm:pt-32 pb-12 px-4 sm:px-8 md:px-12 lg:px-16 relative overflow-hidden flex flex-col justify-between select-none">

            {/* Main Hero Container - Left-aligned text content */}
            <div className="max-w-7xl mx-auto w-full my-auto z-10 pt-4 pb-8">

                {/* Top Badges Row (All 3 badges in the same row) */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6 z-20 relative">
                    <div className="rotate-[-3deg] bg-amber-300 text-slate-900 border-3 border-slate-900 shadow-[4px_4px_0px_#0f172a] px-4 py-2 font-black text-xs uppercase tracking-wider animate-bounce">
                        ⚡ AIR 13
                    </div>
                    {/* SAEINDIA a-BAJA 2026 Pill */}
                    <div className="inline-flex items-center gap-3 px-5 py-2 bg-white border-3 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-full">
                        <span className="w-3 h-3 rounded-full bg-sky-500 animate-pulse border border-slate-900" />
                        <span className="text-xs font-black tracking-widest text-slate-900 uppercase font-mono">
                            SAEINDIA a-BAJA 2026
                        </span>
                    </div>

                    {/* TN RANK 1 Badge */}
                    <div className="rotate-[3deg] bg-sky-400 text-white border-3 border-slate-900 shadow-[4px_4px_0px_#0f172a] px-4 py-2 font-black text-xs uppercase tracking-wider">
                        ★ TN RANK 1
                    </div>
                </div>

                {/* Left Content Block */}
                <div className="max-w-2xl lg:max-w-3xl text-left">

                    {/* Giant Stacked Typography */}
                    <div>
                        <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[10rem] font-black text-slate-900 leading-[0.88] tracking-tighter uppercase">
                            TEAM
                        </h1>

                        <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[10rem] font-black text-stroke-sky text-transparent leading-[0.88] tracking-tighter uppercase mt-1 sm:mt-2">
                            ASTERIX
                        </h1>
                    </div>

                    <p className="mt-6 text-base sm:text-xl md:text-2xl text-slate-700 font-bold leading-snug max-w-xl">
                        Got the passion? We got the track.
                    </p>

                    {/* Cyberbites Chunky Action Button */}
                    <div className="mt-8 flex flex-wrap items-center gap-5">
                        <a
                            href="#squad"
                            className="cyber-button px-9 py-4.5 text-sm sm:text-base tracking-widest uppercase cursor-pointer inline-block"
                        >
                            EXPLORE THE SQUAD →
                        </a>
                    </div>

                </div>

            </div>

            {/* Bottom Floating Footer Row with Corner 3D Baja Model Option */}
            <div className="max-w-7xl mx-auto w-full z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-slate-500 font-mono text-xs font-black uppercase">
                <span>SCROLL TO BE ON OUR SHOES!!</span>

                {/* Corner 3D Baja Inspector Button */}
                <button
                    onClick={onOpenModelViewer}
                    className="group px-4 py-2.5 bg-white hover:bg-sky-500 text-slate-900 hover:text-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#0f172a] transition-all flex items-center gap-2.5 font-mono font-black text-xs uppercase cursor-pointer"
                >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900 animate-pulse" />
                    <span>3D BAJA MODEL</span>
                    <span className="text-sm transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5">↗</span>
                </button>
            </div>

        </section>
    );
}
