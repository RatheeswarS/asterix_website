import { useState } from 'react';
import { useWebsiteData } from '../context/WebsiteDataContext';

export default function FreshersRecruitmentPopup({ onOpenRecruitment }) {
    const { siteData } = useWebsiteData();
    const freshers = siteData.recruitment?.freshers;
    const [isVisible, setIsVisible] = useState(true);

    if (!freshers?.enabled || !isVisible) return null;

    return (
        <aside className="fixed bottom-4 right-4 z-[70] w-[min(calc(100vw-2rem),18rem)] border-3 border-slate-900 bg-amber-300 p-3 text-slate-900 shadow-[5px_5px_0px_#0f172a] sm:bottom-6 sm:right-6 sm:p-4" aria-labelledby="freshers-popup-title">
            <div onClick={onOpenRecruitment} className="cursor-pointer">
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        setIsVisible(false);
                    }}
                    aria-label="Close freshers recruitment announcement"
                    className="absolute right-2 top-2 border-2 border-slate-900 bg-white px-1.5 py-0.5 font-mono text-[10px] font-black text-slate-900 hover:bg-slate-100"
                >
                    X
                </button>
                <span className="mb-3 inline-block border-2 border-slate-900 bg-slate-900 px-2.5 py-1 font-mono text-[11px] font-black uppercase tracking-widest text-amber-300">
                    {freshers.badge}
                </span>
                <h2 id="freshers-popup-title" className="max-w-lg pr-7 text-xl font-black uppercase leading-none text-slate-900 sm:text-2xl">
                    {freshers.title}
                </h2>
                {freshers.description && (
                    <p className="mt-3 max-w-lg text-xs font-bold leading-relaxed text-slate-800 sm:text-sm">
                        {freshers.description}
                    </p>
                )}
                <button
                    type="button"
                    onClick={onOpenRecruitment}
                    className="press mt-4 border-2 border-slate-900 bg-white px-3 py-2 font-mono text-[10px] font-black uppercase text-slate-900 shadow-[3px_3px_0px_#0284c7] hover:bg-sky-100"
                >
                    {freshers.ctaLabel || 'View recruitment details'} <span aria-hidden="true">↗</span>
                </button>
            </div>
        </aside>
    );
}