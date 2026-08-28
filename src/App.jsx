import { useState, useEffect } from "react";
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
import BajaModelPage from "./components/BajaModelPage";
import AdminDashboard from "./components/admin/AdminDashboard";
import { WebsiteDataProvider } from "./context/WebsiteDataContext";

function MainApp() {
    const [selectedSubsystem, setSelectedSubsystem] = useState(null);
    const [isModelPage, setIsModelPage] = useState(false);
    const [isAdminOpen, setIsAdminOpen] = useState(() => window.location.hash === '#admin');
    const [lenisInstance, setLenisInstance] = useState(null);

    useEffect(() => {
        const handleHashChange = () => {
            if (window.location.hash === '#admin') {
                setIsAdminOpen(true);
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

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
        };
    }, []);

    // Activate the global scroll assembly/forming effect across all sections and pages
    useScrollAssembly(lenisInstance, selectedSubsystem);

    const handleSelectSubsystem = (id) => {
        setSelectedSubsystem(id);
        setIsModelPage(false);
        setIsAdminOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleOpenModelViewer = () => {
        setIsModelPage(true);
        setSelectedSubsystem(null);
        setIsAdminOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBackToHome = () => {
        setSelectedSubsystem(null);
        setIsModelPage(false);
        setIsAdminOpen(false);
        if (window.location.hash === '#admin') {
            window.history.replaceState(null, '', ' ');
        }
        setTimeout(() => {
            const squadEl = document.getElementById('squad');
            if (squadEl) {
                squadEl.scrollIntoView({ behavior: 'smooth' });
            }
        }, 50);
    };

    // Dedicated Full-Screen Admin Management Interface
    if (isAdminOpen) {
        return (
            <AdminDashboard
                onExit={() => {
                    setIsAdminOpen(false);
                    if (window.location.hash === '#admin') {
                        window.history.replaceState(null, '', ' ');
                    }
                }}
            />
        );
    }

    // Dedicated Full-Screen 3D Baja Model Inspector Page
    if (isModelPage) {
        return <BajaModelPage onBack={() => setIsModelPage(false)} />;
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
                        <OurStoryCurvedWave />

                        {/* "JOIN THE ALLIANCE" - Brutalist Sponsor / Newsletter Form */}
                        <CyberNewsletterCTA />
                    </main>
                )}

                {/* 4-Column Cyberbites Brutalist Footer */}
                <CyberFooter onOpenAdmin={() => setIsAdminOpen(true)} />
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