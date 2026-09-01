/**
 * Published results, per track.
 *
 * The server withholds `resultsBody` entirely until an admin publishes that
 * track, so an unpublished result is not merely hidden by this component -- it
 * never reaches the browser. That is what makes the "results after 20 September"
 * embargo hold rather than being a promise.
 */
export default function ResultsBoard({ tracks, resultsNote }) {
    const published = tracks.filter((t) => t.resultsPublished && t.resultsBody);

    return (
        <div className="space-y-6">
            {published.length === 0 ? (
                <div className="p-6 sm:p-8 bg-slate-800 border-3 border-slate-700 shadow-[6px_6px_0px_#0284c7]">
                    <h3 className="text-xl font-black uppercase text-white mb-2">No results published yet</h3>
                    <p className="text-sm font-bold text-slate-300 leading-relaxed">
                        {resultsNote || 'Results are published here once every track has concluded.'}
                    </p>
                </div>
            ) : (
                published.map((track) => (
                    <div
                        key={track.id}
                        className="p-6 sm:p-8 bg-slate-800 border-3 border-slate-700 shadow-[6px_6px_0px_#0284c7]"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-700">
                            <h3 className="text-xl font-black uppercase text-white">{track.name}</h3>
                            <span className="px-3 py-1 bg-amber-400 text-slate-900 font-mono font-black text-xs uppercase w-fit">
                                Published
                            </span>
                        </div>
                        <pre className="whitespace-pre-wrap font-sans text-sm font-bold text-slate-300 leading-relaxed">
                            {track.resultsBody}
                        </pre>
                    </div>
                ))
            )}

            {published.length > 0 && resultsNote && (
                <p className="font-mono text-[11px] font-bold text-slate-400">{resultsNote}</p>
            )}
        </div>
    );
}
