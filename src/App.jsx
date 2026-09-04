import { useState, useEffect, lazy, Suspense } from "react";
import Lenis from "lenis";
import useScrollAssembly from "./hooks/useScrollAssembly";
import CyberNavbar from "./components/CyberNavbar";
import IntroScrollSequence from "./components/IntroScrollSequence";
import CyberHero from "./components/CyberHero";
import MarqueeTicker from "./components/MarqueeTicker";
import TheSquad from "./components/TheSquad";
import TeamGallery from "./components/TeamGallery";
import TeamUpdates from "./components/TeamUpdates";
import OurStoryCurvedWave from "./components/OurStoryCurvedWave";
import CyberNewsletterCTA from "./components/CyberNewsletterCTA";
import CyberFooter from "./components/CyberFooter";
import SubsystemDetail from "./components/SubsystemDetail";
import FloatingBackground from "./components/FloatingBackground";
import { WebsiteDataProvider } from "./context/WebsiteDataContext";

const BajaModelPage = lazy(() => import("./components/BajaModelPage"));
const AdminDashboard = lazy(() => import("./components/admin/AdminDashboard"));
const SponsorPage = lazy(() => import("./components/SponsorPage"));
const RecruitmentPage = lazy(() => import("./components/RecruitmentPage"));
const SubmissionPortalPage = lazy(() => import("./components/recruitment/SubmissionPortalPage"));

