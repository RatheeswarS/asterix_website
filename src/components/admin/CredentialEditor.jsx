import { useState } from 'react';
import { credentialId, credentialOf, credentialSummary, credentialUrl } from '../../lib/credentials';

/**
 * Per-member editor for the digital engineering credential.
 *
 * Collapsed by default. The roster grid is already dense, and most edits to a
 * member are a name or a photo -- the credential is written once, when someone
 * finishes a season, and then left alone.
 */
export default function CredentialEditor({ member, subsystem, onPatch }) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const cred = credentialOf(member);
    const id = credentialId(subsystem?.id, member?.name);
    const url = id ? credentialUrl(id) : '';

    const patchCredential = (fields) => onPatch({ credential: { ...cred, ...fields } });

    const setAchievement = (index, text) => {
        const next = [...cred.achievements];
        next[index] = text;
        patchCredential({ achievements: next });
    };

    const removeAchievement = (index) =>
        patchCredential({ achievements: cred.achievements.filter((_, i) => i !== index) });

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard access can be refused outright (insecure origin, or a
            // browser that gates it behind a permission). The link is on screen
            // and selectable, so there is nothing to recover from.
        }
    };

    return (
        <div className="border-2 border-slate-900 bg-amber-50/70">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-left cursor-pointer"
            >
                <span className="font-mono text-[10px] font-black uppercase text-slate-800">
                    🎖 Engineering Credential
                    {!cred.issued && <span className="ml-1.5 text-rose-600">· withheld</span>}
                    {cred.issued && cred.achievements.length > 0 && (
                        <span className="ml-1.5 text-emerald-700">· {cred.achievements.length} listed</span>
                    )}
                </span>
                <span className="font-mono text-[10px] font-black text-slate-500">{open ? '▲' : '▼'}</span>
            </button>

            {open && (
                <div className="px-2.5 pb-2.5 space-y-2 border-t-2 border-slate-900 pt-2.5">
                    <label className="flex items-center gap-2 font-mono text-[10px] font-black uppercase text-slate-700 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={cred.issued}
                            onChange={(e) => patchCredential({ issued: e.target.checked })}
                            className="w-3.5 h-3.5 border-2 border-slate-900 accent-slate-900 cursor-pointer"
                        />
                        Publish a credential page for this member
                    </label>

                    <div>
                        <span className="block font-mono text-[9px] font-black uppercase text-slate-500 mb-0.5">
                            Tenure
                        </span>
                        <input
                            type="text"
                            value={cred.tenure}
                            onChange={(e) => patchCredential({ tenure: e.target.value })}
                            placeholder="2024 – 2026"
                            className="w-full font-mono text-[11px] border-2 border-slate-300 px-2 py-1 bg-white focus:outline-none focus:border-slate-900"
                        />
                    </div>

                    <div>
                        <span className="block font-mono text-[9px] font-black uppercase text-slate-500 mb-0.5">
                            Headline accomplishment
                        </span>
                        <input
                            type="text"
                            value={cred.headline}
                            onChange={(e) => patchCredential({ headline: e.target.value })}
                            placeholder="Architected ROS 2 Stanley Lateral Controller"
                            className="w-full font-mono text-[11px] border-2 border-slate-300 px-2 py-1 bg-white focus:outline-none focus:border-slate-900"
                        />
                    </div>

                    <div>
                        <span className="block font-mono text-[9px] font-black uppercase text-slate-500 mb-1">
                            Verified engineering accomplishments
                        </span>
                        <div className="space-y-1.5">
                            {cred.achievements.map((item, i) => (
                                <div key={i} className="flex items-start gap-1.5">
                                    <textarea
                                        rows={2}
                                        value={item}
                                        onChange={(e) => setAchievement(i, e.target.value)}
                                        placeholder="One shipped piece of engineering, stated concretely."
                                        className="flex-1 min-w-0 font-mono text-[11px] border-2 border-slate-300 px-2 py-1 bg-white focus:outline-none focus:border-slate-900"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeAchievement(i)}
                                        aria-label="Remove accomplishment"
                                        className="press press-flat px-1.5 py-1 bg-rose-50 hover:bg-rose-100 border-2 border-slate-900 text-rose-700 font-mono text-[10px] font-black cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => patchCredential({ achievements: [...cred.achievements, ''] })}
                            className="press press-flat mt-1.5 px-2 py-1 bg-white hover:bg-slate-100 border-2 border-slate-900 font-mono text-[10px] font-black uppercase cursor-pointer"
                        >
                            + Add accomplishment
                        </button>
                    </div>

                    <div className="pt-2 border-t border-slate-300 space-y-1">
                        <span className="block font-mono text-[9px] font-black uppercase text-slate-500">
                            Reads as
                        </span>
                        <p className="font-mono text-[11px] font-bold text-slate-800 leading-snug">
                            {credentialSummary(member, subsystem)}
                        </p>
                        <span className="block font-mono text-[9px] font-black uppercase text-slate-500 pt-1">
                            Credential ID
                        </span>
                        <code className="block font-mono text-[10px] text-slate-700 break-all">{id || '—'}</code>
                        {url && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="press press-flat px-2 py-1 bg-white hover:bg-slate-100 border-2 border-slate-900 font-mono text-[10px] font-black uppercase cursor-pointer"
                                >
                                    Open badge ↗
                                </a>
                                <button
                                    type="button"
                                    onClick={copyLink}
                                    className="press press-flat px-2 py-1 bg-white hover:bg-slate-100 border-2 border-slate-900 font-mono text-[10px] font-black uppercase cursor-pointer"
                                >
                                    {copied ? 'Copied ✓' : 'Copy link'}
                                </button>
                            </div>
                        )}
                        <p className="font-mono text-[9px] font-bold text-slate-500 leading-relaxed pt-1">
                            The ID is derived from the subsystem and the spelling of the name. Renaming a
                            member issues a new one and retires the old link.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
