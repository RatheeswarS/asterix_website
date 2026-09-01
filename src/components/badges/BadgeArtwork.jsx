import { apiUrl } from '../../lib/api';
import { framingStyle } from '../../lib/imageFraming';

/**
 * The badge itself: one member, rendered in the site's own language of hard
 * borders, offset shadows and mono capitals rather than in the rounded pastel
 * that credential platforms default to. It is the same object at both sizes --
 * a tile in the directory and the hero of a shared page -- so a badge someone
 * screenshots from a listing matches the page it links to.
 */

const STATUS = {
    Alumni: {
        chip: 'bg-amber-300 text-slate-900',
        label: '★ ALUMNI',
        shadow: 'shadow-[8px_8px_0px_#f59e0b]'
    },
    active: {
        chip: 'bg-sky-400 text-white',
        label: '● ACTIVE CREW',
        shadow: 'shadow-[8px_8px_0px_#0284c7]'
    }
};

export default function BadgeArtwork({ credential, size = 'tile' }) {
    const status = credential.status === 'Alumni' ? STATUS.Alumni : STATUS.active;
    const photo = apiUrl(credential.photo);
    const large = size === 'hero';

    return (
        <div className={`bg-white border-4 border-slate-900 ${status.shadow} overflow-hidden`}>
            <div className={`h-3 ${credential.subsystemColor || 'bg-sky-400'} border-b-4 border-slate-900`} />

            <div className={`flex gap-4 ${large ? 'p-6 sm:p-8' : 'p-4'}`}>
                <div
                    className={`shrink-0 border-3 border-slate-900 bg-slate-100 overflow-hidden shadow-[3px_3px_0px_#0f172a] ${
                        large ? 'w-28 h-28 sm:w-36 sm:h-36' : 'w-20 h-20'
                    }`}
                >
                    {photo ? (
                        <img
                            src={photo}
                            alt={credential.name}
                            style={framingStyle(credential.photoFit, credential.photoPosition)}
                            className="w-full h-full"
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-900 text-white font-mono font-black flex items-center justify-center text-2xl">
                            {credential.initials}
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <span className={`px-2 py-0.5 border-2 border-slate-900 font-mono font-black text-[10px] uppercase ${status.chip}`}>
                            {status.label}
                        </span>
                        <span className="px-2 py-0.5 border-2 border-slate-900 bg-slate-900 text-white font-mono font-black text-[10px] uppercase">
                            {credential.badge}
                        </span>
                    </div>

                    <h3 className={`font-black uppercase text-slate-900 leading-none tracking-tight ${large ? 'text-3xl sm:text-5xl' : 'text-lg'}`}>
                        {credential.name}
                    </h3>
                    <p className={`font-mono font-bold text-sky-600 mt-1 ${large ? 'text-sm sm:text-base' : 'text-[11px]'}`}>
                        {credential.role}
                    </p>
                    <p className={`font-mono font-bold text-slate-500 uppercase mt-1 ${large ? 'text-[11px]' : 'text-[10px]'}`}>
                        {credential.subsystemName}
                        {credential.tenure && <span className="text-slate-400"> · {credential.tenure}</span>}
                    </p>

                    {large && credential.headline && (
                        <p className="text-sm sm:text-base font-bold text-slate-800 leading-relaxed mt-3 border-l-4 border-sky-400 pl-3">
                            {credential.headline}
                        </p>
                    )}
                </div>
            </div>

            <div className="px-4 py-2 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 font-mono text-[9px] font-black uppercase tracking-widest">
                <span>Team Asterix · SAEINDIA BAJA</span>
                <span className="text-sky-400 break-all">{credential.id}</span>
            </div>
        </div>
    );
}
