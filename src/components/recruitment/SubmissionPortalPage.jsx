import { useState, useMemo, useEffect } from 'react';
import { apiUrl } from '../../lib/api';
import {
    SOFTWARE_PERCEPTION_DATA,
    MECHANICAL_MYSTERY_DATA,
    SUBSYSTEM_LEADS
} from '../../data/recruitmentProblemStatements';

function normalizePhone(p) {
    if (!p) return '';
    return String(p).replace(/\D/g, '').slice(-10);
}

export default function SubmissionPortalPage({ onNavigateHome, onNavigateRecruitment }) {
    // Determine initial track from hash/url query if present (e.g. #submit?track=mechanical)
    const getInitialTrack = () => {
        const hash = window.location.hash || '';
        if (hash.includes('track=mechanical')) return 'mechanical';
        if (hash.includes('track=powertrain')) return 'powertrain';
        return 'software';
    };

    const [subsystem, setSubsystem] = useState(getInitialTrack);
    const [softwareCohort, setSoftwareCohort] = useState('ii'); // 'ii' or 'iii'
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedSubmitterIdx, setSelectedSubmitterIdx] = useState(0);
    const [phoneInput, setPhoneInput] = useState('');
    const [driveUrl, setDriveUrl] = useState('');
    const [notes, setNotes] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [submissionReceipt, setSubmissionReceipt] = useState(null);
    const [copiedReceipt, setCopiedReceipt] = useState(false);

    // Sync track if hash changes
    useEffect(() => {
        const handleHash = () => {
            const h = window.location.hash || '';
            if (h.includes('track=mechanical')) setSubsystem('mechanical');
            else if (h.includes('track=powertrain')) setSubsystem('powertrain');
            else if (h.includes('track=software')) setSubsystem('software');
        };
        window.addEventListener('hashchange', handleHash);
        return () => window.removeEventListener('hashchange', handleHash);
    }, []);

    // Teams for the chosen subsystem
    const availableTeams = useMemo(() => {
        if (subsystem === 'software') {
            return softwareCohort === 'ii'
                ? SOFTWARE_PERCEPTION_DATA.teamFormat.teamsIIYear
                : SOFTWARE_PERCEPTION_DATA.teamFormat.teamsIIIYear;
        }
        if (subsystem === 'mechanical') {
            return MECHANICAL_MYSTERY_DATA.teamFormat.teams;
        }
        return [];
    }, [subsystem, softwareCohort]);

    // Active team object
    const activeTeam = useMemo(() => {
        if (!selectedGroup) return null;
        return availableTeams.find((t) => t.group === selectedGroup) || null;
    }, [availableTeams, selectedGroup]);

    // Submitter and partner
    const currentSubmitter = activeTeam?.members?.[selectedSubmitterIdx] || null;
    const currentPartner = activeTeam?.members?.[selectedSubmitterIdx === 0 ? 1 : 0] || null;

    // Reset group selection on track/cohort change
    const handleSubsystemChange = (newSubsystem) => {
        setSubsystem(newSubsystem);
        setSelectedGroup('');
        setSelectedSubmitterIdx(0);
        setPhoneInput('');
        setFormError('');
    };

    const handleCohortChange = (newCohort) => {
        setSoftwareCohort(newCohort);
        setSelectedGroup('');
        setSelectedSubmitterIdx(0);
        setPhoneInput('');
        setFormError('');
    };

    const handleGroupChange = (groupName) => {
        setSelectedGroup(groupName);
        setSelectedSubmitterIdx(0);
        setPhoneInput('');
        setFormError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (subsystem !== 'powertrain' && !selectedGroup) {
            setFormError('Please select your allocated Duo Group.');
            return;
        }

        if (subsystem !== 'powertrain' && !currentSubmitter) {
            setFormError('Please choose which team member is submitting.');
            return;
        }

        const trimmedUrl = driveUrl.trim();
        if (!trimmedUrl) {
            setFormError('Please paste your Google Drive folder link.');
            return;
        }

        if (!trimmedUrl.toLowerCase().includes('drive.google.com')) {
            setFormError('Invalid link: Please provide a valid Google Drive URL (must contain drive.google.com).');
            return;
        }

        const cleanPhone = normalizePhone(phoneInput);
        if (cleanPhone.length < 10) {
            setFormError('Please enter a valid 10-digit phone number.');
            return;
        }

        // Phone security verification for known roster
        if (currentSubmitter) {
            const registeredPhone = normalizePhone(currentSubmitter.phone);
            if (registeredPhone && cleanPhone !== registeredPhone) {
                setFormError(
                    `Phone number verification failed. The phone number you entered does not match the registered contact for ${currentSubmitter.name}. Please enter your 10-digit number registered in the roster.`
                );
                return;
            }
        }

        setIsSubmitting(true);

        try {
            const payload = {
                subsystem,
                phase: 'phase1',
                cohort: subsystem === 'software' ? (softwareCohort === 'ii' ? 'II Year' : 'III Year') : 'General',
                group: activeTeam ? activeTeam.group : 'Open Submission',
                submitterName: currentSubmitter ? currentSubmitter.name : phoneInput,
                submitterPhone: cleanPhone,
                partnerName: currentPartner ? currentPartner.name : '',
                partnerDept: currentPartner ? currentPartner.dept : '',
                driveUrl: trimmedUrl,
                notes: notes.trim()
            };

            const res = await fetch(apiUrl('/api/submissions'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to submit. Please try again.');
            }

            setSubmissionReceipt({
                submissionId: data.submissionId,
                version: data.version || 1,
                isUpdate: data.isUpdate || false,
                timestamp: data.timestamp || new Date().toISOString(),
                subsystem,
                group: payload.group,
                submitterName: payload.submitterName,
                submitterPhone: cleanPhone,
                partnerName: payload.partnerName,
                driveUrl: trimmedUrl,
                notes: payload.notes
            });
        } catch (err) {
            console.error('Submission error:', err);
            setFormError(err.message || 'Could not reach server. Please check connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopyReceipt = () => {
        if (!submissionReceipt) return;
        const text = `[ASTERIX RECRUITMENT PHASE 1 SUBMISSION RECEIPT]
ID: ${submissionReceipt.submissionId}
Version: #${submissionReceipt.version} ${submissionReceipt.isUpdate ? '(Revision)' : '(Original)'}
Track: ${submissionReceipt.subsystem.toUpperCase()}
Group: ${submissionReceipt.group}
Submitted By: ${submissionReceipt.submitterName} (${submissionReceipt.submitterPhone})
Partner: ${submissionReceipt.partnerName || 'None'}
Drive URL: ${submissionReceipt.driveUrl}
Recorded At: ${new Date(submissionReceipt.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
Note: If multiple submissions are made, only the latest submission will be considered for evaluation.`;

        navigator.clipboard?.writeText?.(text);
        setCopiedReceipt(true);
        setTimeout(() => setCopiedReceipt(false), 2500);
    };

    const handleResetForNew = () => {
        setSubmissionReceipt(null);
        setDriveUrl('');
        setNotes('');
        setFormError('');
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-amber-400 selection:text-slate-900 pb-20">
            {/* Top Navigation Bar */}
            <header className="border-b-3 border-slate-950 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <a
                            href="#recruitment"
                            onClick={(e) => {
                                if (onNavigateRecruitment) {
                                    e.preventDefault();
                                    onNavigateRecruitment();
                                }
                            }}
                            className="press px-3 py-1.5 bg-white text-slate-900 border-2 border-slate-950 font-mono text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000]"
                        >
                            <span>←</span>
                            <span>Recruitment Tracks</span>
                        </a>
                        <span className="hidden sm:inline-block font-mono text-xs font-bold text-slate-400">
                            / Phase 01 Portal
                        </span>
                    </div>

                    <a
                        href="#"
                        onClick={(e) => {
                            if (onNavigateHome) {
                                e.preventDefault();
                                onNavigateHome();
                            }
                        }}
                        className="font-mono text-xs font-black text-amber-400 uppercase hover:underline"
                    >
                        Asterix Main Site ↗
                    </a>
                </div>
            </header>

            {/* Page Header */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400 text-slate-950 border-2 border-slate-950 font-mono text-xs font-black uppercase tracking-wider mb-4 shadow-[3px_3px_0px_#000]">
                    <span className="w-2 h-2 bg-slate-950 inline-block animate-pulse"></span>
                    OFFICIAL SUBMISSION PORTAL • PHASE 01
                </div>
                <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white font-mono leading-none">
                    Submit Your Team&apos;s Drive Link
                </h1>
                <p className="mt-3 text-sm sm:text-base font-bold text-slate-300 max-w-2xl leading-relaxed">
                    Paste your duo team&apos;s shared Google Drive folder containing your Phase 01 presentation slides, technical report, workflow diagrams, and research documentation.
                </p>

                {/* Submission Updates Notice Banner */}
                <div className="mt-6 p-4 bg-amber-500/15 border-2 border-amber-400 text-amber-200 text-xs font-bold space-y-1">
                    <div className="flex items-center gap-2 font-mono font-black uppercase tracking-wide text-amber-300">
                        <span>ℹ️ MULTIPLE SUBMISSIONS ALLOWED</span>
                    </div>
                    <p className="leading-relaxed">
                        Submissions can be made as many times as required before the deadline. <strong>Only your latest (last) submission will be considered</strong> for final evaluation.
                    </p>
                </div>
            </section>

            {/* Main Form or Receipt Card */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6">
                {submissionReceipt ? (
                    /* Success Receipt View */
                    <div className="bg-white text-slate-900 border-4 border-slate-950 p-6 sm:p-8 shadow-[8px_8px_0px_#f59e0b] space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-900 pb-4">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-none bg-emerald-500 text-white flex items-center justify-center font-mono font-black text-lg border-2 border-slate-900">
                                    ✓
                                </span>
                                <div>
                                    <h2 className="font-mono text-lg font-black uppercase tracking-tight text-slate-900">
                                        Submission Successfully Recorded!
                                    </h2>
                                    <span className="font-mono text-xs font-bold text-slate-500">
                                        Recorded on {new Date(submissionReceipt.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                                    </span>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-amber-300 border-2 border-slate-900 font-mono text-xs font-black uppercase">
                                Version #{submissionReceipt.version} {submissionReceipt.isUpdate ? '(Update)' : '(Initial)'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border-2 border-slate-900 p-4 font-mono text-xs">
                            <div>
                                <span className="text-slate-500 block uppercase font-bold text-[10px]">Track / Subsystem</span>
                                <strong className="text-slate-900 text-sm uppercase">{submissionReceipt.subsystem}</strong>
                            </div>
                            <div>
                                <span className="text-slate-500 block uppercase font-bold text-[10px]">Duo Allocation</span>
                                <strong className="text-slate-900 text-sm uppercase">{submissionReceipt.group}</strong>
                            </div>
                            <div>
                                <span className="text-slate-500 block uppercase font-bold text-[10px]">Submitted By</span>
                                <strong className="text-slate-900">{submissionReceipt.submitterName} ({submissionReceipt.submitterPhone})</strong>
                            </div>
                            <div>
                                <span className="text-slate-500 block uppercase font-bold text-[10px]">Duo Partner</span>
                                <strong className="text-slate-900">{submissionReceipt.partnerName || 'None'}</strong>
                            </div>
                            <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                                <span className="text-slate-500 block uppercase font-bold text-[10px] mb-1">Submitted Google Drive Folder</span>
                                <a
                                    href={submissionReceipt.driveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sky-700 font-bold break-all hover:underline flex items-center gap-1.5"
                                >
                                    <span>{submissionReceipt.driveUrl}</span>
                                    <span className="shrink-0 font-mono text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 border border-sky-300">
                                        Test Link ↗
                                    </span>
                                </a>
                            </div>
                            {submissionReceipt.notes && (
                                <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                                    <span className="text-slate-500 block uppercase font-bold text-[10px]">Notes</span>
                                    <span className="text-slate-800 font-bold">{submissionReceipt.notes}</span>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-amber-50 border-2 border-slate-900 text-xs font-bold text-slate-800 space-y-1">
                            <strong className="font-mono text-slate-900 block uppercase">Important Reminder:</strong>
                            <p>
                                Please verify that your Google Drive link has permissions set to <strong>&quot;Anyone with the link can view&quot;</strong> so our evaluation committee can access and grade your presentation.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleCopyReceipt}
                                className="press px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 border-2 border-slate-950 font-mono text-xs font-black uppercase cursor-pointer"
                            >
                                {copiedReceipt ? '✓ Receipt Copied to Clipboard!' : '📋 Copy Official Receipt'}
                            </button>

                            <button
                                type="button"
                                onClick={handleResetForNew}
                                className="press px-4 py-2 bg-amber-300 hover:bg-amber-400 text-slate-950 border-2 border-slate-950 font-mono text-xs font-black uppercase cursor-pointer"
                            >
                                Submit An Updated Link ↗
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Submission Form */
                    <form
                        onSubmit={handleSubmit}
                        className="bg-white text-slate-900 border-4 border-slate-950 p-6 sm:p-8 shadow-[8px_8px_0px_#38bdf8] space-y-6"
                    >
                        {/* Step 1: Subsystem Selection */}
                        <div className="space-y-2">
                            <label className="font-mono text-xs font-black uppercase text-slate-900 block">
                                Step 1: Select Your Recruitment Track
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleSubsystemChange('software')}
                                    className={`p-3.5 border-3 border-slate-950 text-left cursor-pointer transition-all ${
                                        subsystem === 'software'
                                            ? 'bg-slate-950 text-white shadow-[4px_4px_0px_#38bdf8] -translate-y-0.5'
                                            : 'bg-white hover:bg-slate-100 text-slate-900 shadow-[2px_2px_0px_#000]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-mono text-xs font-black uppercase">Software &amp; Perception</span>
                                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 border ${
                                            subsystem === 'software' ? 'bg-amber-400 text-slate-950 border-slate-950' : 'bg-slate-100 border-slate-300'
                                        }`}>
                                            {subsystem === 'software' ? 'SELECTED' : 'SELECT'}
                                        </span>
                                    </div>
                                    <span className="text-[11px] opacity-80 block font-bold">
                                        Vision Object Detection &amp; Sensor Fusion
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleSubsystemChange('mechanical')}
                                    className={`p-3.5 border-3 border-slate-950 text-left cursor-pointer transition-all ${
                                        subsystem === 'mechanical'
                                            ? 'bg-slate-950 text-white shadow-[4px_4px_0px_#f59e0b] -translate-y-0.5'
                                            : 'bg-white hover:bg-slate-100 text-slate-900 shadow-[2px_2px_0px_#000]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-mono text-xs font-black uppercase">Mechanical Mystery</span>
                                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 border ${
                                            subsystem === 'mechanical' ? 'bg-amber-400 text-slate-950 border-slate-950' : 'bg-slate-100 border-slate-300'
                                        }`}>
                                            {subsystem === 'mechanical' ? 'SELECTED' : 'SELECT'}
                                        </span>
                                    </div>
                                    <span className="text-[11px] opacity-80 block font-bold">
                                        eBAJA Autonomous Steering &amp; Braking Conversion
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Step 2: Software Cohort Switcher (if Software) */}
                        {subsystem === 'software' && (
                            <div className="space-y-2 pt-2 border-t-2 border-slate-200">
                                <label className="font-mono text-xs font-black uppercase text-slate-900 block">
                                    Select Academic Cohort
                                </label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleCohortChange('ii')}
                                        className={`flex-1 py-2 px-3 border-2 border-slate-950 font-mono text-xs font-black uppercase cursor-pointer ${
                                            softwareCohort === 'ii'
                                                ? 'bg-amber-300 text-slate-950 shadow-[2px_2px_0px_#000]'
                                                : 'bg-white hover:bg-slate-100 text-slate-700'
                                        }`}
                                    >
                                        II Year Candidates (14 Groups)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleCohortChange('iii')}
                                        className={`flex-1 py-2 px-3 border-2 border-slate-950 font-mono text-xs font-black uppercase cursor-pointer ${
                                            softwareCohort === 'iii'
                                                ? 'bg-amber-300 text-slate-950 shadow-[2px_2px_0px_#000]'
                                                : 'bg-white hover:bg-slate-100 text-slate-700'
                                        }`}
                                    >
                                        III Year Candidates (3 Groups)
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Duo Group Selector */}
                        <div className="space-y-2 pt-2 border-t-2 border-slate-200">
                            <label className="font-mono text-xs font-black uppercase text-slate-900 flex items-center justify-between">
                                <span>Step 2: Select Your Duo Group</span>
                                <span className="text-slate-500 font-bold text-[11px]">
                                    ({availableTeams.length} Allocated Groups)
                                </span>
                            </label>

                            <select
                                value={selectedGroup}
                                onChange={(e) => handleGroupChange(e.target.value)}
                                className="w-full p-3 bg-slate-50 border-3 border-slate-950 font-mono text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                            >
                                <option value="">-- Choose your allocated Duo Group --</option>
                                {availableTeams.map((grp) => {
                                    const names = grp.members?.map((m) => `${m.name} (${m.dept})`).join(' & ') || `${grp.member1} & ${grp.member2}`;
                                    return (
                                        <option key={grp.group} value={grp.group}>
                                            {grp.group}: {names}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {/* Selected Duo Partner Cards */}
                        {activeTeam && activeTeam.members && (
                            <div className="p-4 bg-sky-50 border-2 border-slate-950 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-xs font-black uppercase text-sky-900">
                                        Step 3: Who Is Submitting This Link?
                                    </span>
                                    <span className="font-mono text-[10px] font-bold text-slate-500 uppercase">
                                        Select Partner
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {activeTeam.members.map((member, idx) => (
                                        <label
                                            key={idx}
                                            className={`p-3 border-2 border-slate-950 cursor-pointer flex items-start gap-3 transition-all ${
                                                selectedSubmitterIdx === idx
                                                    ? 'bg-white shadow-[3px_3px_0px_#0284c7] font-black'
                                                    : 'bg-white/70 hover:bg-white text-slate-700'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="submitter"
                                                checked={selectedSubmitterIdx === idx}
                                                onChange={() => {
                                                    setSelectedSubmitterIdx(idx);
                                                    setPhoneInput('');
                                                    setFormError('');
                                                }}
                                                className="mt-1 accent-slate-950"
                                            />
                                            <div className="text-xs">
                                                <strong className="block text-slate-900 text-sm">{member.name}</strong>
                                                <span className="font-mono text-[11px] text-slate-500 uppercase">
                                                    Department: {member.dept}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 4: Phone Verification */}
                        {activeTeam && (
                            <div className="space-y-1.5 pt-2 border-t-2 border-slate-200">
                                <label className="font-mono text-xs font-black uppercase text-slate-900 flex items-center justify-between">
                                    <span>Step 4: Submitter Contact Verification</span>
                                    <span className="font-mono text-[10px] text-rose-600 font-bold">REQUIRED</span>
                                </label>
                                <p className="text-[11px] font-bold text-slate-600">
                                    Enter the 10-digit registered phone number for <strong>{currentSubmitter?.name}</strong> to verify your identity.
                                </p>
                                <input
                                    type="tel"
                                    value={phoneInput}
                                    onChange={(e) => setPhoneInput(e.target.value)}
                                    placeholder="Enter your 10-digit registered phone number (e.g. 9876543210)"
                                    maxLength={12}
                                    className="w-full p-3 bg-slate-50 border-2 border-slate-950 font-mono text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    required
                                />
                            </div>
                        )}

                        {/* Step 5: Google Drive Link */}
                        <div className="space-y-1.5 pt-2 border-t-2 border-slate-200">
                            <label className="font-mono text-xs font-black uppercase text-slate-900 flex items-center justify-between">
                                <span>Step 5: Google Drive Folder Link</span>
                                <span className="font-mono text-[10px] text-rose-600 font-bold">REQUIRED</span>
                            </label>
                            <input
                                type="url"
                                value={driveUrl}
                                onChange={(e) => setDriveUrl(e.target.value)}
                                placeholder="https://drive.google.com/drive/folders/..."
                                className="w-full p-3 bg-slate-50 border-2 border-slate-950 font-mono text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                required
                            />
                            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold leading-relaxed">
                                <span className="font-mono text-base">⚠️</span>
                                <div>
                                    <strong>Access Permission Check:</strong> Ensure your Google Drive folder link sharing is set to <strong>&quot;Anyone with the link can view&quot;</strong> before submitting.
                                </div>
                            </div>
                        </div>

                        {/* Step 6: Notes (Optional) */}
                        <div className="space-y-1.5">
                            <label className="font-mono text-xs font-black uppercase text-slate-900 flex items-center justify-between">
                                <span>Additional Remarks / Submission Notes</span>
                                <span className="font-mono text-[10px] text-slate-400 font-bold">OPTIONAL</span>
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="e.g. Phase 1 Final Deck & Workflow Diagram included. Tested on Jetson Orin NX specs."
                                rows={2}
                                className="w-full p-3 bg-slate-50 border-2 border-slate-950 font-mono text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                        </div>

                        {/* Error Message */}
                        {formError && (
                            <div className="p-3 bg-rose-50 border-2 border-rose-600 text-rose-800 text-xs font-bold font-mono">
                                ⚠️ {formError}
                            </div>
                        )}

                        {/* Submit CTA */}
                        <div className="pt-4 border-t-3 border-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-[11px] font-mono text-slate-500 font-bold">
                                Latest submission will be considered for evaluation
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full sm:w-auto press px-8 py-3.5 bg-slate-950 text-amber-300 hover:bg-slate-900 border-3 border-slate-950 font-mono text-sm font-black uppercase tracking-wider cursor-pointer shadow-[4px_4px_0px_#f59e0b] ${
                                    isSubmitting ? 'opacity-70 cursor-wait' : ''
                                }`}
                            >
                                {isSubmitting ? 'Recording Submission...' : '🚀 SUBMIT PHASE 01 DRIVE LINK'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Subsystem Lead Contact Helpline Card */}
                <div className="mt-8 p-5 bg-slate-800/80 border-2 border-slate-700 font-mono text-xs text-slate-300 space-y-2">
                    <div className="font-black text-amber-400 uppercase tracking-wide">
                        Need Help With Your Submission? Contact Track Leads:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px]">
                        <div>
                            <span className="text-slate-400 block font-bold">Software Lead:</span>
                            <strong className="text-white">{(SUBSYSTEM_LEADS.software || SUBSYSTEM_LEADS['software-perception'])?.name}</strong>
                            <a href={`tel:${(SUBSYSTEM_LEADS.software || SUBSYSTEM_LEADS['software-perception'])?.phone}`} className="text-sky-400 block hover:underline">
                                {(SUBSYSTEM_LEADS.software || SUBSYSTEM_LEADS['software-perception'])?.phone}
                            </a>
                        </div>
                        <div>
                            <span className="text-slate-400 block font-bold">Mechanical Lead:</span>
                            <strong className="text-white">{SUBSYSTEM_LEADS.mechanical?.name}</strong>
                            <a href={`tel:${SUBSYSTEM_LEADS.mechanical?.phone}`} className="text-sky-400 block hover:underline">
                                {SUBSYSTEM_LEADS.mechanical?.phone}
                            </a>
                        </div>
                        <div>
                            <span className="text-slate-400 block font-bold">Powertrain Lead:</span>
                            <strong className="text-white">{SUBSYSTEM_LEADS.powertrain?.name}</strong>
                            <a href={`tel:${SUBSYSTEM_LEADS.powertrain?.phone}`} className="text-sky-400 block hover:underline">
                                {SUBSYSTEM_LEADS.powertrain?.phone}
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
