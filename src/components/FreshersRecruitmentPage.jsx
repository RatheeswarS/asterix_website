import { useWebsiteData } from '../context/WebsiteDataContext';
import { formatIstFull } from '../lib/istTime';

export default function FreshersRecruitmentPage({ onBack }) {
    const { siteData } = useWebsiteData();
    const freshers = siteData.recruitment?.freshers || {};
    const details = Array.isArray(freshers.details) ? freshers.details : [];
    const timeline = Array.isArray(freshers.timeline) ? freshers.timeline : [];

    return (
        <div className="min-h-screen bg-slate-950 font-sans text-white selection:bg-amber-300 selection:text-slate-900">
            <header className="sticky top-0 z-50 border-b-4 border-slate-900 bg-white/95 px-4 py-3.5 text-slate-900 shadow-[0_4px_0px_#0f172a] backdrop-blur-md sm:px-8">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
                    <div>
                        <span className="font-mono text-xs font-black uppercase tracking-widest text-sky-600">Team Asterix</span>
                        <strong className="block text-sm font-black uppercase">First Year Freshers Recruitment</strong>
                    </div>
                    <button type="button" onClick={onBack} className="press border-2 border-slate-900 bg-amber-300 px-4 py-2 font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#0f172a] hover:bg-amber-400">
                        ← Main Website
                    </button>
                </div>
            </header>

            <main>
                <section className="border-b-4 border-slate-900 bg-amber-300 px-4 py-16 text-slate-900 sm:px-8 sm:py-24">
                    <div className="mx-auto max-w-6xl">
                        <span className="inline-block border-2 border-slate-900 bg-slate-900 px-3 py-1 font-mono text-xs font-black uppercase tracking-widest text-amber-300">
                            {freshers.badge || 'FRESHERS RECRUITMENT'}
                        </span>
                        <h1 className="mt-5 max-w-5xl text-4xl font-black uppercase leading-[0.9] tracking-tight sm:text-7xl">
                            {freshers.title || 'Freshers recruitment'}
                        </h1>
                        {freshers.description && <p className="mt-6 max-w-3xl text-base font-bold leading-relaxed sm:text-xl">{freshers.description}</p>}
                        {freshers.applyUrl && (
                            <a href={freshers.applyUrl} target="_blank" rel="noreferrer" className="press mt-8 inline-flex border-2 border-slate-900 bg-white px-5 py-3 font-mono text-xs font-black uppercase text-slate-900 no-underline shadow-[4px_4px_0px_#0284c7] hover:bg-sky-100">
                                {freshers.ctaLabel || 'Apply for freshers recruitment'} ↗
                            </a>
                        )}
                        {freshers.posterUrl && (
                            <div className="mt-10 max-w-xl overflow-hidden border-4 border-slate-900 bg-white shadow-[8px_8px_0px_#0284c7]">
                                <img src={freshers.posterUrl} alt={freshers.badge || 'Freshers recruitment poster'} className="max-h-[32rem] w-full object-cover" style={{ objectPosition: freshers.posterPosition || '50% 50%' }} />
                            </div>
                        )}
                    </div>
                </section>

                {timeline.length > 0 && (
                    <section className="border-b-4 border-slate-900 bg-sky-100 px-4 py-12 text-slate-900 sm:px-8 sm:py-16">
                        <div className="mx-auto max-w-6xl">
                            <span className="font-mono text-xs font-black uppercase tracking-widest text-sky-700">02 / What happens next</span>
                            <h2 className="mt-2 text-3xl font-black uppercase sm:text-5xl">Freshers timeline</h2>
                            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                                {timeline.map((item, index) => (
                                    <article key={item.id || index} className="border-4 border-slate-900 bg-white p-5 shadow-[5px_5px_0px_#0f172a]">
                                        <span className="font-mono text-xs font-black text-sky-600">STAGE {String(index + 1).padStart(2, '0')}</span>
                                        <h3 className="mt-2 text-xl font-black uppercase">{item.label || 'Timeline stage'}</h3>
                                        {item.date && <p className="mt-2 font-mono text-xs font-black uppercase text-amber-600">{formatIstFull(item.date)}</p>}
                                        {item.detail && <p className="mt-3 text-sm font-bold leading-relaxed text-slate-600">{item.detail}</p>}
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                <section className="border-b-4 border-slate-900 bg-slate-100 px-4 py-12 text-slate-900 sm:px-8 sm:py-16">
                    <div className="mx-auto max-w-6xl">
                        <span className="font-mono text-xs font-black uppercase tracking-widest text-sky-600">01 / Recruitment briefing</span>
                        <h2 className="mt-2 text-3xl font-black uppercase sm:text-5xl">Start your build season</h2>
                        {details.length > 0 ? (
                            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
                                {details.map((detail, index) => (
                                    <article key={detail.id || index} className="border-4 border-slate-900 bg-white p-5 shadow-[6px_6px_0px_#0f172a]">
                                        <span className="font-mono text-xs font-black text-sky-600">0{index + 1}</span>
                                        <h3 className="mt-2 text-xl font-black uppercase">{detail.title || 'Recruitment detail'}</h3>
                                        {detail.body && <p className="mt-3 text-sm font-bold leading-relaxed text-slate-600">{detail.body}</p>}
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-6 max-w-2xl text-sm font-bold text-slate-600">Freshers recruitment details will be published here shortly.</p>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}