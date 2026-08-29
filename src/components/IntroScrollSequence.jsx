import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import teamLogo from '../assets/Screenshot 2026-08-26 232320.png';
import { introHandoff, resetIntroHandoff } from '../lib/introHandoff';

gsap.registerPlugin(ScrollTrigger);

/**
 * IntroScrollSequence
 * A scroll-scrubbed turn of the buggy, from its rear round to the pose the live
 * 3D scene is holding, ending with the team mark emerging.
 *
 * The frames were extracted from the workshop turntable clip by
 * scripts/extract-intro-frames.ps1 into public/intro/{desktop,mobile}, every
 * third frame, cropped to drop the generator watermark. Two tiers exist so
 * phones do not download the full-resolution sequence.
 *
 * Playback order is the clip's own. The orbit runs rear-three-quarter (frame 1)
 * -> side profile (~frame 33) -> dead front (~frame 62) -> front-three-quarter
 * (frame 80), so it already opens on the buggy's back and turns it to face the
 * reader. Frame 80 is the pose Car3DCanvas holds through the cross-dissolve:
 * the model is built nose-on-+Z with the camera at +Z, so its `rotY: -0.48`
 * hero keyframe is a front three-quarter, and reversing the sequence would land
 * the footage 180 degrees away from it.
 *
 * Implementation notes:
 * - The sticky child inside a tall section gives the pinned effect without
 *   GSAP's pin-spacer, which is far less likely to fight Lenis or the
 *   surrounding layout. ScrollTrigger is used only to read progress.
 * - Frames are drawn to a canvas rather than swapped as <img> src, so there is
 *   no flash between frames and no layout work per frame.
 * - The canvas is driven by its own rAF loop rather than painted straight from
 *   the scroll handler. Scroll position is a *fractional* frame index that the
 *   loop eases toward, and the two frames bracketing it are cross-faded. Those
 *   two things together are what make 80 discrete stills read as continuous
 *   rotation rather than a slide show, and stop a flicked mouse wheel from
 *   jumping the turn several degrees in one paint.
 */

const FRAME_COUNT = 80;
const SCRUB_END = 0.52;      // the turn finishes here
const LOGO_START = 0.45;     // slight overlap so the two phases cross-fade
const LOGO_END = 0.70;       // mark fully resolved
const HANDOFF_START = 0.78;  // footage dissolves into the live 3D scene

// Enough of the sequence to start without stalling; the rest streams in behind.
const FRAMES_BEFORE_START = 14;