function MainApp() {
    const [selectedSubsystem, setSelectedSubsystem] = useState(null);
    const [isModelPage, setIsModelPage] = useState(false);
    const [isAdminOpen, setIsAdminOpen] = useState(() => window.location.hash.startsWith('#admin'));
    const [isSponsorPage, setIsSponsorPage] = useState(() => window.location.hash === '#sponsor');
    const [isRecruitmentPage, setIsRecruitmentPage] = useState(() => window.location.hash === '#join' || window.location.hash === '#recruitment');
    const [isSubmissionPage, setIsSubmissionPage] = useState(() => window.location.hash.startsWith('#submit') || window.location.hash.startsWith('#recruitment-submit'));
    const [lenisInstance, setLenisInstance] = useState(null);

    const scrollToTop = () => {
        window.scrollTo(0, 0);
        if (window.lenis) {
            window.lenis.scrollTo(0, { immediate: true });
        }
    };

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            setIsAdminOpen(hash.startsWith('#admin'));
            setIsSponsorPage(hash === '#sponsor');
            setIsRecruitmentPage(hash === '#join' || hash === '#recruitment');
            setIsSubmissionPage(hash.startsWith('#submit') || hash.startsWith('#recruitment-submit'));
            if (hash === '#model') setIsModelPage(true);
            scrollToTop();
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    useEffect(() => {
        scrollToTop();
    }, [isSponsorPage, isRecruitmentPage, isSubmissionPage, selectedSubsystem, isModelPage, isAdminOpen]);

    useEffect(() => {
        // Readers who ask for reduced motion get the browser's native scroll.
        // Momentum smoothing is exactly the kind of motion that setting is for.
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        // Initialize Lenis smooth momentum scrolling
        const lenis = new Lenis({
            duration: 1.6,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 0.9,
            touchMultiplier: 1.5,
        });

        // eslint-disable-next-line react/set-state-in-effect
        setLenisInstance(lenis);
        window.lenis = lenis;

        // The frame id has to be tracked across every frame. Capturing only
        // the first one meant cleanup cancelled a frame that had already run,
        // and the loop kept rescheduling itself forever against a destroyed
        // Lenis instance -- twice over, under StrictMode's double mount.
        let rafId = null;

        const raf = (time) => {
            lenis.raf(time);
            rafId = requestAnimationFrame(raf);
        };
        rafId = requestAnimationFrame(raf);

        return () => {
            if (rafId !== null) cancelAnimationFrame(rafId);
            lenis.destroy();
            setLenisInstance(null);
            window.lenis = null;
        };
    }, []);

    // Activate the global scroll assembly/forming effect across all sections and pages
    useScrollAssembly(lenisInstance, selectedSubsystem);

    /* Every page here is a boolean, and forgetting one in a handler leaves two
       pages claiming the screen at once. `closeAll` is the single place that
       knows the full set. */
    const closeAll = () => {
        setSelectedSubsystem(null);
        setIsModelPage(false);
        setIsAdminOpen(false);
        setIsSponsorPage(false);
        setIsRecruitmentPage(false);
    };

    const handleSelectSubsystem = (id) => {
        closeAll();
        setSelectedSubsystem(id);
        scrollToTop();
    };

    const handleOpenModelViewer = () => {
        closeAll();
        setIsModelPage(true);
        scrollToTop();
    };

    const handleOpenSponsor = () => {
        closeAll();
        setIsSponsorPage(true);
        window.location.hash = '#sponsor';
        scrollToTop();
    };

    const handleOpenRecruitment = () => {
        closeAll();
        setIsRecruitmentPage(true);
        window.location.hash = '#join';
        scrollToTop();
    };

    const handleOpenAdmin = () => {
        closeAll();
        setIsAdminOpen(true);
        window.location.hash = '#admin';
        scrollToTop();
    };

    const handleBackToHome = () => {
        closeAll();
        const hash = window.location.hash;
        if (hash.startsWith('#admin') || ['#sponsor', '#join', '#recruitment', '#model'].includes(hash)) {
            window.history.replaceState(null, '', window.location.pathname);
        }
        scrollToTop();
    };

    const pageFallback = (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center font-mono text-sky-400 gap-3">
            <div className="w-10 h-10 border-4 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-black tracking-widest uppercase text-slate-300">LOADING ASTERIX PORTAL...</span>
        </div>
    );

    // Dedicated Full-Screen Admin Management Interface
    if (isAdminOpen) {
        return (
            <Suspense fallback={pageFallback}>
                <AdminDashboard onExit={handleBackToHome} />
            </Suspense>
        );
    }

    // Dedicated Full-Screen 3D Baja Model Inspector Page
    if (isModelPage) {
        return (
            <Suspense fallback={pageFallback}>
                <BajaModelPage onBack={handleBackToHome} />
            </Suspense>
        );
    }

    // Dedicated Full-Screen Sponsorship & Pitch Deck Portal
    if (isSponsorPage) {
        return (
            <Suspense fallback={pageFallback}>
                <SponsorPage onBack={handleBackToHome} />
            </Suspense>
        );
    }

    // Dedicated Full-Screen Crew Recruitment Portal
    if (isRecruitmentPage) {
        return (
            <Suspense fallback={pageFallback}>
                <RecruitmentPage
                    onBack={handleBackToHome}
                    onSelectSubsystem={handleSelectSubsystem}
                />
            </Suspense>
        );
    }

    // Dedicated Full-Screen Phase 01 Google Drive Submission Portal
    if (isSubmissionPage) {
        return (
            <Suspense fallback={pageFallback}>
                <SubmissionPortalPage
                    onNavigateHome={handleBackToHome}
                    onNavigateRecruitment={handleOpenRecruitment}
                />
            </Suspense>
        );
    }

    return (
        <div className="relative min-h-screen bg-white text-slate-900 selection:bg-sky-500 selection:text-white overflow-x-hidden font-sans">
            
            {/* Photorealistic 3D Floating Baja Buggy Canvas & Swimming Goldfish */}
            <FloatingBackground />

            {/* Main Content Layer */}
            <div className="relative z-10">
                {/* Cyberbites Chunky Brutalist Navigation */}
                <CyberNavbar 
                    onSelectSubsystem={handleSelectSubsystem}
                    isDetailPage={Boolean(selectedSubsystem)}
                    onBackToHome={handleBackToHome}
                    onOpenSponsor={handleOpenSponsor}
                    onOpenRecruitment={handleOpenRecruitment}
                />

                {selectedSubsystem ? (
                    /* Dedicated Subsystem Detail Page (Shows all team members, CAD methodology, specs) */
                    <main>
                        <SubsystemDetail 
                            subsystemId={selectedSubsystem}
                            onBack={handleBackToHome}
                            onSelectSubsystem={handleSelectSubsystem}
                        />
                    </main>
                ) : (
                    /* Main Landing Page */
                    <main>
                        {/* Scroll-scrubbed buggy walkaround, resolving into the
                            team mark. Frames live in public/intro. */}
                        <IntroScrollSequence />

                        {/* Hero Section with Filled & Stroke Typography, Badges and 3D Baja Inspector Option */}
                        <CyberHero onOpenModelViewer={handleOpenModelViewer} />

                        {/* Infinite Double Marquee Ribbon */}
                        <MarqueeTicker />

                        {/* "THE SQUAD" - Integrated with React Bits <CardSwap /> Component */}
                        <TheSquad onSelectSubsystem={handleSelectSubsystem} />

                        {/* "OUR GALLERY" - Interactive 3D DriftWall Photo Archive */}
                        <TeamGallery />

                        {/* "TEAM UPDATES" - Integrated with React Bits <FlyingPosters /> Component */}
                        <TeamUpdates />

                        {/* "OUR STORY" - Animated Sinusoidal Wave SVG Curved Text */}
                        <OurStoryCurvedWave onOpenRecruitment={handleOpenRecruitment} />

                        {/* "JOIN THE ALLIANCE" - Brutalist Sponsor / Newsletter Form */}
                        <CyberNewsletterCTA onOpenSponsor={handleOpenSponsor} />
                    </main>
                )}

                {/* 4-Column Cyberbites Brutalist Footer */}
                <CyberFooter 
                    onOpenAdmin={handleOpenAdmin}
                    onOpenSponsor={handleOpenSponsor}
                    onOpenRecruitment={handleOpenRecruitment}
                />
            </div>

        </div>
    );
}

export default function App() {
    return (
        <WebsiteDataProvider>
            <MainApp />
        </WebsiteDataProvider>
    );
}