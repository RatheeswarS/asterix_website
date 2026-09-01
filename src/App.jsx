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
const CrewBadgesPage = lazy(() => import("./components/badges/CrewBadgesPage"));
const CredentialPage = lazy(() => import("./components/badges/CredentialPage"));

/* `#badge/<ID>` is the link a member shares. Parsed here rather than in the
   page so a malformed hash falls back to the directory instead of rendering a
   lookup for an empty identifier. */
const BADGE_HASH = /^#badge\/([A-Za-z0-9-]+)$/;
const badgeIdFromHash = (hash) => BADGE_HASH.exec(hash || '')?.[1]?.toUpperCase() || null;

function MainApp() {
    const [selectedSubsystem, setSelectedSubsystem] = useState(null);
    const [isModelPage, setIsModelPage] = useState(false);
    const [isAdminOpen, setIsAdminOpen] = useState(() => window.location.hash === '#admin');
    const [isSponsorPage, setIsSponsorPage] = useState(() => window.location.hash === '#sponsor');
    const [isRecruitmentPage, setIsRecruitmentPage] = useState(() => window.location.hash === '#join' || window.location.hash === '#recruitment');
    const [isBadgeDirectory, setIsBadgeDirectory] = useState(() => window.location.hash === '#badges');
    const [badgeId, setBadgeId] = useState(() => badgeIdFromHash(window.location.hash));
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
            setIsAdminOpen(hash === '#admin');
            setIsSponsorPage(hash === '#sponsor');
            setIsRecruitmentPage(hash === '#join' || hash === '#recruitment');
            setIsBadgeDirectory(hash === '#badges');
            setBadgeId(badgeIdFromHash(hash));
            if (hash === '#model') setIsModelPage(true);
            scrollToTop();
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    useEffect(() => {
        scrollToTop();
    }, [isSponsorPage, isRecruitmentPage, selectedSubsystem, isModelPage, isAdminOpen, isBadgeDirectory, badgeId]);

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
        setIsBadgeDirectory(false);
        setBadgeId(null);
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

    const handleOpenBadges = () => {
        closeAll();
        setIsBadgeDirectory(true);
        window.location.hash = '#badges';
        scrollToTop();
    };

    const handleBackToHome = () => {
        closeAll();
        const hash = window.location.hash;
        if (['#admin', '#sponsor', '#join', '#recruitment', '#model', '#badges'].includes(hash) || BADGE_HASH.test(hash)) {
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

    // One member's shareable engineering credential
    if (badgeId) {
        return (
            <Suspense fallback={pageFallback}>
                <CredentialPage
                    credentialId={badgeId}
                    onBack={handleBackToHome}
                    onOpenDirectory={handleOpenBadges}
                />
            </Suspense>
        );
    }

    // Alumni & crew credential directory
    if (isBadgeDirectory) {
        return (
            <Suspense fallback={pageFallback}>
                <CrewBadgesPage onBack={handleBackToHome} />
            </Suspense>
        );
    }

    // Dedicated Full-Screen Crew Recruitment Portal
    if (isRecruitmentPage) {
        return (
            <Suspense fallback={pageFallback}>
                <RecruitmentPage onBack={handleBackToHome} />
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
                        <TheSquad onSelectSubsystem={handleSelectSubsystem} onOpenBadges={handleOpenBadges} />

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
                    onOpenAdmin={() => setIsAdminOpen(true)}
                    onOpenSponsor={handleOpenSponsor}
                    onOpenRecruitment={handleOpenRecruitment}
                    onOpenBadges={handleOpenBadges}
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