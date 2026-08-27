import teamLogo from '../assets/Screenshot 2026-08-26 232320.png';

export default function CyberFooter() {
    return (
        <footer className="bg-white border-t-4 border-slate-900 text-slate-900 py-16 px-4 sm:px-8 relative z-10 select-none">
            <div className="max-w-7xl mx-auto">

                <div data-assemble="stagger" className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b-3 border-slate-900">

                    {/* Brand & Direct Contact (Cyberbites Style) */}
                    <div className="md:col-span-2 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <img
                                src={teamLogo}
                                alt="Asterix Racing"
                                className="h-9 sm:h-10 w-auto object-contain"
                            />
                        </div>

                        <p className="text-xs text-slate-600 font-bold max-w-sm leading-relaxed">
                            Official collegiate off-road engineering team competing in the SAEINDIA National BAJA Series.
                        </p>

                        <div className="flex flex-col gap-2 pt-2 text-xs font-mono font-bold text-slate-700">
                            <a href="mailto:contact@teamasterix.org" className="flex items-center gap-2 hover:text-sky-600">
                                <span className="p-1 bg-sky-100 border border-slate-900">✉</span>
                                <span>asterix.psgitech@gmail.com</span>
                            </a>
                            <div className="flex items-center gap-2">
                                <span className="p-1 bg-sky-100 border border-slate-900">📍</span>
                                <span>PSG iTech, Neelambur, Coimbatore, Tamil Nadu</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="p-1 bg-sky-100 border border-slate-900">⚡</span>
                                <span>Ratheeswar • Software & Perception Lead</span>
                            </div>
                        </div>
                    </div>

                    {/* Column 1: The Machine */}
                    <div>
                        <span className="text-xs font-black font-mono text-sky-600 uppercase block mb-4">
                            THE MACHINE
                        </span>
                        <div className="flex flex-col gap-2.5 text-xs font-bold text-slate-700">
                            <a href="#squad" className="hover:text-sky-600 transition-colors">4130 Spaceframe</a>
                            <a href="#squad" className="hover:text-sky-600 transition-colors">FOX Air Dampers</a>
                            <a href="#squad" className="hover:text-sky-600 transition-colors">CVT Drivetrain</a>
                            <a href="#squad" className="hover:text-sky-600 transition-colors">ATV Lug Tires</a>
                        </div>
                    </div>

                    {/* Column 2: The Squad */}
                    <div>
                        <span className="text-xs font-black font-mono text-sky-600 uppercase block mb-4">
                            THE SQUAD
                        </span>
                        <div className="flex flex-col gap-2.5 text-xs font-bold text-slate-700">
                            <a href="#squad" className="hover:text-sky-600 transition-colors">Software & Perception</a>
                            <a href="#squad" className="hover:text-sky-600 transition-colors">Powertrain</a>
                            <a href="#squad" className="hover:text-sky-600 transition-colors">Drive By Wire</a>
                            <a href="#squad" className="hover:text-sky-600 transition-colors">Brake by wire</a>
                            <a href="#squad" className="hover:text-sky-600 transition-colors">Leads</a>
                        </div>
                    </div>

                    {/* Column 3: Gallery & Story */}
                    <div>
                        <span className="text-xs font-black font-mono text-sky-600 uppercase block mb-4">
                            CREW & LOGS
                        </span>
                        <div className="flex flex-col gap-2.5 text-xs font-bold text-slate-700">
                            <a href="#gallery" className="hover:text-sky-600 transition-colors">Photo Gallery</a>
                            <a href="#updates" className="hover:text-sky-600 transition-colors">Team Updates</a>
                            <a href="#story" className="hover:text-sky-600 transition-colors">Our Story</a>
                            <a href="#subscribe" className="hover:text-sky-600 transition-colors">Sponsorship</a>
                            <a href="#hero" className="hover:text-sky-600 transition-colors">Back to Top ↑</a>
                        </div>
                    </div>

                </div>

                {/* Bottom Row with Social Pop Buttons */}
                <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="text-xs font-mono font-black text-slate-500 uppercase">
                        © 2026 TEAM ASTERIX • ALL RIGHTS RESERVED • BAJA SAEINDIA
                    </div>

                    {/* Social Pop Buttons (Cyberbites Style) */}
                    <div className="flex items-center gap-3">
                        {[
                            { name: 'INSTAGRAM', url: 'https://www.instagram.com/asterix_itech/' },
                            { name: 'LINKEDIN', url: 'https://www.linkedin.com/company/teamasterix/' },
                            { name: 'GITHUB', url: 'https://github.com/Team-Asterix264016/' }
                        ].map((net) => (
                            <a
                                key={net.name}
                                href={net.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-1.5 bg-sky-50 border-2 border-slate-900 text-[10px] font-black uppercase text-slate-900 shadow-[2px_2px_0px_#0f172a] hover:bg-sky-500 hover:text-white hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#0f172a] transition-all cursor-pointer"
                            >
                                {net.name}
                            </a>
                        ))}
                    </div>
                </div>
                <div className="pt-6 border-t border-slate-200 mt-6 flex justify-center items-center text-center w-full">
                    <p className="text-xs sm:text-sm font-mono font-bold text-slate-600 flex items-center justify-center gap-1.5">
                        <span>Crafted with</span>
                        <span className="text-sky-500 text-sm inline-block" aria-label="blue heart">💙</span>
                        <span>by Ratheeswar(Software Lead)</span>
                    </p>
                </div>

            </div>
        </footer>
    );
}
