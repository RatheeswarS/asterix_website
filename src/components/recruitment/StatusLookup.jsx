import { useState, useEffect, useCallback } from 'react';
import {
    lookupApplication,
    loadCredential,
    saveCredential,
    clearCredential
} from '../../lib/recruitmentApi';
import { formatIstFull } from '../../lib/istTime';
import SubmitPanel from './SubmitPanel';

/**
 * A candidate's own view of their application.
 *
 * Everything shown here is scoped to the holder of the reference code and
 * token: their own submissions, their own team, and the problem statement only
 * once they have earned it. No applicant can see another's record, and no
 * applicant on one track can reach another track's brief -- both are enforced
 * server-side, not by hiding UI.
 */

const STAGE_LABEL = {
    APPLIED: 'Applied',
    TEST_ABSENT: 'Absent from the written test',
    TEST_FAILED: 'Did not clear the written test',
    TEST_PASSED: 'Cleared the written test',
    TEAM_ASSIGNED: 'Team assigned',
    PHASE_1_SUBMITTED: 'Phase 1 submitted',
    PHASE_2_SUBMITTED: 'Phase 2 submitted',
    SOLUTION_SUBMITTED: 'Solution submitted',
    INTERVIEW: 'Shortlisted for interview',
    CONCLUDED: 'Process concluded'
};

const STATUS_STYLE = {
    ACTIVE: 'bg-emerald-400 text-slate-900',
    SELECTED: 'bg-sky-400 text-white',
    REJECTED: 'bg-slate-300 text-slate-700',
    WITHDRAWN: 'bg-slate-300 text-slate-700'
};

/** Renders the brief body. Deliberately plain text, not HTML — the body is
    admin-authored and rendering it as markup would be an injection surface. */
function BriefBody({ body }) {
    return (
        <pre className="whitespace-pre-wrap font-sans text-sm font-medium text-slate-800 leading-relaxed">
            {body}
        </pre>
    );
}

