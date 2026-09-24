import { useState, useEffect, lazy, Suspense } from "react";
import Lenis from "lenis";
import useScrollAssembly from "./hooks/useScrollAssembly";
import useParallax from "./hooks/useParallax";
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
import FreshersRecruitmentPopup from "./components/FreshersRecruitmentPopup";
import { WebsiteDataProvider } from "./context/WebsiteDataContext";

const BajaModelPage = lazy(() => import("./components/BajaModelPage"));
const AdminDashboard = lazy(() => import("./components/admin/AdminDashboard"));
const SponsorPage = lazy(() => import("./components/SponsorPage"));
const FreshersRecruitmentPage = lazy(() => import("./components/FreshersRecruitmentPage"));
const WorkshopPage = lazy(() => import("./components/WorkshopPage"));

function MainApp() {
    const [selectedSubsystem, setSelectedSubsystem] = useState(null);
    const [isModelPage, setIsModelPage] = useState(false);
    const [isAdminOpen, setIsAdminOpen] = useState(() => window.location.hash.startsWith('#admin'));
    const [isSponsorPage, setIsSponsorPage] = useState(() => window.location.hash === '#sponsor');
    const [isFreshersRecruitmentPage, setIsFreshersRecruitmentPage] = useState(() => window.location.hash === '#freshers-recruitment');
    const [isWorkshopPage, setIsWorkshopPage] = useState(() => window.location.hash === '#workshop');
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
            // Clear retired recruitment and submission hashes to prevent broken landing
            if (['#join', '#recruitment'].includes(hash) || hash.startsWith('#submit') || hash.startsWith('#recruitment-submit')) {
                window.history.replaceState(null, '', window.location.pathname);
                scrollToTop();
                return;
            }
            setIsAdminOpen(hash.startsWith('#admin'));
            setIsSponsorPage(hash === '#sponsor');
            setIsFreshersRecruitmentPage(hash === '#freshers-recruitment');
            setIsWorkshopPage(hash === '#workshop');
            if (hash === '#model') setIsModelPage(true);
            scrollToTop();
        };

        const initialHash = window.location.hash;
        if (['#join', '#recruitment'].includes(initialHash) || initialHash.startsWith('#submit') || initialHash.startsWith('#recruitment-submit')) {
            window.history.replaceState(null, '', window.location.pathname);
        }

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    useEffect(() => {
        scrollToTop();
    }, [isSponsorPage, isFreshersRecruitmentPage, isWorkshopPage, selectedSubsystem, isModelPage, isAdminOpen]);

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

    // Activate the multi-speed depth parallax & kinetic decal float across all sections
    useParallax(lenisInstance, selectedSubsystem);

    /* Every page here is a boolean, and forgetting one in a handler leaves two
       pages claiming the screen at once. `closeAll` is the single place that
       knows the full set. */
    const closeAll = () => {
        setSelectedSubsystem(null);
        setIsModelPage(false);
        setIsAdminOpen(false);
        setIsSponsorPage(false);
        setIsFreshersRecruitmentPage(false);
        setIsWorkshopPage(false);
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

    const handleOpenFreshersRecruitment = () => {
        closeAll();
        setIsFreshersRecruitmentPage(true);
        window.location.hash = '#freshers-recruitment';
        scrollToTop();
    };

    const handleOpenWorkshop = () => {
        closeAll();
        setIsWorkshopPage(true);
        window.location.hash = '#workshop';
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
        if (hash.startsWith('#admin') || ['#sponsor', '#freshers-recruitment', '#workshop', '#model'].includes(hash)) {
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

    if (isFreshersRecruitmentPage) {
        return (
            <Suspense fallback={pageFallback}>
                <FreshersRecruitmentPage onBack={handleBackToHome} />
            </Suspense>
        );
    }

    if (isWorkshopPage) {
        return (
            <Suspense fallback={pageFallback}>
                <WorkshopPage onBack={handleBackToHome} />
            </Suspense>
        );
    }

    const isDetailPage = Boolean(
        selectedSubsystem || isSponsorPage || isFreshersRecruitmentPage || isModelPage
    );

    const currentPage =
        isSponsorPage ? 'sponsor' :
        isFreshersRecruitmentPage ? 'freshers' :
        isModelPage ? 'model' :
        selectedSubsystem ? 'subsystem' : 'home';

    // Dedicated Full-Screen Sponsorship & Pitch Deck Portal
    if (isSponsorPage) {
        return (
            <Suspense fallback={pageFallback}>
                <SponsorPage onBack={handleBackToHome} />
            </Suspense>
        );
    }

    return (
        <div className="relative min-h-screen bg-white text-slate-900 selection:bg-sky-500 selection:text-white overflow-x-hidden font-sans">
            
            {/* Photorealistic 3D Floating Baja Buggy Canvas & Swimming Goldfish */}
            <FloatingBackground />

            <FreshersRecruitmentPopup onOpenRecruitment={handleOpenFreshersRecruitment} />

            {/* Main Content Layer */}
            <div className="relative z-10">
                {/* Cyberbites Chunky Brutalist Navigation */}
                <CyberNavbar 
                    onSelectSubsystem={handleSelectSubsystem}
                    isDetailPage={isDetailPage}
                    currentPage={currentPage}
                    onBackToHome={handleBackToHome}
                    onOpenSponsor={handleOpenSponsor}
                    onOpenFreshersRecruitment={handleOpenFreshersRecruitment}
                    onOpenWorkshop={handleOpenWorkshop}
                />

                {isModelPage ? (
                    <Suspense fallback={pageFallback}>
                        <BajaModelPage onBack={handleBackToHome} />
                    </Suspense>
                ) : isSponsorPage ? (
                    <Suspense fallback={pageFallback}>
                        <SponsorPage onBack={handleBackToHome} />
                    </Suspense>
                ) : selectedSubsystem ? (
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
                        {/* 115-Frame Pre-Rendered Cinema Intro Scroll Sequence */}
                        {/* Interactive Scrubbing Frame Canvas Video sequence with rotating 
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
                        <OurStoryCurvedWave onOpenSponsor={handleOpenSponsor} />

                        {/* "JOIN THE ALLIANCE" - Brutalist Sponsor / Newsletter Form */}
                        <CyberNewsletterCTA onOpenSponsor={handleOpenSponsor} />
                    </main>
                )}

                {/* 4-Column Cyberbites Brutalist Footer */}
                <CyberFooter 
                    onOpenAdmin={handleOpenAdmin}
                    onOpenSponsor={handleOpenSponsor}
                    onOpenFreshersRecruitment={handleOpenFreshersRecruitment}
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