import { useState, useMemo, useEffect } from 'react';
import { apiUrl } from '../../lib/api';
import {
    SOFTWARE_PERCEPTION_DATA,
    MECHANICAL_MYSTERY_DATA,
    POWERTRAIN_CHALLENGE_DATA,
    SUBSYSTEM_LEADS
} from '../../data/recruitmentProblemStatements';

function normalizePhone(p) {
    if (!p) return '';
    return String(p).replace(/\D/g, '').slice(-10);
}

export default function SubmissionPortalPage({ onNavigateHome, onNavigateRecruitment }) {
    // Determine initial track and problem statement from hash/url query if present (e.g. #submit?track=powertrain&ps=ps2)
    const getInitialState = () => {
        const hash = window.location.hash || '';
        let track = 'software';
        let ps = 'ps1';
        if (hash.includes('track=mechanical')) track = 'mechanical';
        else if (hash.includes('track=powertrain')) track = 'powertrain';
        else if (hash.includes('track=software')) track = 'software';

        if (hash.includes('ps=ps3')) ps = 'ps3';
        else if (hash.includes('ps=ps2')) ps = 'ps2';
        else if (hash.includes('ps=ps1')) ps = 'ps1';

        return { track, ps };
    };

    const initial = getInitialState();
    const [subsystem, setSubsystem] = useState(initial.track);
    const [softwareCohort, setSoftwareCohort] = useState('ii'); // 'ii' or 'iii'
    const [problemStatement, setProblemStatement] = useState(initial.ps); // 'ps1', 'ps2', or 'ps3'
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedSubmitterIdx, setSelectedSubmitterIdx] = useState(0);
    const [phoneInput, setPhoneInput] = useState('');
    const [driveUrl, setDriveUrl] = useState('');
    const [githubUrl, setGithubUrl] = useState('');
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

            if (h.includes('ps=ps3')) setProblemStatement('ps3');
            else if (h.includes('ps=ps2')) setProblemStatement('ps2');
            else if (h.includes('ps=ps1')) setProblemStatement('ps1');
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
        if (subsystem === 'powertrain') {
            return POWERTRAIN_CHALLENGE_DATA.teamFormat.teams;
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
        setProblemStatement('ps1');
        setSelectedGroup('');
        setSelectedSubmitterIdx(0);
        setPhoneInput('');
        setDriveUrl('');
        setGithubUrl('');
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

        const isPowertrain = subsystem === 'powertrain';

        if (!selectedGroup) {
            setFormError('Please select your allocated Duo Group.');
            return;
        }

        if (!currentSubmitter) {
            setFormError('Please choose which team member is submitting.');
            return;
        }

        const rawInput = phoneInput.trim().toLowerCase();
        const cleanPhone = normalizePhone(phoneInput);
        
        // Security verification for known roster
        if (currentSubmitter) {
            const registeredPhone = normalizePhone(currentSubmitter.phone || currentSubmitter.regNo);
            const rollMatches = currentSubmitter.rollNo && rawInput === currentSubmitter.rollNo.toLowerCase();
            const emailMatches = currentSubmitter.email && rawInput === currentSubmitter.email.toLowerCase();

            if (registeredPhone && cleanPhone !== registeredPhone && !rollMatches && !emailMatches) {
                setFormError(
                    `Verification failed: The entered credential does not match ${currentSubmitter.name}. Please enter your register number (${currentSubmitter.regNo || currentSubmitter.phone}) or registered roll code.`
                );
                return;
            }
        } else if (cleanPhone.length < 10) {
            setFormError('Please enter a valid 10-digit contact / register number.');
            return;
        }

        const trimmedUrl = driveUrl.trim();
        const cleanGithub = githubUrl.trim();

        // Validation for Google Drive URL
        if (isPowertrain) {
            // For powertrain, drive link is optional at stage 1, but if provided must be a valid Google Drive link
            if (trimmedUrl && !trimmedUrl.toLowerCase().includes('drive.google.com')) {
                setFormError('Invalid link: Please provide a valid Google Drive URL (must contain drive.google.com).');
                return;
            }
        } else {
            // Software and Mechanical require Google Drive links
            if (!trimmedUrl) {
                setFormError('Please paste your Google Drive folder link.');
                return;
            }

            if (!trimmedUrl.toLowerCase().includes('drive.google.com')) {
                setFormError('Invalid link: Please provide a valid Google Drive URL (must contain drive.google.com).');
                return;
            }

            if (subsystem === 'software' && problemStatement === 'ps2') {
                if (!cleanGithub) {
                    setFormError('GitHub Repository required: Problem Statement 2 requires both a Google Drive link and a GitHub repository link.');
                    return;
                }
                if (!cleanGithub.toLowerCase().includes('github.com')) {
                    setFormError('Invalid GitHub URL: Please provide a valid repository link (must contain github.com).');
                    return;
                }
            }
        }

        setIsSubmitting(true);

        try {
            const payload = {
                subsystem,
                phase: isPowertrain ? 'Round 2' : 'phase1',
                cohort: subsystem === 'software' ? (softwareCohort === 'ii' ? 'II Year' : 'III Year') : 'General',
                group: activeTeam ? activeTeam.group : 'Open Submission',
                problemStatement,
                submitterName: currentSubmitter ? currentSubmitter.name : phoneInput,
                submitterPhone: cleanPhone,
                partnerName: currentPartner ? currentPartner.name : '',
                partnerDept: currentPartner ? currentPartner.dept : '',
                driveUrl: trimmedUrl || '',
                githubUrl: cleanGithub || '',
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
                problemStatement: payload.problemStatement,
                group: payload.group,
                submitterName: payload.submitterName,
                submitterPhone: cleanPhone,
                partnerName: payload.partnerName,
                driveUrl: trimmedUrl,
                githubUrl: cleanGithub,
                notes: payload.notes
            });
        } catch (err) {
            console.error('Submission error:', err);
            setFormError(err.message || 'Could not reach server. Please check connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getProblemStatementLabel = (sub, ps) => {
        if (sub === 'software') {
            return ps === 'ps2' ? 'PS2: Sensor Fusion & Track Reconstruction' : 'PS1: Vision-Based Object Detection';
        }
        if (sub === 'powertrain') {
            if (ps === 'ps1') return 'PS1: CAN-Based Sensor Network (Due Wednesday 16 Sept)';
            if (ps === 'ps2') return 'PS2: Automatic Temperature Control (Due Tuesday 15 Sept)';
            if (ps === 'ps3') return 'PS3: Ready-to-Drive System (Due Tuesday 15 Sept)';
        }
        return 'PS1: Mechanical System Design';
    };

    const handleCopyReceipt = () => {
        if (!submissionReceipt) return;
        const isPt = submissionReceipt.subsystem === 'powertrain';
        const psLabel = `\nProblem Statement: ${getProblemStatementLabel(submissionReceipt.subsystem, submissionReceipt.problemStatement)}`;
        const driveLabel = submissionReceipt.driveUrl ? `\nDrive URL: ${submissionReceipt.driveUrl}` : '';
        const ghLabel = submissionReceipt.githubUrl ? `\nGitHub URL: ${submissionReceipt.githubUrl}` : '';

        const text = `[ASTERIX RECRUITMENT ${isPt ? 'PROBLEM STATEMENT REGISTRATION' : 'SUBMISSION'} RECEIPT]
ID: ${submissionReceipt.submissionId}
Version: #${submissionReceipt.version} ${submissionReceipt.isUpdate ? '(Revision)' : '(Original)'}
Track: ${submissionReceipt.subsystem.toUpperCase()}${psLabel}
Group: ${submissionReceipt.group}
Submitted By: ${submissionReceipt.submitterName} (${submissionReceipt.submitterPhone})
Partner: ${submissionReceipt.partnerName || 'None'}${driveLabel}${ghLabel}
Recorded At: ${new Date(submissionReceipt.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
Note: If multiple registrations are made, only the latest choice will be considered for evaluation.`;

        navigator.clipboard?.writeText?.(text);
        setCopiedReceipt(true);
        setTimeout(() => setCopiedReceipt(false), 2500);
    };

    const handleResetForNew = () => {
        setSubmissionReceipt(null);
        setDriveUrl('');
        setGithubUrl('');
        setNotes('');
        setFormError('');
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-amber-400 selection:text-slate-900 pt-24 sm:pt-28 pb-20">
            {/* Page Header */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <button
                        onClick={onNavigateRecruitment}
                        className="press px-3 py-1.5 bg-white text-slate-900 border-2 border-slate-950 font-mono text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000] cursor-pointer"
                    >
                        <span>← Back to Problem Statements</span>
                    </button>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400 text-slate-950 border-2 border-slate-950 font-mono text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#000]">
                        <span className="w-2 h-2 bg-slate-950 inline-block animate-pulse"></span>
                        OFFICIAL SUBMISSION &amp; CHOICE PORTAL
                    </div>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white font-mono leading-none">
                    {subsystem === 'powertrain'
                        ? 'Register Problem Statement Choice'
                        : "Submit Your Team's Drive Link"}
                </h1>
                <p className="mt-3 text-sm sm:text-base font-bold text-slate-300 max-w-2xl leading-relaxed">
                    {subsystem === 'powertrain'
                        ? 'Select your allocated duo team and register the electrical engineering problem statement (PS1, PS2, or PS3) your team will be solving and defending.'
                        : 'Paste your duo team\'s shared Google Drive folder containing your presentation slides, technical report, workflow diagrams, and research documentation.'}
                </p>

                {/* Submission Updates Notice Banner */}
                <div className="mt-6 p-4 bg-amber-500/15 border-2 border-amber-400 text-amber-200 text-xs font-bold space-y-1">
                    <div className="flex items-center gap-2 font-mono font-black uppercase tracking-wide text-amber-300">
                        <span>ℹ️ MULTIPLE REGISTRATIONS ALLOWED</span>
                    </div>
                    <p className="leading-relaxed">
                        Registrations can be updated as needed before deadlines. <strong>Only your latest (last) submission will be considered</strong> for final evaluation.
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
                                        {submissionReceipt.subsystem === 'powertrain'
                                            ? (submissionReceipt.driveUrl
                                                ? 'Problem Statement & Presentation Link Recorded!'
                                                : 'Problem Statement Choice Successfully Locked In!')
                                            : 'Submission Successfully Recorded!'}
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

                            <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                                <span className="text-slate-500 block uppercase font-bold text-[10px]">Chosen Problem Statement</span>
                                <span className="inline-block mt-0.5 px-2.5 py-1 bg-amber-300 border border-slate-900 font-mono text-xs font-black text-slate-950 uppercase">
                                    {getProblemStatementLabel(submissionReceipt.subsystem, submissionReceipt.problemStatement)}
                                </span>
                            </div>

                            <div>
                                <span className="text-slate-500 block uppercase font-bold text-[10px]">Submitted By</span>
                                <strong className="text-slate-900">{submissionReceipt.submitterName} ({submissionReceipt.submitterPhone})</strong>
                            </div>
                            <div>
                                <span className="text-slate-500 block uppercase font-bold text-[10px]">Duo Partner</span>
                                <strong className="text-slate-900">{submissionReceipt.partnerName || 'None'}</strong>
                            </div>

                            {submissionReceipt.driveUrl ? (
                                <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                                    <span className="text-slate-500 block uppercase font-bold text-[10px] mb-1">
                                        {submissionReceipt.subsystem === 'powertrain'
                                            ? 'Submitted Presentation Drive Folder (PPT / PDF)'
                                            : 'Submitted Google Drive Folder'}
                                    </span>
                                    <a
                                        href={submissionReceipt.driveUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sky-700 font-bold break-all hover:underline flex items-center gap-1.5"
                                    >
                                        <span>{submissionReceipt.driveUrl}</span>
                                        <span className="shrink-0 font-mono text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 border border-sky-300">
                                            Test Drive Link ↗
                                        </span>
                                    </a>
                                </div>
                            ) : submissionReceipt.subsystem === 'powertrain' ? (
                                <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                                    <span className="text-slate-500 block uppercase font-bold text-[10px] mb-1">Presentation Drive Link (PPT / PDF)</span>
                                    <div className="flex items-center justify-between gap-2 p-2.5 bg-amber-50 border border-amber-300 text-amber-950 font-bold text-xs font-sans">
                                        <span>⏳ <strong>Not submitted yet (Choice Locked In).</strong> You can submit your Google Drive PPT/PDF link anytime before your deadline.</span>
                                        <span className="shrink-0 font-mono text-[10px] text-amber-900 bg-amber-200/80 px-2 py-0.5 border border-amber-400 font-black">
                                            STAGE 01 LOCKED
                                        </span>
                                    </div>
                                </div>
                            ) : null}

                            {submissionReceipt.githubUrl && (
                                <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                                    <span className="text-slate-500 block uppercase font-bold text-[10px] mb-1">Submitted GitHub Repository</span>
                                    <a
                                        href={submissionReceipt.githubUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sky-700 font-bold break-all hover:underline flex items-center gap-1.5"
                                    >
                                        <span>{submissionReceipt.githubUrl}</span>
                                        <span className="shrink-0 font-mono text-[10px] bg-slate-900 text-amber-300 px-1.5 py-0.5 border border-slate-900">
                                            Test GitHub ↗
                                        </span>
                                    </a>
                                </div>
                            )}

                            {submissionReceipt.notes && (
                                <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                                    <span className="text-slate-500 block uppercase font-bold text-[10px]">Notes</span>
                                    <span className="text-slate-800 font-bold">{submissionReceipt.notes}</span>
                                </div>
                            )}
                        </div>

                        {submissionReceipt.subsystem === 'powertrain' ? (
                            <div className="p-4 bg-sky-50 border-2 border-slate-900 text-xs font-bold text-slate-800 space-y-1">
                                <strong className="font-mono text-slate-900 block uppercase">Next Steps for Powertrain:</strong>
                                <p>
                                    {submissionReceipt.driveUrl
                                        ? 'Your Problem Statement choice and presentation Drive folder are recorded. Prepare for live hardware or simulation demonstration during evaluation rounds (17–18 September 2026).'
                                        : 'Your Problem Statement choice is locked in. Prepare your Technical Presentation (PPT/PDF). When ready, return here to submit your Google Drive folder link before your problem statement deadline.'}
                                </p>
                            </div>
                        ) : (
                            <div className="p-4 bg-amber-50 border-2 border-slate-900 text-xs font-bold text-slate-800 space-y-1">
                                <strong className="font-mono text-slate-900 block uppercase">Important Reminder:</strong>
                                <p>
                                    Please verify that your Google Drive link has permissions set to <strong>&quot;Anyone with the link can view&quot;</strong> so our evaluation committee can access and grade your presentation.
                                </p>
                            </div>
                        )}

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
                                {submissionReceipt.subsystem === 'powertrain'
                                    ? (submissionReceipt.driveUrl ? 'Submit Updated Presentation Link / Change PS ↗' : 'Submit Presentation Drive Link (PPT / PDF) ↗')
                                    : 'Submit An Updated Link ↗'}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Submission Form */
                    <form
                        onSubmit={handleSubmit}
                        className="bg-white text-slate-900 border-4 border-slate-950 p-6 sm:p-8 shadow-[8px_8px_0px_#38bdf8] space-y-6"
                    >
                        {/* Step 1: Subsystem Selection (3 tracks) */}
                        <div className="space-y-2">
                            <label className="font-mono text-xs font-black uppercase text-slate-900 block">
                                Step 1: Select Your Recruitment Track
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                                        <span className="font-mono text-xs font-black uppercase">Software</span>
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
                                    onClick={() => handleSubsystemChange('powertrain')}
                                    className={`p-3.5 border-3 border-slate-950 text-left cursor-pointer transition-all ${
                                        subsystem === 'powertrain'
                                            ? 'bg-slate-950 text-white shadow-[4px_4px_0px_#f59e0b] -translate-y-0.5'
                                            : 'bg-white hover:bg-slate-100 text-slate-900 shadow-[2px_2px_0px_#000]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-mono text-xs font-black uppercase">Powertrain</span>
                                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 border ${
                                            subsystem === 'powertrain' ? 'bg-amber-400 text-slate-950 border-slate-950' : 'bg-slate-100 border-slate-300'
                                        }`}>
                                            {subsystem === 'powertrain' ? 'SELECTED' : 'SELECT'}
                                        </span>
                                    </div>
                                    <span className="text-[11px] opacity-80 block font-bold">
                                        CAN Sensor, Temp Control, Ready-to-Drive
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleSubsystemChange('mechanical')}
                                    className={`p-3.5 border-3 border-slate-950 text-left cursor-pointer transition-all ${
                                        subsystem === 'mechanical'
                                            ? 'bg-slate-950 text-white shadow-[4px_4px_0px_#10b981] -translate-y-0.5'
                                            : 'bg-white hover:bg-slate-100 text-slate-900 shadow-[2px_2px_0px_#000]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-mono text-xs font-black uppercase">Mechanical</span>
                                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 border ${
                                            subsystem === 'mechanical' ? 'bg-amber-400 text-slate-950 border-slate-950' : 'bg-slate-100 border-slate-300'
                                        }`}>
                                            {subsystem === 'mechanical' ? 'SELECTED' : 'SELECT'}
                                        </span>
                                    </div>
                                    <span className="text-[11px] opacity-80 block font-bold">
                                        eBAJA Autonomous Steering &amp; Braking
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Step 2 for Powertrain: Choose Problem Statement */}
                        {subsystem === 'powertrain' && (
                            <div className="space-y-3 pt-2 border-t-2 border-slate-200">
                                <label className="font-mono text-xs font-black uppercase text-slate-900 flex items-center justify-between">
                                    <span>Step 2: Choose Your Team&apos;s Problem Statement</span>
                                    <span className="font-mono text-[10px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 border border-amber-300">
                                        Choose Exactly 1 Statement
                                    </span>
                                </label>

                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        {
                                            id: 'ps1',
                                            num: '01',
                                            title: 'CAN-Based Autonomous Vehicle Sensor Network',
                                            domain: 'Distributed Embedded Systems (3 ESP32 Nodes)',
                                            demo: 'Breadboard Hardware Prototype Mandatory',
                                            deadline: 'Due Wednesday, 16 Sept • 11:59 PM IST',
                                            deadlineTag: 'WEDNESDAY DEADLINE',
                                            color: 'border-emerald-500'
                                        },
                                        {
                                            id: 'ps2',
                                            num: '02',
                                            title: 'Automatic Temperature Control of a Heating System',
                                            domain: 'Control Systems & Thermal Chamber Modeling',
                                            demo: 'MATLAB/Simulink or Python Simulation Mandatory',
                                            deadline: 'Due Tuesday, 15 Sept • 11:59 PM IST',
                                            deadlineTag: 'TUESDAY DEADLINE',
                                            color: 'border-sky-500'
                                        },
                                        {
                                            id: 'ps3',
                                            num: '03',
                                            title: 'Starting Conditions & Ready-to-Drive System',
                                            domain: 'Vehicle Electrical Architecture & 6 Interlocks',
                                            demo: 'PSpice/LTspice + Proteus/Wokwi Simulation Mandatory',
                                            deadline: 'Due Tuesday, 15 Sept • 11:59 PM IST',
                                            deadlineTag: 'TUESDAY DEADLINE',
                                            color: 'border-amber-500'
                                        }
                                    ].map((psItem) => (
                                        <button
                                            key={psItem.id}
                                            type="button"
                                            onClick={() => {
                                                setProblemStatement(psItem.id);
                                                setFormError('');
                                            }}
                                            className={`p-3.5 border-3 border-slate-950 text-left font-mono cursor-pointer transition-all ${
                                                problemStatement === psItem.id
                                                    ? 'bg-amber-300 text-slate-950 shadow-[4px_4px_0px_#000] -translate-y-0.5'
                                                    : 'bg-white hover:bg-slate-50 text-slate-900'
                                            }`}
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-xs uppercase px-2 py-0.5 bg-slate-900 text-white">
                                                        PROBLEM STATEMENT {psItem.num}
                                                    </span>
                                                    <span className="text-[11px] font-bold text-slate-700">
                                                        {psItem.domain}
                                                    </span>
                                                </div>
                                                <span className={`text-[10px] font-black px-2 py-0.5 border ${
                                                    problemStatement === psItem.id ? 'bg-slate-950 text-amber-300 border-slate-950' : 'bg-slate-100 border-slate-300'
                                                }`}>
                                                    {problemStatement === psItem.id ? '✓ CHOSEN' : 'SELECT'}
                                                </span>
                                            </div>

                                            <h4 className="font-black text-sm sm:text-base uppercase tracking-tight text-slate-900 mt-1">
                                                {psItem.title}
                                            </h4>

                                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-sans font-bold pt-2 border-t border-slate-900/20">
                                                <span className="text-slate-800 font-mono">
                                                    🎯 {psItem.demo}
                                                </span>
                                                <span className="font-mono text-rose-800 font-black">
                                                    ⏰ {psItem.deadline}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 2 for Software: Cohort & Problem Statement */}
                        {subsystem === 'software' && (
                            <div className="space-y-4 pt-2 border-t-2 border-slate-200">
                                <div className="space-y-2">
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

                                <div className="space-y-2">
                                    <label className="font-mono text-xs font-black uppercase text-slate-900 flex items-center justify-between">
                                        <span>Select Problem Statement</span>
                                        <span className="font-mono text-[10px] text-slate-500 font-bold uppercase">
                                            {problemStatement === 'ps2' ? 'Dual Submission (Drive + GitHub)' : 'Drive Submission'}
                                        </span>
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setProblemStatement('ps1');
                                                setFormError('');
                                            }}
                                            className={`p-3 border-2 border-slate-950 text-left font-mono text-xs cursor-pointer transition-all ${
                                                problemStatement === 'ps1'
                                                    ? 'bg-amber-300 text-slate-950 font-black shadow-[3px_3px_0px_#000]'
                                                    : 'bg-white hover:bg-slate-100 text-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-black">PS1: Vision Detection</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 border ${
                                                    problemStatement === 'ps1' ? 'bg-slate-900 text-amber-300 border-slate-900' : 'bg-slate-100 border-slate-300'
                                                }`}>
                                                    {problemStatement === 'ps1' ? 'ACTIVE' : 'SELECT'}
                                                </span>
                                            </div>
                                            <span className="text-[10px] opacity-85 block font-bold font-sans">
                                                Camera object detection, dataset, classes &amp; presentation
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setProblemStatement('ps2');
                                                setFormError('');
                                            }}
                                            className={`p-3 border-2 border-slate-950 text-left font-mono text-xs cursor-pointer transition-all ${
                                                problemStatement === 'ps2'
                                                    ? 'bg-amber-300 text-slate-950 font-black shadow-[3px_3px_0px_#000]'
                                                    : 'bg-white hover:bg-slate-100 text-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-black">PS2: Sensor Fusion</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 border ${
                                                    problemStatement === 'ps2' ? 'bg-slate-900 text-amber-300 border-slate-900' : 'bg-slate-100 border-slate-300'
                                                }`}>
                                                    {problemStatement === 'ps2' ? 'ACTIVE' : 'SELECT'}
                                                </span>
                                            </div>
                                            <span className="text-[10px] opacity-85 block font-bold font-sans">
                                                Transforms, noise filter, 2D map (Drive Link + GitHub Link)
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step: Duo Group Selector */}
                        <div className="space-y-2 pt-2 border-t-2 border-slate-200">
                            <label className="font-mono text-xs font-black uppercase text-slate-900 flex items-center justify-between">
                                <span>{subsystem === 'powertrain' ? 'Step 3' : 'Step 2'}: Select Your Duo Group</span>
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
                                        {subsystem === 'powertrain' ? 'Step 4' : 'Step 3'}: Who Is Submitting This Registration?
                                    </span>
                                    <span className="font-mono text-[10px] font-bold text-slate-500 uppercase">
                                        Select Member
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
                                                    {member.dept} • {member.year || 'II YEAR'} • {member.rollNo || ''}
                                                </span>
                                                <span className="font-mono text-[10px] text-sky-700 block font-bold mt-0.5">
                                                    📞 {member.phone}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step: Submitter Identity Verification */}
                        {activeTeam && (
                            <div className="space-y-1.5 pt-2 border-t-2 border-slate-200">
                                <label className="font-mono text-xs font-black uppercase text-slate-900 flex items-center justify-between">
                                    <span>{subsystem === 'powertrain' ? 'Step 5' : 'Step 4'}: Submitter Verification</span>
                                    <span className="font-mono text-[10px] text-rose-600 font-bold">REQUIRED</span>
                                </label>
                                <p className="text-[11px] font-bold text-slate-600">
                                    Enter the registered contact / register number (e.g. <strong>{currentSubmitter?.regNo || currentSubmitter?.phone}</strong>) or roll code (<strong>{currentSubmitter?.rollNo || ''}</strong>) for <strong>{currentSubmitter?.name}</strong> to verify your identity.
                                </p>
                                <input
                                    type="text"
                                    value={phoneInput}
                                    onChange={(e) => setPhoneInput(e.target.value)}
                                    placeholder={`Enter ${currentSubmitter?.regNo ? 'Register No / Roll Code / Contact' : '10-digit registered contact number'}`}
                                    className="w-full p-3 bg-slate-50 border-2 border-slate-950 font-mono text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    required
                                />
                            </div>
                        )}

                        {/* Step: Google Drive Link (Presentation PPT / PDF / Deliverables) */}
                        {subsystem === 'powertrain' ? (
                            <div className="space-y-2 pt-2 border-t-2 border-slate-200">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <label className="font-mono text-xs font-black uppercase text-slate-900">
                                        Step 6: Technical Presentation Google Drive Link (PPT / PDF)
                                    </label>
                                    <span className="font-mono text-[10px] text-amber-800 bg-amber-200/80 px-2 py-0.5 border border-amber-400 font-bold uppercase">
                                        Optional Now • Submit Now or Later
                                    </span>
                                </div>
                                <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                                    You can submit this form now to <strong>lock in your chosen Problem Statement</strong> without a Drive link, and come back before your deadline to submit your presentation slides. If you already have your Google Drive folder ready, paste it below.
                                </p>
                                <input
                                    type="url"
                                    value={driveUrl}
                                    onChange={(e) => setDriveUrl(e.target.value)}
                                    placeholder="https://drive.google.com/drive/folders/... (Optional at choice lock-in)"
                                    className="w-full p-3 bg-slate-50 border-2 border-slate-950 font-mono text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold leading-relaxed">
                                    <span className="font-mono text-base">⚠️</span>
                                    <div>
                                        <strong>Access Permission Check:</strong> Ensure your Google Drive folder link sharing is set to <strong>&quot;Anyone with the link can view&quot;</strong> before submitting.
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* For Software & Mechanical: Step 5 Google Drive Link */
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
                        )}

                        {/* Software PS2: Step 6 GitHub Repository Link */}
                        {subsystem === 'software' && problemStatement === 'ps2' && (
                            <div className="space-y-1.5 pt-2 border-t-2 border-slate-200">
                                <label className="font-mono text-xs font-black uppercase text-slate-900 flex items-center justify-between">
                                    <span>Step 6: GitHub Repository Link (Code Pipeline)</span>
                                    <span className="font-mono text-[10px] text-rose-600 font-bold">REQUIRED FOR PS2</span>
                                </label>
                                <p className="text-[11px] font-bold text-slate-600">
                                    For Problem Statement 2, submit your runnable source code, config files, and README replay instructions via a public or shared GitHub repository.
                                </p>
                                <input
                                    type="url"
                                    value={githubUrl}
                                    onChange={(e) => setGithubUrl(e.target.value)}
                                    placeholder="https://github.com/your-username/asterix-sensor-fusion"
                                    className="w-full p-3 bg-slate-50 border-2 border-slate-950 font-mono text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    required
                                />
                                <div className="flex items-start gap-2 p-3 bg-sky-50 border border-sky-300 text-sky-950 text-xs font-bold leading-relaxed">
                                    <span className="font-mono text-base">ℹ️</span>
                                    <div>
                                        <strong>Dual Submission for PS2:</strong> Your Google Drive folder stores your plots, diagram, and comparative analysis report. Your GitHub repository hosts the complete runnable script/package.
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Additional Remarks / Notes */}
                        <div className="space-y-1.5 pt-2 border-t-2 border-slate-200">
                            <label className="font-mono text-xs font-black uppercase text-slate-900 flex items-center justify-between">
                                <span>{subsystem === 'powertrain' ? 'Step 7' : (subsystem === 'software' && problemStatement === 'ps2' ? 'Step 7' : 'Step 6')}: Additional Remarks / Notes</span>
                                <span className="font-mono text-[10px] text-slate-400 font-bold">OPTIONAL</span>
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder={subsystem === 'powertrain' ? 'e.g. Planning to use 3 ESP32 nodes with CAN transceiver modules...' : 'e.g. Phase 1 Final Deck & Workflow Diagram included.'}
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
                                {subsystem === 'powertrain'
                                    ? 'Submissions & choices can be revised anytime before deadlines'
                                    : 'Latest submission will be considered for evaluation'}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full sm:w-auto press px-8 py-3.5 bg-slate-950 text-amber-300 hover:bg-slate-900 border-3 border-slate-950 font-mono text-sm font-black uppercase tracking-wider cursor-pointer shadow-[4px_4px_0px_#f59e0b] ${
                                    isSubmitting ? 'opacity-70 cursor-wait' : ''
                                }`}
                            >
                                {isSubmitting
                                    ? 'Recording Submission...'
                                    : subsystem === 'powertrain'
                                    ? (driveUrl.trim() ? '🚀 SUBMIT PRESENTATION LINK & LOCK CHOICE' : '🎯 LOCK IN PROBLEM STATEMENT CHOICE')
                                    : subsystem === 'software' && problemStatement === 'ps2'
                                    ? '🚀 SUBMIT PHASE 01 LINKS (DRIVE + GITHUB)'
                                    : '🚀 SUBMIT PHASE 01 DRIVE LINK'}
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
                            <span className="text-slate-400 block font-bold">Powertrain Lead:</span>
                            <strong className="text-white">{SUBSYSTEM_LEADS.powertrain?.name}</strong>
                            <a href={`tel:${SUBSYSTEM_LEADS.powertrain?.phone}`} className="text-sky-400 block hover:underline">
                                {SUBSYSTEM_LEADS.powertrain?.phone}
                            </a>
                        </div>
                        <div>
                            <span className="text-slate-400 block font-bold">Mechanical Lead:</span>
                            <strong className="text-white">{SUBSYSTEM_LEADS.mechanical?.name}</strong>
                            <a href={`tel:${SUBSYSTEM_LEADS.mechanical?.phone}`} className="text-sky-400 block hover:underline">
                                {SUBSYSTEM_LEADS.mechanical?.phone}
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
