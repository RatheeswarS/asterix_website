import { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import { apiUrl } from '../../lib/api';
import { AUTH_TOKEN_KEY } from '../../context/WebsiteDataContext';

export default function WorkshopAttendanceProjector({ onExit, initialTrack = 'software' }) {
    const [track, setTrack] = useState(initialTrack);
    const [sessionNumber, setSessionNumber] = useState(1);
    const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [sessionTopic, setSessionTopic] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Dynamic QR & Timer state
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [countdownSeconds, setCountdownSeconds] = useState(12);
    const [scanUrl, setScanUrl] = useState('');
    const [error, setError] = useState('');

    // Live Attendance stream
    const [liveStats, setLiveStats] = useState({
        totalEligible: 0,
        totalPresent: 0,
        percentage: 0,
        recentCheckins: []
    });

    const projectorRef = useRef(null);
    const sessionId = `${track}-s${String(sessionNumber).padStart(2, '0')}-${sessionDate}`;

    // Fetch token & generate QR
    const fetchRotatingToken = useCallback(async () => {
        try {
            const token = sessionStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem('admin_token');
            if (!token) {
                setError('Admin session expired. Please sign in again.');
                return;
            }

            const query = new URLSearchParams({
                track,
                sessionNumber: String(sessionNumber),
                sessionDate,
                sessionTopic
            });

            const res = await fetch(apiUrl(`/api/workshop/attendance/session-token?${query.toString()}`), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `Server HTTP ${res.status}`);
            }

            const data = await res.json();
            setScanUrl(data.scanUrl);
            setCountdownSeconds(12);

            // Generate crisp high-resolution QR Code
            const url = await QRCode.toDataURL(data.scanUrl, {
                width: 900,
                margin: 2,
                color: {
                    dark: '#0f172a',
                    light: '#ffffff'
                },
                errorCorrectionLevel: 'M'
            });
            setQrDataUrl(url);
            setError('');
        } catch (err) {
            console.error('Error fetching rotating attendance token:', err);
            setError(err.message);
        }
    }, [track, sessionNumber, sessionDate, sessionTopic]);

    // Poll live attendance numbers every 3 seconds
    const fetchLiveStatus = useCallback(async () => {
        try {
            const token = sessionStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem('admin_token');
            if (!token) return;

            const res = await fetch(apiUrl(`/api/workshop/attendance/live-status?sessionId=${encodeURIComponent(sessionId)}`), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setLiveStats({
                    totalEligible: data.totalEligible || 0,
                    totalPresent: data.totalPresent || 0,
                    percentage: data.percentage || 0,
                    recentCheckins: data.recentCheckins || []
                });
            }
        } catch {
            // silent poll error
        }
    }, [sessionId]);

    // 12-second countdown and rotation timer
    useEffect(() => {
        fetchRotatingToken();
        fetchLiveStatus();

        // 1-second interval to update countdown number
        const countdownTimer = setInterval(() => {
            setCountdownSeconds((prev) => {
                if (prev <= 1) {
                    fetchRotatingToken();
                    return 12;
                }
                return prev - 1;
            });
        }, 1000);

        // 3-second live status refresh
        const pollTimer = setInterval(fetchLiveStatus, 3000);

        return () => {
            clearInterval(countdownTimer);
            clearInterval(pollTimer);
        };
    }, [fetchRotatingToken, fetchLiveStatus]);

    // Fullscreen toggle handler
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            projectorRef.current?.requestFullscreen?.().catch(() => {});
            setIsFullscreen(true);
        } else {
            document.exitFullscreen?.().catch(() => {});
            setIsFullscreen(false);
        }
    };

    return (
        <div
            ref={projectorRef}
            className="min-h-screen bg-slate-950 text-white font-mono flex flex-col justify-between p-4 sm:p-8 select-none"
        >
            {/* Top Control Bar */}
            <header className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <div>
                        <h1 className="text-lg sm:text-2xl font-black uppercase tracking-wider text-white">
                            Team Asterix — Workshop Attendance Projector
                        </h1>
                        <p className="text-xs text-slate-400 font-bold">
                            Live dynamic QR code rotates every 12 seconds.
                        </p>
                    </div>
                </div>

                {/* Session Selectors */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* Track Toggle */}
                    <div className="inline-flex border-2 border-slate-700 bg-slate-900 p-0.5 font-black uppercase">
                        <button
                            type="button"
                            onClick={() => setTrack('software')}
                            className={`px-3 py-1.5 cursor-pointer transition-colors ${
                                track === 'software' ? 'bg-sky-400 text-slate-950 shadow-[1px_1px_0px_#ffffff]' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            Software
                        </button>
                        <button
                            type="button"
                            onClick={() => setTrack('powertrain')}
                            className={`px-3 py-1.5 cursor-pointer transition-colors ${
                                track === 'powertrain' ? 'bg-amber-400 text-slate-950 shadow-[1px_1px_0px_#ffffff]' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            Powertrain
                        </button>
                    </div>

                    {/* Session Number */}
                    <div className="flex items-center gap-1 bg-slate-900 border-2 border-slate-700 px-2 py-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Session:</span>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={sessionNumber}
                            onChange={(e) => setSessionNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            className="w-12 bg-transparent text-white font-black text-center focus:outline-none"
                        />
                    </div>

                    {/* Session Date */}
                    <div className="flex items-center gap-1 bg-slate-900 border-2 border-slate-700 px-2 py-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Date:</span>
                        <input
                            type="date"
                            value={sessionDate}
                            onChange={(e) => setSessionDate(e.target.value)}
                            className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer"
                        />
                    </div>

                    {/* Session Topic */}
                    <div className="hidden xl:flex items-center gap-1 bg-slate-900 border-2 border-slate-700 px-2 py-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Topic:</span>
                        <input
                            type="text"
                            value={sessionTopic}
                            placeholder="Optional topic..."
                            onChange={(e) => setSessionTopic(e.target.value)}
                            className="bg-transparent text-white font-mono text-xs focus:outline-none w-32"
                        />
                    </div>

                    {/* Fullscreen Button */}
                    <button
                        type="button"
                        onClick={toggleFullscreen}
                        className="press px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 text-white font-black uppercase text-xs cursor-pointer"
                    >
                        {isFullscreen ? 'Exit Fullscreen ↙' : 'Fullscreen ↗'}
                    </button>

                    {/* Exit Projector View */}
                    {onExit && (
                        <button
                            type="button"
                            onClick={onExit}
                            className="press px-3 py-1.5 bg-rose-500 hover:bg-rose-400 border-2 border-slate-700 text-white font-black uppercase text-xs cursor-pointer"
                        >
                            Close ✕
                        </button>
                    )}
                </div>
            </header>

            {/* Main Center Area */}
            <main className="my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center max-w-[1600px] w-full mx-auto">
                {/* QR Code Presentation (Dominant Left / Center - 8 cols) */}
                <div className="lg:col-span-8 flex flex-col items-center justify-center space-y-4">
                    {/* Track & Session Header Banner */}
                    <div className={`px-4 py-1.5 border-2 border-slate-900 font-black text-xs sm:text-sm uppercase tracking-widest ${
                        track === 'software' ? 'bg-sky-400 text-slate-950' : 'bg-amber-400 text-slate-950'
                    }`}>
                        {track === 'software' ? 'Software & Perception Workshop' : 'Electronics & Powertrain Workshop'} · Session {String(sessionNumber).padStart(2, '0')}
                    </div>

                    {/* Dynamic QR Container - Enlarged for Large Screen Visibility */}
                    <div className="p-4 sm:p-6 lg:p-8 bg-white border-4 border-slate-900 shadow-[10px_10px_0px_#38bdf8] flex flex-col items-center">
                        {qrDataUrl ? (
                            <img
                                src={qrDataUrl}
                                alt="Live Attendance QR Code"
                                className="w-[300px] h-[300px] sm:w-[460px] sm:h-[460px] md:w-[540px] md:h-[540px] lg:w-[580px] lg:h-[580px] xl:w-[640px] xl:h-[640px] object-contain transition-opacity duration-200"
                            />
                        ) : (
                            <div className="w-[300px] h-[300px] sm:w-[460px] sm:h-[460px] md:w-[540px] md:h-[540px] lg:w-[580px] lg:h-[580px] xl:w-[640px] xl:h-[640px] flex items-center justify-center text-slate-400 font-bold text-base">
                                Generating QR Code...
                            </div>
                        )}

                        {/* Clean 12-Second Countdown Timer */}
                        <div className="mt-4 flex items-center gap-2 font-mono text-xs sm:text-sm font-black text-slate-800 bg-slate-100 px-4 py-1.5 border border-slate-400">
                            <span>⏱ Code refreshes in:</span>
                            <span className="text-rose-600 text-base font-black w-7 text-center">
                                {countdownSeconds}s
                            </span>
                        </div>
                    </div>

                    <div className="text-center text-xs sm:text-sm text-slate-400 space-y-1">
                        <p className="font-bold text-slate-200">
                            Scan with your mobile camera to check in
                        </p>
                        <p className="text-[11px] sm:text-xs text-slate-400">
                            Enter your Roll Number and College Email to record attendance
                        </p>
                    </div>

                    {error && (
                        <div className="px-3 py-1.5 bg-rose-950 border border-rose-600 text-rose-300 text-xs font-bold">
                            ⚠️ {error}
                        </div>
                    )}
                </div>

                {/* Right Column: Live Attendance Stats & Recent Ticker (4 cols) */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Live Metric Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-slate-900 border-2 border-slate-800 shadow-[4px_4px_0px_#0284c7]">
                            <span className="text-[10px] uppercase tracking-wider text-sky-400 font-black block">
                                Present In Class
                            </span>
                            <span className="text-4xl font-black text-white">
                                {liveStats.totalPresent}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-1">
                                of {liveStats.totalEligible} enrolled
                            </span>
                        </div>

                        <div className="p-4 bg-slate-900 border-2 border-slate-800 shadow-[4px_4px_0px_#10b981]">
                            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-black block">
                                Attendance Rate
                            </span>
                            <span className="text-4xl font-black text-emerald-400">
                                {liveStats.percentage}%
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-1">
                                quorum progress
                            </span>
                        </div>
                    </div>

                    {/* Live Attendance Stream / Ticker */}
                    <div className="p-4 bg-slate-900 border-2 border-slate-800 shadow-[4px_4px_0px_#0f172a] space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="text-xs font-black uppercase text-slate-300 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                Live Check-In Ticker
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold">
                                {liveStats.recentCheckins.length} recent
                            </span>
                        </div>

                        {liveStats.recentCheckins.length === 0 ? (
                            <div className="py-8 text-center text-xs text-slate-500">
                                Awaiting student scans...
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                {liveStats.recentCheckins.map((item, idx) => (
                                    <div
                                        key={item.rollNo || idx}
                                        className="p-2 bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                                    >
                                        <div className="flex items-center gap-2 truncate pr-2">
                                            <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-700 text-[10px] font-black">
                                                ✓
                                            </span>
                                            <div className="truncate">
                                                <div className="font-black text-white truncate text-[11px]">
                                                    {item.name}
                                                </div>
                                                <div className="text-[9px] text-slate-400">
                                                    {item.rollNo} · {item.department}
                                                </div>
                                            </div>
                                        </div>

                                        <span className="text-[9px] text-slate-500 shrink-0 font-mono">
                                            {item.checkedInAt ? new Date(item.checkedInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Bottom Status Bar */}
            <footer className="border-t-2 border-slate-800 pt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-bold">
                <div>
                    Session ID: <strong className="text-slate-300 font-mono">{sessionId}</strong>
                </div>
                <div>
                    Indian Standard Time (IST)
                </div>
            </footer>
        </div>
    );
}
