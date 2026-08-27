import { useState } from 'react';

export default function OurStoryCurvedWave() {
    const [isExpanded, setIsExpanded] = useState(false);

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


                            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase text-slate-900 tracking-tight leading-none">
                                IT STARTED AS A <span className="text-stroke-sky text-transparent">TRAINING PROGRAM.</span>
                            </h2>
                        </div>

                        <a
                            href="https://forms.gle/6hHG6aXqrunnfj7V6"
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
                                <p className="font-bold text-slate-900 text-lg sm:text-xl">
                                    It started as a training program.
                                </p>

                                <p>
                                    In the first year, there was no Team Asterix, no competition vehicle, and no clear idea where the journey would lead. It was simply a group of students learning how vehicles worked. Months were spent understanding vehicle dynamics, control systems, electronics, and autonomous technologies.
                                </p>

                                <p>
                                    About a year later, the group decided to take the program seriously and registered for SAE BAJA 2026. Somewhere along that journey, the name Asterix came into existence, and the training program evolved into a team with a much bigger ambition.
                                </p>

                                <p className="font-bold text-sky-700">
                                    That was where the real learning began.
                                </p>

                                <p>
                                    The project was divided into five major subsystems: Software, Sensors, Powertrain, Steer-by-Wire, and Brake & Throttle-by-Wire. Each had its own challenges, but the vehicle could only work when all five came together.
                                </p>

                                <p>
                                    The team started with planning. Budgets were prepared, timelines were drawn, documents were written, and everything looked organized on paper. But this was the first BAJA vehicle the team had ever built. There was still a lot they didn’t know.
                                </p>

                                <p>
                                    The autonomous side involved systems like Automatic Emergency Braking (AEB) and Lane Keeping Assist (LKA). AEB was tested, while LKA couldn’t be fully validated due to delays in vehicle testing.
                                </p>

                                <p>
                                    Like most first-time engineering teams, everyone wore multiple hats.
                                </p>

                                <p>
                                    Design reviews, documentation, procurement, fabrication, wiring, machining, painting, body panels, stickers, T-shirt designs, presentations, and countless other jobs became routine.
                                </p>

                                <p className="font-bold text-slate-900">
                                    Then reality caught up.
                                </p>

                                <p>
                                    Timelines slipped. Simple tasks took days. Presentations were made the night before. The garage became a second home. Weeks passed with little sleep, constant debugging, delayed parts, broken components, and new problems every day.
                                </p>

                                <p>
                                    Eventually, everything came together.
                                </p>

                                <p>
                                    The vehicle was packed and sent to Chennai.
                                </p>

                                <p>
                                    The team cleared Mechanical and Electrical Inspection, though not without battle scars. But A-Kit ended the journey. Electrical issues meant the vehicle never reached dynamic events.
                                </p>

                                <p className="font-bold text-slate-900 text-lg sm:text-xl">
                                    Still, the team finished AIR 13.
                                </p>

                                <p>
                                    It wasn’t the result hoped for, and it felt like a hard ending.
                                </p>

                                <div className="p-6 bg-sky-50 border-3 border-slate-900 shadow-[4px_4px_0px_#0f172a] my-6">
                                    <p className="font-black text-slate-900 text-lg sm:text-xl uppercase tracking-tight mb-2">
                                        Looking back, it feels like the first draft.
                                    </p>
                                    <p className="text-slate-800 font-bold">
                                        The biggest lesson wasn’t about any subsystem. It was that ambitious engineering is decided long before assembly begins.
                                    </p>
                                </div>

                                <p>
                                    Planning matters. Foundations matter. Understanding why something is built matters as much as building it.
                                </p>

                                <p>
                                    Engineering is also not solo work. Some problems need perspective. No last-minute effort can replace proper testing.
                                </p>

                                <p>
                                    Mistakes were made—expensive, frustrating, avoidable.
                                </p>

                                <p className="font-bold text-slate-900">
                                    But each became part of what comes next.
                                </p>

                                <p className="text-lg sm:text-xl font-black text-sky-600">
                                    The next build won’t just improve the vehicle.
                                </p>

                                <p className="text-xl sm:text-2xl font-black text-slate-900">
                                    It will improve everything behind it.
                                </p>
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
