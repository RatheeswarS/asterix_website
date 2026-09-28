import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiUrl } from '../lib/api';
import { useWebsiteData } from '../context/WebsiteDataContext';
/* Shared with the backend so the page and the server can never disagree on
   what a package includes or costs. The server still looks the price up on
   its own side when it creates the order; this import is for display only. */
import {
    WORKSHOP_TRACKS,
    WORKSHOP_PACKAGES,
    WORKSHOP_DEPARTMENTS,
    isPriced
} from '../../server/src/config/workshopPackages.js';

const TRACK_ORDER = ['software', 'powertrain'];
const RAZORPAY_CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Payments are open. Flip to false to pause.
const PAYMENTS_ENABLED = true;

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
    package: 'Track'
};

/* text-base (16px) on phones: anything smaller makes iOS Safari zoom the page
   in when a field is tapped, which then has to be pinched back out. */
function inputClass(hasError) {
    return `w-full min-h-12 px-3 py-3 border-2 font-mono text-base font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 sm:text-sm ${hasError ? 'border-red-600 bg-red-50' : 'border-slate-950 bg-slate-50'
        }`;
}

/* Same rule as the server: keep the last 10 digits, so "+91 98765 43210"
   and "098765 43210" are accepted as the number they are. */
function normalizePhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
}

// Shown on the page as the deadline.
const REGISTRATION_CLOSES = '3 October 2026';

function formatRupees(amount) {
    return `₹${amount.toLocaleString('en-IN')}`;
}

function formatPrice(pkg) {
    return isPriced(pkg) ? formatRupees(pkg.price) : 'TBD';
}

/* Combo offer maths, worked out from the package prices so the tags never
   drift from what is actually charged. */
const SINGLE_PACKAGES = WORKSHOP_PACKAGES.filter(p => p.tracksIncluded.length === 1);
const COMBO_PACKAGE = WORKSHOP_PACKAGES.find(p => p.tracksIncluded.length > 1) || null;
const COMBO_SAVING = isPriced(COMBO_PACKAGE) && SINGLE_PACKAGES.every(isPriced)
    ? SINGLE_PACKAGES.reduce((sum, p) => sum + p.price, 0) - COMBO_PACKAGE.price
    : 0;

// For a single-track choice: the other track and what adding it would cost.
function upsellFor(pkg) {
    if (!pkg || !COMBO_PACKAGE || COMBO_SAVING <= 0 || pkg.tracksIncluded.length !== 1) return null;
    const other = SINGLE_PACKAGES.find(p => p.id !== pkg.id);
    if (!other) return null;
    return { other, extra: COMBO_PACKAGE.price - pkg.price };
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
    // Checked in the order the fields appear on the page (track choice first),
    // so the first key is the topmost problem.
    const errors = {};
    const pkg = WORKSHOP_PACKAGES.find(p => p.id === form.package);
    if (!pkg) errors.package = 'Choose a track.';
    else if (!isPriced(pkg)) errors.package = 'Pricing for this package is not announced yet.';
    if (form.name.trim().length < 2) errors.name = 'Enter your full name.';
    if (!form.rollNo.trim()) errors.rollNo = 'Enter your registered number.';
    if (!WORKSHOP_DEPARTMENTS.includes(form.department)) errors.department = 'Select your department.';
    if (!['1', '2'].includes(form.year)) errors.year = 'Select 1st or 2nd year.';
    if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Enter a valid email address.';
    if (normalizePhone(form.phone).length !== 10) errors.phone = 'Enter a valid 10-digit phone number.';
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

const STEPS = ['Details', 'Confirm', 'Payment'];

// Which slide of the registration pop-up a stage belongs to.
function stepFor(stage) {
    if (stage === 'form') return 0;
    if (stage === 'review') return 1;
    return 2;
}

function formatPaidAt(value) {
    if (!value) return '';
    return new Date(value).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short'
    });
}

/* One list feeds both the on-screen receipt and the downloaded image, whether
   the record comes from a payment just made or from a later receipt lookup. */
function receiptRows(record) {
    return [
        ['Receipt no.', record.receiptNo || 'Being generated'],
        ['Name', record.name],
        ['Registered no.', record.rollNo],
        ['Department', record.department],
        ['Year', record.year === '1' ? '1st year' : record.year === '2' ? '2nd year' : ''],
        ['Email', record.email],
        ['Phone', record.phone],
        ['Track', record.packageName],
        ['Amount paid', `₹${Number(record.amount).toLocaleString('en-IN')}`],
        ['Paid on', formatPaidAt(record.paidAt)],
        ['Reference', record.registrationId]
    ].filter(([, value]) => value);
}

function wrapText(ctx, text, maxWidth) {
    const lines = [];
    let line = '';
    for (const word of String(text).split(' ')) {
        const next = line ? `${line} ${word}` : word;
        if (line && ctx.measureText(next).width > maxWidth) {
            lines.push(line);
            line = word;
        } else {
            line = next;
        }
    }
    if (line) lines.push(line);
    return lines;
}

/* Drawn on a canvas and saved as a PNG: no PDF library needed, and on a
   phone an image lands straight in the gallery / downloads. */
function downloadReceipt(rows, fileId) {
    const W = 640, PAD = 36, LABEL_W = 170, LINE_H = 24, ROW_PAD = 18;
    const HEADER_H = 128, FOOTER_H = 84;
    const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    const VALUE_FONT = `700 17px ${SANS}`;
    const valueW = W - PAD * 2 - LABEL_W;

    const canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    ctx.font = VALUE_FONT;
    const laid = rows.map(([label, value]) => ({ label, lines: wrapText(ctx, value, valueW) }));
    const H = HEADER_H + laid.reduce((sum, row) => sum + row.lines.length * LINE_H + ROW_PAD, 0) + FOOTER_H + 16;

    const scale = 2;
    canvas.width = W * scale;
    canvas.height = H * scale;
    ctx = canvas.getContext('2d'); // resizing resets the context state
    ctx.scale(scale, scale);
    ctx.textBaseline = 'top';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#fcd34d';
    ctx.fillRect(0, 0, W, HEADER_H - 16);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, HEADER_H - 20, W, 4);
    ctx.font = `900 13px ${MONO}`;
    ctx.fillStyle = '#0369a1';
    ctx.fillText('TEAM ASTERIX · WORKSHOP 2026', PAD, 30);
    ctx.font = `900 30px ${SANS}`;
    ctx.fillStyle = '#0f172a';
    ctx.fillText('PAYMENT RECEIPT', PAD, 52);

    ctx.font = `900 14px ${MONO}`;
    const tag = '✓ PAID';
    const tagW = ctx.measureText(tag).width + 24;
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(W - PAD - tagW, 50, tagW, 34);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.strokeRect(W - PAD - tagW, 50, tagW, 34);
    ctx.fillStyle = '#0f172a';
    ctx.fillText(tag, W - PAD - tagW + 12, 60);

    let y = HEADER_H;
    laid.forEach((row, index) => {
        const rowH = row.lines.length * LINE_H + ROW_PAD;
        if (row.label === 'Amount paid') {
            ctx.fillStyle = '#fcd34d';
            ctx.fillRect(PAD - 12, y - 2, W - PAD * 2 + 24, rowH);
        }
        ctx.font = `900 12px ${MONO}`;
        ctx.fillStyle = '#64748b';
        ctx.fillText(row.label.toUpperCase(), PAD, y + 11);
        ctx.font = VALUE_FONT;
        ctx.fillStyle = '#0f172a';
        row.lines.forEach((line, i) => ctx.fillText(line, PAD + LABEL_W, y + 8 + i * LINE_H));
        y += rowH;
        if (index < laid.length - 1) {
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(PAD, y - 2, W - PAD * 2, 2);
        }
    });

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, y + 8, W, 4);
    ctx.font = `700 12px ${MONO}`;
    ctx.fillStyle = '#475569';
    ctx.fillText('Payment processed by Razorpay.', PAD, y + 30);
    ctx.fillText('Keep this receipt; session details will be shared before the workshop.', PAD, y + 50);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 8;
    ctx.strokeRect(0, 0, W, H);

    canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Asterix-Workshop-Receipt-${fileId}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    }, 'image/png');
}

