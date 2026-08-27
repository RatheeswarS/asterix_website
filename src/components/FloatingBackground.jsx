import { useEffect, useState } from 'react';
import Car3DCanvas from './Car3DCanvas';
import SwimmingGoldfish from './SwimmingGoldfish';

export default function FloatingBackground() {
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY || window.pageYOffset);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const orb1Y = scrollY * 0.35;
    const orb2Y = -scrollY * 0.25;
    const orb3Y = scrollY * 0.18;

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-gradient-to-b from-white via-sky-50/40 to-white">
            {/* Parallax Floating Sky Blue Ambient Light Blooms */}
            <div 
                className="absolute top-[-5%] right-[-5%] w-[48rem] h-[48rem] bg-sky-400/12 rounded-full blur-3xl pointer-events-none will-change-transform"
                style={{ transform: `translate3d(0, ${orb1Y}px, 0)` }}
            />
            <div 
                className="absolute top-[40%] left-[-10%] w-[44rem] h-[44rem] bg-sky-300/10 rounded-full blur-3xl pointer-events-none will-change-transform"
                style={{ transform: `translate3d(0, ${orb2Y}px, 0)` }}
            />
            <div 
                className="absolute top-[75%] right-[5%] w-[50rem] h-[50rem] bg-sky-400/12 rounded-full blur-3xl pointer-events-none will-change-transform"
                style={{ transform: `translate3d(0, ${orb3Y}px, 0)` }}
            />
            
            {/* Subtle Sky Blue Technical Grid with Parallax */}
            <div 
                className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:36px_36px] opacity-[0.22] pointer-events-none will-change-transform"
                style={{ transform: `translate3d(0, ${scrollY * 0.08}px, 0)` }}
            />

            {/* PHOTOREALISTIC 3D BAJA BUGGY WEBGL CANVAS */}
            <Car3DCanvas />

            {/* Interactive Swimming Golden Fish in Background Layer */}
            <SwimmingGoldfish />
        </div>
    );
}
