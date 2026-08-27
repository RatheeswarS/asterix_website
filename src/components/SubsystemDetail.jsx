import { useEffect } from 'react';
import { subsystems } from '../data/subsystemsData';

export default function SubsystemDetail({ subsystemId, onBack, onSelectSubsystem }) {
    const currentSystem = subsystems.find(s => s.id === subsystemId) || subsystems[0];
    const currentIndex = subsystems.findIndex(s => s.id === currentSystem.id);
    const nextSystem = subsystems[(currentIndex + 1) % subsystems.length];
    const prevSystem = subsystems[(currentIndex - 1 + subsystems.length) % subsystems.length];

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [subsystemId]);

    return (
        <div className="min-h-screen bg-white text-slate-900 pt-28 pb-20 px-4 sm:px-8 relative z-30 selection:bg-sky-500 selection:text-white">
            <div className="max-w-6xl mx-auto">

                {/* Top Navigation & Back Button */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <button
                        onClick={onBack}
                        className="cyber-button-white px-6 py-3 text-xs tracking-wider uppercase flex items-center gap-2 cursor-pointer"
                    >
                        <span>← Back to Overview</span>
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onSelectSubsystem(prevSystem.id)}
                            className="px-4 py-2 border-2 border-slate-900 bg-white font-bold text-xs shadow-[2px_2px_0px_#0f172a] hover:bg-sky-100 transition-colors cursor-pointer"
                        >
                            ← Prev Spec
                        </button>
                        <span className="font-mono font-black text-xs px-3 py-1 bg-slate-900 text-white">
                            0{currentIndex + 1} / 0{subsystems.length}
                        </span>
                        <button
                            onClick={() => onSelectSubsystem(nextSystem.id)}
                            className="px-4 py-2 border-2 border-slate-900 bg-white font-bold text-xs shadow-[2px_2px_0px_#0f172a] hover:bg-sky-100 transition-colors cursor-pointer"
                        >
                            Next Spec →
                        </button>
                    </div>
                </div>

                {/* Main Subsystem Hero Card */}
                <div className="bg-white border-4 border-slate-900 shadow-[10px_10px_0px_#0f172a] p-6 sm:p-12 mb-12 relative overflow-hidden">
                    {/* Top Accent Color Strip */}
                    <div className={`h-4 -mx-6 sm:-mx-12 -mt-6 sm:-mt-12 mb-8 ${currentSystem.color} border-b-4 border-slate-900`} />

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="px-3 py-1 bg-slate-900 text-white font-mono font-black text-xs uppercase tracking-widest">
                                    {currentSystem.badge}
                                </span>
                                <span className="px-3 py-1 bg-sky-100 border border-slate-900 text-slate-900 font-mono font-black text-xs uppercase">
                                    {currentSystem.stat}
                                </span>
                            </div>

                            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 uppercase tracking-tight leading-none">
                                {currentSystem.name}
                            </h1>
                            <p className="text-lg sm:text-xl font-bold text-sky-600 mt-2">
                                {currentSystem.tagline}
                            </p>
                        </div>

                        <div className="hidden lg:flex items-center justify-center w-24 h-24 bg-sky-50 border-3 border-slate-900 shadow-[4px_4px_0px_#0f172a] font-mono font-black text-3xl text-slate-900">
                            0{currentIndex + 1}
                        </div>
                    </div>

                    <p className="text-base sm:text-lg text-slate-700 font-bold leading-relaxed max-w-4xl">
                        {currentSystem.fullDesc}
                    </p>
                </div>

                {/* Subsystem Specifications & Highlights (Full Width Clean Layout) */}
                <div className="bg-white border-4 border-slate-900 shadow-[10px_10px_0px_#0f172a] p-6 sm:p-10 mb-16">
                    <div className="flex items-center justify-between mb-8 border-b-3 border-slate-900 pb-4">
                        <h3 className="text-2xl sm:text-3xl font-black uppercase text-slate-900 tracking-tight">
                            TECHNICAL SPECIFICATIONS
                        </h3>
                    </div>

                    {/* Specifications Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono mb-8">
                        {currentSystem.specifications.map((spec, idx) => (
                            <div key={idx} className="p-4 bg-sky-50 border-3 border-slate-900 shadow-[4px_4px_0px_#0f172a]">
                                <span className="text-[11px] font-bold text-slate-600 uppercase block mb-1.5 font-mono">
                                    {spec.label}
                                </span>
                                <span className="text-base sm:text-lg font-black text-slate-900 block leading-tight font-mono">
                                    {spec.value}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Key Engineering Highlights */}
                    <div className="pt-6 border-t-2 border-slate-200 mb-8">
                        <h4 className="text-sm font-black uppercase text-slate-900 mb-4 tracking-wider">
                            KEY ENGINEERING HIGHLIGHTS:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {currentSystem.highlights.map((highlight, idx) => (
                                <div key={idx} className="flex items-start gap-2.5 p-3.5 bg-slate-50 border-2 border-slate-900">
                                    <span className="text-sky-600 font-black text-base leading-none">✦</span>
                                    <span className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed">{highlight}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact Subsystem Engineers Banner */}
                    <div className="pt-6 border-t-3 border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-sky-50/70 p-6 border-2 border-slate-900">
                        <div>
                            <p className="text-sm sm:text-base font-black text-slate-900 uppercase">
                                Have a question about {currentSystem.name}?
                            </p>
                        </div>
                        <a
                            href="mailto:contact@teamasterix.org"
                            className="cyber-button px-6 py-3 text-xs tracking-wider uppercase whitespace-nowrap inline-block self-start sm:self-auto cursor-pointer"
                        >
                            Contact Subsystem Engineers →
                        </a>
                    </div>
                </div>

                {/* Subsystem Team Members Section */}
                <div className="bg-white border-4 border-slate-900 shadow-[10px_10px_0px_#0f172a] p-6 sm:p-12 mb-16">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 border-b-3 border-slate-900 pb-4">
                        <div>
                            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 uppercase tracking-tight">
                                Members
                            </h2>
                        </div>
                        <span className="px-3 py-1 bg-sky-100 border-2 border-slate-900 font-mono font-black text-xs self-start sm:self-auto">
                            {currentSystem.teamMembers.length} ENGINEERS ASSIGNED
                        </span>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {currentSystem.teamMembers.map((member, idx) => (
                            <div
                                key={idx}
                                className="cyber-card p-6 flex flex-col justify-between bg-sky-50/40 group"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-14 h-14 bg-slate-900 text-white border-2 border-slate-900 font-mono font-black text-lg flex items-center justify-center shadow-[3px_3px_0px_#0284c7] group-hover:bg-sky-500 transition-colors">
                                            {member.initials}
                                        </div>
                                        <span className="px-2.5 py-0.5 bg-white border border-slate-900 font-mono font-black text-[10px] uppercase">
                                            {member.badge}
                                        </span>
                                    </div>

                                    <h4 className="text-xl font-black text-slate-900 uppercase mb-1">
                                        {member.name}
                                    </h4>
                                    <p className="text-xs font-mono font-bold text-sky-600 mb-3">
                                        {member.role}
                                    </p>
                                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                        {member.bio}
                                    </p>
                                </div>

                                <div className="mt-6 pt-3 border-t border-slate-200 text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center justify-between">
                                    <span>TEAM ASTERIX</span>
                                    <span className="text-sky-600">ACTIVE</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Subsystem Switcher Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-slate-900 text-white border-4 border-slate-900 shadow-[8px_8px_0px_#0284c7]">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⚡</span>
                        <div>
                            <span className="text-[10px] font-mono text-sky-400 uppercase block">Next System in Line:</span>
                            <span className="text-base font-black uppercase">{nextSystem.name}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => onSelectSubsystem(nextSystem.id)}
                        className="cyber-button px-8 py-3.5 text-xs font-black uppercase cursor-pointer"
                    >
                        EXPLORE {nextSystem.name} →
                    </button>
                </div>

            </div>
        </div>
    );
}
