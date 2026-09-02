import { useEffect, useMemo, useState } from 'react';
import {
    useRecruitmentCountdown,
    RecruitmentCountdownBoard,
    RecruitmentCountdownStrip,
} from './RecruitmentCountdown';
import { useWebsiteData } from '../context/WebsiteDataContext';
import { formatIstFull } from '../lib/istTime';
import teamLogo from '../assets/Screenshot 2026-08-26 232320.png';
import SoftwarePerceptionViewer from './recruitment/SoftwarePerceptionViewer';
import PowertrainTestViewer from './recruitment/PowertrainTestViewer';
import MechanicalMysteryViewer from './recruitment/MechanicalMysteryViewer';
import SubsystemLockedCard from './recruitment/SubsystemLockedCard';
import {
    RECRUITMENT_RELEASE_DATE_STR,
    RECRUITMENT_RELEASE_MS
} from '../data/recruitmentProblemStatements';
import { AUTH_SESSION_KEY } from '../context/WebsiteDataContext';

/**
 * The recruitment portal — static, split per subsystem.
 *
 * Each subsystem (Software & Perception, Powertrain, Mechanical) recruits on its
 * own terms, so the portal is organised by subsystem: pick one and you get that
 * subsystem's deadlines, its problem statement(s) and its Google Form, and
 * nothing belonging to the other two. Everything comes from
 * `siteData.recruitment.tracks`, so it works from the bundled defaults with no
 * backend and updates the moment an admin edit syncs.
 *
 * There is no application form, status lookup or team draw here — applications
 * run entirely through each subsystem's Google Form.
 */