export default function WorkshopPage({ onBack }) {
    const [activeTrack, setActiveTrack] = useState('software');
    const [registerOpen, setRegisterOpen] = useState(false);
    const [lookupOpen, setLookupOpen] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [fieldErrors, setFieldErrors] = useState({});
    // form -> review -> paying -> verifying -> success | unconfirmed
    const [stage, setStage] = useState('form');
    const [error, setError] = useState('');
    const [registration, setRegistration] = useState(null);
    // "Add the other track for ₹750 more" prompt beside Review & continue.
    const [upsellOpen, setUpsellOpen] = useState(false);
    const formRef = useRef(null);
    const detailRef = useRef(null);

    const { siteData } = useWebsiteData();
    const dynamicTracks = siteData?.workshop?.tracks || {};
    const track = {
        ...WORKSHOP_TRACKS[activeTrack],
        ...(dynamicTracks[activeTrack] || {})
    };
    const selectedPkg = WORKSHOP_PACKAGES.find(p => p.id === form.package) || null;
    const anyPriced = WORKSHOP_PACKAGES.some(isPriced);

    const openRegister = (packageId) => {
        if (typeof packageId === 'string' && packageId) {
            setForm(prev => ({ ...prev, package: packageId }));
            setFieldErrors(prev => ({ ...prev, package: undefined }));
        }
        setRegisterOpen(true);
    };

    // Not while the payment window is open or a payment is being confirmed.
    const canClose = stage !== 'paying' && stage !== 'verifying';
    const closeRegister = () => {
        if (!canClose) return;
        setRegisterOpen(false);
        setUpsellOpen(false);
    };

    const selectTrack = (id) => {
        setActiveTrack(id);
        setTimeout(() => scrollToEl(detailRef.current), 60);
    };

    const updateField = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
        setFieldErrors(prev => ({ ...prev, [key]: undefined }));
        setError('');
        setUpsellOpen(false);
    };

    const handleConfirm = (event) => {
        event.preventDefault();
        const errors = validate(form);
        setFieldErrors(errors);
        const keys = Object.keys(errors);
        if (keys.length > 0) {
            setError(`Please fix: ${keys.map(key => FIELD_LABELS[key] || key).join(', ')}.`);
            // On a phone the first problem is usually off screen: take them to it.
            // validate() adds keys in form order, so keys[0] is the topmost field.
            const target = formRef.current?.querySelector(`[data-field="${keys[0]}"]`);
            if (target) {
                (target.closest('[data-field-wrap]') || target).scrollIntoView({ behavior: 'smooth', block: 'center' });
                target.focus({ preventScroll: true });
            }
            return;
        }
        setError('');
        // One track picked: offer the combo once before moving on.
        if (upsellFor(selectedPkg) && !upsellOpen) {
            setUpsellOpen(true);
            return;
        }
        setUpsellOpen(false);
        setStage('review');
    };

    const acceptUpsell = () => {
        updateField('package', COMBO_PACKAGE.id);
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
        setUpsellOpen(false);
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
                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        <button type="button" onClick={onBack} className="press border-2 border-slate-900 bg-amber-300 px-3 py-2 font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#0f172a] hover:bg-amber-400 sm:px-4">
                            ← Main<span className="hidden sm:inline"> Website</span>
                        </button>
                        {/* Downloadable receipt button with clear icon */}
                        <button
                            type="button"
                            onClick={() => setLookupOpen(true)}
                            aria-haspopup="dialog"
                            aria-label="Download receipt"
                            className="press inline-flex items-center gap-1.5 border-2 border-slate-900 bg-emerald-400 px-2.5 py-2 font-mono text-xs font-black uppercase text-slate-900 shadow-[3px_3px_0px_#0f172a] hover:bg-emerald-300 sm:px-4"
                        >
                            <svg className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            <span className="sm:hidden">Receipt ↓</span>
                            <span className="hidden sm:inline">Download Receipt ↓</span>
                        </button>
                    </div>
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
                            Engineer autonomy with the team that builds it
                        </h1>
                        <p className="mt-6 max-w-3xl text-base font-bold leading-relaxed sm:text-xl">
                            Two hands-on tracks. One autonomous vehicle.<br className="hidden sm:inline" />
                            Learn the software that makes it think, or the electronics and powertrain that make it move.
                        </p>
                        <p className="mt-3 max-w-3xl text-sm font-bold leading-relaxed text-slate-800 sm:text-base">
                            Sessions led by Team Asterix engineers and industry experts with real hardware, handbooks and project work.
                        </p>
                        <p className="mt-2 max-w-3xl text-sm font-bold leading-relaxed text-slate-800 sm:text-base">
                            Choose one track, or take both with the combo package.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <button type="button" onClick={() => openRegister()} className="press border-2 border-slate-900 bg-slate-900 px-5 py-3 font-mono text-xs font-black uppercase text-amber-300 shadow-[4px_4px_0px_#0284c7] hover:bg-slate-800">
                                Register now →
                            </button>
                            <button type="button" onClick={() => scrollToEl(detailRef.current)} className="press border-2 border-slate-900 bg-white px-5 py-3 font-mono text-xs font-black uppercase shadow-[4px_4px_0px_#0f172a] hover:bg-sky-100">
                                Explore the tracks ↓
                            </button>
                        </div>
                        <ClosingDate className="mt-5" />
                    </div>
                </section>

                {/* Track selector + details */}
                <section ref={detailRef} className="border-b-4 border-slate-900 bg-sky-100 px-4 py-12 sm:px-8 sm:py-16">
                    <div className="mx-auto max-w-6xl">
                        <span className="font-mono text-xs font-black uppercase tracking-widest text-sky-700">01 / Choose a track</span>
                        <h2 className="mt-2 text-3xl font-black uppercase sm:text-5xl">The tracks</h2>

                        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4" role="tablist" aria-label="Workshop tracks">
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
                                        className={`press group cursor-pointer border-3 sm:border-4 border-slate-900 p-3.5 sm:p-6 text-left transition-all ${active
                                                ? 'bg-slate-900 text-white shadow-[6px_6px_0px_#0284c7]'
                                                : 'bg-white text-slate-900 shadow-[4px_4px_0px_#0f172a] hover:bg-amber-100 hover:shadow-[6px_6px_0px_#0f172a]'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-1">
                                            <span className={`inline-flex items-center gap-1 font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider ${active ? 'text-amber-300' : 'text-sky-600 group-hover:text-sky-700'
                                                }`}>
                                                <span>{active ? '● Selected' : '○ View Track'}</span>
                                            </span>
                                            <span className={`font-mono text-xs font-black ${active ? 'text-amber-300' : 'text-slate-400 group-hover:text-slate-900'
                                                }`}>
                                                {active ? '✓' : '↘'}
                                            </span>
                                        </div>
                                        <span className="mt-1.5 sm:mt-2 block text-sm sm:text-2xl lg:text-3xl font-black uppercase leading-tight">
                                            {t.name}
                                        </span>
                                        <span className={`mt-2 hidden text-sm font-bold sm:block ${active ? 'text-slate-300' : 'text-slate-600'
                                            }`}>
                                            {t.tagline}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <TrackDetail key={track.id} track={track} onRegister={openRegister} />
                    </div>
                </section>

                {/* Included Section */}
                <section className="border-b-4 border-slate-900 bg-amber-300 px-4 py-10 sm:px-8 sm:py-16">
                    <div className="mx-auto max-w-6xl">
                        <span className="inline-block border-2 border-slate-900 bg-slate-900 px-2.5 py-0.5 font-mono text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-300">
                            ✦ All-Inclusive Experience
                        </span>
                        <h2 className="mt-2 text-2xl font-black uppercase sm:text-5xl leading-tight">
                            YOUR ₹1,000 INCLUDES
                        </h2>
                        <p className="mt-1.5 text-xs sm:text-base font-bold text-slate-800">
                            Everything you need to build real-world engineering mastery with Team Asterix and industry experts.
                        </p>

                        <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-3.5">
                            <div className="border-2 sm:border-3 border-slate-900 bg-white p-3.5 sm:p-4 shadow-[3px_3px_0px_#0f172a] sm:shadow-[4px_4px_0px_#0f172a]">
                                <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-widest text-sky-600">01 / RESOURCES</span>
                                <h3 className="mt-1 text-sm sm:text-base font-black uppercase leading-snug">Handbooks &amp; guides</h3>
                                <p className="mt-1 text-xs font-bold leading-relaxed text-slate-600">Physical &amp; digital comprehensive manuals, schematics and code references.</p>
                            </div>
                            <div className="border-2 sm:border-3 border-slate-900 bg-white p-3.5 sm:p-4 shadow-[3px_3px_0px_#0f172a] sm:shadow-[4px_4px_0px_#0f172a]">
                                <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-widest text-sky-600">02 / PRACTICE</span>
                                <h3 className="mt-1 text-sm sm:text-base font-black uppercase leading-snug">Hands-on learning</h3>
                                <p className="mt-1 text-xs font-bold leading-relaxed text-slate-600">Direct hardware labs, vehicle testing and interactive debugging sessions.</p>
                            </div>
                            <div className="border-2 sm:border-3 border-slate-900 bg-white p-3.5 sm:p-4 shadow-[3px_3px_0px_#0f172a] sm:shadow-[4px_4px_0px_#0f172a]">
                                <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-widest text-sky-600">03 / BUILD</span>
                                <h3 className="mt-1 text-sm sm:text-base font-black uppercase leading-snug">Mini-projects</h3>
                                <p className="mt-1 text-xs font-bold leading-relaxed text-slate-600">End-to-end milestone projects designed to build practical engineering confidence.</p>
                            </div>
                            <div className="border-2 sm:border-3 border-slate-900 bg-white p-3.5 sm:p-4 shadow-[3px_3px_0px_#0f172a] sm:shadow-[4px_4px_0px_#0f172a]">
                                <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-widest text-sky-600">04 / CAREER</span>
                                <h3 className="mt-1 text-sm sm:text-base font-black uppercase leading-snug">Build and strengthen your resume</h3>
                                <p className="mt-1 text-xs font-bold leading-relaxed text-slate-600">Stand out with verified, hands-on project experience on real autonomous stacks and powertrain electronics.</p>
                            </div>
                            <div className="border-2 sm:border-3 border-slate-900 bg-white p-3.5 sm:p-4 shadow-[3px_3px_0px_#0f172a] sm:shadow-[4px_4px_0px_#0f172a]">
                                <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-widest text-sky-600">05 / CURRICULUM</span>
                                <h3 className="mt-1 text-sm sm:text-base font-black uppercase leading-snug">Industry approved syllabus</h3>
                                <p className="mt-1 text-xs font-bold leading-relaxed text-slate-600">Sessions handled by Team Asterix engineers and industry experts.</p>
                            </div>
                            <div className="border-2 sm:border-3 border-slate-900 bg-white p-3.5 sm:p-4 shadow-[3px_3px_0px_#0f172a] sm:shadow-[4px_4px_0px_#0f172a]">
                                <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-widest text-sky-600">06 / BONUS</span>
                                <h3 className="mt-1 text-sm sm:text-base font-black uppercase leading-snug">3 complimentary sessions</h3>
                                <p className="mt-1 text-xs font-bold leading-relaxed text-slate-600">Free cross-track masterclasses: Perception, Embedded Systems &amp; Mechanical Fundamentals.</p>
                            </div>
                            <div className="border-2 sm:border-3 border-slate-900 bg-white p-3.5 sm:p-4 shadow-[3px_3px_0px_#0f172a] sm:shadow-[4px_4px_0px_#0f172a]">
                                <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-widest text-sky-600">07 / VEHICLE</span>
                                <h3 className="mt-1 text-sm sm:text-base font-black uppercase leading-snug">Real autonomous-vehicle context</h3>
                                <p className="mt-1 text-xs font-bold leading-relaxed text-slate-600">Taught directly on the systems powering our national BAJA autonomous buggy.</p>
                            </div>
                            <div className="border-2 sm:border-3 border-slate-900 bg-white p-3.5 sm:p-4 shadow-[3px_3px_0px_#0f172a] sm:shadow-[4px_4px_0px_#0f172a]">
                                <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-widest text-sky-600">08 / SKILLS</span>
                                <h3 className="mt-1 text-sm sm:text-base font-black uppercase leading-snug">Future ready minds</h3>
                                <p className="mt-1 text-xs font-bold leading-relaxed text-slate-600">Master ROS, Computer Vision, Agentic AI, circuits, and PCB design.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact Leads Section */}
                <section className="border-b-4 border-slate-900 bg-sky-50 px-4 py-10 sm:px-8 sm:py-14">
                    <div className="mx-auto max-w-6xl">
                        <span className="inline-block border-2 border-slate-900 bg-slate-900 px-2.5 py-0.5 font-mono text-[10px] sm:text-xs font-black uppercase tracking-widest text-sky-400">
                            ✦ Get In Touch
                        </span>
                        <h2 className="mt-2 text-2xl font-black uppercase sm:text-4xl leading-tight text-slate-900">
                            CONTACT THE LEADS
                        </h2>
                        <p className="mt-1.5 text-xs sm:text-base font-bold text-slate-700">
                            Have questions regarding track topics, prerequisites, timings, or payments? Feel free to reach out directly.
                        </p>

                        <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                            {/* Arya */}
                            <div className="border-3 border-slate-900 bg-white p-4 sm:p-5 shadow-[4px_4px_0px_#0f172a] flex flex-col justify-between">
                                <div>
                                    <span className="border-2 border-slate-900 bg-sky-400 px-2 py-0.5 font-mono text-[10px] font-black uppercase text-slate-900 inline-block mb-2">
                                        Software Lead
                                    </span>
                                    <h3 className="text-base sm:text-lg font-black uppercase text-slate-900">Arya</h3>
                                    <p className="mt-1 font-mono text-xs font-bold text-slate-600">ROS, ML, Agentic AI &amp; Perception Track</p>
                                </div>
                                <div className="mt-4 pt-3 border-t-2 border-slate-200">
                                    <a
                                        href="tel:9994399419"
                                        className="press flex items-center justify-between border-2 border-slate-900 bg-slate-900 px-3.5 py-2.5 font-mono text-xs font-black uppercase text-amber-300 shadow-[2px_2px_0px_#0ea5e9] hover:bg-slate-800"
                                    >
                                        <span>+91 99943 99419</span>
                                        <span className="text-[10px] text-white font-mono">Call →</span>
                                    </a>
                                </div>
                            </div>

                            {/* Ratheeshwar S */}
                            <div className="border-3 border-slate-900 bg-white p-4 sm:p-5 shadow-[4px_4px_0px_#0f172a] flex flex-col justify-between">
                                <div>
                                    <span className="border-2 border-slate-900 bg-sky-400 px-2 py-0.5 font-mono text-[10px] font-black uppercase text-slate-900 inline-block mb-2">
                                        Software Lead
                                    </span>
                                    <h3 className="text-base sm:text-lg font-black uppercase text-slate-900">Ratheeshwar S</h3>
                                    <p className="mt-1 font-mono text-xs font-bold text-slate-600">Autonomous Stack, CV &amp; System Design</p>
                                </div>
                                <div className="mt-4 pt-3 border-t-2 border-slate-200">
                                    <a
                                        href="tel:8608944644"
                                        className="press flex items-center justify-between border-2 border-slate-900 bg-slate-900 px-3.5 py-2.5 font-mono text-xs font-black uppercase text-amber-300 shadow-[2px_2px_0px_#0ea5e9] hover:bg-slate-800"
                                    >
                                        <span>+91 86089 44644</span>
                                        <span className="text-[10px] text-white font-mono">Call →</span>
                                    </a>
                                </div>
                            </div>

                            {/* Joel Anto Edwin */}
                            <div className="border-3 border-slate-900 bg-white p-4 sm:p-5 shadow-[4px_4px_0px_#0f172a] flex flex-col justify-between">
                                <div>
                                    <span className="border-2 border-slate-900 bg-amber-300 px-2 py-0.5 font-mono text-[10px] font-black uppercase text-slate-900 inline-block mb-2">
                                        Powertrain Lead
                                    </span>
                                    <h3 className="text-base sm:text-lg font-black uppercase text-slate-900">Joel Anto Edwin</h3>
                                    <p className="mt-1 font-mono text-xs font-bold text-slate-600">Circuits, Motors, Microcontrollers &amp; PCB Design</p>
                                </div>
                                <div className="mt-4 pt-3 border-t-2 border-slate-200">
                                    <a
                                        href="tel:7207960077"
                                        className="press flex items-center justify-between border-2 border-slate-900 bg-slate-900 px-3.5 py-2.5 font-mono text-xs font-black uppercase text-amber-300 shadow-[2px_2px_0px_#0ea5e9] hover:bg-slate-800"
                                    >
                                        <span>+91 72079 60077</span>
                                        <span className="text-[10px] text-white font-mono">Call →</span>
                                    </a>
                                </div>
                            </div>
                        </div>
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
                            <ClosingDate className="mt-4" dark />
                        </div>
                        <button
                            type="button"
                            onClick={openRegister}
                            aria-haspopup="dialog"
                            className="press press-sky border-4 border-white bg-amber-300 px-8 py-4 text-lg font-black uppercase tracking-wide text-slate-900 shadow-[6px_6px_0px_#0ea5e9] hover:bg-amber-400"
                        >
                            Register ✦
                        </button>
                    </div>
                </section>

                {lookupOpen && <ReceiptLookupDialog onClose={() => setLookupOpen(false)} />}

                {/* Registration pop-up: Details -> Confirm -> Payment, sliding sideways. */}
                {registerOpen && (
                    <RegisterDialog step={stepFor(stage)} canClose={canClose} onClose={closeRegister}>
                        <form ref={formRef} onSubmit={handleConfirm} noValidate className="flex h-full flex-col">
                            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
                                {!anyPriced && (
                                    <p className="mb-5 border-2 border-slate-900 bg-amber-100 p-3 font-mono text-xs font-black uppercase">
                                        Prices are yet to be announced. Payments open as soon as they are.
                                    </p>
                                )}
                                <ClosingDate className="mb-5" />

                                {/* Package first: it is what they came here to pick. */}
                                <fieldset data-field-wrap>
                                    <legend className="mb-2 font-mono text-xs font-black uppercase tracking-widest text-slate-700">1. Choose your track</legend>
                                    <div className="grid grid-cols-1 gap-2.5">
                                        {WORKSHOP_PACKAGES.map((pkg, index) => {
                                            const selected = form.package === pkg.id;
                                            const isCombo = pkg.id === COMBO_PACKAGE?.id;
                                            return (
                                                <label
                                                    key={pkg.id}
                                                    className={`press flex min-h-14 cursor-pointer items-center justify-between gap-3 border-2 p-3.5 ${fieldErrors.package ? 'border-red-600' : 'border-slate-950'
                                                        } ${selected ? 'bg-amber-300 shadow-[4px_4px_0px_#0f172a]' : 'bg-slate-50 hover:bg-amber-50'}`}
                                                >
                                                    <span className="flex min-w-0 items-center gap-3">
                                                        <input
                                                            type="radio"
                                                            name="package"
                                                            value={pkg.id}
                                                            checked={selected}
                                                            onChange={() => updateField('package', pkg.id)}
                                                            data-field={index === 0 ? 'package' : undefined}
                                                            className="h-5 w-5 shrink-0 accent-slate-900"
                                                        />
                                                        <span className="min-w-0">
                                                            {isCombo && (
                                                                <span className="mb-1 flex flex-wrap gap-1.5">
                                                                    <span className="border-2 border-slate-900 bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-black uppercase text-amber-300">★ Recommended</span>
                                                                    {COMBO_SAVING > 0 && (
                                                                        <span className="border-2 border-slate-900 bg-green-400 px-1.5 py-0.5 font-mono text-[10px] font-black uppercase text-slate-900">Save {formatRupees(COMBO_SAVING)}</span>
                                                                    )}
                                                                </span>
                                                            )}
                                                            <span className="block text-sm font-black uppercase">{pkg.name}</span>
                                                            {pkg.tracksIncluded.length > 1 && (
                                                                <span className="block font-mono text-[11px] font-bold text-slate-600">
                                                                    {pkg.tracksIncluded.map(id => WORKSHOP_TRACKS[id].name).join(' + ')}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </span>
                                                    <span className="shrink-0 text-right font-mono">
                                                        {isCombo && (
                                                            <span className="block text-xs font-bold text-slate-500 line-through">₹2,000</span>
                                                        )}
                                                        <span className="text-base font-black sm:text-lg">{formatPrice(pkg)}</span>
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    {fieldErrors.package && <p className="mt-2 font-mono text-xs font-black text-red-600">{fieldErrors.package}</p>}
                                </fieldset>

                                <p className="mb-2 mt-6 font-mono text-xs font-black uppercase tracking-widest text-slate-700">2. Your details</p>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Field label="Full name" error={fieldErrors.name}>
                                        <input data-field="name" className={inputClass(fieldErrors.name)} value={form.name} onChange={e => updateField('name', e.target.value)} autoComplete="name" autoCapitalize="words" enterKeyHint="next" maxLength={100} placeholder="As on your ID card" />
                                    </Field>
                                    <Field label="Registered number" error={fieldErrors.rollNo}>
                                        <input data-field="rollNo" className={inputClass(fieldErrors.rollNo)} value={form.rollNo} onChange={e => updateField('rollNo', e.target.value)} autoComplete="off" autoCapitalize="characters" autoCorrect="off" spellCheck={false} enterKeyHint="next" maxLength={40} placeholder="College register number" />
                                    </Field>
                                    <Field label="Department" error={fieldErrors.department}>
                                        <select data-field="department" className={inputClass(fieldErrors.department)} value={form.department} onChange={e => updateField('department', e.target.value)}>
                                            <option value="" disabled>Select department</option>
                                            {WORKSHOP_DEPARTMENTS.map(dept => (
                                                <option key={dept} value={dept}>{dept}</option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="Year" error={fieldErrors.year}>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['1', '2'].map(y => (
                                                <button
                                                    key={y}
                                                    type="button"
                                                    onClick={() => updateField('year', y)}
                                                    aria-pressed={form.year === y}
                                                    data-field={y === '1' ? 'year' : undefined}
                                                    className={`press min-h-12 border-2 p-3 font-mono text-sm font-black uppercase ${fieldErrors.year ? 'border-red-600' : 'border-slate-950'
                                                        } ${form.year === y ? 'bg-sky-500 text-white' : fieldErrors.year ? 'bg-red-50 hover:bg-sky-100' : 'bg-slate-50 hover:bg-sky-100'
                                                        }`}
                                                >
                                                    {y === '1' ? '1st year' : '2nd year'}
                                                </button>
                                            ))}
                                        </div>
                                    </Field>
                                    <Field label="Email ID" error={fieldErrors.email}>
                                        <input data-field="email" type="email" inputMode="email" className={inputClass(fieldErrors.email)} value={form.email} onChange={e => updateField('email', e.target.value)} autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="next" maxLength={254} placeholder="you@example.com" />
                                    </Field>
                                    <Field label="Phone" error={fieldErrors.phone}>
                                        <input data-field="phone" type="tel" inputMode="tel" className={inputClass(fieldErrors.phone)} value={form.phone} onChange={e => updateField('phone', e.target.value)} autoComplete="tel" enterKeyHint="done" maxLength={20} placeholder="10-digit mobile number" />
                                    </Field>
                                </div>
                            </div>

                            {/* Pinned to the bottom so the button is always in thumb reach. */}
                            <div className="relative border-t-4 border-slate-900 bg-slate-50 p-3 sm:p-4">
                                {upsellOpen && stage === 'form' && (
                                    <UpsellPopover
                                        offer={upsellFor(selectedPkg)}
                                        onAccept={acceptUpsell}
                                        onDecline={() => { setUpsellOpen(false); setStage('review'); }}
                                        onDismiss={() => setUpsellOpen(false)}
                                    />
                                )}
                                {error && stage === 'form' && (
                                    <p className="mb-3 border-2 border-red-600 bg-red-50 p-2.5 font-mono text-xs font-black text-red-700">{error}</p>
                                )}
                                <button type="submit" className="press min-h-12 w-full border-2 border-slate-900 bg-slate-900 px-5 py-3.5 font-mono text-sm font-black uppercase text-amber-300 shadow-[4px_4px_0px_#0284c7] hover:bg-slate-800">
                                    Review &amp; continue →
                                </button>
                            </div>
                        </form>

                        <ReviewPanel
                            form={form}
                            pkg={selectedPkg}
                            error={stage === 'review' || stage === 'paying' ? error : ''}
                            busy={stage === 'paying'}
                            onEdit={() => { setError(''); setStage('form'); }}
                            onPay={handlePay}
                        />

                        <PaymentPanel
                            stage={stage}
                            registration={registration}
                            form={form}
                            onRegisterAnother={resetForm}
                            onClose={closeRegister}
                        />
                    </RegisterDialog>
                )}
            </main>
        </div>
    );
}

function TrackDetail({ track, onRegister }) {
    const isSoftware = track.id === 'software';
    const otherTrackName = isSoftware ? 'Powertrain' : 'Software';
    const facts = [
        ['Dates', track.dates],
        ['Schedule', track.days],
        ['Timing', track.timing],
        ['Price', formatPrice(WORKSHOP_PACKAGES.find(p => p.id === track.id))]
    ];

    return (
        <article className="mt-8 border-4 border-slate-900 bg-white p-5 shadow-[8px_8px_0px_#0f172a] sm:p-8 anim-pop" role="tabpanel">
            <h3 className="text-2xl font-black uppercase sm:text-4xl">{track.name}</h3>
            {track.tagline && (
                <p className="mt-2 text-base font-bold text-sky-700 sm:text-lg">{track.tagline}</p>
            )}
            <p className="mt-2 max-w-3xl text-sm font-bold leading-relaxed text-slate-600 sm:text-base">{track.overview}</p>
            {track.highlight && (
                <p className="mt-4 inline-block border-2 border-slate-900 bg-green-400 px-3 py-1.5 font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#0f172a]">
                    ⏱ {track.highlight}
                </p>
            )}

            <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {facts.map(([label, value]) => (
                    <div key={label} className={`border-2 border-slate-900 p-3 ${label === 'Price' ? 'bg-amber-300' : 'bg-sky-50'}`}>
                        <dt className="font-mono text-[10px] font-black uppercase tracking-widest text-slate-600">{label}</dt>
                        <dd className="mt-1 text-sm font-black">{value}</dd>
                    </div>
                ))}
            </dl>
            <p className="mt-3 font-mono text-xs font-bold text-slate-600">{track.audience}</p>

            <h4 className="mt-6 font-mono text-xs font-black uppercase tracking-widest text-sky-600">What you will learn</h4>
            <p className="mt-2 text-sm font-bold leading-relaxed text-slate-700">
                {track.topics.map(topic => topic.title).join(' · ')}.
            </p>
            <p className="mt-1 text-xs font-bold text-slate-500">Full topic list and weekly plan in the syllabus PDF.</p>

            {/* Handbook & guided resources note */}
            <div className="mt-5 inline-flex items-center gap-2 border-2 border-slate-900 bg-sky-50 px-3.5 py-2 font-mono text-xs font-black uppercase text-slate-900 shadow-[2px_2px_0px_#0f172a]">
                <span className="text-sky-600">✦</span>
                <span>Handbook + guided resources included.</span>
            </div>

            {/* Cross-track combo offer card */}
            <div className="mt-6 border-3 border-dashed border-slate-900 bg-amber-50 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <span className="font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-900">
                            ★ Dual-Track Bundle Discount
                        </span>
                        <p className="mt-0.5 text-base sm:text-lg font-black uppercase text-slate-900">
                            Want both tracks? Add {otherTrackName} for just ₹750 more →
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-600">
                            Get Software + Powertrain for ₹1,750 (Save ₹250). Includes both full tracks and all bonus sessions.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onRegister('combo')}
                        className="press shrink-0 border-2 border-slate-900 bg-amber-300 px-4 py-2.5 font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#0f172a] hover:bg-amber-400"
                    >
                        Get Combo (₹1,750) ✦
                    </button>
                </div>
            </div>

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
                <button type="button" onClick={() => onRegister(track.id)} className="press border-2 border-slate-900 bg-amber-300 px-5 py-3 font-mono text-xs font-black uppercase shadow-[4px_4px_0px_#0f172a] hover:bg-amber-400">
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
        <label className="block" data-field-wrap>
            <span className="mb-1.5 block font-mono text-xs font-black uppercase tracking-widest text-slate-700">{label}</span>
            {children}
            {error && <span className="mt-1 block font-mono text-xs font-black text-red-600">{error}</span>}
        </label>
    );
}

function ClosingDate({ className = '', dark = false }) {
    return (
        <p className={`inline-flex items-center gap-2 border-2 px-3 py-1.5 font-mono text-xs font-black uppercase ${dark ? 'border-amber-300 text-amber-300' : 'border-slate-900 bg-white text-slate-900'
            } ${className}`}>
            <span aria-hidden="true">⏳</span>
            Registration closes on {REGISTRATION_CLOSES}
        </p>
    );
}

/* Small card that rises out of the Review & continue button when one track is
   picked. It sits inside the pop-up footer, so the form stays visible. */
function UpsellPopover({ offer, onAccept, onDecline, onDismiss }) {
    if (!offer) return null;
    return (
        <div
            role="dialog"
            aria-label="Add the other track"
            className="anim-pop absolute bottom-full right-3 left-3 z-10 mb-2 border-4 border-slate-900 bg-white p-4 shadow-[6px_6px_0px_#16a34a] sm:left-auto sm:right-4 sm:w-96"
        >
            <button type="button" onClick={onDismiss} aria-label="Close offer" className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center font-black text-slate-500 hover:text-slate-900">
                ✕
            </button>
            <span className="inline-block border-2 border-slate-900 bg-green-400 px-1.5 py-0.5 font-mono text-[10px] font-black uppercase">
                Save {formatRupees(COMBO_SAVING)}
            </span>
            <p className="mt-2 pr-6 text-base font-black uppercase leading-tight">
                Only {formatRupees(offer.extra)} more for {offer.other.name}
            </p>
            <p className="mt-1.5 text-sm font-bold text-slate-600">
                Get both tracks for {formatPrice(COMBO_PACKAGE)}. This {formatRupees(COMBO_SAVING)} saving is lost if you don’t add it now.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button type="button" onClick={onAccept} className="press min-h-11 border-2 border-slate-900 bg-green-400 px-3 py-2 font-mono text-[11px] font-black uppercase shadow-[3px_3px_0px_#0f172a] hover:bg-green-300">
                    Add both →
                </button>
                <button type="button" onClick={onDecline} className="press min-h-11 border-2 border-slate-900 bg-white px-3 py-2 font-mono text-[11px] font-black uppercase hover:bg-slate-100">
                    Continue with one
                </button>
            </div>
            {/* Arrow pointing down at the button. */}
            <span aria-hidden="true" className="absolute -bottom-[11px] right-10 h-4 w-4 rotate-45 border-b-4 border-r-4 border-slate-900 bg-white" />
        </div>
    );
}

/* Full-screen sheet on phones, centred card from sm up. The three children are
   laid side by side and the row slides left one slide per step; each slide
   scrolls on its own, so the buttons pinned at the bottom never move. */
// Page behind a pop-up stays still; Escape closes it when allowed.
function useModal(canClose, onClose) {
    useEffect(() => {
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.lenis?.stop();
        return () => {
            document.body.style.overflow = prevOverflow;
            window.lenis?.start();
        };
    }, []);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape' && canClose) onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [canClose, onClose]);
}

function RegisterDialog({ step, canClose, onClose, children }) {
    const slides = Array.isArray(children) ? children : [children];
    const slideRefs = useRef([]);
    useModal(canClose, onClose);

    // Keyboard / screen-reader focus follows the slide that is showing.
    useEffect(() => {
        slideRefs.current[step]?.focus({ preventScroll: true });
    }, [step]);

    return createPortal(
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm anim-fade sm:p-6"
            onClick={() => { if (canClose) onClose(); }}
            data-lenis-prevent
            role="dialog"
            aria-modal="true"
            aria-labelledby="workshop-register-title"
        >
            <div
                className="anim-pop-center flex h-[100dvh] w-full flex-col bg-white sm:h-[min(88vh,780px)] sm:max-w-2xl sm:border-4 sm:border-slate-900"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between gap-3 bg-slate-900 px-4 py-3 text-white">
                    <div className="min-w-0">
                        <span className="block font-mono text-[10px] font-black uppercase tracking-widest text-amber-300">Workshop 2026</span>
                        <h2 id="workshop-register-title" className="truncate text-base font-black uppercase sm:text-lg">Register for the workshop</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={!canClose}
                        aria-label="Close registration"
                        className="press press-flat flex h-9 w-9 shrink-0 items-center justify-center border-2 border-white bg-rose-500 font-sans text-base font-bold text-white hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <span aria-hidden="true">✕</span>
                    </button>
                </div>

                <ol className="grid grid-cols-3 border-b-4 border-slate-900 font-mono text-[11px] font-black uppercase">
                    {STEPS.map((label, i) => (
                        <li
                            key={label}
                            aria-current={i === step ? 'step' : undefined}
                            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 transition-colors ${i > 0 ? 'border-l-2 border-slate-900' : ''} ${i === step ? 'bg-amber-300 text-slate-900' : i < step ? 'bg-sky-100 text-slate-700' : 'bg-white text-slate-400'
                                }`}
                        >
                            <span>{i < step ? '✓' : i + 1}</span>
                            <span>{label}</span>
                        </li>
                    ))}
                </ol>

                <div className="relative min-h-0 flex-1 overflow-hidden">
                    <div
                        className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
                        style={{ width: `${slides.length * 100}%`, transform: `translateX(-${(step * 100) / slides.length}%)` }}
                    >
                        {slides.map((slide, i) => (
                            <div
                                key={i}
                                ref={el => { slideRefs.current[i] = el; }}
                                tabIndex={-1}
                                inert={i !== step}
                                aria-hidden={i !== step}
                                className="h-full min-w-0 outline-none"
                                style={{ width: `${100 / slides.length}%` }}
                            >
                                {slide}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>,
        document.body
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
        ['Track', pkg?.name]
    ];

    return (
        <div className="flex h-full flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
                <p className="font-mono text-xs font-black uppercase tracking-widest text-sky-600">Check your details before paying</p>
                <dl className="mt-3 divide-y-2 divide-slate-200 border-2 border-slate-900">
                    {rows.map(([label, value]) => (
                        <div key={label} className="grid grid-cols-[6.5rem_1fr] gap-3 p-3 sm:grid-cols-[9rem_1fr]">
                            <dt className="font-mono text-xs font-black uppercase text-slate-500">{label}</dt>
                            <dd className="min-w-0 break-words text-sm font-black">{value}</dd>
                        </div>
                    ))}
                    <div className="grid grid-cols-[6.5rem_1fr] gap-3 bg-amber-300 p-3 sm:grid-cols-[9rem_1fr]">
                        <dt className="font-mono text-xs font-black uppercase">Amount</dt>
                        <dd className="font-mono text-lg font-black">
                            {formatPrice(pkg)}
                            {pkg?.id === COMBO_PACKAGE?.id && COMBO_SAVING > 0 && (
                                <span className="ml-2 border-2 border-slate-900 bg-green-400 px-1.5 py-0.5 align-middle text-[10px] uppercase">You save {formatRupees(COMBO_SAVING)}</span>
                            )}
                        </dd>
                    </div>
                </dl>
                <p className="mt-4 font-mono text-[10px] font-bold uppercase text-slate-500">
                    Payments are processed by Razorpay. Team Asterix never sees your card or UPI details.
                </p>
            </div>

            <div className="border-t-4 border-slate-900 bg-slate-50 p-3 sm:p-4">
                {error && <p className="mb-3 border-2 border-red-600 bg-red-50 p-2.5 font-mono text-xs font-black text-red-700">{error}</p>}
                <div className="grid grid-cols-[auto_1fr] gap-3">
                    <button type="button" onClick={onEdit} disabled={busy} className="press min-h-12 border-2 border-slate-900 bg-white px-4 py-3 font-mono text-xs font-black uppercase shadow-[4px_4px_0px_#0f172a] hover:bg-sky-100 disabled:opacity-50">
                        ← Edit
                    </button>
                    <button type="button" onClick={onPay} disabled={busy || !PAYMENTS_ENABLED} className="press min-h-12 border-2 border-slate-900 bg-sky-500 px-5 py-3 font-mono text-sm font-black uppercase text-white shadow-[4px_4px_0px_#0f172a] hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-sky-500">
                        {busy ? 'Opening payment…' : `Pay ${formatPrice(pkg)} →`}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* Slide 3. Razorpay Checkout opens as its own secure window on top of this
   slide (it cannot be embedded), so while it is open this slide says so;
   once the payment is confirmed it becomes the receipt. */
function PaymentPanel({ stage, registration, form, onRegisterAnother, onClose }) {
    if (stage === 'success' && registration) {
        return <ReceiptPanel registration={registration} form={form} onRegisterAnother={onRegisterAnother} onClose={onClose} />;
    }
    if (stage === 'unconfirmed') {
        return (
            <StatusCard
                title="Payment is still being confirmed"
                body={`If money was deducted, your registration will be confirmed automatically within a few minutes. Do not pay again. If it still is not confirmed, contact the team with this reference: ${registration?.registrationId}.`}
            />
        );
    }
    if (stage === 'verifying') {
        return <StatusCard busy title="Confirming your payment…" body="Hold on, this only takes a few seconds. Please do not close this page." />;
    }
    return (
        <StatusCard
            busy={stage === 'paying'}
            title="Secure payment"
            body="Complete your payment in the Razorpay window. Your receipt appears here as soon as it is confirmed."
        />
    );
}

function ReceiptPanel({ registration, form, onRegisterAnother, onClose }) {
    /* The server's public view has no roll number, department or phone, so
       those come from the form just submitted (it is not cleared on success). */
    const rows = receiptRows({
        ...registration,
        name: registration.name || form.name,
        email: registration.email || form.email,
        rollNo: form.rollNo,
        department: form.department,
        year: form.year,
        phone: normalizePhone(form.phone)
    });
    const fileId = registration.receiptNo || registration.registrationId;

    return (
        <div className="flex h-full flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
                <div className="border-4 border-slate-900 bg-white shadow-[6px_6px_0px_#16a34a]">
                    <div className="border-b-4 border-slate-900 bg-green-400 p-4 sm:p-5">
                        <span className="font-mono text-xs font-black uppercase tracking-widest">✓ Payment confirmed</span>
                        <p className="mt-1 text-2xl font-black uppercase">You’re in, {registration.name?.split(' ')[0]}!</p>
                    </div>
                    <dl className="divide-y-2 divide-slate-200">
                        {rows.map(([label, value]) => (
                            <div key={label} className={`grid grid-cols-[6.5rem_1fr] gap-3 p-3 sm:grid-cols-[9rem_1fr] ${label === 'Amount paid' ? 'bg-amber-300' : ''}`}>
                                <dt className="font-mono text-xs font-black uppercase text-slate-500">{label}</dt>
                                <dd className="min-w-0 break-words font-mono text-sm font-black">{value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
                <p className="mt-4 text-sm font-bold text-slate-600">
                    Keep your receipt handy. Session details will be shared with you before the workshop begins.
                </p>
            </div>

            <div className="border-t-4 border-slate-900 bg-slate-50 p-3 sm:p-4">
                <button
                    type="button"
                    onClick={() => downloadReceipt(rows, fileId)}
                    className="press min-h-12 w-full border-2 border-slate-900 bg-slate-900 px-5 py-3.5 font-mono text-sm font-black uppercase text-amber-300 shadow-[4px_4px_0px_#16a34a] hover:bg-slate-800"
                >
                    Download receipt ↓
                </button>
                <div className="mt-3 grid grid-cols-2 gap-3">
                    <button type="button" onClick={onRegisterAnother} className="press min-h-11 border-2 border-slate-900 bg-white px-3 py-2 font-mono text-[11px] font-black uppercase shadow-[3px_3px_0px_#0f172a] hover:bg-sky-100">
                        Register another
                    </button>
                    <button type="button" onClick={onClose} className="press min-h-11 border-2 border-slate-900 bg-amber-300 px-3 py-2 font-mono text-[11px] font-black uppercase shadow-[3px_3px_0px_#0f172a] hover:bg-amber-400">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}

/* "Download receipt" for students who registered earlier: name + registered
   number in, their receipt(s) out. The server masks the email and phone. */
function ReceiptLookupDialog({ onClose }) {
    const [lookup, setLookup] = useState({ name: '', rollNo: '' });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [receipts, setReceipts] = useState(null);
    useModal(true, onClose);

    const update = (key, value) => {
        setLookup(prev => ({ ...prev, [key]: value }));
        setError('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (lookup.name.trim().length < 2 || !lookup.rollNo.trim()) {
            setError('Enter your full name and registered number.');
            return;
        }
        setBusy(true);
        setError('');
        try {
            const { ok, data } = await postJson('/api/workshop/receipt-lookup', lookup);
            if (ok && data.receipts?.length) setReceipts(data.receipts);
            else setError(data.error || 'No receipt found. Please try again.');
        } catch {
            setError('Could not reach the server. Check your connection and try again.');
        } finally {
            setBusy(false);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm anim-fade sm:p-6"
            onClick={onClose}
            data-lenis-prevent
            role="dialog"
            aria-modal="true"
            aria-labelledby="workshop-receipt-title"
        >
            <div
                className="anim-pop-center flex max-h-[90dvh] w-full max-w-lg flex-col border-4 border-slate-900 bg-white shadow-[10px_10px_0px_#16a34a]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between gap-3 bg-slate-900 px-4 py-3 text-white">
                    <div className="min-w-0">
                        <span className="block font-mono text-[10px] font-black uppercase tracking-widest text-green-400">Already registered?</span>
                        <h2 id="workshop-receipt-title" className="truncate text-base font-black uppercase sm:text-lg">Download your receipt</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="press press-flat flex h-9 w-9 shrink-0 items-center justify-center border-2 border-white bg-rose-500 font-sans text-base font-bold text-white hover:bg-rose-600"
                    >
                        <span aria-hidden="true">✕</span>
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
                    {receipts ? (
                        <div className="space-y-5">
                            {receipts.map(record => {
                                const rows = receiptRows(record);
                                return (
                                    <div key={record.registrationId}>
                                        <dl className="divide-y-2 divide-slate-200 border-2 border-slate-900">
                                            {rows.map(([label, value]) => (
                                                <div key={label} className={`grid grid-cols-[6.5rem_1fr] gap-3 p-2.5 sm:grid-cols-[8rem_1fr] ${label === 'Amount paid' ? 'bg-amber-300' : ''}`}>
                                                    <dt className="font-mono text-[11px] font-black uppercase text-slate-500">{label}</dt>
                                                    <dd className="min-w-0 break-words font-mono text-sm font-black">{value}</dd>
                                                </div>
                                            ))}
                                        </dl>
                                        <button
                                            type="button"
                                            onClick={() => downloadReceipt(rows, record.receiptNo || record.registrationId)}
                                            className="press mt-3 min-h-12 w-full border-2 border-slate-900 bg-slate-900 px-5 py-3.5 font-mono text-sm font-black uppercase text-amber-300 shadow-[4px_4px_0px_#16a34a] hover:bg-slate-800"
                                        >
                                            Download receipt ↓
                                        </button>
                                    </div>
                                );
                            })}
                            <button type="button" onClick={() => setReceipts(null)} className="font-mono text-xs font-black uppercase text-sky-700 underline">
                                ← Look up a different registration
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} noValidate className="space-y-4">
                            <p className="text-sm font-bold text-slate-600">
                                Enter the name and registered number you used when you registered.
                            </p>
                            <Field label="Full name">
                                <input className={inputClass(false)} value={lookup.name} onChange={e => update('name', e.target.value)} autoComplete="name" autoCapitalize="words" enterKeyHint="next" maxLength={100} placeholder="As entered while registering" />
                            </Field>
                            <Field label="Registered number">
                                <input className={inputClass(false)} value={lookup.rollNo} onChange={e => update('rollNo', e.target.value)} autoComplete="off" autoCapitalize="characters" autoCorrect="off" spellCheck={false} enterKeyHint="search" maxLength={40} placeholder="College register number" />
                            </Field>
                            {error && <p className="border-2 border-red-600 bg-red-50 p-2.5 font-mono text-xs font-black text-red-700" role="alert">{error}</p>}
                            <button type="submit" disabled={busy} className="press min-h-12 w-full border-2 border-slate-900 bg-green-400 px-5 py-3.5 font-mono text-sm font-black uppercase shadow-[4px_4px_0px_#0f172a] hover:bg-green-300 disabled:cursor-wait disabled:opacity-60">
                                {busy ? 'Looking up…' : 'Find my receipt →'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

function StatusCard({ title, body, busy = false }) {
    return (
        <div className="flex h-full items-center justify-center p-4 sm:p-6">
            <div className="w-full border-4 border-slate-900 bg-white p-6 shadow-[8px_8px_0px_#0f172a]" role="status">
                {busy && <span className="mb-4 block h-8 w-8 animate-spin border-4 border-slate-900 border-t-amber-300" aria-hidden="true" />}
                <p className="text-xl font-black uppercase">{title}</p>
                <p className="mt-2 text-sm font-bold text-slate-600">{body}</p>
            </div>
        </div>
    );
}
