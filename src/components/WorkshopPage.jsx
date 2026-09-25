import { useRef, useState } from 'react';
import { apiUrl } from '../lib/api';
import { useWebsiteData } from '../context/WebsiteDataContext';
/* Shared with the backend so the page and the server can never disagree on
   what a package includes or costs. The server still looks the price up on
   its own side when it creates the order; this import is for display only. */
import {
    WORKSHOP_TRACKS,
    WORKSHOP_PACKAGES,
    isPriced
} from '../../server/src/config/workshopPackages.js';

const TRACK_ORDER = ['software', 'powertrain'];
const RAZORPAY_CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Payments are paused for now: the Pay button renders disabled. Flip to true to reopen.
const PAYMENTS_ENABLED = false;

const EMPTY_FORM = {
    name: '',
    rollNo: '',
    department: '',
    year: '',
    email: '',
    phone: '',
    package: ''
};

const FIELD_LABELS = {
    name: 'Full name',
    rollNo: 'Registered number',
    department: 'Department',
    year: 'Year',
    email: 'Email ID',
    phone: 'Phone',
    package: 'Your choice'
};

function inputClass(hasError) {
    return `w-full p-3 border-2 font-mono text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 ${
        hasError ? 'border-red-600 bg-red-50' : 'border-slate-950 bg-slate-50'
    }`;
}

/* Same rule as the server: keep the last 10 digits, so "+91 98765 43210"
   and "098765 43210" are accepted as the number they are. */
function normalizePhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
}

function formatPrice(pkg) {
    return isPriced(pkg) ? `₹${pkg.price.toLocaleString('en-IN')}` : 'TBD';
}

