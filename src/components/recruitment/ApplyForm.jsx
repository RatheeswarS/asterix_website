import { useState } from 'react';
import { submitApplication, saveCredential } from '../../lib/recruitmentApi';
import { formatIstFull } from '../../lib/istTime';

/**
 * Application intake for one track.
 *
 * On success the candidate is handed a reference code and a token. The token is
 * the only thing that proves an application is theirs -- it is what stops a
 * rival submitting or withdrawing on their behalf -- and it is shown exactly
 * once, because the server stores only its bcrypt hash and genuinely cannot
 * recover it afterwards. The panel below says so plainly rather than leaving
 * someone to discover it later.
 */

const FIELDS = [
    { name: 'name', label: 'Full name', required: true, placeholder: 'As on your college record' },
    { name: 'email', label: 'College email', required: true, type: 'email', placeholder: 'you@psgitech.ac.in' },
    { name: 'rollNumber', label: 'Roll number', placeholder: '23XX0000' },
    { name: 'phone', label: 'Phone', placeholder: '10-digit mobile' },
    { name: 'department', label: 'Department', placeholder: 'e.g. Mechanical Engineering' },
    { name: 'year', label: 'Year of study', placeholder: '1st / 2nd / 3rd' }
];

const EMPTY = {
    name: '', email: '', rollNumber: '', phone: '', department: '', year: '', priorExperience: ''
};

function CopyRow({ label, value }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard blocked. The value is on screen to copy by hand.
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-black text-[11px] uppercase text-slate-500 w-28 shrink-0">{label}</span>
            <code className="flex-1 min-w-[12rem] px-3 py-2 bg-white border-2 border-slate-900 font-mono text-sm font-black text-slate-900 break-all">
                {value}
            </code>
            <button
                type="button"
                onClick={copy}
                className="press px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-mono font-black text-[11px] uppercase border-2 border-slate-900 cursor-pointer shrink-0"
            >
                {copied ? 'Copied ✓' : 'Copy'}
            </button>
        </div>
    );
}

