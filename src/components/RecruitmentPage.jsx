import { useEffect, useMemo, useState } from 'react';
import {
    useRecruitmentCountdown,
    RecruitmentCountdownBoard,
    RecruitmentCountdownStrip,
} from './RecruitmentCountdown';
import { useWebsiteData } from '../context/WebsiteDataContext';
import { formatIstFull } from '../lib/istTime';
import teamLogo from '../assets/Screenshot 2026-08-26 232320.png';

/**
 * The recruitment portal — static edition.
 *
 * Applications run entirely through the team's Google Form. This page is the
 * shop window in front of it: the induction timeline (with a live countdown to
 * the next deadline) and the subsystem problem statements the leads publish
 * from the admin dashboard. Everything it shows comes from `siteData.recruitment`,
 * so it works from the bundled defaults even with no backend, and updates the
 * moment an admin edit syncs — exactly like every other section of the site.
 *
 * There is no application form, no status lookup and no team draw here any more.
 * Those lived behind their own API; the form is simpler and it is what the team
 * actually uses.
 */

const btnPrimary =
    'press inline-flex items-center gap-2 px-6 py-3.5 bg-amber-300 hover:bg-amber-400 text-slate-900 border-3 border-slate-900 font-mono font-black text-xs uppercase shadow-[4px_4px_0px_#0284c7] cursor-pointer no-underline';

/* Renders nothing when there is no form URL, so the page never shows a dead
   "Apply" anchor. Declared at module scope rather than inside the page so it
   keeps its identity across renders. */
function ApplyButton({ applyUrl, applyLabel, className = btnPrimary, children }) {
    if (!applyUrl) return null;
    return (
        <a href={applyUrl} target="_blank" rel="noopener noreferrer" className={className}>
            {children || `${applyLabel} ↗`}
        </a>
    );
}

