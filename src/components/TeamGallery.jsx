import { useState, useEffect, useMemo } from 'react';
import DriftWall from './DriftWall';

import imgPaddock from '../assets/gallery/01_team_paddock.jpg';
import imgWelding from '../assets/gallery/02_workshop_welding.jpg';
import imgLidar from '../assets/gallery/03_lidar_sensor_tuning.jpg';
import imgTrack from '../assets/gallery/04_track_dirt_action.jpg';
import imgMechanics from '../assets/gallery/05_pitlane_mechanics.jpg';
import imgCelebration from '../assets/gallery/06_team_celebration.jpg';

const galleryItems = [
    {
        id: 1,
        title: "Full Crew Paddock Lineup",
        category: "RACE DAY & CREW",
        location: "SAEINDIA National Paddock • Pit Lane",
        date: "FEB 2026",
        image: imgPaddock,
        badge: "OFFICIAL CREW",
        description: "The complete Team Asterix engineering crew standing proudly alongside our autonomous buggy right before official tech inspection and endurance shakedown."
    },
    {
        id: 2,
        title: "Chassis Spaceframe TIG Welding",
        category: "WORKSHOP & FAB",
        location: "Collegiate Machine Shop • Chassis Bay",
        date: "NOV 2025",
        image: imgWelding,
        badge: "FABRICATION",
        description: "Precision tube notching and 100% GTAW purged TIG welding on the AISI 4130 chromoly tubular roll cage, ensuring superior driver safety factor."
    },
    {
        id: 3,
        title: "LiDAR & Neural Perception Calibration",
        category: "AUTONOMOUS & SENSORS",
        location: "Robotics & AI Systems Laboratory",
        date: "JAN 2026",
        image: imgLidar,
        badge: "AI & PERCEPTION",
        description: "Live calibration of the 3D solid-state LiDAR point clouds and stereo camera obstacle detection pipeline mounted on the vehicle's structural roll bar."
    },
    {
        id: 4,
        title: "High-Speed Dirt Drift Shakedown",
        category: "TRACK DYNAMICS",
        location: "Off-Road Proving Grounds • Sector 4",
        date: "JAN 2026",
        image: imgTrack,
        badge: "DYNAMIC TESTING",
        description: "Testing continuous torque delivery, steering response, and dual-rate suspension damping as the buggy drifts aggressively through high-speed dirt ruts."
    },
    {
        id: 5,
        title: "Paddock Brake & Hub Service",
        category: "WORKSHOP & FAB",
        location: "Pit Tent • Redline Proving Grounds",
        date: "FEB 2026",
        image: imgMechanics,
        badge: "PIT CREW",
        description: "Race mechanics performing high-precision torque checks, brake caliper bleeding, and upright hub adjustments between high-speed qualification runs."
    },
    {
        id: 6,
        title: "Endurance Victory & Podium",
        category: "RACE DAY & CREW",
        location: "Main Stage • Paddock Finish Line",
        date: "FEB 2026",
        image: imgCelebration,
        badge: "PODIUM CELEBRATION",
        description: "Jubilant celebrations after completing the punishing 4-hour endurance challenge and bringing home top collegiate engineering honors."
    }
];