function scrollToEl(el) {
    if (!el) return;
    if (window.lenis) window.lenis.scrollTo(el, { offset: -90 });
    else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function loadRazorpayCheckout() {
    if (window.Razorpay) return Promise.resolve(true);
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = RAZORPAY_CHECKOUT_SRC;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

function validate(form) {
    const errors = {};
    if (form.name.trim().length < 2) errors.name = 'Enter your full name.';
    if (!form.rollNo.trim()) errors.rollNo = 'Enter your registered number.';
    if (form.department.trim().length < 2) errors.department = 'Enter your department.';
    if (!['1', '2'].includes(form.year)) errors.year = 'Select 1st or 2nd year.';
    if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Enter a valid email address.';
    if (normalizePhone(form.phone).length !== 10) errors.phone = 'Enter a valid 10-digit phone number.';
    const pkg = WORKSHOP_PACKAGES.find(p => p.id === form.package);
    if (!pkg) errors.package = 'Choose a package.';
    else if (!isPriced(pkg)) errors.package = 'Pricing for this package is not announced yet.';
    return errors;
}

async function postJson(path, body) {
    const res = await fetch(apiUrl(path), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
}

const wait = (ms) => new Promise(r => setTimeout(r, ms));

export default function WorkshopPage({ onBack }) {
    const [activeTrack, setActiveTrack] = useState('software');
    const [registerOpen, setRegisterOpen] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [fieldErrors, setFieldErrors] = useState({});
    // form -> review -> paying -> verifying -> success | unconfirmed
    const [stage, setStage] = useState('form');
    const [error, setError] = useState('');
    const [registration, setRegistration] = useState(null);
    const registerRef = useRef(null);
    const detailRef = useRef(null);

    const { siteData } = useWebsiteData();
    const dynamicTracks = siteData?.workshop?.tracks || {};
    const track = {
        ...WORKSHOP_TRACKS[activeTrack],
        ...(dynamicTracks[activeTrack] || {})
    };
    const selectedPkg = WORKSHOP_PACKAGES.find(p => p.id === form.package) || null;
    const anyPriced = WORKSHOP_PACKAGES.some(isPriced);

    const openRegister = () => {
        setRegisterOpen(true);
        setTimeout(() => scrollToEl(registerRef.current), 60);
    };

    const selectTrack = (id) => {
        setActiveTrack(id);
        setTimeout(() => scrollToEl(detailRef.current), 60);
    };

    const updateField = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
        setFieldErrors(prev => ({ ...prev, [key]: undefined }));
        setError('');
    };

    const handleConfirm = (event) => {
        event.preventDefault();
        const errors = validate(form);
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            setError(`Please fix: ${Object.keys(errors).map(key => FIELD_LABELS[key] || key).join(', ')}.`);
            return;
        }
        setError('');
        setStage('review');
    };

    /* The signature check in /verify is what confirms a payment. If that call
       never lands (dropped connection), the Razorpay webhook marks the
       registration paid on the server, and polling /status picks that up. */
    const confirmPaid = async (registrationId, response) => {
        setStage('verifying');
        try {
            const { ok, data } = await postJson('/api/workshop/verify', response);
            if (ok && data.registration?.status === 'paid') {
                setRegistration(data.registration);
                setStage('success');
                return;
            }
        } catch {
            // Fall through to polling.
        }

        for (let attempt = 0; attempt < 10; attempt++) {
            await wait(3000);
            try {
                const res = await fetch(apiUrl(`/api/workshop/status/${registrationId}`));
                const data = await res.json().catch(() => ({}));
                if (data.registration?.status === 'paid') {
                    setRegistration(data.registration);
                    setStage('success');
                    return;
                }
            } catch {
                // Keep polling.
            }
        }
        setRegistration({ registrationId });
        setStage('unconfirmed');
    };

    const handlePay = async () => {
        setError('');
        setStage('paying');

        let result;
        try {
            result = await postJson('/api/workshop/register', {
                ...form,
                phone: normalizePhone(form.phone)
            });
        } catch {
            setError('Could not reach the server. Check your connection and try again.');
            setStage('review');
            return;
        }

        const { ok, data } = result;
        if (!ok) {
            if (data.fields) {
                setFieldErrors(data.fields);
                setStage('form');
            } else {
                setStage('review');
            }
            setError(data.error || 'Registration failed. Please try again.');
            return;
        }

        const loaded = await loadRazorpayCheckout();
        if (!loaded || !window.Razorpay) {
            setError('Could not load the payment window. Disable any ad-blocker for this site and try again.');
            setStage('review');
            return;
        }

        const checkout = new window.Razorpay({
            key: data.keyId,
            order_id: data.order.id,
            amount: data.order.amount,
            currency: data.order.currency,
            name: 'Team Asterix',
            description: `${data.package.name} Workshop`,
            prefill: data.prefill,
            notes: { registrationId: data.registrationId },
            theme: { color: '#0ea5e9' },
            handler: (response) => confirmPaid(data.registrationId, response),
            modal: {
                ondismiss: () => {
                    setStage(current => (current === 'paying' ? 'review' : current));
                    setError(current => current || 'Payment window closed. You can try again whenever you are ready.');
                }
            }
        });
        checkout.on('payment.failed', (response) => {
            setError(response?.error?.description || 'Payment failed. You can retry.');
        });
        checkout.open();
    };

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setFieldErrors({});
        setError('');
        setRegistration(null);
        setStage('form');
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-amber-300 selection:text-slate-900">
            <header className="sticky top-0 z-50 border-b-4 border-slate-900 bg-white/95 px-4 py-3.5 shadow-[0_4px_0px_#0f172a] backdrop-blur-md sm:px-8">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
                    <div>
                        <span className="font-mono text-xs font-black uppercase tracking-widest text-sky-600">Team Asterix</span>
                        <strong className="block text-sm font-black uppercase">Workshops 2026</strong>
                    </div>
                    <button type="button" onClick={onBack} className="press border-2 border-slate-900 bg-amber-300 px-4 py-2 font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#0f172a] hover:bg-amber-400">
                        ← Main Website
                    </button>
                </div>
            </header>

            <main>
                {/* Overview */}
                <section className="border-b-4 border-slate-900 bg-amber-300 px-4 py-16 sm:px-8 sm:py-24">
                    <div className="mx-auto max-w-6xl">
                        <span className="inline-block border-2 border-slate-900 bg-slate-900 px-3 py-1 font-mono text-xs font-black uppercase tracking-widest text-amber-300">
                            ✦ Workshop 2026
                        </span>
                        <h1 className="mt-5 max-w-5xl text-4xl font-black uppercase leading-[0.9] tracking-tight sm:text-7xl">
                            Learn from the team that builds the buggy
                        </h1>
                        <p className="mt-6 max-w-3xl text-base font-bold leading-relaxed sm:text-xl">
                            Two hands-on tracks taught by Team Asterix: the software that lets our autonomous
                            BAJA buggy see and steer, and the electronics and powertrain that make it move.
                            Pick one track, or take both with the combo package.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <button type="button" onClick={openRegister} className="press border-2 border-slate-900 bg-slate-900 px-5 py-3 font-mono text-xs font-black uppercase text-amber-300 shadow-[4px_4px_0px_#0284c7] hover:bg-slate-800">
                                Register now →
                            </button>
                            <button type="button" onClick={() => scrollToEl(detailRef.current)} className="press border-2 border-slate-900 bg-white px-5 py-3 font-mono text-xs font-black uppercase shadow-[4px_4px_0px_#0f172a] hover:bg-sky-100">
                                Explore the tracks ↓
                            </button>
                        </div>
                    </div>
                </section>

                {/* Track selector + details */}
                <section ref={detailRef} className="border-b-4 border-slate-900 bg-sky-100 px-4 py-12 sm:px-8 sm:py-16">
                    <div className="mx-auto max-w-6xl">
                        <span className="font-mono text-xs font-black uppercase tracking-widest text-sky-700">01 / Choose a track</span>
                        <h2 className="mt-2 text-3xl font-black uppercase sm:text-5xl">The tracks</h2>

                        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2" role="tablist" aria-label="Workshop tracks">
                            {TRACK_ORDER.map((id) => {
                                const t = WORKSHOP_TRACKS[id];
                                const active = id === activeTrack;
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        role="tab"
                                        aria-selected={active}
                                        onClick={() => selectTrack(id)}
                                        className={`press border-4 border-slate-900 p-5 text-left shadow-[6px_6px_0px_#0f172a] transition-colors sm:p-6 ${
                                            active ? 'bg-slate-900 text-white' : 'bg-white text-slate-900 hover:bg-amber-100'
                                        }`}
                                    >
                                        <span className={`font-mono text-xs font-black uppercase tracking-widest ${active ? 'text-amber-300' : 'text-sky-600'}`}>
                                            {active ? '● Selected' : 'Track'}
                                        </span>
                                        <span className="mt-2 block text-2xl font-black uppercase sm:text-3xl">{t.name}</span>
                                        <span className={`mt-2 block text-sm font-bold ${active ? 'text-slate-300' : 'text-slate-600'}`}>{t.tagline}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <TrackDetail key={track.id} track={track} onRegister={openRegister} />
                    </div>
                </section>

                {/* Register CTA */}
                <section className="border-b-4 border-slate-900 bg-slate-900 px-4 py-12 text-white sm:px-8">
                    <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                        <div>
                            <span className="font-mono text-xs font-black uppercase tracking-widest text-amber-300">02 / Save your seat</span>
                            <h2 className="mt-2 text-3xl font-black uppercase sm:text-4xl">Ready to build?</h2>
                            <p className="mt-2 max-w-xl text-sm font-bold text-slate-300">
                                One track or both. Registration takes a minute; payment is handled securely by Razorpay.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={openRegister}
                            aria-expanded={registerOpen}
                            className="press press-sky border-4 border-white bg-amber-300 px-8 py-4 text-lg font-black uppercase tracking-wide text-slate-900 shadow-[6px_6px_0px_#0ea5e9] hover:bg-amber-400"
                        >
                            Register ✦
                        </button>
                    </div>
                </section>

                {/* Registration form */}
                {registerOpen && (
                    <section ref={registerRef} className="border-b-4 border-slate-900 bg-slate-100 px-4 py-12 sm:px-8 sm:py-16 anim-pop">
                        <div className="mx-auto max-w-4xl">
                            <span className="font-mono text-xs font-black uppercase tracking-widest text-sky-600">03 / Registration</span>
                            <h2 className="mt-2 text-3xl font-black uppercase sm:text-5xl">
                                {stage === 'success' ? 'Registered successfully' : 'Register for the workshop'}
                            </h2>

                            {stage === 'success' ? (
                                <SuccessPanel registration={registration} onRegisterAnother={resetForm} />
                            ) : stage === 'unconfirmed' ? (
                                <UnconfirmedPanel registrationId={registration?.registrationId} />
                            ) : stage === 'verifying' ? (
                                <StatusCard title="Confirming your payment…" body="Hold on, this only takes a few seconds. Please do not close this page." />
                            ) : stage === 'form' ? (
                                <form onSubmit={handleConfirm} noValidate className="mt-8 border-4 border-slate-900 bg-white p-5 shadow-[8px_8px_0px_#0f172a] sm:p-8">
                                    {!anyPriced && (
                                        <p className="mb-6 border-2 border-slate-900 bg-amber-100 p-3 font-mono text-xs font-black uppercase">
                                            Prices are yet to be announced. Payments open as soon as they are.
                                        </p>
                                    )}
                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                        <Field label="Full name" error={fieldErrors.name}>
                                            <input className={inputClass(fieldErrors.name)} value={form.name} onChange={e => updateField('name', e.target.value)} autoComplete="name" maxLength={100} />
                                        </Field>
                                        <Field label="Registered number" error={fieldErrors.rollNo}>
                                            <input className={inputClass(fieldErrors.rollNo)} value={form.rollNo} onChange={e => updateField('rollNo', e.target.value)} maxLength={40} />
                                        </Field>
                                        <Field label="Department" error={fieldErrors.department}>
                                            <input className={inputClass(fieldErrors.department)} value={form.department} onChange={e => updateField('department', e.target.value)} maxLength={100} />
                                        </Field>
                                        <Field label="Year" error={fieldErrors.year}>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['1', '2'].map(y => (
                                                    <button
                                                        key={y}
                                                        type="button"
                                                        onClick={() => updateField('year', y)}
                                                        aria-pressed={form.year === y}
                                                        className={`press border-2 p-3 font-mono text-sm font-black uppercase ${
                                                            fieldErrors.year ? 'border-red-600' : 'border-slate-950'
                                                        } ${
                                                            form.year === y ? 'bg-sky-500 text-white' : fieldErrors.year ? 'bg-red-50 hover:bg-sky-100' : 'bg-slate-50 hover:bg-sky-100'
                                                        }`}
                                                    >
                                                        {y === '1' ? '1st year' : '2nd year'}
                                                    </button>
                                                ))}
                                            </div>
                                        </Field>
                                        <Field label="Email ID" error={fieldErrors.email}>
                                            <input type="email" className={inputClass(fieldErrors.email)} value={form.email} onChange={e => updateField('email', e.target.value)} autoComplete="email" maxLength={254} />
                                        </Field>
                                        <Field label="Phone" error={fieldErrors.phone}>
                                            <input type="tel" inputMode="numeric" className={inputClass(fieldErrors.phone)} value={form.phone} onChange={e => updateField('phone', e.target.value)} autoComplete="tel" maxLength={20} placeholder="10-digit mobile" />
                                        </Field>
                                    </div>

                                    <fieldset className="mt-6">
                                        <legend className="mb-2 font-mono text-xs font-black uppercase tracking-widest text-slate-700">Your choice</legend>
                                        <div className="grid grid-cols-1 gap-3">
                                            {WORKSHOP_PACKAGES.map(pkg => {
                                                const selected = form.package === pkg.id;
                                                return (
                                                    <label
                                                        key={pkg.id}
                                                        className={`press flex cursor-pointer items-center justify-between gap-4 border-2 border-slate-950 p-4 ${
                                                            selected ? 'bg-amber-300 shadow-[4px_4px_0px_#0f172a]' : 'bg-slate-50 hover:bg-amber-50'
                                                        }`}
                                                    >
                                                        <span className="flex items-center gap-3">
                                                            <input
                                                                type="radio"
                                                                name="package"
                                                                value={pkg.id}
                                                                checked={selected}
                                                                onChange={() => updateField('package', pkg.id)}
                                                                className="h-4 w-4 accent-slate-900"
                                                            />
                                                            <span>
                                                                <span className="block text-sm font-black uppercase">{pkg.name}</span>
                                                                <span className="block font-mono text-[11px] font-bold text-slate-600">
                                                                    {pkg.tracksIncluded.map(id => WORKSHOP_TRACKS[id].name).join(' + ')}
                                                                </span>
                                                            </span>
                                                        </span>
                                                        <span className="shrink-0 font-mono text-lg font-black">{formatPrice(pkg)}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        {fieldErrors.package && <p className="mt-2 font-mono text-xs font-black text-red-600">{fieldErrors.package}</p>}
                                    </fieldset>

                                    {error && <p className="mt-6 border-2 border-red-600 bg-red-50 p-3 font-mono text-xs font-black text-red-700">{error}</p>}

                                    <button type="submit" className="press mt-6 w-full border-2 border-slate-900 bg-slate-900 px-5 py-4 font-mono text-sm font-black uppercase text-amber-300 shadow-[4px_4px_0px_#0284c7] hover:bg-slate-800 sm:w-auto">
                                        Confirm details →
                                    </button>
                                </form>
                            ) : (
                                <ReviewPanel
                                    form={form}
                                    pkg={selectedPkg}
                                    error={error}
                                    busy={stage === 'paying'}
                                    onEdit={() => { setError(''); setStage('form'); }}
                                    onPay={handlePay}
                                />
                            )}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}

function TrackDetail({ track, onRegister }) {
    const facts = [
        ['Dates', track.dates],
        ['Schedule', track.days],
        ['Timing', track.timing],
        ['Price', formatPrice(WORKSHOP_PACKAGES.find(p => p.id === track.id))]
    ];

    return (
        <article className="mt-8 border-4 border-slate-900 bg-white p-5 shadow-[8px_8px_0px_#0f172a] sm:p-8 anim-pop" role="tabpanel">
            <h3 className="text-2xl font-black uppercase sm:text-4xl">{track.name}</h3>
            <p className="mt-3 max-w-3xl text-sm font-bold leading-relaxed text-slate-600 sm:text-base">{track.overview}</p>

            <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {facts.map(([label, value]) => (
                    <div key={label} className={`border-2 border-slate-900 p-3 ${label === 'Price' ? 'bg-amber-300' : 'bg-sky-50'}`}>
                        <dt className="font-mono text-[10px] font-black uppercase tracking-widest text-slate-600">{label}</dt>
                        <dd className="mt-1 text-sm font-black">{value}</dd>
                    </div>
                ))}
            </dl>
            <p className="mt-3 font-mono text-xs font-bold text-slate-600">{track.startLabel} · {track.format}</p>
            <p className="mt-1 font-mono text-xs font-bold text-slate-600">{track.audience}</p>

            <h4 className="mt-8 font-mono text-xs font-black uppercase tracking-widest text-sky-600">What you will learn</h4>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                {track.topics.map((topic, index) => (
                    <div key={topic.title} className="border-2 border-slate-900 bg-slate-50 p-4">
                        <span className="font-mono text-xs font-black text-sky-600">{String(index + 1).padStart(2, '0')}</span>
                        <h5 className="mt-1 text-lg font-black uppercase">{topic.title}</h5>
                        <ul className="mt-2 space-y-1">
                            {topic.points.map(point => (
                                <li key={point} className="flex gap-2 text-sm font-bold text-slate-700">
                                    <span className="text-sky-600">→</span>
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <h4 className="mt-8 font-mono text-xs font-black uppercase tracking-widest text-sky-600">Plan</h4>
            
            <div className="mt-3 border-2 border-slate-900 overflow-hidden">
                <div className="hidden sm:grid sm:grid-cols-[6.5rem_7.5rem_8.5rem_1fr] gap-3 p-3 bg-slate-900 text-white font-mono text-[10px] font-black uppercase tracking-wider">
                    <span>Week</span>
                    <span>Days</span>
                    <span>Dates</span>
                    <span>Session Topic</span>
                </div>

                <ol className="divide-y-2 divide-slate-200 bg-white">
                    {track.schedule.map((item, index) => {
                        const isOngoing = track.ongoingWeek && (
                            item.label?.trim().toLowerCase() === track.ongoingWeek?.trim().toLowerCase() ||
                            item.id === track.ongoingWeek ||
                            (!track.schedule.some(s => s.label?.trim().toLowerCase() === track.ongoingWeek?.trim().toLowerCase()) && index === 0)
                        );

                        return (
                            <li 
                                key={item.id || item.label || index} 
                                className={`p-3.5 transition-colors ${isOngoing ? 'bg-sky-50/80 border-l-4 border-l-sky-500' : 'hover:bg-slate-50'}`}
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-[6.5rem_7.5rem_8.5rem_1fr] gap-2 sm:gap-3 items-start sm:items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-black uppercase text-slate-900">{item.label}</span>
                                        {isOngoing && (
                                            <span className="px-1.5 py-0.5 text-[8px] font-mono font-black uppercase tracking-wider bg-emerald-400 text-slate-900 border border-slate-900 shadow-[1px_1px_0px_#0f172a]">
                                                Ongoing
                                            </span>
                                        )}
                                    </div>
                                    <div className="font-mono text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                        <span className="sm:hidden text-[10px] font-mono font-black text-slate-400 uppercase">Days:</span>
                                        <span>{item.days || '—'}</span>
                                    </div>
                                    <div className="font-mono text-xs font-bold text-slate-500 flex items-center gap-1.5">
                                        <span className="sm:hidden text-[10px] font-mono font-black text-slate-400 uppercase">Dates:</span>
                                        <span>{item.date || '—'}</span>
                                    </div>
                                    <div className="text-sm font-bold text-slate-900">
                                        {item.title}
                                    </div>
                                </div>

                                {/* Venue Details and Reporting Instructions - Automatically Open below the Ongoing Week */}
                                {isOngoing && (track.venue || track.reportingInstructions) && (
                                    <div className="mt-3 p-3.5 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-widest text-sky-700">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                            <span>Current Session Details & Venue</span>
                                        </div>
                                        {track.venue && (
                                            <div className="text-xs font-mono">
                                                <span className="font-black uppercase text-slate-700 mr-1.5">📍 Venue:</span>
                                                <span className="font-bold text-slate-900">{track.venue}</span>
                                            </div>
                                        )}
                                        {track.reportingInstructions && (
                                            <div className="text-xs font-mono">
                                                <span className="font-black uppercase text-slate-700 mr-1.5">📋 Reporting Instructions:</span>
                                                <span className="font-medium text-slate-800 leading-relaxed">{track.reportingInstructions}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </div>
            <p className="mt-3 text-sm font-bold text-slate-600">✦ {track.bonus}</p>

            <div className="mt-8 flex flex-wrap gap-3">
                <a
                    href={track.syllabus}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="press inline-flex items-center gap-2 border-2 border-slate-900 bg-white px-5 py-3 font-mono text-xs font-black uppercase text-slate-900 no-underline shadow-[4px_4px_0px_#0f172a] hover:bg-sky-100"
                >
                    Download syllabus & plan (PDF) ↓
                </a>
                <button type="button" onClick={onRegister} className="press border-2 border-slate-900 bg-amber-300 px-5 py-3 font-mono text-xs font-black uppercase shadow-[4px_4px_0px_#0f172a] hover:bg-amber-400">
                    Register ✦
                </button>
            </div>
            <p className="mt-4 font-mono text-[10px] font-bold uppercase text-slate-500">
                * Syllabus, schedule and other details are subject to change.
            </p>
        </article>
    );
}

function Field({ label, error, children }) {
    return (
        <label className="block">
            <span className="mb-1.5 block font-mono text-xs font-black uppercase tracking-widest text-slate-700">{label}</span>
            {children}
            {error && <span className="mt-1 block font-mono text-xs font-black text-red-600">{error}</span>}
        </label>
    );
}

function ReviewPanel({ form, pkg, error, busy, onEdit, onPay }) {
    const rows = [
        ['Name', form.name],
        ['Registered number', form.rollNo],
        ['Department', form.department],
        ['Year', form.year === '1' ? '1st year' : '2nd year'],
        ['Email', form.email],
        ['Phone', normalizePhone(form.phone)],
        ['Package', pkg?.name]
    ];

    return (
        <div className="mt-8 border-4 border-slate-900 bg-white p-5 shadow-[8px_8px_0px_#0f172a] sm:p-8">
            <p className="font-mono text-xs font-black uppercase tracking-widest text-sky-600">Check your details before paying</p>
            <dl className="mt-4 divide-y-2 divide-slate-200 border-2 border-slate-900">
                {rows.map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[9rem_1fr] gap-3 p-3">
                        <dt className="font-mono text-xs font-black uppercase text-slate-500">{label}</dt>
                        <dd className="break-words text-sm font-black">{value}</dd>
                    </div>
                ))}
                <div className="grid grid-cols-[9rem_1fr] gap-3 bg-amber-300 p-3">
                    <dt className="font-mono text-xs font-black uppercase">Amount</dt>
                    <dd className="font-mono text-lg font-black">{formatPrice(pkg)}</dd>
                </div>
            </dl>

            {error && <p className="mt-6 border-2 border-red-600 bg-red-50 p-3 font-mono text-xs font-black text-red-700">{error}</p>}

            <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={onEdit} disabled={busy} className="press border-2 border-slate-900 bg-white px-5 py-3 font-mono text-xs font-black uppercase shadow-[4px_4px_0px_#0f172a] hover:bg-sky-100 disabled:opacity-50">
                    ← Edit details
                </button>
                <button type="button" onClick={onPay} disabled={busy || !PAYMENTS_ENABLED} className="press border-2 border-slate-900 bg-sky-500 px-6 py-3 font-mono text-sm font-black uppercase text-white shadow-[4px_4px_0px_#0f172a] hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-sky-500">
                    {busy ? 'Opening payment…' : `Pay ${formatPrice(pkg)} →`}
                </button>
            </div>
            <p className="mt-4 font-mono text-[10px] font-bold uppercase text-slate-500">
                Payments are processed by Razorpay. Team Asterix never sees your card or UPI details.
            </p>
        </div>
    );
}

function SuccessPanel({ registration, onRegisterAnother }) {
    return (
        <div className="mt-8 border-4 border-slate-900 bg-white shadow-[8px_8px_0px_#16a34a]">
            <div className="border-b-4 border-slate-900 bg-green-400 p-5 sm:p-6">
                <span className="font-mono text-xs font-black uppercase tracking-widest">✓ Payment confirmed</span>
                <p className="mt-1 text-2xl font-black uppercase sm:text-3xl">You’re in, {registration.name?.split(' ')[0]}!</p>
            </div>
            <dl className="divide-y-2 divide-slate-200 p-2">
                {[
                    ['Receipt no.', registration.receiptNo || 'Being generated'],
                    ['Package', registration.packageName],
                    ['Amount paid', `₹${Number(registration.amount).toLocaleString('en-IN')}`],
                    ['Email', registration.email]
                ].map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[8rem_1fr] gap-3 p-3">
                        <dt className="font-mono text-xs font-black uppercase text-slate-500">{label}</dt>
                        <dd className="break-words font-mono text-sm font-black">{value}</dd>
                    </div>
                ))}
            </dl>
            <div className="border-t-2 border-slate-200 p-5">
                <p className="text-sm font-bold text-slate-600">
                    Keep your receipt number handy. Session details will be shared with you before the workshop begins.
                </p>
                <button type="button" onClick={onRegisterAnother} className="press mt-4 border-2 border-slate-900 bg-white px-4 py-2 font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#0f172a] hover:bg-sky-100">
                    Register someone else
                </button>
            </div>
        </div>
    );
}

function UnconfirmedPanel({ registrationId }) {
    return (
        <StatusCard
            title="Payment is still being confirmed"
            body={`If money was deducted, your registration will be confirmed automatically within a few minutes. Do not pay again. If it still is not confirmed, contact the team with this reference: ${registrationId}.`}
        />
    );
}

function StatusCard({ title, body }) {
    return (
        <div className="mt-8 border-4 border-slate-900 bg-white p-6 shadow-[8px_8px_0px_#0f172a]">
            <p className="text-xl font-black uppercase">{title}</p>
            <p className="mt-2 text-sm font-bold text-slate-600">{body}</p>
        </div>
    );
}