export default function ApplyForm({ track, onApplied, now }) {
    const [form, setForm] = useState(EMPTY);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [issued, setIssued] = useState(null);
    const [acknowledged, setAcknowledged] = useState(false);

    const set = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            const result = await submitApplication({ ...form, track: track.id });
            saveCredential(result.refCode, result.token);
            setIssued(result);
            setForm(EMPTY);
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    if (issued) {
        return (
            <div className="p-6 sm:p-8 bg-amber-50 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a]">
                <span className="px-3 py-1 bg-emerald-400 border-2 border-slate-900 font-mono font-black text-[11px] uppercase inline-block mb-4">
                    ✓ Application received — {issued.trackName}
                </span>

                <h3 className="text-2xl font-black uppercase text-slate-900 mb-2">
                    Save these now
                </h3>
                <p className="text-sm font-bold text-slate-700 leading-relaxed mb-5">
                    Your access token is shown <span className="underline decoration-rose-500 decoration-2">once and never again</span>.
                    We store only a hash of it, so it cannot be re-sent or recovered. Together with your reference
                    code it is what lets you check your status and submit your work — and what stops anyone else
                    doing either in your name. Screenshot this or write it down before you leave the page.
                </p>

                <div className="space-y-3 mb-6">
                    <CopyRow label="Reference" value={issued.refCode} />
                    <CopyRow label="Token" value={issued.token} />
                </div>

                <label className="flex items-start gap-3 mb-5 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={acknowledged}
                        onChange={(e) => setAcknowledged(e.target.checked)}
                        className="mt-1 w-5 h-5 border-2 border-slate-900 accent-slate-900 cursor-pointer shrink-0"
                    />
                    <span className="text-xs font-bold text-slate-700">
                        I have saved my reference code and token somewhere I can find them again.
                    </span>
                </label>

                <button
                    type="button"
                    disabled={!acknowledged}
                    onClick={() => onApplied?.(issued)}
                    className={`press px-6 py-3 font-mono font-black text-xs uppercase border-3 border-slate-900 ${
                        acknowledged
                            ? 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer shadow-[4px_4px_0px_#0284c7]'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                >
                    Continue to my application →
                </button>
            </div>
        );
    }

    if (!track.applyOpen) {
        // "Not open" covers two opposite situations, and telling someone the
        // window "ran until" a date that has not arrived yet is worse than
        // saying nothing. Before the opening moment this is an invitation; after
        // the closing one it is a refusal.
        const opensAt = new Date(track.applyOpensAt).getTime();
        const notYetOpen = Number.isFinite(opensAt) && now < opensAt;

        if (notYetOpen) {
            return (
                <div className="p-6 bg-amber-50 border-4 border-slate-900 shadow-[6px_6px_0px_#f59e0b]">
                    <span className="px-2 py-1 bg-amber-300 border-2 border-slate-900 font-mono font-black text-[10px] uppercase inline-block mb-3">
                        Opening soon
                    </span>
                    <h3 className="text-xl font-black uppercase text-slate-900 mb-1">
                        Applications for {track.name} have not opened yet
                    </h3>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed">
                        They open {formatIstFull(track.applyOpensAt)} and close{' '}
                        {formatIstFull(track.applyClosesAt) || 'at a date still to be published'}.
                    </p>
                    <p className="text-xs font-bold text-slate-500 font-mono mt-2">
                        Come back after that and this form will be live.
                    </p>
                </div>
            );
        }

        return (
            <div className="p-6 bg-slate-100 border-4 border-slate-400 border-dashed">
                <h3 className="text-lg font-black uppercase text-slate-700 mb-1">
                    Applications are closed for {track.name}
                </h3>
                <p className="text-xs font-bold text-slate-500 font-mono">
                    The window ran until {formatIstFull(track.applyClosesAt) || 'an unpublished date'}.
                    Already applied? Use the status lookup below.
                </p>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8 bg-white border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] space-y-5"
        >
            <div>
                <h3 className="text-2xl font-black uppercase text-slate-900">
                    Apply — {track.name}
                </h3>
                <p className="text-xs font-bold text-slate-500 font-mono mt-1">
                    One application per person per cycle. Closes {formatIstFull(track.applyClosesAt)}.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FIELDS.map((field) => (
                    <div key={field.name}>
                        <label
                            htmlFor={`apply-${field.name}`}
                            className="block text-xs font-mono font-black uppercase text-slate-700 mb-1"
                        >
                            {field.label}{field.required && <span className="text-rose-600"> *</span>}
                        </label>
                        <input
                            id={`apply-${field.name}`}
                            type={field.type || 'text'}
                            required={field.required}
                            value={form[field.name]}
                            onChange={(e) => set(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 border-2 border-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-sky-400"
                        />
                    </div>
                ))}
            </div>

            <div>
                <label
                    htmlFor="apply-priorExperience"
                    className="block text-xs font-mono font-black uppercase text-slate-700 mb-1"
                >
                    Relevant experience
                </label>
                <textarea
                    id="apply-priorExperience"
                    rows={4}
                    value={form.priorExperience}
                    onChange={(e) => set('priorExperience', e.target.value)}
                    placeholder="Projects, coursework, tools you have used. Be specific; this is what the leads read first."
                    className="w-full px-3 py-2 border-2 border-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
            </div>

            {error && (
                <p role="alert" className="p-3 bg-rose-100 border-2 border-rose-500 font-mono text-xs font-bold text-rose-800">
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={busy}
                className={`press px-6 py-3.5 font-mono font-black text-xs uppercase border-3 border-slate-900 ${
                    busy
                        ? 'bg-slate-200 text-slate-500 cursor-wait'
                        : 'bg-amber-300 hover:bg-amber-400 text-slate-900 cursor-pointer shadow-[4px_4px_0px_#0284c7]'
                }`}
            >
                {busy ? 'Submitting…' : 'Submit application →'}
            </button>
        </form>
    );
}