export default function TeamGallery() {
    const [lightboxIndex, setLightboxIndex] = useState(null);

    // Multiplied list to provide a continuous, fluid drifting wall across columns
    const driftItems = useMemo(() => {
        return [
            ...galleryItems,
            ...galleryItems,
            ...galleryItems
        ];
    }, []);

    // Keyboard navigation for lightbox modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (lightboxIndex === null) return;
            if (e.key === 'Escape') setLightboxIndex(null);
            if (e.key === 'ArrowLeft') {
                setLightboxIndex((prev) => (prev > 0 ? prev - 1 : galleryItems.length - 1));
            }
            if (e.key === 'ArrowRight') {
                setLightboxIndex((prev) => (prev < galleryItems.length - 1 ? prev + 1 : 0));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxIndex]);

    const activeItem = lightboxIndex !== null ? galleryItems[lightboxIndex] : null;

    const handleTileClick = (item) => {
        const foundIdx = galleryItems.findIndex(g => g.id === item.id);
        setLightboxIndex(foundIdx !== -1 ? foundIdx : 0);
    };

    return (
        <section id="gallery" className="py-28 px-4 sm:px-8 bg-white border-t-4 border-slate-900 relative overflow-hidden z-10 select-none">

            <div className="max-w-7xl mx-auto">

                {/* Section Header (Cyberbites Stacked Brutalist Typography) */}
                <div data-assemble="header" className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-6xl sm:text-7xl md:text-8xl font-black text-slate-900 leading-none uppercase">
                                OUR
                            </h2>
                            <h2 className="text-6xl sm:text-7xl md:text-8xl font-black text-stroke-black text-transparent leading-none uppercase">
                                GALLERY
                            </h2>
                            <span className="animate-spin-slow text-amber-400 text-4xl hidden sm:inline-block">★</span>
                        </div>
                        <p className="text-sm sm:text-base font-bold text-slate-600 mt-3 max-w-xl">
                            Moments from our workshop fabrication, autonomous sensor calibration, proving trials, and race day celebrations. Click any photo to inspect.
                        </p>
                    </div>
                </div>

                {/* 3D DriftWall Stage (Clean Brutalist Light Container Merged With Website Theme) */}
                <div data-assemble="card" className="relative w-full h-[540px] sm:h-[620px] md:h-[680px] bg-sky-50/40 border-4 border-slate-900 shadow-[10px_10px_0px_#0f172a] overflow-hidden">

                    {/* The 3D DriftWall */}
                    <DriftWall
                        items={driftItems}
                        columns={typeof window !== 'undefined' && window.innerWidth < 640 ? 3 : 5}
                        tileWidth={typeof window !== 'undefined' && window.innerWidth < 640 ? 165 : 220}
                        tileHeight={typeof window !== 'undefined' && window.innerWidth < 640 ? 115 : 150}
                        gap={18}
                        radius={12}
                        tilt={16}
                        turn={-14}
                        perspective={1200}
                        depth={100}
                        speed={38}
                        direction="up"
                        variance={0.45}
                        parallax={0.6}
                        lift={54}
                        fade={0.3}
                        dim={0.92}
                        overlayColor="transparent"
                        onItemClick={handleTileClick}
                        className="w-full h-full"
                    />

                </div>

            </div>

            {/* Lightbox Modal (Detailed High-Res Photo View with Keyboard & Click Navigation) */}
            {activeItem && (
                <div
                    className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
                    onClick={() => setLightboxIndex(null)}
                >
                    <div
                        className="relative max-w-5xl w-full bg-white border-4 border-slate-900 shadow-[12px_12px_0px_#0284c7] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header Bar */}
                        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between border-b-3 border-slate-900 font-mono text-xs font-black">
                            <div className="flex items-center gap-3">
                                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
                                <span className="uppercase tracking-wider">TEAM ASTERIX ARCHIVE // 0{lightboxIndex + 1} OF 0{galleryItems.length}</span>
                            </div>

                            <button
                                onClick={() => setLightboxIndex(null)}
                                className="w-8 h-8 bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center border-2 border-white cursor-pointer transition-colors font-sans text-base font-bold"
                                aria-label="Close Lightbox"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Image Viewer Frame */}
                        <div className="relative aspect-[16/10] sm:aspect-[16/9] max-h-[60vh] w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                            <img
                                src={activeItem.image}
                                alt={activeItem.title}
                                className="max-w-full max-h-full object-contain select-none"
                            />

                            {/* Prev Navigation Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxIndex(prev => (prev > 0 ? prev - 1 : galleryItems.length - 1));
                                }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-sky-500 hover:text-white text-slate-900 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] flex items-center justify-center text-xl font-black transition-all cursor-pointer"
                                aria-label="Previous Photo"
                            >
                                ←
                            </button>

                            {/* Next Navigation Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxIndex(prev => (prev < galleryItems.length - 1 ? prev + 1 : 0));
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-sky-500 hover:text-white text-slate-900 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] flex items-center justify-center text-xl font-black transition-all cursor-pointer"
                                aria-label="Next Photo"
                            >
                                →
                            </button>
                        </div>

                        {/* Modal Footer Description */}
                        <div className="p-6 sm:p-8 bg-white border-t-3 border-slate-900">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-0.5 bg-slate-900 text-white font-mono font-black text-xs uppercase">
                                        {activeItem.badge}
                                    </span>
                                    <span className="px-2.5 py-0.5 bg-sky-100 border border-slate-900 font-mono font-black text-xs text-sky-700 uppercase">
                                        {activeItem.category}
                                    </span>
                                </div>

                                <div className="text-xs font-mono font-bold text-slate-500">
                                    <span>📍 {activeItem.location}</span> • <span>{activeItem.date}</span>
                                </div>
                            </div>

                            <h3 className="text-2xl sm:text-3xl font-black uppercase text-slate-900 mb-2">
                                {activeItem.title}
                            </h3>

                            <p className="text-sm sm:text-base text-slate-700 font-bold leading-relaxed">
                                {activeItem.description}
                            </p>

                            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-500">
                                <span>USE ARROW KEYS (← / →) TO NAVIGATE • [ESC] TO CLOSE</span>
                                <button
                                    onClick={() => setLightboxIndex(null)}
                                    className="text-slate-900 font-black hover:text-sky-600 cursor-pointer"
                                >
                                    CLOSE VIEWER ✕
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}

        </section>
    );
}