export default function StatusLookup({ tracks, initialCredential, onTrackDetected }) {
    const [refCode, setRefCode] = useState(initialCredential?.refCode || '');
    const [token, setToken] = useState(initialCredential?.token || '');
    const [credential, setCredential] = useState(initialCredential || null);
    const [application, setApplication] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async (code, secret, { persist = true } = {}) => {
        setBusy(true);
        setError('');
        try {
            const result = await lookupApplication(code, secret);
            setApplication(result);
            setCredential({ refCode: code, token: secret });
            if (persist) saveCredential(code, secret);
            onTrackDetected?.(result.track);
        } catch (err) {
            setError(err.message);
            setApplication(null);
        } finally {
            setBusy(false);
        }
    }, [onTrackDetected]);

    // A returning candidate whose browser still holds their credential goes
    // straight to their status instead of retyping a 32-character token.
    useEffect(() => {
        const stored = initialCredential || loadCredential();
        if (stored) {
            setRefCode(stored.refCode);
            setToken(stored.token);
            load(stored.refCode, stored.token, { persist: false });
        }
        // Intentionally runs once on mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        load(refCode.trim(), token.trim());
    };

    const handleForget = () => {
        clearCredential();
        setCredential(null);
        setApplication(null);
        setRefCode('');
        setToken('');
    };

    if (!application) {
        return (
            <form
                onSubmit={handleSubmit}
                className="p-6 sm:p-8 bg-white border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] space-y-4"
            >
                <div>
                    <h3 className="text-2xl font-black uppercase text-slate-900">Check your application</h3>
                    <p className="text-xs font-bold text-slate-500 font-mono mt-1">
                        Enter the reference code and token you were given when you applied.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="lookup-ref" className="block text-xs font-mono font-black uppercase text-slate-700 mb-1">
                            Reference code
                        </label>
                        <input
                            id="lookup-ref"
                            type="text"
                            required
                            value={refCode}
                            onChange={(e) => setRefCode(e.target.value)}
                            placeholder="ASX-SW-0417"
                            className="w-full px-3 py-2 border-2 border-slate-900 font-mono text-sm font-black uppercase focus:outline-none focus:ring-2 focus:ring-sky-400"
                        />
                    </div>
                    <div>
                        <label htmlFor="lookup-token" className="block text-xs font-mono font-black uppercase text-slate-700 mb-1">
                            Access token
                        </label>
                        <input
                            id="lookup-token"
                            type="text"
                            required
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="The one-time token from your application"
                            className="w-full px-3 py-2 border-2 border-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-400"
                        />
                    </div>
                </div>

                {error && (
                    <p role="alert" className="p-3 bg-rose-100 border-2 border-rose-500 font-mono text-xs font-bold text-rose-800">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={busy}
                    className={`press px-6 py-3 font-mono font-black text-xs uppercase border-3 border-slate-900 ${
                        busy
                            ? 'bg-slate-200 text-slate-500 cursor-wait'
                            : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-[4px_4px_0px_#0284c7]'
                    }`}
                >
                    {busy ? 'Checking…' : 'Open my application →'}
                </button>

                <p className="text-[11px] font-bold text-slate-500">
                    Lost your token? It cannot be recovered — only a hash of it is stored. Email
                    asterix.psgitech@gmail.com from the address you applied with and the leads will re-issue it.
                </p>
            </form>
        );
    }

    const track = tracks.find((t) => t.id === application.track);

    return (
        <div className="space-y-6">
            {/* Header card */}
            <div className="p-6 sm:p-8 bg-slate-900 text-white border-4 border-slate-900 shadow-[8px_8px_0px_#0284c7]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <span className="font-mono font-black text-[11px] uppercase text-sky-400 tracking-widest block mb-1">
                            {application.trackName}
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-black uppercase leading-tight">
                            {application.name}
                        </h3>
                        <p className="font-mono text-xs font-bold text-slate-400 mt-1">
                            {application.refCode} · applied {formatIstFull(application.appliedAt)}
                        </p>
                    </div>
                    <span className={`px-3 py-1.5 border-2 border-slate-900 font-mono font-black text-[11px] uppercase ${STATUS_STYLE[application.status] || 'bg-slate-300 text-slate-900'}`}>
                        {application.status}
                    </span>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-700 grid gap-4 sm:grid-cols-2 font-mono text-xs">
                    <div>
                        <span className="block font-black uppercase text-slate-500 mb-0.5">Current stage</span>
                        <span className="font-bold text-white">
                            {STAGE_LABEL[application.stage] || application.stage}
                        </span>
                    </div>
                    <div>
                        <span className="block font-black uppercase text-slate-500 mb-0.5">Next deadline</span>
                        <span className="font-bold text-white">
                            {application.nextStage
                                ? `${application.nextStage.label} · ${formatIstFull(application.nextStage.closesAt)}`
                                : 'Nothing further scheduled'}
                        </span>
                    </div>
                    {application.writtenTest && (
                        <div>
                            <span className="block font-black uppercase text-slate-500 mb-0.5">Written test</span>
                            <span className="font-bold text-white">
                                {application.writtenTest.attended
                                    ? (application.writtenTest.passed ? 'Cleared' : 'Not cleared')
                                    : 'Not yet recorded'}
                            </span>
                        </div>
                    )}
                    {application.team && (
                        <div>
                            <span className="block font-black uppercase text-slate-500 mb-0.5">Team</span>
                            <span className="font-bold text-white">{application.team.teamCode}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Team roster and the draw's audit trail */}
            {application.team && (
                <div className="p-5 sm:p-6 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a]">
                    <h4 className="text-lg font-black uppercase text-slate-900 mb-1">
                        {application.team.teamCode}
                    </h4>
                    <p className="text-xs font-bold text-slate-500 font-mono mb-4">
                        Drawn at random {formatIstFull(application.team.drawnAt)}.
                    </p>
                    <ul className="grid gap-2 sm:grid-cols-2 mb-4">
                        {application.team.members.map((m) => (
                            <li
                                key={m.refCode}
                                className={`px-3 py-2 border-2 font-mono text-xs font-bold ${
                                    m.refCode === application.refCode
                                        ? 'border-slate-900 bg-amber-200 text-slate-900'
                                        : 'border-slate-300 bg-slate-50 text-slate-700'
                                }`}
                            >
                                {m.name} <span className="text-slate-500">· {m.refCode}</span>
                                {m.refCode === application.refCode && <span className="text-slate-900"> (you)</span>}
                            </li>
                        ))}
                    </ul>
                    <details className="border-t-2 border-slate-200 pt-3">
                        <summary className="font-mono font-black text-[11px] uppercase text-slate-500 cursor-pointer">
                            How this draw can be verified
                        </summary>
                        <p className="mt-2 text-xs font-medium text-slate-600 leading-relaxed">
                            The shuffle is seeded and deterministic. Re-running it with the seed and roster
                            below reproduces exactly these teams, so the draw can be checked rather than
                            taken on trust.
                        </p>
                        <dl className="mt-2 font-mono text-[11px] space-y-1">
                            <div className="flex gap-2">
                                <dt className="font-black uppercase text-slate-400 w-20 shrink-0">Seed</dt>
                                <dd className="text-slate-700 break-all">{application.team.drawSeed}</dd>
                            </div>
                            <div className="flex gap-2">
                                <dt className="font-black uppercase text-slate-400 w-20 shrink-0">Roster</dt>
                                <dd className="text-slate-700 break-all">{application.team.rosterHash}</dd>
                            </div>
                        </dl>
                    </details>
                </div>
            )}

            {/* Problem statement, if earned */}
            <div className="p-5 sm:p-6 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a]">
                <h4 className="text-lg font-black uppercase text-slate-900 mb-3">Your problem statement</h4>
                {application.brief ? (
                    <>
                        <h5 className="text-base font-black text-slate-900 mb-1">{application.brief.title}</h5>
                        <p className="text-sm font-bold text-slate-700 mb-4">{application.brief.description}</p>
                        <div className="p-4 bg-slate-50 border-2 border-slate-900 mb-4">
                            <BriefBody body={application.brief.bodyMarkdown} />
                        </div>
                        {application.brief.deliverables && (
                            <div className="p-3 bg-sky-50 border-2 border-sky-600">
                                <span className="block font-mono font-black text-[11px] uppercase text-sky-800 mb-1">
                                    Expected deliverables
                                </span>
                                <p className="text-xs font-mono text-slate-700">{application.brief.deliverables}</p>
                            </div>
                        )}
                        {application.brief.fileUrl && (
                            <a
                                href={application.brief.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="press inline-block mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-mono font-black text-[11px] uppercase border-2 border-slate-900 cursor-pointer"
                            >
                                Download the full brief ↗
                            </a>
                        )}
                    </>
                ) : (
                    <div className="p-4 bg-slate-100 border-2 border-dashed border-slate-400">
                        <p className="font-mono text-xs font-bold text-slate-600">
                            🔒 {application.briefLockedReason}
                        </p>
                    </div>
                )}
            </div>

            {/* Submission */}
            <SubmitPanel
                application={application}
                credential={credential}
                track={track}
                onSubmitted={() => load(credential.refCode, credential.token, { persist: false })}
            />

            {/* Own submission history */}
            {(application.submissions.length > 0 || application.team?.submissions?.length > 0) && (
                <div className="p-5 sm:p-6 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a]">
                    <h4 className="text-lg font-black uppercase text-slate-900 mb-3">Submission history</h4>
                    <ul className="space-y-2">
                        {[...application.submissions, ...(application.team?.submissions || [])]
                            .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                            .map((s, i) => (
                                <li key={`${s.phase}-${s.submittedAt}-${i}`} className="p-3 border-2 border-slate-300 bg-slate-50">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className="px-2 py-0.5 bg-slate-900 text-white font-mono font-black text-[10px] uppercase">
                                            {s.phase}
                                        </span>
                                        <span className="font-mono text-[11px] font-bold text-slate-500">
                                            {formatIstFull(s.submittedAt)}
                                        </span>
                                        {i === 0 && (
                                            <span className="px-2 py-0.5 bg-emerald-400 text-slate-900 font-mono font-black text-[10px] uppercase">
                                                Latest
                                            </span>
                                        )}
                                    </div>
                                    <a
                                        href={s.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-mono text-xs text-sky-700 underline break-all"
                                    >
                                        {s.url}
                                    </a>
                                    {s.note && <p className="mt-1 text-xs font-medium text-slate-600">{s.note}</p>}
                                </li>
                            ))}
                    </ul>
                </div>
            )}

            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={() => load(credential.refCode, credential.token, { persist: false })}
                    disabled={busy}
                    className="press px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 font-mono font-black text-[11px] uppercase border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] cursor-pointer"
                >
                    {busy ? 'Refreshing…' : 'Refresh'}
                </button>
                <button
                    type="button"
                    onClick={handleForget}
                    className="press px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 font-mono font-black text-[11px] uppercase border-2 border-rose-600 shadow-[2px_2px_0px_#be123c] cursor-pointer"
                >
                    Forget me on this device
                </button>
            </div>
        </div>
    );
}
