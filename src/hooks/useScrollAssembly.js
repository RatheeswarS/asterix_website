import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * useScrollAssembly
 * Reveals each section once, as it enters the viewport, and leaves it alone
 * afterwards.
 *
 * The earlier version scrubbed the reveal to scroll position, which meant
 * content sat at 30% opacity until the reader had scrolled far enough, and
 * un-revealed itself again on the way back up. Reveals are now one-shot: an
 * element animates from 0 to 1 and stays there.
 *
 * Bypassed entirely on standalone detail pages so their copy is crisp
 * immediately.
 */

const ENTER_START = 'top 88%';

// Every element the hook is willing to touch. Anything matching this is
// hidden up front and is guaranteed to be un-hidden by a trigger below.
const MANAGED = '[data-assemble], [data-assemble-section]';

const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function useScrollAssembly(lenis, dependency) {
    useEffect(() => {
        // Track only the triggers this hook created. The previous version
        // called ScrollTrigger.getAll().kill() on cleanup, which would also
        // destroy triggers belonging to any other component.
        const ownedTriggers = [];
        const ownedTweens = [];
        // Every element this hook hid, including ones matched by the
        // structural fallback rather than by a data-assemble attribute. All of
        // them must be restored on cleanup or they stay at opacity 0.
        const ownedElements = new Set();

        const clearManaged = () => {
            document.querySelectorAll(MANAGED).forEach((el) => {
                el.classList.remove('reveal-init');
            });
            gsap.set(MANAGED, { clearProps: 'transform,opacity,willChange' });

            if (ownedElements.size) {
                const list = [...ownedElements];
                list.forEach((el) => el.classList.remove('reveal-init'));
                gsap.set(list, { clearProps: 'transform,opacity,willChange' });
                ownedElements.clear();
            }
        };

        // A subpage or modal is open: no reveals, nothing hidden.
        if (dependency) {
            clearManaged();
            return;
        }

        // Reduced motion: show everything immediately.
        if (prefersReducedMotion()) {
            clearManaged();
            return;
        }

        // Keep ScrollTrigger in step with Lenis' virtual scroll position.
        let scrollHandler;
        if (lenis) {
            scrollHandler = () => ScrollTrigger.update();
            lenis.on('scroll', scrollHandler);
        }

        // GSAP's lag smoothing fights a smooth-scroll library; without this,
        // a single long frame makes the page and the reveals disagree.
        gsap.ticker.lagSmoothing(0);

        let refreshOnLoad;

        const timer = setTimeout(() => {
            const sections = document.querySelectorAll('section, footer');

            // Reveal helper: hide now, animate to visible once, then drop the
            // inline styles so nothing is left with a stale transform or a
            // lingering will-change layer.
            const revealOnce = (targets, section, fromVars) => {
                const list = Array.isArray(targets) ? targets : Array.from(targets);
                if (!list.length) return null;

                list.forEach((el) => {
                    el.classList.add('reveal-init');
                    ownedElements.add(el);
                });

                const tween = gsap.fromTo(
                    list,
                    { ...fromVars, opacity: 0 },
                    {
                        x: 0,
                        y: 0,
                        scale: 1,
                        opacity: 1,
                        duration: 0.55,
                        ease: 'power2.out',
                        stagger: 0.06,
                        paused: true,
                        onStart: () => list.forEach((el) => el.classList.remove('reveal-init')),
                        onComplete: () => gsap.set(list, { clearProps: 'transform,willChange' }),
                    }
                );

                ownedTweens.push(tween);

                const st = ScrollTrigger.create({
                    trigger: section,
                    start: ENTER_START,
                    once: true,
                    invalidateOnRefresh: true,
                    onEnter: () => tween.play(),
                });
                ownedTriggers.push(st);
                return tween;
            };

            sections.forEach((section) => {
                const isHero = section.id === 'hero' || section.classList.contains('hero-section');

                // The hero is above the fold on load; it plays on mount rather
                // than waiting for a scroll that may never come.
                if (isHero) {
                    const heroItems = Array.from(
                        section.querySelectorAll('[data-assemble], .cyber-button, h1, p, .rounded-full')
                    );
                    if (heroItems.length) {
                        heroItems.forEach((el) => ownedElements.add(el));
                        const tween = gsap.fromTo(
                            heroItems,
                            { y: 24, opacity: 0, scale: 0.99 },
                            {
                                y: 0,
                                opacity: 1,
                                scale: 1,
                                stagger: 0.06,
                                duration: 0.7,
                                ease: 'power2.out',
                                delay: 0.08,
                                onComplete: () =>
                                    gsap.set(heroItems, { clearProps: 'transform,willChange' }),
                            }
                        );
                        ownedTweens.push(tween);
                    }
                    return;
                }

                // CardSwap owns its own 3D transforms on the cards
                // (xPercent/yPercent/z). Touching them desynchronises the swap
                // animation, so only the header is revealed here.
                if (section.id === 'squad') {
                    const header = section.querySelector('[data-assemble="header"]');
                    if (header) revealOnce([header], section, { y: -24 });
                    return;
                }

                const explicit = {
                    headers: Array.from(section.querySelectorAll('[data-assemble="header"]')),
                    left: Array.from(section.querySelectorAll('[data-assemble="left"]')),
                    right: Array.from(section.querySelectorAll('[data-assemble="right"]')),
                    up: Array.from(section.querySelectorAll('[data-assemble="up"], [data-assemble="card"]')),
                    down: Array.from(section.querySelectorAll('[data-assemble="down"]')),
                    pop: Array.from(section.querySelectorAll('[data-assemble="pop"], [data-assemble="badge"]')),
                    stagger: Array.from(section.querySelectorAll('[data-assemble="stagger"]')),
                };

                const hasExplicit = Object.values(explicit).some((list) => list.length > 0);

                let { headers, left, right, up: cards, down, pop } = explicit;

                // Sections that have not been annotated fall back to a
                // structural guess.
                if (!hasExplicit) {
                    headers = Array.from(section.querySelectorAll('h1, h2, h3, .section-header'));
                    cards = Array.from(section.querySelectorAll('.grid > div, form, .cyber-card'));
                    pop = Array.from(section.querySelectorAll('.cyber-button, button, .badge'));
                }

                revealOnce(headers, section, { y: -24 });
                revealOnce(left, section, { x: -36 });
                revealOnce(right, section, { x: 36 });
                revealOnce(down, section, { y: -32 });
                revealOnce(cards, section, { y: 36, scale: 0.98 });
                revealOnce(pop, section, { y: 16, scale: 0.94 });

                explicit.stagger.forEach((parent) => {
                    revealOnce(Array.from(parent.children), section, { y: 24 });
                });
            });

            ScrollTrigger.refresh();

            // Images and the site-data fetch both change layout after this
            // point; without a refresh the trigger positions are computed
            // against a shorter page than the reader actually gets.
            refreshOnLoad = () => ScrollTrigger.refresh();
            window.addEventListener('load', refreshOnLoad);
        }, 100);

        return () => {
            clearTimeout(timer);
            if (refreshOnLoad) window.removeEventListener('load', refreshOnLoad);
            if (lenis && scrollHandler) lenis.off('scroll', scrollHandler);

            ownedTriggers.forEach((trigger) => trigger.kill());
            ownedTweens.forEach((tween) => tween.kill());

            // Never unmount leaving content stuck at opacity 0.
            clearManaged();
        };
    }, [lenis, dependency]);
}
