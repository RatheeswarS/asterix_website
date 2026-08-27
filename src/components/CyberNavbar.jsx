import { useState } from 'react';
import { subsystems } from '../data/subsystemsData';
import teamLogo from '../assets/Screenshot 2026-08-26 232320.png';
import TextDock, { DockTextItem } from './Dock';

export default function CyberNavbar({ onSelectSubsystem, isDetailPage, onBackToHome }) {
    const [shopOpen, setShopOpen] = useState(false);
    const [contactOpen, setContactOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mobileContactOpen, setMobileContactOpen] = useState(false);

    const socialLinks = [
        {
            name: 'Instagram',
            handle: '@asterix_itech',
            url: 'https://www.instagram.com/asterix_itech/',
            color: 'hover:bg-pink-50 hover:text-pink-600',
            icon: (
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
            )
        },
        {
            name: 'LinkedIn',
            handle: 'Team Asterix',
            url: 'https://www.linkedin.com/company/teamasterix/',
            color: 'hover:bg-blue-50 hover:text-blue-600',
            icon: (
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
            )
        },
        {
            name: 'GitHub',
            handle: 'Team-Asterix264016',
            url: 'https://github.com/Team-Asterix264016/',
            color: 'hover:bg-slate-100 hover:text-slate-950',
            icon: (
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
            )
        }
    ];

    const handleSubsystemClick = (id) => {
        setShopOpen(false);
        setContactOpen(false);
        setMobileOpen(false);
        if (onSelectSubsystem) {
            onSelectSubsystem(id);
        }
    };

    const handleNavigate = (hash) => {
        setShopOpen(false);
        setContactOpen(false);
        if (isDetailPage && onBackToHome) {
            onBackToHome();
            setTimeout(() => {
                const el = document.querySelector(hash);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            const el = document.querySelector(hash);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b-4 border-slate-900 select-none">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 py-2.5 flex items-center justify-between relative">

                {/* Brand Logo */}
                <button
                    onClick={onBackToHome}
                    className="flex items-center group cursor-pointer text-left focus:outline-none"
                    aria-label="Asterix Racing Home"
                >
                    <img
                        src={teamLogo}
                        alt="Asterix Racing"
                        className="h-8 sm:h-9 md:h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                    />
                </button>

                {/* React Bits TextDock: Proximity magnification on the actual letters/buttons */}
                <div className="hidden md:flex items-center">
                    <TextDock className="py-1">
                        {({ mouseX }) => (
                            <div className="flex items-center gap-1.5 lg:gap-2.5">
                                {/* The Subsystems Text Item */}
                                <div className="relative">
                                    <DockTextItem
                                        mouseX={mouseX}
                                        onClick={() => {
                                            setShopOpen((prev) => !prev);
                                            setContactOpen(false);
                                        }}
                                        className={`px-3.5 py-2 border-2 border-slate-900 bg-white shadow-[2px_2px_0px_#0f172a] hover:bg-sky-100 hover:shadow-[3px_3px_0px_#0f172a] flex items-center gap-1.5 ${shopOpen ? '!bg-sky-200' : ''
                                            }`}
                                    >
                                        <span>THE SUBSYSTEMS</span>
                                        <span className="text-[10px]">▼</span>
                                    </DockTextItem>

                                    {/* Mega Dropdown Menu */}
                                    {shopOpen && (
                                        <div
                                            className="absolute top-full left-0 mt-3 w-80 bg-white border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-5 z-50 animate-in fade-in zoom-in-95 duration-150"
                                            onMouseLeave={() => setShopOpen(false)}
                                        >
                                            <div className="flex items-center justify-between mb-3 border-b-2 border-slate-200 pb-1">
                                                <span className="text-[10px] font-mono text-sky-600 uppercase font-black">
                                                    // SELECT SUBSYSTEM DECK
                                                </span>
                                                <button
                                                    onClick={() => setShopOpen(false)}
                                                    className="text-xs font-black text-slate-400 hover:text-slate-900 cursor-pointer"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {subsystems.map((s) => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => handleSubsystemClick(s.id)}
                                                        className="p-2 border-2 border-slate-900 bg-sky-50 hover:bg-sky-500 hover:text-white transition-colors flex items-center justify-between font-bold text-xs cursor-pointer text-left"
                                                    >
                                                        <span>{s.name}</span>
                                                        <span>→</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {isDetailPage ? (
                                    <DockTextItem
                                        mouseX={mouseX}
                                        onClick={onBackToHome}
                                        className="px-4 py-2 border-2 border-slate-900 bg-sky-100 text-slate-900 shadow-[2px_2px_0px_#0f172a] hover:bg-sky-500 hover:text-white"
                                    >
                                        <span>← Back to Overview</span>
                                    </DockTextItem>
                                ) : (
                                    <>
                                        {/* Gallery */}
                                        <DockTextItem
                                            mouseX={mouseX}
                                            onClick={() => handleNavigate('#gallery')}
                                            className="px-3.5 py-2 border-2 border-slate-900 bg-white shadow-[2px_2px_0px_#0f172a] hover:bg-sky-100 hover:shadow-[3px_3px_0px_#0f172a]"
                                        >
                                            <span>Gallery</span>
                                        </DockTextItem>

                                        {/* Updates */}
                                        <DockTextItem
                                            mouseX={mouseX}
                                            onClick={() => handleNavigate('#updates')}
                                            className="px-3.5 py-2 border-2 border-slate-900 bg-white shadow-[2px_2px_0px_#0f172a] hover:bg-sky-100 hover:shadow-[3px_3px_0px_#0f172a]"
                                        >
                                            <span>Updates</span>
                                        </DockTextItem>

                                        {/* Our Story */}
                                        <DockTextItem
                                            mouseX={mouseX}
                                            onClick={() => handleNavigate('#story')}
                                            className="px-3.5 py-2 border-2 border-slate-900 bg-white shadow-[2px_2px_0px_#0f172a] hover:bg-sky-100 hover:shadow-[3px_3px_0px_#0f172a]"
                                        >
                                            <span>Our Story</span>
                                        </DockTextItem>
                                    </>
                                )}

                                {/* Contact Us Button with Pop-up list of Instagram, LinkedIn, and GitHub */}
                                <div className="relative">
                                    <DockTextItem
                                        mouseX={mouseX}
                                        onClick={() => {
                                            setContactOpen((prev) => !prev);
                                            setShopOpen(false);
                                        }}
                                        className={`px-3.5 py-2 border-2 border-slate-900 bg-white shadow-[2px_2px_0px_#0f172a] hover:bg-sky-100 hover:shadow-[3px_3px_0px_#0f172a] flex items-center gap-1.5 ${contactOpen ? '!bg-sky-200' : ''
                                            }`}
                                    >
                                        <span>CONTACT US</span>
                                        <span className="text-[10px]">▼</span>
                                    </DockTextItem>

                                    {/* Contact Us Dropdown Pop-up Card */}
                                    {contactOpen && (
                                        <div
                                            className="absolute top-full left-0 sm:left-auto sm:right-0 mt-3 w-72 bg-white border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-4 z-50 animate-in fade-in zoom-in-95 duration-150"
                                            onMouseLeave={() => setContactOpen(false)}
                                        >
                                            <div className="flex items-center justify-between mb-3 border-b-2 border-slate-200 pb-1">
                                                <button
                                                    onClick={() => setContactOpen(false)}
                                                    className="text-xs font-black text-slate-400 hover:text-slate-900 cursor-pointer"
                                                >
                                                    ✕
                                                </button>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                {socialLinks.map((item) => (
                                                    <a
                                                        key={item.name}
                                                        href={item.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={() => setContactOpen(false)}
                                                        className={`p-2.5 border-2 border-slate-900 bg-sky-50 ${item.color} transition-all flex items-center justify-between font-bold text-xs shadow-[2px_2px_0px_#0f172a] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#0f172a] cursor-pointer group`}
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            {item.icon}
                                                            <div>
                                                                <span className="block font-black uppercase text-slate-900 group-hover:text-inherit">
                                                                    {item.name}
                                                                </span>
                                                                <span className="block text-[10px] font-mono text-slate-500">
                                                                    {item.handle}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className="text-sm font-black text-slate-900 group-hover:text-inherit">↗</span>
                                                    </a>
                                                ))}
                                            </div>

                                            <div className="mt-3 pt-2.5 border-t border-slate-200">
                                                <a
                                                    href="mailto:asterix.psgitech@gmail.com"
                                                    className="text-[11px] font-mono font-bold text-slate-600 hover:text-sky-600 flex items-center gap-1.5"
                                                >
                                                    <span>✉</span>
                                                    <span className="truncate">asterix.psgitech@gmail.com</span>
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Join Team Text Button with Dock Magnification */}
                                <DockTextItem
                                    mouseX={mouseX}
                                    onClick={() => window.open('https://forms.gle/6hHG6aXqrunnfj7V6', '_blank')}
                                    className="px-3.5 py-2 border-2 border-slate-900 bg-amber-300 text-slate-900 shadow-[2px_2px_0px_#0f172a] hover:bg-amber-400 hover:shadow-[3px_3px_0px_#0f172a] flex items-center gap-1"
                                >
                                    <span>Join Team</span>
                                    <span className="text-[10px]">↗</span>
                                </DockTextItem>

                                {/* Sponsor Team Text Button with Dock Magnification */}
                                <DockTextItem
                                    mouseX={mouseX}
                                    onClick={() => handleNavigate('#subscribe')}
                                    className="px-4 py-2 border-2 border-slate-900 bg-sky-500 text-white shadow-[2px_2px_0px_#0f172a] hover:bg-sky-400 hover:shadow-[3px_3px_0px_#0f172a]"
                                >
                                    <span>Sponsor Team</span>
                                </DockTextItem>
                            </div>
                        )}
                    </TextDock>
                </div>

                {/* Mobile Hamburger Toggle */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="md:hidden p-2 border-2 border-slate-900 bg-sky-100 cursor-pointer"
                    aria-label="Toggle Menu"
                >
                    <div className="w-5 h-3.5 flex flex-col justify-between">
                        <span className="h-0.5 w-full bg-slate-900" />
                        <span className="h-0.5 w-full bg-slate-900" />
                        <span className="h-0.5 w-full bg-slate-900" />
                    </div>
                </button>

            </div>

            {/* Mobile Menu Drawer */}
            {mobileOpen && (
                <div className="md:hidden bg-white border-t-2 border-slate-900 p-6 flex flex-col gap-3 font-black text-sm uppercase max-h-[85vh] overflow-y-auto">
                    <span className="text-xs font-mono text-sky-600">-- SUBSYSTEMS --</span>
                    {subsystems.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => handleSubsystemClick(s.id)}
                            className="p-2 border-2 border-slate-900 bg-sky-50 text-left font-bold text-xs"
                        >
                            {s.name}
                        </button>
                    ))}
                    <div className="border-t-2 border-slate-200 my-2" />
                    <button onClick={() => { setMobileOpen(false); handleNavigate('#gallery'); }} className="p-2 border-2 border-slate-900 bg-sky-50 text-left">Gallery</button>
                    <button onClick={() => { setMobileOpen(false); handleNavigate('#updates'); }} className="p-2 border-2 border-slate-900 bg-sky-50 text-left">Updates</button>
                    <button onClick={() => { setMobileOpen(false); handleNavigate('#story'); }} className="p-2 border-2 border-slate-900 bg-sky-50 text-left">Our Story</button>

                    {/* Mobile Contact Us Accordion */}
                    <div className="border-2 border-slate-900 bg-sky-50 p-2">
                        <button
                            onClick={() => setMobileContactOpen(!mobileContactOpen)}
                            className="w-full flex items-center justify-between font-black text-xs uppercase text-slate-900"
                        >
                            <span>Contact Us</span>
                            <span>{mobileContactOpen ? '▲' : '▼'}</span>
                        </button>

                        {mobileContactOpen && (
                            <div className="mt-3 flex flex-col gap-2 pt-2 border-t border-slate-300">
                                {socialLinks.map((item) => (
                                    <a
                                        key={item.name}
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => setMobileOpen(false)}
                                        className="p-2 bg-white border border-slate-900 flex items-center justify-between font-bold text-xs"
                                    >
                                        <div className="flex items-center gap-2">
                                            {item.icon}
                                            <span>{item.name}</span>
                                        </div>
                                        <span>↗</span>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    <a
                        href="https://forms.gle/6hHG6aXqrunnfj7V6"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMobileOpen(false)}
                        className="p-2 bg-amber-300 text-slate-900 border-2 border-slate-900 text-center flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#0f172a]"
                    >
                        <span>Join Team</span>
                        <span>↗</span>
                    </a>
                    <button onClick={() => { setMobileOpen(false); handleNavigate('#subscribe'); }} className="p-2 bg-sky-500 text-white border-2 border-slate-900 text-center">Sponsor Team</button>
                </div>
            )}
        </nav>
    );
}
