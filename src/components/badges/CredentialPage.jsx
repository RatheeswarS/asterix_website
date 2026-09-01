import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWebsiteData } from '../../context/WebsiteDataContext';
import { apiUrl } from '../../lib/api';
import {
    buildCredentials,
    credentialUrl,
    linkedInAddToProfileUrl,
    linkedInShareUrl,
    tenureEndYear
} from '../../lib/credentials';
import BadgeArtwork from './BadgeArtwork';
import teamLogo from '../../assets/Screenshot 2026-08-26 232320.png';

/**
 * One member's credential, as a stranger following a shared link sees it.
 *
 * Two sources, on purpose. The roster already in the browser renders the badge
 * immediately, because a page that spends a Render cold start on a blank screen
 * is a page nobody waits for. In parallel, `/api/credentials/:id` is asked the
 * same question independently, and its answer -- not the local copy -- is what
 * the verification strip reports. The local copy could have been edited in
 * devtools before a screenshot; the API's could not.
 *
 * The strip states exactly what was checked and no more. This says the team's
 * own roster still carries this person in this role. It is not a signed
 * attestation and does not pretend to be one.
 */

const VERIFY_STATE = {
    checking: {
        chip: 'bg-slate-200 text-slate-700 border-slate-400',
        label: '⟳ Checking the registry…'
    },
    verified: {
        chip: 'bg-emerald-400 text-slate-900 border-slate-900',
        label: '✓ Verified against the Team Asterix roster'
    },
    missing: {
        chip: 'bg-rose-300 text-slate-900 border-slate-900',
        label: '✕ Not on the current roster'
    },
    unreachable: {
        chip: 'bg-amber-300 text-slate-900 border-slate-900',
        label: '⚠ Registry unreachable — shown from cache, unverified'
    }
};

