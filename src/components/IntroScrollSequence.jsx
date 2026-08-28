import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import teamLogo from '../assets/Screenshot 2026-08-26 232320.png';

gsap.registerPlugin(ScrollTrigger);

/**
 * IntroScrollSequence
 * A scroll-scrubbed turntable of the buggy, ending with the team mark emerging.
 *
 * The frames were extracted from the workshop turntable clip with ffmpeg (every
 * third frame, cropped to drop the generator watermark, encoded as WebP) into
 * public/intro/{desktop,mobile}. Two tiers exist so phones do not download the
 * full-resolution sequence.
 *
 * Implementation notes:
 * - The sticky child inside a tall section gives the pinned effect without
 *   GSAP's pin-spacer, which is far less likely to fight Lenis or the
 *   surrounding layout. ScrollTrigger is used only to read progress.
 * - Frames are drawn to a canvas rather than swapped as <img> src, so there is
 *   no flash between frames and no layout work per frame.
 * - Drawing is deferred to a rAF tick. Scrub fires on every scroll event, and
 *   painting synchronously there wastes work when several land in one frame.
 */

const FRAME_COUNT = 80;
const SCRUB_END = 0.62;   // frames finish here
const LOGO_START = 0.55;  // slight overlap so the two phases cross-fade
const LOGO_END = 0.9;     // mark fully resolved, and held until the handoff

// Enough of the sequence to start without stalling; the rest streams in behind.
const FRAMES_BEFORE_START = 14;

const framePath = (tier, index) =>
    `${import.meta.env.BASE_URL}intro/${tier}/frame_${String(index + 1).padStart(3, '0')}.webp`;

