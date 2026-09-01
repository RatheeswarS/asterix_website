import { useState } from 'react';
import { submitWork } from '../../lib/recruitmentApi';
import { formatIstFull } from '../../lib/istTime';

/**
 * Submission for whichever phase is currently open.
 *
 * The button is enabled only when the server says a window is open, but the
 * server checks again on arrival regardless -- this component is a convenience,
 * not the enforcement. A candidate with a wrong system clock, or one posting
 * straight to the API, gets the same answer either way.
 *
 * Submissions are links rather than uploads: the backend's upload path accepts
 * images only and its disk does not survive a restart, so a pasted Drive or
 * GitHub URL is both simpler and more durable than a file we might lose.
 */
export default function SubmitPanel({ application, credential, track, onSubmitted }) {
    const [url, setUrl] = useState('');
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState('');

    const phase = application.openSubmissionPhase;
    const stage = (track?.stages || []).find((s) => s.submissionPhase === phase) || null;

    // Team tracks need a drawn team before anything can be filed against it.
    const needsTeam = application.teamBased && !application.team;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setDone('');
        setBusy(true);
        try {
            const result = await submitWork({
                refCode: credential.refCode,
                token: credential.token,
                phase,
                url,
                note
            });
            setDone(result.message);
            setUrl('');
            setNote('');
            onSubmitted?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    if (!phase || !stage) {
        return (
            <div className="p-5 bg-slate-100 border-3 border-slate-400 border-dashed">
                <h4 className="font-black uppercase text-sm text-slate-700 mb-1">Nothing to submit right now</h4>
                <p className="text-xs font-bold text-slate-500 font-mono">
                    {application.nextStage
                        ? `Next up: ${application.nextStage.label}, closing ${formatIstFull(application.nextStage.closesAt)}.`
                        : 'All stages for your track have closed.'}
                </p>
            </div>
        );
    }

    if (needsTeam) {
        return (
            <div className="p-5 bg-amber-50 border-3 border-amber-500">
                <h4 className="font-black uppercase text-sm text-slate-900 mb-1">Waiting on the team draw</h4>
                <p className="text-xs font-bold text-slate-600 font-mono">
                    {track.name} works in teams, and submissions are filed per team. You will be able to
                    submit as soon as the draw has run.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0284c7] space-y-4">
            <div>
                <span className="px-2 py-1 bg-emerald-400 border-2 border-slate-900 font-mono font-black text-[10px] uppercase inline-block mb-2">
                    Open now
                </span>
                <h4 className="text-lg font-black uppercase text-slate-900">{stage.label}</h4>
                <p className="text-xs font-mono font-bold text-slate-500 mt-0.5">
                    Closes {formatIstFull(stage.closesAt)}. Late submissions are rejected by the server.
                </p>
                {application.team && (
                    <p className="text-xs font-bold text-slate-600 mt-2">
                        Filing for <strong className="font-mono">{application.team.teamCode}</strong> — your
                        whole team sees this submission.
                    </p>
                )}
            </div>

            <div>
                <label htmlFor="submit-url" className="block text-xs font-mono font-black uppercase text-slate-700 mb-1">
                    Link to your work <span className="text-rose-600">*</span>
                </label>
                <input
                    id="submit-url"
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://drive.google.com/… or https://github.com/…"
                    className="w-full px-3 py-2 border-2 border-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                <p className="text-[11px] font-bold text-slate-500 mt-1">
                    Make sure the link is readable by anyone with it, or the leads cannot open your work.
                </p>
            </div>

            <div>
                <label htmlFor="submit-note" className="block text-xs font-mono font-black uppercase text-slate-700 mb-1">
                    Note for the reviewers
                </label>
                <textarea
                    id="submit-note"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Anything they should read first: what works, what does not, how to run it."
                    className="w-full px-3 py-2 border-2 border-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
            </div>

            {error && (
                <p role="alert" className="p-3 bg-rose-100 border-2 border-rose-500 font-mono text-xs font-bold text-rose-800">
                    {error}
                </p>
            )}
            {done && (
                <p role="status" className="p-3 bg-emerald-100 border-2 border-emerald-600 font-mono text-xs font-bold text-emerald-900">
                    {done}
                </p>
            )}

            <button
                type="submit"
                disabled={busy}
                className={`press px-6 py-3 font-mono font-black text-xs uppercase border-3 border-slate-900 ${
                    busy
                        ? 'bg-slate-200 text-slate-500 cursor-wait'
                        : 'bg-sky-500 hover:bg-sky-400 text-white cursor-pointer shadow-[3px_3px_0px_#0f172a]'
                }`}
            >
                {busy ? 'Submitting…' : 'Submit work →'}
            </button>

            <p className="text-[11px] font-bold text-slate-500">
                Resubmitting adds a new entry rather than replacing the old one, so you can never lose an
                earlier attempt. The most recent entry is the one reviewed.
            </p>
        </form>
    );
}