export default function CredentialPage({ credentialId: id, onBack, onOpenDirectory }) {
    const { siteData } = useWebsiteData();
    const [remote, setRemote] = useState(null);
    const [state, setState] = useState('checking');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        window.lenis?.scrollTo(0, { immediate: true });
    }, [id]);

    const local = useMemo(
        () => buildCredentials(siteData.subsystems).find((c) => c.id === id) || null,
        [siteData.subsystems, id]
    );

    const verify = useCallback(async () => {
        if (!id) return;
        setState('checking');
        try {
            const res = await fetch(apiUrl(`/api/credentials/${encodeURIComponent(id)}`));
            const body = await res.json().catch(() => null);
            if (res.ok && body?.verified) {
                setRemote(body);
                setState('verified');
            } else if (res.status === 404) {
                setRemote(null);
                setState('missing');
            } else {
                // 503 with the database down, or anything else the API could not
                // answer. That is not the same as "this person is not on the
                // roster", so it must not read as a failed verification.
                setRemote(null);
                setState('unreachable');
            }
        } catch {
            setRemote(null);
            setState('unreachable');
        }
    }, [id]);

    useEffect(() => { verify(); }, [verify]);

    const credential = remote?.credential || local;
    const url = credentialUrl(id);
    const issueYear = tenureEndYear(credential?.tenure);

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard access is refused on insecure origins and in some
            // browsers without a prompt. The URL is on screen and selectable.
        }
    };

    const verifyStyle = VERIFY_STATE[state];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-amber-400 selection:text-slate-900">

            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-4 border-slate-900 shadow-[0_4px_0px_#0f172a]">
                <div className="px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <img src={teamLogo} alt="Team Asterix" className="h-9 w-auto object-contain" />
                        <div className="hidden sm:block">
                            <span className="font-mono text-xs font-black uppercase text-amber-600 block leading-tight">
                                DIGITAL ENGINEERING CREDENTIAL
                            </span>
                            <span className="font-black text-sm uppercase text-slate-900 leading-tight">
                                TEAM ASTERIX · SAEINDIA BAJA
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={onOpenDirectory}
                            className="press hidden sm:block px-4 py-2 border-2 border-slate-900 bg-white hover:bg-slate-100 font-mono font-black text-xs uppercase shadow-[2px_2px_0px_#0f172a] cursor-pointer"
                        >
                            All badges
                        </button>
                        <button
                            onClick={onBack}
                            className="press px-4 py-2 border-2 border-slate-900 bg-sky-100 hover:bg-sky-500 hover:text-white font-mono font-black text-xs uppercase shadow-[2px_2px_0px_#0f172a] cursor-pointer"
                        >
                            ← Website
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-14 space-y-8">

                {!credential && state !== 'checking' && (
                    <div className="p-6 sm:p-8 bg-white border-4 border-rose-500 shadow-[8px_8px_0px_#f43f5e]">
                        <h1 className="text-2xl sm:text-3xl font-black uppercase text-slate-900 mb-2">
                            No credential carries that identifier
                        </h1>
                        <p className="text-sm font-bold text-slate-600 leading-relaxed mb-4">
                            Either the badge was retired when the roster changed, or the identifier in the
                            link is not one Team Asterix has issued. Nothing here is cached, so a badge that
                            has been withdrawn stops resolving straight away.
                        </p>
                        <code className="block font-mono text-xs text-slate-500 break-all mb-4">{id}</code>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={verify} className="press px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-mono font-black text-xs uppercase border-2 border-slate-900 cursor-pointer">
                                Check again
                            </button>
                            <button onClick={onOpenDirectory} className="press px-4 py-2 bg-white hover:bg-slate-100 font-mono font-black text-xs uppercase border-2 border-slate-900 cursor-pointer">
                                Browse all badges →
                            </button>
                        </div>
                    </div>
                )}

                {!credential && state === 'checking' && (
                    <p className="p-6 bg-white border-4 border-slate-900 font-mono text-sm font-bold text-slate-600">
                        Looking this credential up in the registry…
                        <span className="block mt-1 text-xs font-normal text-slate-500">
                            The API sleeps when idle, so a cold start can take up to a minute.
                        </span>
                    </p>
                )}

                {credential && (
                    <>
                        <BadgeArtwork credential={credential} size="hero" />

                        {/* Verification strip */}
                        <div className={`p-4 border-3 font-mono ${verifyStyle.chip}`}>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <span className="text-xs font-black uppercase tracking-wider">{verifyStyle.label}</span>
                                <button
                                    onClick={verify}
                                    className="press press-flat px-2.5 py-1 bg-white/80 hover:bg-white border-2 border-slate-900 text-slate-900 text-[10px] font-black uppercase cursor-pointer"
                                >
                                    Re-check
                                </button>
                            </div>
                            <p className="text-[11px] font-bold mt-2 leading-relaxed">
                                {state === 'verified' && (
                                    <>
                                        Checked {new Date(remote.checkedAt).toLocaleString()} against{' '}
                                        {remote.issuer.name}, {remote.issuer.institution}. This confirms the team&apos;s
                                        own roster still lists this person in this role — it is a record lookup,
                                        not a cryptographic attestation.
                                    </>
                                )}
                                {state === 'checking' && 'Asking the Team Asterix API whether this identifier is still on the roster.'}
                                {state === 'missing' && 'The registry has no active credential under this identifier.'}
                                {state === 'unreachable' && 'The badge below is rendered from the copy this browser already held. Treat it as unconfirmed until the registry answers.'}
                            </p>
                        </div>

                        {/* Accomplishments */}
                        <section className="p-6 sm:p-8 bg-white border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a]">
                            <h2 className="text-xl sm:text-2xl font-black uppercase text-slate-900 tracking-tight mb-1">
                                Verified engineering accomplishments
                            </h2>
                            <p className="font-mono text-[11px] font-bold text-slate-500 uppercase mb-5">
                                {credential.subsystemName}
                                {credential.tenure && ` · ${credential.tenure}`}
                            </p>

                            {credential.achievements.length > 0 ? (
                                <ul className="space-y-3">
                                    {credential.achievements.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 p-3.5 bg-slate-50 border-2 border-slate-900">
                                            <span className="text-sky-600 font-black text-base leading-none shrink-0">✦</span>
                                            <span className="text-sm font-bold text-slate-800 leading-relaxed">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="p-4 bg-slate-50 border-2 border-dashed border-slate-400 font-mono text-xs font-bold text-slate-500">
                                    {credential.bio || 'The subsystem leads have not written up this record yet.'}
                                </p>
                            )}
                        </section>

                        {/* Sharing */}
                        <section className="p-6 sm:p-8 bg-slate-900 text-white border-4 border-slate-900 shadow-[8px_8px_0px_#0284c7]">
                            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-1">
                                Put this on your résumé
                            </h2>
                            <p className="text-xs font-bold text-slate-400 leading-relaxed mb-5">
                                &ldquo;Add to profile&rdquo; opens LinkedIn&apos;s Licenses &amp; Certifications form with the
                                issuer, the identifier and this link already filled in.
                            </p>

                            <div className="flex flex-wrap gap-2.5 mb-5">
                                <a
                                    href={linkedInAddToProfileUrl({
                                        name: `${credential.role || 'Crew'} — Team Asterix`,
                                        id: credential.id,
                                        url,
                                        issueYear
                                    })}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="press px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-mono font-black text-xs uppercase border-2 border-white shadow-[3px_3px_0px_#0f172a] cursor-pointer no-underline"
                                >
                                    Add to LinkedIn profile ↗
                                </a>
                                <a
                                    href={linkedInShareUrl(url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="press px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-mono font-black text-xs uppercase border-2 border-slate-900 shadow-[3px_3px_0px_#0284c7] cursor-pointer no-underline"
                                >
                                    Share as a post ↗
                                </a>
                                <button
                                    onClick={copyLink}
                                    className="press px-5 py-2.5 bg-amber-300 hover:bg-amber-200 text-slate-900 font-mono font-black text-xs uppercase border-2 border-slate-900 shadow-[3px_3px_0px_#0284c7] cursor-pointer"
                                >
                                    {copied ? 'Link copied ✓' : 'Copy badge link'}
                                </button>
                            </div>

                            <div className="space-y-2">
                                <span className="font-mono text-[10px] font-black uppercase tracking-widest text-sky-400 block">
                                    Résumé line
                                </span>
                                <p className="p-3 bg-slate-800 border-2 border-slate-700 font-mono text-[11px] leading-relaxed text-slate-200 break-words">
                                    {credential.summary}
                                </p>
                                <span className="font-mono text-[10px] font-black uppercase tracking-widest text-sky-400 block pt-2">
                                    Verification link
                                </span>
                                <p className="p-3 bg-slate-800 border-2 border-slate-700 font-mono text-[11px] text-slate-200 break-all">
                                    {url}
                                </p>
                            </div>
                        </section>

                        <div className="flex flex-wrap gap-2">
                            <button onClick={onOpenDirectory} className="press px-4 py-2.5 bg-white hover:bg-slate-100 font-mono font-black text-xs uppercase border-3 border-slate-900 shadow-[2px_2px_0px_#0f172a] cursor-pointer">
                                ← All Team Asterix badges
                            </button>
                            <button onClick={onBack} className="press px-4 py-2.5 bg-white hover:bg-slate-100 font-mono font-black text-xs uppercase border-3 border-slate-900 shadow-[2px_2px_0px_#0f172a] cursor-pointer">
                                Back to the website
                            </button>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
