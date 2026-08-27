import AccordionGallery from './AccordionGallery';

import imgPaddock from '../assets/gallery/01_team_paddock.jpg';
import imgWelding from '../assets/gallery/02_workshop_welding.jpg';
import imgLidar from '../assets/gallery/03_lidar_sensor_tuning.jpg';
import imgTrack from '../assets/gallery/04_track_dirt_action.jpg';
import imgCelebration from '../assets/gallery/06_team_celebration.jpg';

const updateItems = [
    {
        image: imgPaddock,
        label: "Paddock Lineup & Shakedown",
        tag: "FEB 2026 • PIT LANE",
        link: "#"
    },
    {
        image: imgWelding,
        label: "Spaceframe TIG Welding",
        tag: "NOV 2025 • CHASSIS BAY",
        link: "#"
    },
    {
        image: imgLidar,
        label: "LiDAR & Neural Perception",
        tag: "JAN 2026 • AI LAB",
        link: "#"
    },
    {
        image: imgTrack,
        label: "High-Speed Dirt Testing",
        tag: "JAN 2026 • PROVING GROUNDS",
        link: "#"
    },
    {
        image: imgCelebration,
        label: "Endurance Podium Victory",
        tag: "FEB 2026 • NATIONAL FINALS",
        link: "#"
    }
];

export default function TeamUpdates() {
    return (
        <section id="updates" className="py-28 px-4 sm:px-8 bg-sky-50/60 border-t-4 border-slate-900 relative overflow-hidden z-10 select-none">

            <div className="max-w-7xl mx-auto">

                {/* Section Header (Cyberbites Stacked Brutalist Typography) */}
                <div data-assemble="header" className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-6xl sm:text-7xl md:text-8xl font-black text-slate-900 leading-none uppercase">
                                TEAM
                            </h2>
                            <h2 className="text-6xl sm:text-7xl md:text-8xl font-black text-stroke-black text-transparent leading-none uppercase">
                                UPDATES
                            </h2>
                            <span className="animate-spin-slow text-amber-400 text-4xl hidden sm:inline-block">★</span>
                        </div>
                        <p className="text-sm sm:text-base font-bold text-slate-600 mt-3 max-w-xl">
                            Real-time dispatches from the proving grounds, shop floor, and competition circuit. Hover over any panel to expand full-spectrum coverage.
                        </p>
                    </div>


                </div>

                {/* Seamless AccordionGallery Integration (No Black Background, Transparent & Merged) */}
                <div data-assemble="card" className="w-full">
                    <AccordionGallery
                        items={updateItems}
                        defaultIndex={2}
                        expandRatio={0.46}
                        trigger="hover"
                        height={480}
                        gap={14}
                        radius={12}
                        tilt={7}
                        parallax={0.4}
                        accentColor="#38bdf8"
                        overlayColor="#0f172a"
                        textColor="#ffffff"
                        grayscale={false}
                        showLabels={true}
                        className="w-full"
                    />
                </div>

            </div>

        </section>
    );
}