export default function RecruitmentPage({ onBack }) {
    const { siteData } = useWebsiteData();

    const recruitment = siteData.recruitment || {};
    const tracks = Array.isArray(recruitment.tracks) ? recruitment.tracks : [];
    const [selectedId, setSelectedId] = useState(() => tracks[0]?.id || null);
    const [isCountdownDocked, setIsCountdownDocked] = useState(false);
    const [isAdmin] = useState(() => {
        try {
            return Boolean(sessionStorage.getItem(AUTH_SESSION_KEY));
        } catch {
            return false;
        }
    });
    const [isReleased, setIsReleased] = useState(() => Date.now() >= RECRUITMENT_RELEASE_MS);

    useEffect(() => {
        if (isReleased) return;
        const remaining = Math.max(10, RECRUITMENT_RELEASE_MS - Date.now());
        const timer = setTimeout(() => setIsReleased(true), remaining);
        return () => clearTimeout(timer);
    }, [isReleased]);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (window.lenis) window.lenis.scrollTo(0, { immediate: true });
    }, []);

    const selectedTrack = tracks.find((t) => t.id === selectedId) || tracks[0] || null;
    const statements = Array.isArray(selectedTrack?.problemStatements)
        ? selectedTrack.problemStatements
        : [];

    /* One track's deadlines feed the countdown engine at a time, so switching
       subsystems swaps the whole timing tower. An empty timeline reports
       `hasSchedule: false`, so the board is hidden rather than inventing a date. */
    const deadlines = useMemo(() => {
        const items = Array.isArray(selectedTrack?.timeline) ? selectedTrack.timeline : [];
        return items
            .filter((item) => item && item.date)
            .map((item, index) => ({
                id: item.id || `tl-${index}`,
                stage: String(index + 1).padStart(2, '0'),
                label: item.label || `Stage ${index + 1}`,
                detail: item.detail || '',
                date: item.date,
            }));
    }, [selectedTrack]);

    const countdown = useRecruitmentCountdown(deadlines);

    const handleSelect = (id) => {
        setSelectedId(id);
        setIsCountdownDocked(false);
    };

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

                <RecruitmentCountdownStrip
                    countdown={countdown}
                    docked={isCountdownDocked}
                />
            </header>

            {/* Admin Bypass Notice */}
            {isAdmin && !isReleased && (
                <div className="bg-amber-400 text-slate-900 border-b-4 border-slate-900 px-4 sm:px-8 py-2.5 flex items-center justify-between font-mono font-black text-xs uppercase shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-900 text-amber-300 border border-slate-900">
                            ADMIN PREVIEW MODE
                        </span>
                        <span>Embargo lock bypassed • Full problem statements and Phase 2 unlocked for verification</span>
                    </div>
                    <span className="hidden sm:inline text-[11px] text-slate-800">
                        (Public visitors see countdown until tomorrow 6:30 PM)
                    </span>
                </div>
            )}

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

                    {recruitment.notice && (
                        <div className="mt-7 p-4 sm:p-5 bg-amber-300 text-slate-900 border-3 border-slate-900 shadow-[5px_5px_0px_#0284c7] max-w-3xl">
                            <span className="font-mono font-black text-[11px] uppercase tracking-widest block mb-1">
                                ⚑ Before you apply
                            </span>
                            <p className="text-sm font-bold leading-relaxed">{recruitment.notice}</p>
                        </div>
                    )}

                    {tracks.length > 0 && (
                        <div className="mt-8">
                            <a
                                href="#subsystems"
                                className="press px-6 py-3.5 bg-white text-slate-900 border-3 border-slate-900 font-mono font-black text-xs uppercase shadow-[4px_4px_0px_#0284c7] cursor-pointer no-underline"
                            >
                                Choose your subsystem ↓
                            </a>
                        </div>
                    )}
                </div>
            </section>

            {/* Subsystem selector */}
            <section id="subsystems" className="py-10 sm:py-12 px-4 sm:px-8 max-w-6xl mx-auto">
                <span className="text-xs font-mono font-black uppercase text-sky-600 tracking-widest block mb-1">
                    CHOOSE YOUR SUBSYSTEM
                </span>
                <h2 className="text-3xl sm:text-4xl font-black uppercase text-slate-900 tracking-tight mb-2">
                    THREE SUBSYSTEMS, THREE PROCESSES
                </h2>
                <p className="text-sm font-bold text-slate-600 max-w-3xl mb-6">
                    Each subsystem sets its own problem statement and its own deadlines. Pick yours to see
                    its brief, its timeline and its form.
                </p>

                {tracks.length === 0 ? (
                    <div className="p-6 sm:p-8 bg-white border-4 border-dashed border-slate-300 text-center font-mono text-sm font-bold text-slate-500">
                        Recruitment details are being prepared. Check back shortly.
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-3">
                        {tracks.map((track) => {
                            const isActive = track.id === selectedTrack?.id;
                            return (
                                <button
                                    key={track.id}
                                    type="button"
                                    onClick={() => handleSelect(track.id)}
                                    aria-pressed={isActive}
                                    className={`px-5 py-3 border-3 border-slate-900 font-mono font-black text-xs uppercase tracking-wide cursor-pointer transition-all ${
                                        isActive
                                            ? 'bg-slate-900 text-white shadow-[4px_4px_0px_#0284c7]'
                                            : 'bg-white hover:bg-slate-100 text-slate-900 shadow-[3px_3px_0px_#0f172a]'
                                    }`}
                                >
                                    {track.name}
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Countdown for the selected subsystem, when it has dated milestones */}
            {selectedTrack && countdown.hasSchedule && (
                <RecruitmentCountdownBoard
                    countdown={countdown}
                    onDockChange={setIsCountdownDocked}
                />
            )}

            {/* Selected subsystem detail */}
            {selectedTrack && (
                <section className="py-12 sm:py-16 px-4 sm:px-8 bg-sky-50/60 border-y-4 border-slate-900">
                    <div className="max-w-6xl mx-auto">
                        {(!isReleased && !isAdmin) ? (
                            selectedTrack.id === 'software-perception' ? (
                                <SubsystemLockedCard
                                    title="Problem Statements Release Countdown"
                                    badge="SOFTWARE & PERCEPTION EMBARGOED"
                                    releaseDate={RECRUITMENT_RELEASE_DATE_STR}
                                    description="The Vision-Based Object Detection and Sensor Fusion & Track Reconstruction challenge briefs, deliverables checklists, and Phase 1 submission guidelines are sealed under recruitment protocol. The full problem statements will unlock tomorrow at 6:30 PM IST."
                                    teaserPoints={[
                                        'Problem 01: 2D Multi-Class Object Detection (ZED 2i + Jetson Orin NX)',
                                        'Problem 02: Sensor Fusion, Cone Filtering & Track Reconstruction',
                                    ]}
                                    onUnlock={() => setIsReleased(true)}
                                />
                            ) : selectedTrack.id === 'powertrain' ? (
                                <SubsystemLockedCard
                                    title="Test Details Release Countdown"
                                    badge="POWERTRAIN SUBSYSTEM EMBARGOED"
                                    releaseDate={RECRUITMENT_RELEASE_DATE_STR}
                                    description="The test details will be released tomorrow. It will be an open book test."
                                    teaserPoints={[
                                        'Test details will be released tomorrow at 6:30 PM IST',
                                        'Format: Open book test',
                                    ]}
                                    onUnlock={() => setIsReleased(true)}
                                />
                            ) : selectedTrack.id === 'mechanical' ? (
                                <SubsystemLockedCard
                                    title="Problem Statements Release Countdown"
                                    badge="MECHANICAL SUBSYSTEM EMBARGOED"
                                    releaseDate={RECRUITMENT_RELEASE_DATE_STR}
                                    description="The Mechanical problem statements and team allocations will be released tomorrow at 6:30 PM IST."
                                    teaserPoints={[
                                        '3 Problem Statements',
                                        'Teams of 2 each',
                                    ]}
                                    onUnlock={() => setIsReleased(true)}
                                />
                            ) : (
                                <SubsystemLockedCard
                                    title="Recruitment Brief Release Countdown"
                                    badge="CHALLENGE EMBARGOED"
                                    releaseDate={RECRUITMENT_RELEASE_DATE_STR}
                                    onUnlock={() => setIsReleased(true)}
                                />
                            )
                        ) : selectedTrack.id === 'software-perception' ? (
                            <SoftwarePerceptionViewer isAdmin={isAdmin} />
                        ) : selectedTrack.id === 'powertrain' ? (
                            <PowertrainTestViewer />
                        ) : selectedTrack.id === 'mechanical' ? (
                            <MechanicalMysteryViewer />
                        ) : (
                            <>
                                <div className="mb-8">
                                    <span className="text-xs font-mono font-black uppercase text-sky-600 tracking-widest block mb-1">
                                        {selectedTrack.name}
                                    </span>
                                    <h2 className="text-2xl sm:text-4xl font-black uppercase text-slate-900 tracking-tight">
                                        PROBLEM STATEMENT{statements.length > 1 ? 'S' : ''}
                                    </h2>
                                    {selectedTrack.blurb && (
                                        <p className="text-sm font-bold text-slate-600 mt-2 max-w-3xl">
                                            {selectedTrack.blurb}
                                        </p>
                                    )}
                                </div>

                                {!countdown.hasSchedule && (
                                    <div className="mb-8 p-5 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a]">
                                        <span className="font-mono font-black text-[11px] uppercase tracking-widest text-slate-500 block mb-1">
                                            ⏱ Deadlines
                                        </span>
                                        <p className="text-sm font-bold text-slate-600">
                                            The timeline for {selectedTrack.name} will be announced here.
                                        </p>
                                    </div>
                                )}

                                {statements.length === 0 ? (
                                    <div className="p-6 sm:p-8 bg-white border-4 border-dashed border-slate-300 text-center">
                                        <span className="font-mono font-black text-[11px] uppercase tracking-widest text-slate-500 block mb-2">
                                            ⚑ Stay tuned
                                        </span>
                                        <p className="text-sm font-bold text-slate-600 max-w-xl mx-auto leading-relaxed">
                                            The problem statement for {selectedTrack.name} has not been published yet.
                                            It will appear here as soon as the leads release it.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {statements.map((ps, index) => (
                                            <article
                                                key={ps.id || index}
                                                className="flex flex-col bg-white border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-5 sm:p-6"
                                            >
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
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </section>
            )}

            {/* Closing */}
            <section className="py-14 px-4 sm:px-8 bg-slate-900 text-white">
                <div className="max-w-5xl mx-auto text-center">
                    <span className="text-xs font-mono font-black uppercase text-amber-400 tracking-widest block mb-2">
                        READY WHEN YOU ARE
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight mb-4">
                        JOIN TEAM ASTERIX
                    </h2>
                    <p className="text-sm font-bold text-slate-300 max-w-2xl mx-auto leading-relaxed mb-2">
                        Pick your subsystem above, read its problem statement, and apply through its form
                        before the deadline.
                    </p>

                    <div className="mt-10 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
                        <span>
                            © {new Date().getFullYear()} TEAM ASTERIX • RECRUITMENT &amp; INDUCTION PORTAL
                            {selectedTrack && countdown.hasSchedule && countdown.active && (
                                <span className="block sm:inline sm:ml-2 text-slate-600">
                                    {selectedTrack.name} next deadline{' '}
                                    {formatIstFull(new Date(countdown.active.at).toISOString())}
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