export default function RecruitmentPage({ onBack }) {
    const { siteData } = useWebsiteData();

    /* Normalised defensively: a server document written before this field
       existed, or a restored backup, can arrive without these keys. */
    const recruitment = siteData.recruitment || {};
    const timeline = Array.isArray(recruitment.timeline) ? recruitment.timeline : [];
    const problemStatements = Array.isArray(recruitment.problemStatements)
        ? recruitment.problemStatements
        : [];

    const applyUrl = (recruitment.applyUrl || '').trim() || siteData.hero?.joinFormUrl || '';
    const applyLabel = recruitment.applyLabel || 'Apply on the Google Form';

    const [isCountdownDocked, setIsCountdownDocked] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (window.lenis) window.lenis.scrollTo(0, { immediate: true });
    }, []);

    /* The countdown engine models a numbered schedule with open/closed/upcoming
       state and a live tick. Feeding it the timeline milestones gives the
       "next deadline on the board" behaviour for free — and when the timeline
       is empty it reports `hasSchedule: false`, so the board simply does not
       render rather than inventing a date. */
    const deadlines = useMemo(() => {
        const items = Array.isArray(recruitment.timeline) ? recruitment.timeline : [];
        return items
            .filter((item) => item && item.date)
            .map((item, index) => ({
                id: item.id || `tl-${index}`,
                stage: String(index + 1).padStart(2, '0'),
                label: item.label || `Stage ${index + 1}`,
                detail: item.detail || '',
                date: item.date,
            }));
    }, [recruitment.timeline]);

    const countdown = useRecruitmentCountdown(deadlines);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-amber-400 selection:text-slate-900">

            {/* Top navigation */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-4 border-slate-900 shadow-[0_4px_0px_#0f172a]">
                <div className="px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <img src={teamLogo} alt="Team Asterix" className="h-9 w-auto object-contain" />
                        <div className="hidden sm:block">
                            <span className="font-mono text-xs font-black uppercase text-amber-600 block leading-tight">
                                CREW SELECTION &amp; RECRUITMENT
                            </span>
                            <span className="font-black text-sm uppercase text-slate-900 leading-tight">
                                TEAM ASTERIX INDUCTION PORTAL
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

                {applyUrl && (
                    <RecruitmentCountdownStrip
                        countdown={countdown}
                        applyLink={applyUrl}
                        docked={isCountdownDocked}
                    />
                )}
            </header>

            {/* Hero */}
            <section className="py-12 sm:py-16 px-4 sm:px-8 bg-slate-900 text-white border-b-4 border-slate-900">
                <div className="max-w-6xl mx-auto">
                    <span className="px-3 py-1 bg-amber-300 text-slate-900 border-2 border-slate-900 shadow-[3px_3px_0px_#0284c7] font-mono text-xs font-black inline-block mb-4">
                        ⚡ {recruitment.headline || 'CREW RECRUITMENT'}
                    </span>

                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-none mb-5">
                        BUILD THE <span className="text-stroke-white text-transparent">BEAST</span>
                    </h1>
                    {recruitment.intro && (
                        <p className="text-base sm:text-lg text-slate-300 font-bold max-w-3xl leading-relaxed">
                            {recruitment.intro}
                        </p>
                    )}

                    {/* Standing notice, e.g. an orientation announcement. Hidden
                        entirely when the leads leave it blank. */}
                    {recruitment.notice && (
                        <div className="mt-7 p-4 sm:p-5 bg-amber-300 text-slate-900 border-3 border-slate-900 shadow-[5px_5px_0px_#0284c7] max-w-3xl">
                            <span className="font-mono font-black text-[11px] uppercase tracking-widest block mb-1">
                                ⚑ Before you apply
                            </span>
                            <p className="text-sm font-bold leading-relaxed">{recruitment.notice}</p>
                        </div>
                    )}

                    <div className="mt-8 flex flex-wrap items-center gap-4">
                        <ApplyButton applyUrl={applyUrl} applyLabel={applyLabel} />
                        {timeline.length > 0 && (
                            <a
                                href="#timeline"
                                className="press px-6 py-3.5 bg-white text-slate-900 border-3 border-slate-900 font-mono font-black text-xs uppercase shadow-[4px_4px_0px_#0284c7] cursor-pointer no-underline"
                            >
                                See the timeline ↓
                            </a>
                        )}
                    </div>
                </div>
            </section>

            {/* Countdown + schedule for the induction timeline. Renders only when
                the leads have published dated milestones. */}
            {countdown.hasSchedule && (
                <div id="timeline">
                    <RecruitmentCountdownBoard
                        countdown={countdown}
                        applyLink={applyUrl}
                        onDockChange={setIsCountdownDocked}
                    />
                </div>
            )}

            {/* Problem statements */}
            <section id="problem-statements" className="py-12 sm:py-16 px-4 sm:px-8 max-w-6xl mx-auto">
                <div className="mb-8">
                    <span className="text-xs font-mono font-black uppercase text-sky-600 tracking-widest block mb-1">
                        WHAT YOU WILL BE ASKED TO SOLVE
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black uppercase text-slate-900 tracking-tight">
                        PROBLEM STATEMENTS
                    </h2>
                    <p className="text-sm font-bold text-slate-600 mt-2 max-w-3xl">
                        Each subsystem sets its own brief. Read the one you are applying for, then submit your
                        response through the Google Form before the deadline.
                    </p>
                </div>

                {problemStatements.length === 0 ? (
                    <div className="p-6 sm:p-8 bg-white border-4 border-dashed border-slate-300 text-center">
                        <span className="font-mono font-black text-[11px] uppercase tracking-widest text-slate-500 block mb-2">
                            ⚑ Stay tuned
                        </span>
                        <p className="text-sm font-bold text-slate-600 max-w-xl mx-auto leading-relaxed">
                            The problem statements have not been published yet. They will appear here as soon
                            as the subsystem leads release them.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {problemStatements.map((ps, index) => (
                            <article
                                key={ps.id || index}
                                className="flex flex-col bg-white border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-5 sm:p-6"
                            >
                                {ps.subsystem && (
                                    <span className="self-start px-2.5 py-1 bg-sky-500 text-white border-2 border-slate-900 font-mono font-black text-[10px] uppercase tracking-widest mb-3">
                                        {ps.subsystem}
                                    </span>
                                )}
                                <h3 className="text-xl sm:text-2xl font-black uppercase text-slate-900 tracking-tight leading-tight">
                                    {ps.title || 'Untitled brief'}
                                </h3>
                                {ps.summary && (
                                    <p className="text-sm font-bold text-slate-600 mt-2 leading-relaxed">
                                        {ps.summary}
                                    </p>
                                )}

                                {ps.body && (
                                    <div className="mt-4 p-4 bg-slate-50 border-2 border-slate-900">
                                        <pre className="text-xs sm:text-sm font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
                                            {ps.body}
                                        </pre>
                                    </div>
                                )}

                                <div className="mt-auto pt-5 flex flex-wrap gap-3">
                                    {ps.fileUrl && (
                                        <a
                                            href={ps.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="press inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-sky-600 text-white font-mono font-black text-xs uppercase border-2 border-slate-900 cursor-pointer no-underline"
                                        >
                                            Open the attachment ↗
                                        </a>
                                    )}
                                    <ApplyButton
                                        applyUrl={applyUrl}
                                        applyLabel={applyLabel}
                                        className="press inline-flex items-center gap-2 px-4 py-2 bg-amber-300 hover:bg-amber-400 text-slate-900 font-mono font-black text-xs uppercase border-2 border-slate-900 shadow-[2px_2px_0px_#0284c7] cursor-pointer no-underline"
                                    />
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {/* Closing call to action */}
            <section className="py-14 px-4 sm:px-8 bg-slate-900 text-white">
                <div className="max-w-5xl mx-auto text-center">
                    <span className="text-xs font-mono font-black uppercase text-amber-400 tracking-widest block mb-2">
                        READY WHEN YOU ARE
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight mb-4">
                        JOIN TEAM ASTERIX
                    </h2>
                    <p className="text-sm font-bold text-slate-300 max-w-2xl mx-auto leading-relaxed mb-7">
                        One form, one submission. Read your subsystem&apos;s brief above, then apply. The leads
                        review every entry after the deadline.
                    </p>

                    {applyUrl ? (
                        <div className="flex justify-center">
                            <ApplyButton applyUrl={applyUrl} applyLabel={applyLabel} />
                        </div>
                    ) : (
                        <p className="font-mono text-xs font-bold text-slate-400">
                            The application form link has not been set yet. Check back shortly.
                        </p>
                    )}

                    <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
                        <span>
                            © {new Date().getFullYear()} TEAM ASTERIX • RECRUITMENT &amp; INDUCTION PORTAL
                            {countdown.hasSchedule && countdown.active && (
                                <span className="block sm:inline sm:ml-2 text-slate-600">
                                    Next deadline {formatIstFull(new Date(countdown.active.at).toISOString())}
                                </span>
                            )}
                        </span>
                        <button
                            onClick={onBack}
                            className="press press-flat text-sky-400 hover:text-white underline cursor-pointer"
                        >
                            ← Return to Main Site
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
