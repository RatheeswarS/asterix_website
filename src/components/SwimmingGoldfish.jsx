import { useEffect, useState, useRef } from 'react';
import goldenFishImg from '../assets/golden_fish.png';

export default function SwimmingGoldfish() {
    const [pos, setPos] = useState({ x: 100, y: 300, angle: 0, flipY: false });
    const targetRef = useRef({ x: 100, y: 300, angle: 0, flipY: false });
    const currentRef = useRef({ x: 100, y: 300, angle: 0, flipY: false });
    const lastScrollY = useRef(0);
    const rafRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY || window.pageYOffset;
            const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
            const progress = Math.min(1, Math.max(0, scrollY / maxScroll));

            const isScrollingDown = scrollY >= lastScrollY.current;
            lastScrollY.current = scrollY;

            // Viewport dimensions
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            // Organic Lissajous / Sinusoidal swimming trajectory across viewport
            // As user scrolls from 0 to 1, fish traverses across the screen in gentle waves
            const cycles = 3.5;
            const t = progress * cycles * Math.PI * 2;
            
            // X position sweeps back and forth smoothly between 15% and 85% of screen width
            const xMin = vw * 0.12;
            const xMax = vw * 0.88;
            const targetX = xMin + (Math.sin(t) * 0.5 + 0.5) * (xMax - xMin);

            // Y position undulates gently in the mid-viewport area (between 25% and 75% of screen height)
            const yMin = vh * 0.22;
            const yMax = vh * 0.76;
            const targetY = yMin + (Math.cos(t * 0.7 + 0.4) * 0.5 + 0.5) * (yMax - yMin);

            // Compute movement vector for realistic swimming heading angle
            const dx = targetX - currentRef.current.x;
            const dy = targetY - currentRef.current.y;
            let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

            // If swimming leftwards, flip horizontally so fish head always leads
            const isMovingLeft = dx < 0;

            targetRef.current = {
                x: targetX,
                y: targetY,
                angle: angleDeg,
                flipX: isMovingLeft,
                isScrollingDown
            };
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        // Smooth physics-damped animation loop
        let time = 0;
        const animate = () => {
            time += 0.05;
            const cur = currentRef.current;
            const tgt = targetRef.current;

            // Smooth lerp toward target scroll position
            const lerpFactor = 0.065;
            cur.x += (tgt.x - cur.x) * lerpFactor;
            cur.y += (tgt.y - cur.y) * lerpFactor;
            
            // Add gentle natural swimming idle bobbing even when not actively scrolling
            const idleWiggleY = Math.sin(time * 2.2) * 6;
            const idleWiggleX = Math.cos(time * 1.6) * 4;
            const swimWiggleAngle = Math.sin(time * 3.5) * 4;

            // Smooth angle interpolation
            cur.angle += (tgt.angle - cur.angle) * 0.08;

            setPos({
                x: cur.x + idleWiggleX,
                y: cur.y + idleWiggleY,
                angle: cur.angle + swimWiggleAngle,
                flipX: tgt.flipX ?? false
            });

            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return (
        <div 
            className="absolute inset-0 pointer-events-none select-none overflow-hidden"
            aria-hidden="true"
        >
            <div 
                className="absolute pointer-events-none select-none will-change-transform transition-opacity duration-300"
                style={{
                    left: 0,
                    top: 0,
                    transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`
                }}
            >
                <div 
                    className="relative will-change-transform flex items-center justify-center"
                    style={{
                        transform: `rotate(${pos.angle}deg) ${pos.flipX ? 'scaleX(-1)' : 'scaleX(1)'}`,
                        transition: 'transform 0.15s ease-out'
                    }}
                >
                    {/* Golden Fish Render with Luminous Water Aura */}
                    <img
                        src={goldenFishImg}
                        alt="Swimming Golden Fish"
                        className="w-24 sm:w-32 md:w-40 h-auto object-contain drop-shadow-[0_10px_20px_rgba(245,158,11,0.45)] filter brightness-105 contrast-105"
                        draggable={false}
                    />

                    {/* Ambient Golden Glow Bubble Ring */}
                    <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-xl pointer-events-none scale-110 animate-pulse" />
                    
                    {/* Tiny Swimming Water Trail Bubbles */}
                    <span className="absolute -left-3 top-1/2 w-2 h-2 rounded-full bg-sky-300/60 blur-[1px] animate-ping" />
                </div>
            </div>
        </div>
    );
}
