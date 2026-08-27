import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * useScrollAssembly Hook
 * Orchestrates a clean, modern mechanical assembly effect as the user scrolls into each section
 * on the main landing page.
 * Safely bypassed on standalone detail pages (e.g. SubsystemDetail) to ensure 100% crisp readability.
 */
export default function useScrollAssembly(lenis, dependency) {
    useEffect(() => {
        // If a specific subpage/modal is open, do not apply scroll assembly animations.
        // Immediately reset and clear all transforms and opacity.
        if (dependency) {
            ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
            gsap.set('[data-assemble], [data-assemble-section]', { clearProps: 'transform,opacity,willChange' });
            return;
        }

        // Connect Lenis smooth scroll to GSAP ScrollTrigger
        let scrollHandler;
        if (lenis) {
            scrollHandler = () => ScrollTrigger.update();
            lenis.on('scroll', scrollHandler);
        }

        // Small timeout to allow DOM to settle after mounting
        const timer = setTimeout(() => {
            // Find all major sections on the home page
            const sections = document.querySelectorAll('section, footer');
            const triggers = [];

            sections.forEach((section) => {
                const isHero = section.id === 'hero' || section.classList.contains('hero-section');

                if (section.id === 'squad') {
                    // CardSwap manages its own GSAP 3D transforms (xPercent: -50, yPercent: -50).
                    // Only animate the header cleanly and NEVER touch the cards!
                    const header = section.querySelector('[data-assemble="header"]');
                    if (header) {
                        const tlSquad = gsap.timeline();
                        tlSquad.fromTo(header, { y: -30, opacity: 0.3 }, { y: 0, opacity: 1, ease: 'power2.out' });
                        const st = ScrollTrigger.create({
                            trigger: section,
                            start: 'top 92%',
                            end: 'top 50%',
                            scrub: 0.6,
                            animation: tlSquad,
                            invalidateOnRefresh: true,
                        });
                        triggers.push(st);
                    }
                    return;
                }

                // Collect explicit elements with data-assemble
                const explicitHeaders = Array.from(section.querySelectorAll('[data-assemble="header"]'));
                const explicitLeft = Array.from(section.querySelectorAll('[data-assemble="left"]'));
                const explicitRight = Array.from(section.querySelectorAll('[data-assemble="right"]'));
                const explicitUp = Array.from(section.querySelectorAll('[data-assemble="up"], [data-assemble="card"]'));
                const explicitDown = Array.from(section.querySelectorAll('[data-assemble="down"]'));
                const explicitPop = Array.from(section.querySelectorAll('[data-assemble="pop"], [data-assemble="badge"]'));
                const explicitStagger = Array.from(section.querySelectorAll('[data-assemble="stagger"]'));

                const hasExplicit = explicitHeaders.length || explicitLeft.length || explicitRight.length || 
                                    explicitUp.length || explicitDown.length || explicitPop.length || explicitStagger.length;

                let headers = explicitHeaders;
                let cards = explicitUp;
                let popElements = explicitPop;
                let leftElements = explicitLeft;
                let rightElements = explicitRight;

                if (!hasExplicit && !isHero) {
                    headers = Array.from(section.querySelectorAll('h1, h2, h3, .section-header'));
                    cards = Array.from(section.querySelectorAll('.grid > div, form, .cyber-card'));
                    popElements = Array.from(section.querySelectorAll('.cyber-button, button, .badge'));
                }

                if (isHero) {
                    const heroItems = Array.from(section.querySelectorAll('[data-assemble], .cyber-button, h1, p, .rounded-full'));
                    if (heroItems.length) {
                        gsap.fromTo(
                            heroItems,
                            { y: 30, opacity: 0.3, scale: 0.98 },
                            {
                                y: 0,
                                opacity: 1,
                                scale: 1,
                                stagger: 0.08,
                                duration: 0.8,
                                ease: 'power2.out',
                                delay: 0.1,
                            }
                        );
                    }
                    return;
                }

                // Create a scroll-scrubbed assembly timeline for this section
                const tl = gsap.timeline();

                // 1. Headers move smoothly into place from above (no tilt)
                if (headers.length) {
                    tl.fromTo(
                        headers,
                        { y: -35, opacity: 0.3 },
                        { y: 0, opacity: 1, ease: 'power2.out', stagger: 0.06 },
                        0
                    );
                }

                // 2. Left elements glide in from the left (straight, no rotation tilt)
                if (leftElements.length) {
                    tl.fromTo(
                        leftElements,
                        { x: -45, opacity: 0.3 },
                        { x: 0, opacity: 1, ease: 'power2.out', stagger: 0.06 },
                        0.04
                    );
                }

                // 3. Right elements glide in from the right (straight, no rotation tilt)
                if (rightElements.length) {
                    tl.fromTo(
                        rightElements,
                        { x: 45, opacity: 0.3 },
                        { x: 0, opacity: 1, ease: 'power2.out', stagger: 0.06 },
                        0.04
                    );
                }

                // 4. Cards and central interactive components rise up cleanly
                if (cards.length) {
                    tl.fromTo(
                        cards,
                        { y: 45, scale: 0.96, opacity: 0.3 },
                        { y: 0, scale: 1, opacity: 1, ease: 'power2.out', stagger: 0.08 },
                        0.06
                    );
                }

                // 5. Staggered child containers
                explicitStagger.forEach((parent) => {
                    const children = Array.from(parent.children);
                    if (children.length) {
                        tl.fromTo(
                            children,
                            { y: 30, opacity: 0.3 },
                            { y: 0, opacity: 1, stagger: 0.06, ease: 'power2.out' },
                            0.08
                        );
                    }
                });

                // 6. Badges and CTA buttons
                if (popElements.length) {
                    tl.fromTo(
                        popElements,
                        { y: 20, scale: 0.92, opacity: 0.3 },
                        { y: 0, scale: 1, opacity: 1, ease: 'power2.out', stagger: 0.05 },
                        0.1
                    );
                }

                // Attach ScrollTrigger: starts as section approaches, fully assembled by top 50%
                const st = ScrollTrigger.create({
                    trigger: section,
                    start: 'top 92%',
                    end: 'top 50%',
                    scrub: 0.6,
                    animation: tl,
                    invalidateOnRefresh: true,
                });

                triggers.push(st);
            });

            ScrollTrigger.refresh();
        }, 100);

        return () => {
            clearTimeout(timer);
            if (lenis && scrollHandler) {
                lenis.off('scroll', scrollHandler);
            }
            ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
            gsap.set('[data-assemble], [data-assemble-section]', { clearProps: 'transform,opacity,willChange' });
        };
    }, [lenis, dependency]);
}