export default function IntroScrollSequence() {
    const sectionRef = useRef(null);
    const stageRef = useRef(null);
    const canvasRef = useRef(null);
    const logoRef = useRef(null);
    const captionRef = useRef(null);
    const scrimRef = useRef(null);

    const [ready, setReady] = useState(false);
    const [loadPercent, setLoadPercent] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        const section = sectionRef.current;
        if (!canvas || !section) return;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const tier = window.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop';

        const images = Array.from({ length: FRAME_COUNT });
        let loadedCount = 0;
        let cancelled = false;
        let currentFrame = -1;
        let pendingFrame = 0;
        let drawScheduled = false;
        let trigger = null;

        // --- painting -------------------------------------------------------

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            if (!w || !h) return;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            currentFrame = -1; // force a repaint at the new size
            scheduleDraw(pendingFrame);
        };

        const paint = (index) => {
            const img = images[index];
            if (!img || !img.complete || img.naturalWidth === 0) return;

            const cw = canvas.width;
            const ch = canvas.height;
            if (!cw || !ch) return;

            // The footage is landscape. Cover-fitting it into a portrait phone
            // crops so aggressively that only a fragment of the vehicle is
            // left on screen, so portrait viewports letterbox it instead and
            // keep the whole buggy visible. Landscape still fills the frame.
            // The 1.12 nudge past pure contain fills more of a phone screen.
            // The vehicle sits inside roughly the middle 80% of the frame, so
            // trimming ~6% from each edge does not reach the wheels.
            const portrait = ch > cw;
            const scale = portrait
                ? Math.min(cw / img.naturalWidth, ch / img.naturalHeight) * 1.12
                : Math.max(cw / img.naturalWidth, ch / img.naturalHeight);

            const dw = img.naturalWidth * scale;
            const dh = img.naturalHeight * scale;

            // Sit the band a little above centre on portrait, leaving the
            // lower third clear for the mark.
            const originY = portrait ? (ch - dh) * 0.38 : (ch - dh) / 2;

            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, cw, ch);
            ctx.drawImage(img, (cw - dw) / 2, originY, dw, dh);
            currentFrame = index;
        };

        const scheduleDraw = (index) => {
            pendingFrame = index;
            if (drawScheduled) return;
            drawScheduled = true;
            requestAnimationFrame(() => {
                drawScheduled = false;
                if (cancelled) return;
                if (pendingFrame === currentFrame) return;
                paint(pendingFrame);
            });
        };

        // Fall back to the closest already-decoded frame so scrubbing ahead of
        // the download never shows a blank canvas.
        const nearestLoaded = (index) => {
            if (images[index]?.complete) return index;
            for (let step = 1; step < FRAME_COUNT; step++) {
                if (images[index - step]?.complete) return index - step;
                if (images[index + step]?.complete) return index + step;
            }
            return -1;
        };

        // --- loading --------------------------------------------------------

        const loadFrame = (index) =>
            new Promise((resolve) => {
                const img = new Image();
                img.decoding = 'async';
                img.onload = img.onerror = () => {
                    loadedCount++;
                    if (!cancelled) {
                        setLoadPercent(Math.round((loadedCount / FRAME_COUNT) * 100));
                    }
                    resolve();
                };
                img.src = framePath(tier, index);
                images[index] = img;
            });

        const start = async () => {
            // Load the opening frames first so the sequence is usable quickly.
            await Promise.all(
                Array.from({ length: FRAMES_BEFORE_START }, (_, i) => loadFrame(i))
            );
            if (cancelled) return;

            resize();
            paint(0);
            setReady(true);

            // Remainder streams in sequentially, staying out of the way of the
            // rest of the page's requests.
            for (let i = FRAMES_BEFORE_START; i < FRAME_COUNT; i++) {
                if (cancelled) return;
                await loadFrame(i);
            }
        };

        // --- scroll wiring --------------------------------------------------

        // Releasing the pin at the end of the range, the way GSAP's own pinning
        // does. A fixed stage cannot scroll away on its own, so simply fading
        // it out left the remaining viewport of the section as an empty dark
        // gap before the hero. Parked at the section's bottom edge instead, it
        // sits exactly where it was pinned and scrolls off with the section.
        let pinned = null;
        const setPinned = (next) => {
            const stage = stageRef.current;
            if (!stage || pinned === next) return;
            pinned = next;
            if (next) {
                stage.style.position = 'fixed';
                stage.style.top = '0px';
                stage.style.bottom = '';
            } else {
                stage.style.position = 'absolute';
                stage.style.top = 'auto';
                stage.style.bottom = '0px';
            }
        };

        const setupTrigger = () => {
            trigger = ScrollTrigger.create({
                trigger: section,
                start: 'top top',
                end: 'bottom bottom',
                scrub: true,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                    const p = self.progress;

                    const framePos = Math.min(1, p / SCRUB_END);
                    const wanted = Math.min(
                        FRAME_COUNT - 1,
                        Math.round(framePos * (FRAME_COUNT - 1))
                    );
                    const drawable = nearestLoaded(wanted);
                    if (drawable >= 0) scheduleDraw(drawable);

                    // The mark emerges over the tail of the scroll while the
                    // footage sinks behind a darkening scrim.
                    const logoP = gsap.utils.clamp(
                        0,
                        1,
                        (p - LOGO_START) / (LOGO_END - LOGO_START)
                    );
                    const eased = gsap.parseEase('power2.out')(logoP);

                    gsap.set(scrimRef.current, { opacity: eased * 0.82 });
                    gsap.set(logoRef.current, {
                        opacity: eased,
                        scale: 0.82 + eased * 0.18,
                        y: (1 - eased) * 34,
                    });
                    gsap.set(captionRef.current, {
                        opacity: gsap.utils.clamp(0, 1, (logoP - 0.35) / 0.65),
                        y: (1 - eased) * 18,
                    });

                    setPinned(p < 1);
                },
                // onUpdate stops firing once scrolled clear of the range, so
                // the pin state is settled explicitly at both edges.
                onLeave: () => setPinned(false),
                onEnterBack: () => setPinned(true),
            });

            setPinned(true);
        };

        // Reduced motion: no scrub. Show the closing frame with the mark
        // already resolved, and let the section collapse to a single screen.
        const applyReducedMotion = () => {
            section.style.height = '100vh';
            // Without a scrub there is nothing to drive the fixed stage out of
            // the way, so it becomes a normal in-flow layer that scrolls off.
            if (stageRef.current) stageRef.current.style.position = 'absolute';
            loadFrame(FRAME_COUNT - 1).then(() => {
                if (cancelled) return;
                resize();
                paint(FRAME_COUNT - 1);
                setReady(true);
                gsap.set(scrimRef.current, { opacity: 0.82 });
                gsap.set(logoRef.current, { opacity: 1, scale: 1, y: 0 });
                gsap.set(captionRef.current, { opacity: 1, y: 0 });
            });
        };

        if (reduceMotion.matches) {
            applyReducedMotion();
        } else {
            start();
            setupTrigger();
        }

        window.addEventListener('resize', resize);

        return () => {
            cancelled = true;
            window.removeEventListener('resize', resize);
            trigger?.kill();
            // Drop the decoded bitmaps; 80 frames is a real amount of memory to
            // leave behind on a route change.
            for (let i = 0; i < FRAME_COUNT; i++) {
                if (images[i]) images[i].src = '';
                images[i] = null;
            }
        };
    }, []);

    return (
        <section
            ref={sectionRef}
            id="intro"
            className="relative w-full h-[280vh] bg-slate-900 select-none"
            aria-label="Team Asterix buggy walkaround"
        >
            {/* Fixed rather than sticky. The app root and body both set
                overflow-x: hidden, which per spec makes the other axis compute
                to auto -- that turns the ancestor into a scroll container and
                silently breaks position: sticky, leaving the stage to scroll
                away instead of holding. A fixed layer is unaffected by overflow
                ancestors; setPinned parks it at the section's bottom edge once
                the scrub is done so it scrolls off with the section. */}
            <div
                ref={stageRef}
                className="fixed inset-x-0 top-0 h-screen w-full overflow-hidden pointer-events-none"
            >
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full block"
                    aria-hidden="true"
                />

                {/* Darkens the footage as the mark takes over. */}
                <div
                    ref={scrimRef}
                    className="absolute inset-0 bg-slate-950 opacity-0 pointer-events-none"
                    aria-hidden="true"
                />

                {/* Emerging team mark */}
                {/* Portrait letterboxes the footage into the upper part of the
                    screen, so the mark drops into the clear lower third rather
                    than sitting on top of the vehicle. */}
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-24 gap-6 landscape:justify-center landscape:pb-0 sm:justify-center sm:pb-0 sm:gap-10 px-6 pointer-events-none">
                    {/* The team mark is dark artwork intended for a light
                        background. Knocked out to solid white so it reads
                        against the scrim, with a sky glow behind it. */}
                    <img
                        ref={logoRef}
                        src={teamLogo}
                        alt="Team Asterix"
                        className="w-56 sm:w-80 md:w-[26rem] h-auto object-contain opacity-0 [filter:brightness(0)_invert(1)_drop-shadow(0_0_28px_rgba(56,189,248,0.65))]"
                    />
                    <div ref={captionRef} className="opacity-0 text-center">
                        <p className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white leading-none">
                            SAEINDIA a-BAJA 2026
                        </p>
                        <p className="mt-3 text-[10px] sm:text-xs font-mono font-black uppercase tracking-[0.35em] text-sky-400">
                            Keep scrolling
                        </p>
                    </div>
                </div>

                {/* Loading state. The bar is the only thing on screen until
                    enough of the sequence has decoded to scrub smoothly. */}
                {!ready && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900">
                        <span className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-sky-400">
                            Loading walkaround
                        </span>
                        <div className="w-56 h-2.5 border-2 border-sky-400/70 overflow-hidden">
                            <div
                                className="h-full bg-sky-400 transition-[width] duration-200 ease-linear"
                                style={{ width: `${loadPercent}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 tabular-nums">
                            {loadPercent}%
                        </span>
                    </div>
                )}
            </div>
        </section>
    );
}
