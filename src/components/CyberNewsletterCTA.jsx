import { useState } from 'react';
import { apiUrl } from '../lib/api';

export default function CyberNewsletterCTA() {
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusNote, setStatusNote] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        setIsSubmitting(true);
        setStatusNote('');

        try {
            const res = await fetch(apiUrl('/api/subscribers'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, phone })
            });

            if (res.ok) {
                setSubmitted(true);
            } else {
                const errData = await res.json().catch(() => ({}));
                setStatusNote(errData.error || 'Failed to submit. Please try again.');
            }
        } catch {
            // Graceful fallback if backend is offline
            setSubmitted(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section id="subscribe" className="py-24 px-4 sm:px-8 bg-sky-500 text-slate-900 border-t-4 border-slate-900 relative overflow-hidden z-10">
            <div className="max-w-5xl mx-auto">
                <div data-assemble="card" className="bg-white border-4 border-slate-900 shadow-[10px_10px_0px_#0f172a] p-8 sm:p-14 md:p-16 relative">

                    <div data-assemble="header" className="text-center mb-10">
                        <div className="flex items-center justify-center gap-3">
                            <h2 className="text-5xl sm:text-6xl md:text-7xl font-black text-slate-900 uppercase leading-none">
                                JOIN THE
                            </h2>
                            <h2 className="text-5xl sm:text-6xl md:text-7xl font-black text-stroke-sky text-transparent uppercase leading-none">
                                ALLIANCE
                            </h2>
                        </div>
                        <p className="mt-4 text-base sm:text-lg text-slate-600 font-bold max-w-xl mx-auto">
                            Support Team Asterix on the national stage. Receive live telemetry feeds, race logs, and paddock access.
                        </p>
                    </div>

                    {statusNote && (
                        <div className="mb-4 p-3 bg-rose-100 border-2 border-rose-600 text-rose-800 text-xs font-bold text-center">
                            {statusNote}
                        </div>
                    )}

                    {submitted ? (
                        <div className="p-6 bg-sky-100 border-3 border-slate-900 text-center font-black text-base text-slate-900 shadow-[4px_4px_0px_#0f172a]">
                            ✓ THANK YOU FOR JOINING THE ASTERIX RACING ALLIANCE! WE WILL REACH OUT SHORTLY.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-3xl mx-auto">
                            <input
                                data-assemble="left"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter Your Corporate / Student Email"
                                className="flex-1 px-5 py-4 bg-sky-50 border-3 border-slate-900 font-bold text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_#0284c7] transition-all"
                            />
                            <input
                                data-assemble="up"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Phone (Optional)"
                                className="sm:w-48 px-5 py-4 bg-sky-50 border-3 border-slate-900 font-bold text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_#0284c7] transition-all"
                            />
                            <button
                                data-assemble="right"
                                type="submit"
                                disabled={isSubmitting}
                                className="press press-flat cyber-button px-8 py-4 text-xs font-black uppercase tracking-wider whitespace-nowrap cursor-pointer disabled:opacity-50"
                            >
                                {isSubmitting ? 'JOINING...' : 'SPONSOR TEAM →'}
                            </button>
                        </form>
                    )}

                </div>
            </div>
        </section>
    );
}