// Settling time for the eased frame position, in seconds. Long enough to
// absorb a wheel notch, short enough that the turn never feels detached from
// the scroll.
const FRAME_TAU = 0.085;

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

        // Take ownership of the 3D scene's opening pose for as long as this
        // section is mounted. Starting at 0 holds the buggy on the frame that
        // matches the footage, so nothing jumps when the dissolve begins.
        introHandoff.active = true;
        introHandoff.progress = 0;

        const images = Array.from({ length: FRAME_COUNT });
        let loadedCount = 0;
        let cancelled = false;
        let trigger = null;

        // Frame position is fractional throughout: `target` is where the scroll
        // says the turn should be, `display` is where it has eased to, and
        // `painted` is what is actually on the canvas.
        let targetPos = 0;
        let displayPos = 0;
        let paintedPos = -1;

        let rafId = null;
        let running = false;
        let lastTime = 0;

        // --- painting -------------------------------------------------------

        const isLoaded = (index) => {
            const img = images[index];
            return !!img && img.complete && img.naturalWidth > 0;
        };

        // Cover on every viewport: the footage fills the screen edge to edge.
        // Letterboxing portrait kept the whole vehicle visible but turned the
        // opening shot into a small band floating in a dark field, which read
        // as a video player rather than a full-bleed sequence.
        const drawFrame = (index) => {
            const img = images[index];
            const cw = canvas.width;
            const ch = canvas.height;

            const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
            const dw = img.naturalWidth * scale;
            const dh = img.naturalHeight * scale;

            // Portrait crops hard, so bias the visible window slightly above
            // centre: the buggy sits a little high in frame and the floor,
            // which carries no detail, is what gets cut.
            const portrait = ch > cw;
            const originY = portrait ? (ch - dh) * 0.42 : (ch - dh) / 2;

            ctx.drawImage(img, (cw - dw) / 2, originY, dw, dh);
        };

        // Fall back to the closest already-decoded frame so scrubbing ahead of
        // the download never shows a blank canvas.
        const nearestLoaded = (index) => {
            if (isLoaded(index)) return index;
            for (let step = 1; step < FRAME_COUNT; step++) {
                if (isLoaded(index - step)) return index - step;
                if (isLoaded(index + step)) return index + step;
            }
            return -1;
        };

        const paint = (pos) => {
            const cw = canvas.width;
            const ch = canvas.height;
            if (!cw || !ch) return;

            const lo = Math.min(FRAME_COUNT - 1, Math.max(0, Math.floor(pos)));
            const hi = Math.min(FRAME_COUNT - 1, lo + 1);
            const t = Math.min(1, Math.max(0, pos - lo));

            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, cw, ch);

            // Both bracketing frames present: cross-fade between them, which is
            // what turns an 80-still sequence into a continuous turn. If either
            // is still downloading, fall back to the nearest whole frame rather
            // than blending in something from a different part of the orbit.
            if (hi !== lo && t > 0.002 && isLoaded(lo) && isLoaded(hi)) {
                drawFrame(lo);
                ctx.globalAlpha = t;
                drawFrame(hi);
                ctx.globalAlpha = 1;
            } else {
                const fallback = nearestLoaded(lo);
                if (fallback < 0) return;
                drawFrame(fallback);
            }

            paintedPos = pos;
        };

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            if (!w || !h) return;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            // Resizing the backing store resets every bit of context state.
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            paintedPos = -1; // force a repaint at the new size
            paint(displayPos);
        };

        // --- render loop ----------------------------------------------------

        // Frame-rate independent damping: the same settling time whether the
        // display runs at 60Hz or 144Hz.
        const tick = (now) => {
            rafId = null;
            if (cancelled) return;

            const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
            lastTime = now;

            const k = 1 - Math.exp(-dt / FRAME_TAU);
            displayPos += (targetPos - displayPos) * k;
            if (Math.abs(targetPos - displayPos) < 0.01) displayPos = targetPos;

            // A few thousandths of a frame is well under a pixel of movement;
            // repainting for it is pure cost.
            if (Math.abs(displayPos - paintedPos) > 0.004) paint(displayPos);

            if (running) rafId = requestAnimationFrame(tick);
        };

        const startLoop = () => {
            if (running || cancelled) return;
            running = true;
            lastTime = performance.now();
            rafId = requestAnimationFrame(tick);
        };

        const stopLoop = () => {
            running = false;
            if (rafId !== null) cancelAnimationFrame(rafId);
            rafId = null;
        };

        // --- loading --------------------------------------------------------

        const loadFrame = (index) =>
            new Promise((resolve) => {
                const img = new Image();
                img.decoding = 'async';
                if (index < FRAMES_BEFORE_START) img.fetchPriority = 'high';

                const done = () => {
                    loadedCount++;
                    if (!cancelled) {
                        setLoadPercent(Math.round((loadedCount / FRAME_COUNT) * 100));
                    }
                    resolve();
                };

                // Decoding up front costs nothing here and keeps the first
                // drawImage of each frame off the critical path -- a synchronous
                // decode inside the rAF tick is a dropped frame mid-scrub.
                img.onload = () => {
                    if (typeof img.decode === 'function') img.decode().then(done, done);
                    else done();
                };
                img.onerror = done;
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
            setReady(true);
            startLoop();

            // Remainder streams in sequentially, staying out of the way of the
            // rest of the page's requests.
            for (let i = FRAMES_BEFORE_START; i < FRAME_COUNT; i++) {
                if (cancelled) return;
                await loadFrame(i);
                // A frame arriving behind the scrub replaces whichever fallback
                // is standing in for it, so force the next tick to repaint.
                paintedPos = -1;
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

                    // Fractional on purpose -- the rAF loop eases toward this
                    // and cross-fades the two frames around it.
                    targetPos = Math.min(1, p / SCRUB_END) * (FRAME_COUNT - 1);

                    // The mark emerges over the tail of the scroll while the
                    // footage sinks behind a darkening scrim.
                    const logoP = gsap.utils.clamp(
                        0,
                        1,
                        (p - LOGO_START) / (LOGO_END - LOGO_START)
                    );
                    const eased = gsap.parseEase('power2.out')(logoP);

                    // The closing stretch dissolves the footage into the live
                    // 3D scene sitting behind this stage, rather than cutting
                    // from a dark video straight into a light page. The frame
                    // canvas and the scrim fade to transparent, which reveals
                    // FloatingBackground underneath, and `introHandoff` tells
                    // the WebGL scene to travel from the pose that matches this
                    // closing frame to its normal hero mark over the same
                    // stretch of scroll. Both halves of the cross-dissolve
                    // therefore move together instead of swapping.
                    const rawHandoff = gsap.utils.clamp(
                        0,
                        1,
                        (p - HANDOFF_START) / (1 - HANDOFF_START)
                    );
                    const handoff = gsap.parseEase('power2.inOut')(rawHandoff);

                    introHandoff.progress = handoff;

                    const veil = 1 - handoff;

                    gsap.set(canvasRef.current, { opacity: veil });
                    gsap.set(scrimRef.current, { opacity: eased * 0.82 * veil });

                    // The mark clears before the hero copy arrives, a little
                    // ahead of the footage, so the two never overlap.
                    const markVeil = 1 - gsap.utils.clamp(0, 1, rawHandoff * 1.35);

                    gsap.set(logoRef.current, {
                        opacity: eased * markVeil,
                        scale: 0.82 + eased * 0.18,
                        y: (1 - eased) * 34,
                    });
                    gsap.set(captionRef.current, {
                        opacity: gsap.utils.clamp(0, 1, (logoP - 0.35) / 0.65) * markVeil,
                        y: (1 - eased) * 18,
                    });

                    setPinned(p < 1);
                },
                // The canvas only has work to do while the section is on
                // screen. Outside the range it is either untouched or fully
                // faded out, so the loop is parked rather than left spinning
                // for the rest of the page.
                onToggle: (self) => {
                    if (self.isActive) {
                        startLoop();
                    } else {
                        stopLoop();
                        displayPos = targetPos;
                        paint(displayPos);
                    }
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
            // No scrub means no dissolve to drive, so the 3D scene keeps its
            // normal framing from the start.
            introHandoff.progress = 1;
            introHandoff.active = false;
            // Without a scrub there is nothing to drive the fixed stage out of
            // the way, so it becomes a normal in-flow layer that scrolls off.
            if (stageRef.current) stageRef.current.style.position = 'absolute';
            loadFrame(FRAME_COUNT - 1).then(() => {
                if (cancelled) return;
                targetPos = FRAME_COUNT - 1;
                displayPos = FRAME_COUNT - 1;
                resize();
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
            stopLoop();
            resetIntroHandoff();
            window.removeEventListener('resize', resize);
            trigger?.kill();
            // Drop the decoded bitmaps; the sequence is a real amount of memory
            // to leave behind on a route change.
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
            // Deliberately transparent. The dark backdrop is painted by the
            // frame canvas itself, so fading that canvas out at the end reveals
            // the live 3D scene sitting behind this section instead of a flat
            // slate panel, which is what made the handoff read as a hard cut.
            className="relative w-full h-[280vh] select-none"
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
                {/* Centred on every viewport. The mark used to be pushed into
                    the lower third to clear a letterboxed band; the footage is
                    full-bleed now, and the scrim gives it contrast wherever it
                    lands. */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 sm:gap-10 px-6 pointer-events-none">
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
