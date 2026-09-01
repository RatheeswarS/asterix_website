import { useEffect, useMemo, useState } from 'react';
import { useWebsiteData } from '../../context/WebsiteDataContext';
import { buildCredentials } from '../../lib/credentials';
import BadgeArtwork from './BadgeArtwork';
import teamLogo from '../../assets/Screenshot 2026-08-26 232320.png';

/**
 * The credential directory.
 *
 * Built from the roster already in memory rather than from a fetch, so it
 * renders instantly and stays consistent with the subsystem pages a visitor
 * just came from. The per-credential page is the one that does the independent
 * check against the API, because that is the page a stranger arrives at from a
 * LinkedIn link with no other context.
 */

const FILTERS = [
    { id: 'all', label: 'Everyone' },
    { id: 'active', label: 'Active crew' },
    { id: 'alumni', label: 'Alumni' }
];

export default function CrewBadgesPage({ onBack }) {
    const { siteData } = useWebsiteData();
    const [filter, setFilter] = useState('all');
    const [subsystemId, setSubsystemId] = useState('all');

    useEffect(() => {
        window.scrollTo(0, 0);
        window.lenis?.scrollTo(0, { immediate: true });
    }, []);

    const all = useMemo(() => buildCredentials(siteData.subsystems), [siteData.subsystems]);

    const shown = useMemo(() => all.filter((c) => {
        if (filter === 'alumni' && c.status !== 'Alumni') return false;
        if (filter === 'active' && c.status === 'Alumni') return false;
        if (subsystemId !== 'all' && c.subsystemId !== subsystemId) return false;
        return true;
    }), [all, filter, subsystemId]);

    const alumniCount = all.filter((c) => c.status === 'Alumni').length;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-amber-400 selection:text-slate-900">

            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-4 border-slate-900 shadow-[0_4px_0px_#0f172a]">
                <div className="px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <img src={teamLogo} alt="Team Asterix" className="h-9 w-auto object-contain" />
                        <div className="hidden sm:block">
                            <span className="font-mono text-xs font-black uppercase text-amber-600 block leading-tight">
                                ALUMNI &amp; CREW CREDENTIALS
                            </span>
                            <span className="font-black text-sm uppercase text-slate-900 leading-tight">
                                DIGITAL ENGINEERING BADGES
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onBack}
                        className="press px-4 py-2 border-2 border-slate-900 bg-sky-100 hover:bg-sky-500 hover:text-white font-mono font-black text-xs uppercase shadow-[2px_2px_0px_#0f172a] cursor-pointer shrink-0"
                    >
                        ← Back to Website
                    </button>
                </div>
            </header>

            <section className="py-12 sm:py-16 px-4 sm:px-8 bg-slate-900 text-white border-b-4 border-slate-900">
                <div className="max-w-6xl mx-auto">
                    <span className="px-3 py-1 bg-amber-300 text-slate-900 border-2 border-slate-900 shadow-[3px_3px_0px_#0284c7] font-mono text-xs font-black inline-block mb-4">
                        🎖 {all.length} ISSUED CREDENTIALS · {alumniCount} ALUMNI
                    </span>
                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-none mb-5">
                        PROOF OF <span className="text-stroke-white text-transparent">WORK</span>
                    </h1>
                    <p className="text-base sm:text-lg text-slate-300 font-bold max-w-3xl leading-relaxed">
                        Every engineer who has built for Team Asterix gets a page naming the subsystem they
                        owned and the work they actually shipped. Each one is generated from the team roster
                        and checked against it on every visit, so a link is worth reading rather than taking
                        on trust — and it is shareable straight into a résumé or a LinkedIn profile.
                    </p>
                </div>
            </section>

            <section className="py-10 px-4 sm:px-8 max-w-6xl mx-auto">
                <div className="flex flex-wrap gap-2 mb-8">
                    {FILTERS.map((f) => (
                        <button
                            key={f.id}
                            type="button"
                            onClick={() => setFilter(f.id)}
                            aria-pressed={filter === f.id}
                            className={`px-4 py-2.5 border-3 border-slate-900 font-mono font-black text-xs uppercase cursor-pointer ${
                                filter === f.id
                                    ? 'bg-slate-900 text-white shadow-[3px_3px_0px_#0284c7]'
                                    : 'bg-white hover:bg-slate-100 text-slate-900 shadow-[2px_2px_0px_#0f172a]'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}

                    <select
                        value={subsystemId}
                        onChange={(e) => setSubsystemId(e.target.value)}
                        aria-label="Filter by subsystem"
                        className="px-3 py-2.5 border-3 border-slate-900 bg-white font-mono font-black text-xs uppercase shadow-[2px_2px_0px_#0f172a] cursor-pointer"
                    >
                        <option value="all">All subsystems</option>
                        {siteData.subsystems.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                {shown.length === 0 ? (
                    <p className="p-6 bg-white border-4 border-slate-900 font-mono text-sm font-bold text-slate-600">
                        No credentials match that filter yet.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {shown.map((credential) => (
                            <a
                                key={credential.id}
                                href={`#badge/${credential.id}`}
                                className="press block no-underline hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform"
                            >
                                <BadgeArtwork credential={credential} />
                            </a>
                        ))}
                    </div>
                )}
            </section>

            <footer className="py-10 px-4 sm:px-8 bg-slate-900 text-white">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
                    <span>© 2026 TEAM ASTERIX · CREDENTIAL REGISTRY</span>
                    <button onClick={onBack} className="press press-flat text-sky-400 hover:text-white underline cursor-pointer">
                        ← Return to Main Site
                    </button>
                </div>
            </footer>
        </div>
    );
}
