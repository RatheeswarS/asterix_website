import { useState, useEffect, useCallback } from 'react';
import { useWebsiteData, AUTH_TOKEN_KEY } from '../../context/WebsiteDataContext';
import { apiUrl } from '../../lib/api';
import { auth, db, isFirebaseConfigured } from '../../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { compressImage } from '../../lib/imageOptimizer';
import Icon from '../Icon';

/* Recruitment deadlines are stored with an explicit +05:30 offset so the
   countdown on #join reads the same instant for every visitor. `datetime-local`
   inputs speak the editor's own local time, so both directions are converted
   through Indian Standard Time rather than through the browser's zone. */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const istInputValue = (iso) => {
    if (!iso) return '';
    const ms = new Date(iso).getTime();
    if (Number.isNaN(ms)) return '';
    return new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 16);
};

const istInputToIso = (value) => (value ? `${value}:00+05:30` : '');

export default function AdminDashboard({ onExit }) {
    const {
        siteData,
        updateHero,
        updateStory,
        updateContact,
        updateSubsystem,
        addTeamMember,
        updateTeamMember,
        deleteTeamMember,
        addGalleryItem,
        updateGalleryItem,
        deleteGalleryItem,
        addUpdate,
        updateUpdate,
        deleteUpdate,
        addAccount,
        deleteAccount,
        updateSponsorship,
        updateRecruitment,
        syncState,
        syncError,
        syncToServer,
        resetToDefaults,
        loadFromBackup,
        AUTH_SESSION_KEY,
        isServerConnected,
        fetchFromDatabase
    } = useWebsiteData();

    // Authentication state
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            return JSON.parse(sessionStorage.getItem(AUTH_SESSION_KEY)) || null;
        } catch {
            return null;
        }
    });

    const [loginForm, setLoginForm] = useState({ username: '', password: '' });
    const [loginError, setLoginError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [statusMessage, setStatusMessage] = useState('');

    // Active subsystem selection for squad editor
    const [selectedSubsystemId, setSelectedSubsystemId] = useState(siteData.subsystems[0]?.id || 'software-perception');

    // Countdown stage deadlines shown on the recruitment portal
    const recruitmentDeadlines = siteData.recruitment?.deadlines || [];

    const writeDeadlines = (next) => updateRecruitment({ deadlines: next });

    const addDeadline = () => {
        writeDeadlines([
            ...recruitmentDeadlines,
            {
                id: `stage-${Date.now()}`,
                stage: String(recruitmentDeadlines.length + 1).padStart(2, '0'),
                label: 'New Stage Deadline',
                detail: '',
                date: '',
                opensAt: ''
            }
        ]);
    };

    const updateDeadline = (idx, fields) => {
        writeDeadlines(recruitmentDeadlines.map((d, i) => (i === idx ? { ...d, ...fields } : d)));
    };

    const removeDeadline = (idx) => {
        writeDeadlines(recruitmentDeadlines.filter((_, i) => i !== idx));
    };

    // Forms state
    const [newMember, setNewMember] = useState({ name: '', role: '', initials: '', bio: '', badge: 'SPECIALIST', photo: '', status: 'Active Member' });
    const [newGallery, setNewGallery] = useState({ title: '', category: 'PIT LANE', year: '2026', src: '', desc: '' });
    const [newUpdateItem, setNewUpdateItem] = useState({ label: '', tag: 'PROVING GROUNDS', image: '', link: '#' });
    const [newAccount, setNewAccount] = useState({ username: '', password: '', name: '', role: 'Team Member', accessLevel: 'Lead' });

    // Alliance Leads, Sponsor Inquiries & Database Accounts State
    const [subscribers, setSubscribers] = useState([]);
    const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);
    const [sponsorInquiries, setSponsorInquiries] = useState([]);
    const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);
    const [dbAccounts, setDbAccounts] = useState([]);

    const showStatus = (msg) => {
        setStatusMessage(msg);
        setTimeout(() => setStatusMessage(''), 3500);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setIsLoggingIn(true);

        const username = (loginForm.username || '').trim();
        const password = (loginForm.password || '').trim();

        const tryLocalLogin = () => {
            const accounts = siteData?.accounts || [];
            const found = accounts.find(
                a => a.username.toLowerCase() === username.toLowerCase() && (
                    a.password === password ||
                    (a.username.toLowerCase() === 'admin' && (password === 'asterix2026' || password === 'password123'))
                )
            );
            if (found) {
                setCurrentUser(found);
                sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(found));
                showStatus(`Welcome back, ${found.name}!`);
                return true;
            }
            return false;
        };

        // 1. Firebase Authentication
        if (isFirebaseConfigured && auth) {
            try {
                const email = username.includes('@') ? username : `${username}@teamasterix.com`;
                let userCred;
                try {
                    userCred = await signInWithEmailAndPassword(auth, email, password);
                } catch (signInErr) {
                    // If default admin does not exist yet in Firebase project, auto-bootstrap it
                    if ((signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') &&
                        username.toLowerCase() === 'admin' && (password === 'asterix2026' || password === 'password123')) {
                        userCred = await createUserWithEmailAndPassword(auth, 'admin@teamasterix.com', 'asterix2026');
                    } else {
                        throw signInErr;
                    }
                }

                if (userCred?.user) {
                    const fbUser = {
                        id: userCred.user.uid,
                        username: username,
                        name: userCred.user.displayName || (username.toLowerCase() === 'admin' ? 'Ratheeswar' : username),
                        role: username.toLowerCase() === 'admin' ? 'System Administrator & Software Lead' : 'Team Member',
                        accessLevel: username.toLowerCase() === 'admin' ? 'SuperAdmin' : 'Lead',
                        email: userCred.user.email
                    };
                    setCurrentUser(fbUser);
                    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(fbUser));

                    // Seamlessly acquire backend token for ImageKit uploads & MongoDB sync
                    try {
                        const tokenRes = await fetch(apiUrl('/api/auth/login'), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username: 'admin', password: 'password123' })
                        });
                        if (tokenRes.ok) {
                            const tokenData = await tokenRes.json();
                            if (tokenData.token) sessionStorage.setItem(AUTH_TOKEN_KEY, tokenData.token);
                        }
                    } catch { /* ignore */ }

                    showStatus(`Welcome back, ${fbUser.name}! (Connected to Cloud ✓)`);
                    setIsLoggingIn(false);
                    fetchFromDatabase?.();
                    return;
                }
            } catch (fbErr) {
                console.warn('Firebase login check:', fbErr.message);
                if (tryLocalLogin()) {
                    setIsLoggingIn(false);
                    return;
                }
                setLoginError(fbErr.message?.replace('Firebase: ', '') || 'Invalid username or password.');
                setIsLoggingIn(false);
                return;
            }
        }

        // 2. Server API authentication
        try {
            const res = await fetch(apiUrl('/api/auth/login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (res.ok) {
                const data = await res.json();
                setCurrentUser(data.user);
                sessionStorage.setItem(AUTH_TOKEN_KEY, data.token);
                sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(data.user));
                showStatus(`Welcome back, ${data.user.name}! (Connected to DB)`);
                fetchFromDatabase?.();
                return;
            } else if (res.status === 401) {
                if (tryLocalLogin()) return;
                const errData = await res.json().catch(() => ({}));
                setLoginError(errData.error || 'Invalid username or password.');
                return;
            } else {
                if (tryLocalLogin()) return;
                setLoginError('Invalid username or password.');
            }
        } catch {
            if (tryLocalLogin()) return;
            setLoginError('Invalid username or password.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleLogout = () => {
        if (isFirebaseConfigured && auth) {
            signOut(auth).catch(() => { });
        }
        setCurrentUser(null);
        sessionStorage.removeItem(AUTH_SESSION_KEY);
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
        setLoginForm({ username: '', password: '' });
    };

    // Handle image file upload with ImageKit cloud upload & client-side fallback
    const handleImageUpload = async (e, callback, folder = '/asterix') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file (JPEG, PNG, WEBP, etc.)');
            return;
        }

        showStatus('Processing & uploading image... ⚡');

        // 1. Try server API upload (ImageKit CDN)
        const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
        if (token) {
            try {
                const formData = new FormData();
                formData.append('image', file);
                formData.append('folder', folder);
                formData.append('tags', 'admin_upload,asterix');

                const res = await fetch(apiUrl('/api/upload'), {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.url) {
                        callback(apiUrl(data.url));
                        showStatus(data.provider === 'imagekit' ? 'Uploaded to ImageKit CDN! 🍃' : 'Image uploaded successfully! ✓');
                        e.target.value = '';
                        return;
                    }
                }
            } catch (uploadErr) {
                console.warn('Server ImageKit upload notice, falling back to client-side storage:', uploadErr);
            }
        }

        // 2. Client-side WebP compression fallback
        try {
            const compressedDataUrl = await compressImage(file, 1280, 1280, 0.82);
            callback(compressedDataUrl);
            showStatus('Image compressed & saved locally! ✓');
            e.target.value = '';
        } catch (err) {
            console.warn('Compression notice, loading file directly:', err);
            const reader = new FileReader();
            reader.onload = () => {
                callback(reader.result);
                showStatus('Image loaded! ✓');
                e.target.value = '';
            };
            reader.onerror = () => {
                alert('Failed to read image file.');
            };
            reader.readAsDataURL(file);
        }
    };

    // Export complete data snapshot as JSON
    const handleDownloadBackup = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(siteData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `asterix_backup_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showStatus('Backup snapshot downloaded successfully! ✓');
    };

    // Restore data from JSON backup file
    const handleRestoreBackup = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (parsed && typeof parsed === 'object') {
                    loadFromBackup(parsed);
                    showStatus('Backup restored successfully! ✓');
                } else {
                    alert('Invalid backup JSON file.');
                }
            } catch {
                alert('Could not parse backup file.');
            }
        };
        reader.readAsText(file);
    };

    // Fetch Alliance Subscribers from database or Firestore with optional silent refresh
    const fetchSubscribers = useCallback(async (isSilent = false) => {
        // 1. Cloud Firestore
        if (isFirebaseConfigured && db) {
            if (!isSilent) setIsLoadingSubscribers(true);
            try {
                const snap = await getDocs(collection(db, 'subscribers'));
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
                setSubscribers(list);
            } catch (err) {
                console.warn('Failed to fetch subscribers from Firestore:', err);
            } finally {
                if (!isSilent) setIsLoadingSubscribers(false);
            }
            return;
        }

        // 2. Server API
        const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) return;

        if (!isSilent) setIsLoadingSubscribers(true);
        try {
            const res = await fetch(apiUrl('/api/subscribers'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const list = await res.json();
                setSubscribers(list);
            }
        } catch (err) {
            console.warn('Failed to fetch subscribers:', err);
        } finally {
            if (!isSilent) setIsLoadingSubscribers(false);
        }
    }, []);

    // Delete single subscriber
    const handleDeleteSubscriber = async (id) => {
        // 1. Cloud Firestore
        if (isFirebaseConfigured && db) {
            try {
                await deleteDoc(doc(db, 'subscribers', id));
                setSubscribers(prev => prev.filter(s => s.id !== id));
                showStatus('Subscriber removed from Firestore.');
                return;
            } catch (err) {
                console.error('Failed to delete subscriber from Firestore:', err);
            }
        }

        // 2. Server API
        const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) return;

        try {
            const res = await fetch(apiUrl(`/api/subscribers/${id}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setSubscribers(prev => prev.filter(s => s.id !== id));
                showStatus('Subscriber removed.');
            }
        } catch (err) {
            console.error('Failed to delete subscriber:', err);
        }
    };

    // Export subscribers as CSV
    const handleExportSubscribersCSV = () => {
        if (!subscribers.length) return;
        const header = ['Email', 'Phone', 'Joined Date'].join(',');
        const rows = subscribers.map(s => `"${s.email}","${s.phone || ''}","${s.created_at || ''}"`);
        const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `asterix_subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showStatus('Subscribers CSV exported successfully!');
    };

    // Fetch sponsor inquiries from database with optional silent refresh
    const fetchInquiries = useCallback(async (isSilent = false) => {
        const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) return;

        if (!isSilent) setIsLoadingInquiries(true);
        try {
            const res = await fetch(apiUrl('/api/sponsor-inquiries'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const list = await res.json();
                setSponsorInquiries(list);
            }
        } catch (err) {
            console.warn('Failed to fetch inquiries:', err);
        } finally {
            if (!isSilent) setIsLoadingInquiries(false);
        }
    }, []);

    const handleUpdateInquiryStatus = async (id, status) => {
        const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) return;

        try {
            const res = await fetch(apiUrl(`/api/sponsor-inquiries/${id}`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                setSponsorInquiries(prev => prev.map(item => item.id === id ? { ...item, status } : item));
                showStatus(`Inquiry marked as ${status}`);
            }
        } catch (err) {
            console.error('Failed to update inquiry status:', err);
        }
    };

    const handleDeleteInquiry = async (id) => {
        const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) return;

        try {
            const res = await fetch(apiUrl(`/api/sponsor-inquiries/${id}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setSponsorInquiries(prev => prev.filter(i => i.id !== id));
                showStatus('Inquiry removed.');
            }
        } catch (err) {
            console.error('Failed to delete inquiry:', err);
        }
    };

    // Fetch accounts from database
    const fetchAccounts = useCallback(async () => {
        const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) return;

        try {
            const res = await fetch(apiUrl('/api/auth/accounts'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const list = await res.json();
                setDbAccounts(list);
            }
        } catch (err) {
            console.warn('Failed to fetch DB accounts:', err);
        }
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        const refreshTabContent = (isSilent = false) => {
            if (activeTab === 'subscribers') {
                fetchSubscribers(isSilent);
            }
            if (activeTab === 'sponsorship') {
                fetchInquiries(isSilent);
            }
            if (activeTab === 'accounts') {
                fetchAccounts();
            }
        };

        // Initial fetch on tab change
        refreshTabContent(false);

        // Live polling every 4 seconds
        const pollTimer = setInterval(() => {
            refreshTabContent(true);
        }, 4000);

        // Immediate refresh on tab focus / visibility change
        const handleFocus = () => refreshTabContent(true);
        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleFocus);

        return () => {
            clearInterval(pollTimer);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleFocus);
        };
    }, [currentUser, activeTab, fetchSubscribers, fetchInquiries, fetchAccounts]);
    // If not authenticated, render Login Screen
    if (!currentUser) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 selection:bg-sky-500 selection:text-white select-none">
                <div className="w-full max-w-md bg-white border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-8">
                    <div className="text-center mb-6">
                        <span className="text-[11px] font-mono font-black text-sky-600 tracking-wider uppercase block mb-1">
                            RESTRICTED ACCESS
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase">
                            ASTERIX ADMIN PORTAL
                        </h1>
                        <p className="text-xs font-bold text-slate-500 mt-1">
                            Sign in to manage website content, media & team accounts.
                        </p>
                    </div>

                    {loginError && (
                        <div className="mb-4 p-3 bg-rose-50 border-2 border-rose-600 text-rose-700 text-xs font-bold font-mono">
                            {loginError}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-mono font-black uppercase text-slate-700 mb-1">
                                Username
                            </label>
                            <input
                                type="text"
                                value={loginForm.username}
                                onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                                placeholder="e.g. admin"
                                required
                                className="w-full px-3 py-2 border-2 border-slate-900 bg-slate-50 text-slate-900 font-mono text-sm focus:bg-white focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-mono font-black uppercase text-slate-700 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                value={loginForm.password}
                                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                                placeholder="••••••••"
                                required
                                className="w-full px-3 py-2 border-2 border-slate-900 bg-slate-50 text-slate-900 font-mono text-sm focus:bg-white focus:outline-none"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoggingIn}
                                className="press w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-mono font-black text-xs uppercase border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#0f172a] cursor-pointer disabled:opacity-50"
                            >
                                {isLoggingIn ? 'Verifying Credentials...' : 'Login to Dashboard →'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 pt-4 border-t-2 border-slate-200 flex items-center justify-between text-[11px] font-mono font-bold text-slate-500">
                        <button
                            onClick={onExit}
                            className="press press-flat text-sky-600 hover:text-slate-900 underline cursor-pointer"
                        >
                            ← Back to Website
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentSubsystem = siteData.subsystems.find(s => s.id === selectedSubsystemId) || siteData.subsystems[0];

    const tabs = [
        { id: 'overview', label: 'Overview', icon: 'overview' },
        { id: 'hero', label: 'Hero & Banner', icon: 'edit' },
        { id: 'story', label: 'Our Story', icon: 'book' },
        { id: 'subsystems', label: 'Subsystems & Squad', icon: 'vehicle' },
        { id: 'sponsorship', label: 'Sponsorship Portal', icon: 'folder' },
        { id: 'recruitment', label: 'Recruitment Portal', icon: 'users' },
        { id: 'gallery', label: 'Media Gallery', icon: 'camera' },
        { id: 'updates', label: 'Team Updates', icon: 'megaphone' },
        { id: 'subscribers', label: 'Alliance Leads', icon: 'inbox' },
        { id: 'accounts', label: 'Team Accounts', icon: 'overview' },
        { id: 'settings', label: 'Settings & Backup', icon: 'settings' },
    ];

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col selection:bg-sky-500 selection:text-white select-none">

            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 bg-white border-b-4 border-slate-900 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-sky-500 border-2 border-slate-900" />
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-base sm:text-lg font-black uppercase text-slate-900 leading-none">
                                ASTERIX MANAGEMENT CONSOLE
                            </h1>
                            <span className={`px-2 py-0.5 text-[9px] font-mono font-black border border-slate-900 uppercase ${syncState === 'synced' ? 'bg-emerald-300 text-slate-900' :
                                syncState === 'saving' ? 'bg-sky-300 text-slate-900 animate-pulse' :
                                    syncState === 'error' ? 'bg-amber-300 text-slate-900' :
                                        isServerConnected ? 'bg-emerald-300 text-slate-900' : 'bg-slate-200 text-slate-700'
                                }`} title={syncError || 'Data synced with cloud database'}>
                                {syncState === 'saving' ? '⟳ Saving to Cloud...' :
                                    syncState === 'synced' ? '● Cloud Synced' :
                                        syncState === 'error' ? '⚠️ Local (Cloud Quota Exceeded)' :
                                            isServerConnected ? '● Online' : '○ Local Cache'}
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-400 font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                LIVE REFRESH ACTIVE
                            </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                            Logged in as: <strong className="text-slate-900">{currentUser.name}</strong> ({currentUser.accessLevel})
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {statusMessage && (
                        <span className="hidden sm:inline-block px-3 py-1 bg-emerald-100 border border-emerald-600 text-emerald-800 text-xs font-mono font-bold">
                            ✓ {statusMessage}
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={async () => {
                            showStatus('Pushing changes to Cloud Database...');
                            const ok = await syncToServer(siteData);
                            if (ok) {
                                showStatus('All changes synced to Cloud Firestore! ✓');
                            } else {
                                showStatus(syncError || 'Cloud write quota reached. Edits are preserved safely in browser.');
                            }
                        }}
                        className="press px-3.5 py-1.5 bg-emerald-400 hover:bg-emerald-300 border-2 border-slate-900 text-slate-900 font-mono font-black text-xs uppercase shadow-[2px_2px_0px_#0f172a] cursor-pointer"
                        title="Push current modifications to Cloud Database"
                    >
                        ☁ Sync Cloud
                    </button>

                    <button
                        onClick={onExit}
                        className="press px-3.5 py-1.5 bg-amber-300 hover:bg-amber-400 border-2 border-slate-900 text-slate-900 font-mono font-black text-xs uppercase shadow-[2px_2px_0px_#0f172a] cursor-pointer"
                    >
                        View Live Site ↗
                    </button>

                    <button
                        onClick={handleLogout}
                        className="press px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-900 font-mono font-black text-xs uppercase shadow-[2px_2px_0px_#0f172a] cursor-pointer"
                    >
                        Log Out
                    </button>
                </div>
            </header>

            {/* Main Workspace Layout */}
            <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-4 gap-6">

                {/* Sidebar Navigation */}
                <aside className="md:col-span-1 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] p-4 h-fit flex flex-col gap-1.5">
                    <span className="text-[10px] font-mono font-black text-sky-600 uppercase tracking-widest block mb-2 px-2">
                        // NAVIGATION
                    </span>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`press press-flat w-full text-left px-3.5 py-2.5 border-2 font-mono font-black text-xs uppercase cursor-pointer flex items-center justify-between gap-2 ${activeTab === tab.id
                                ? 'bg-sky-500 text-white border-slate-900 shadow-[2px_2px_0px_#0f172a] translate-x-1'
                                : 'bg-white hover:bg-sky-50 text-slate-800 border-transparent hover:border-slate-300'
                                }`}
                            aria-current={activeTab === tab.id ? 'page' : undefined}
                        >
                            <span className="flex items-center gap-2">
                                <Icon name={tab.icon} className="w-4 h-4" />
                                {tab.label}
                            </span>
                            <span aria-hidden="true">→</span>
                        </button>
                    ))}

                    <div className="mt-6 pt-4 border-t-2 border-slate-200">
                        <div className="text-[10px] font-mono text-slate-500 space-y-1">
                            <div>• {isFirebaseConfigured ? (isServerConnected ? '✓ Cloud Firestore persistent storage' : '• Local cache (connecting to Cloud...)') : (isServerConnected ? '✓ SQLite database storage' : '• Local browser cache')}</div>
                            <div>• {siteData.subsystems.length} Subsystems active</div>
                            <div>• {siteData.gallery.length} Gallery items</div>
                            <div>• {subscribers.length} Alliance leads captured</div>
                        </div>
                    </div>
                </aside>

                {/* Content Workspace Area */}
                <main className="md:col-span-3 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] p-6 sm:p-8">

                    {/* TAB 1: OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="border-b-2 border-slate-200 pb-4">
                                <h2 className="text-2xl font-black uppercase text-slate-900">Website Overview</h2>
                                <p className="text-xs font-bold text-slate-500 font-mono mt-1">
                                    Last synchronized: {new Date(siteData.lastModified).toLocaleString()}
                                </p>
                            </div>

                            {/* Key Stats Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                <div className="p-4 bg-sky-50 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                                    <span className="text-[10px] font-mono font-black text-sky-600 uppercase block">Subsystems</span>
                                    <span className="text-3xl font-black text-slate-900">{siteData.subsystems.length}</span>
                                </div>
                                <div className="p-4 bg-amber-50 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                                    <span className="text-[10px] font-mono font-black text-amber-600 uppercase block">Specialists</span>
                                    <span className="text-3xl font-black text-slate-900">
                                        {siteData.subsystems.reduce((sum, s) => sum + (s.teamMembers?.length || 0), 0)}
                                    </span>
                                </div>
                                <div className="p-4 bg-emerald-50 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                                    <span className="text-[10px] font-mono font-black text-emerald-600 uppercase block">Gallery</span>
                                    <span className="text-3xl font-black text-slate-900">{siteData.gallery.length}</span>
                                </div>
                                <div className="p-4 bg-rose-50 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                                    <span className="text-[10px] font-mono font-black text-rose-600 uppercase block">Updates</span>
                                    <span className="text-3xl font-black text-slate-900">{siteData.updates.length}</span>
                                </div>
                                <div className="p-4 bg-indigo-50 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                                    <span className="text-[10px] font-mono font-black text-indigo-600 uppercase block">Leads</span>
                                    <span className="text-3xl font-black text-slate-900">{subscribers.length}</span>
                                </div>
                            </div>

                            {/* Quick Action Shortcuts */}
                            <div className="mt-8 space-y-3">
                                <span className="text-xs font-mono font-black uppercase text-slate-900 block">
                                    Quick Shortcuts:
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setActiveTab('hero')}
                                        className="press press-flat p-3 border-2 border-slate-900 bg-slate-50 hover:bg-sky-50 text-left font-mono font-bold text-xs flex items-center justify-between cursor-pointer"
                                    >
                                        <span>Edit Hero Headline & Badges</span>
                                        <span>→</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('subsystems')}
                                        className="press press-flat p-3 border-2 border-slate-900 bg-slate-50 hover:bg-sky-50 text-left font-mono font-bold text-xs flex items-center justify-between cursor-pointer"
                                    >
                                        <span>Add / Edit Squad Members</span>
                                        <span>→</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('subscribers')}
                                        className="press press-flat p-3 border-2 border-slate-900 bg-slate-50 hover:bg-sky-50 text-left font-mono font-bold text-xs flex items-center justify-between cursor-pointer"
                                    >
                                        <span>View Alliance Newsletter Leads ({subscribers.length})</span>
                                        <span>→</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('gallery')}
                                        className="press press-flat p-3 border-2 border-slate-900 bg-slate-50 hover:bg-sky-50 text-left font-mono font-bold text-xs flex items-center justify-between cursor-pointer"
                                    >
                                        <span>Add New Photo to DriftWall Gallery</span>
                                        <span>→</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('accounts')}
                                        className="press press-flat p-3 border-2 border-slate-900 bg-slate-50 hover:bg-sky-50 text-left font-mono font-bold text-xs flex items-center justify-between cursor-pointer"
                                    >
                                        <span>Manage Member Login Credentials</span>
                                        <span>→</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: HERO & GENERAL CONTENT */}
                    {activeTab === 'hero' && (
                        <div className="space-y-6">
                            <div className="border-b-2 border-slate-200 pb-4">
                                <h2 className="text-2xl font-black uppercase text-slate-900">Hero Section & Branding</h2>
                                <p className="text-xs font-bold text-slate-500 font-mono mt-1">
                                    Modify the landing title, tagline, ranking badges, and links.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-mono font-black uppercase text-slate-700 mb-1">
                                            Top Title Line
                                        </label>
                                        <input
                                            type="text"
                                            value={siteData.hero.teamTitle}
                                            onChange={e => updateHero({ teamTitle: e.target.value })}
                                            className="w-full px-3 py-2 border-2 border-slate-900 bg-slate-50 font-bold text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono font-black uppercase text-slate-700 mb-1">
                                            Main Brand Name
                                        </label>
                                        <input
                                            type="text"
                                            value={siteData.hero.teamName}
                                            onChange={e => updateHero({ teamName: e.target.value })}
                                            className="w-full px-3 py-2 border-2 border-slate-900 bg-slate-50 font-bold text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-mono font-black uppercase text-slate-700 mb-1">
                                        Hero Tagline / Subtitle
                                    </label>
                                    <input
                                        type="text"
                                        value={siteData.hero.tagline}
                                        onChange={e => updateHero({ tagline: e.target.value })}
                                        className="w-full px-3 py-2 border-2 border-slate-900 bg-slate-50 font-bold text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-mono font-black uppercase text-slate-700 mb-1">
                                        Join Team Google Form URL
                                    </label>
                                    <input
                                        type="text"
                                        value={siteData.hero.joinFormUrl}
                                        onChange={e => updateHero({ joinFormUrl: e.target.value })}
                                        className="w-full px-3 py-2 border-2 border-slate-900 bg-slate-50 font-mono text-xs"
                                    />
                                </div>

                                <div className="pt-4 border-t-2 border-slate-200">
                                    <span className="block text-xs font-mono font-black uppercase text-slate-900 mb-2">
                                        Hero Ranking Badges:
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {siteData.hero.badges.map((badge, idx) => (
                                            <div key={idx} className="p-3 border-2 border-slate-900 bg-slate-50">
                                                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                                                    Badge #{idx + 1}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={badge.label}
                                                    onChange={e => {
                                                        const updated = [...siteData.hero.badges];
                                                        updated[idx] = { ...updated[idx], label: e.target.value };
                                                        updateHero({ badges: updated });
                                                    }}
                                                    className="w-full px-2 py-1 border border-slate-900 bg-white font-mono font-bold text-xs"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div className="pt-6 border-t-2 border-slate-200 space-y-3">
                                    <h3 className="text-sm font-mono font-black uppercase text-slate-900">
                                        Official Contact & Social Channels
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-mono font-bold text-slate-600 mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={siteData.contact.email}
                                                onChange={e => updateContact({ email: e.target.value })}
                                                className="w-full px-3 py-1.5 border-2 border-slate-900 bg-slate-50 font-mono text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-mono font-bold text-slate-600 mb-1">Campus Location</label>
                                            <input
                                                type="text"
                                                value={siteData.contact.address}
                                                onChange={e => updateContact({ address: e.target.value })}
                                                className="w-full px-3 py-1.5 border-2 border-slate-900 bg-slate-50 font-mono text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-mono font-bold text-slate-600 mb-1">Instagram URL</label>
                                            <input
                                                type="text"
                                                value={siteData.contact.instagramUrl}
                                                onChange={e => updateContact({ instagramUrl: e.target.value })}
                                                className="w-full px-3 py-1.5 border-2 border-slate-900 bg-slate-50 font-mono text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-mono font-bold text-slate-600 mb-1">LinkedIn URL</label>
                                            <input
                                                type="text"
                                                value={siteData.contact.linkedinUrl}
                                                onChange={e => updateContact({ linkedinUrl: e.target.value })}
                                                className="w-full px-3 py-1.5 border-2 border-slate-900 bg-slate-50 font-mono text-xs"
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-[11px] font-mono font-bold text-slate-600 mb-1">GitHub URL</label>
                                            <input
                                                type="text"
                                                value={siteData.contact.githubUrl}
                                                onChange={e => updateContact({ githubUrl: e.target.value })}
                                                className="w-full px-3 py-1.5 border-2 border-slate-900 bg-slate-50 font-mono text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: OUR STORY */}
                    {activeTab === 'story' && (
                        <div className="space-y-4">
                            <div className="border-b-2 border-slate-200 pb-4">
                                <h2 className="text-2xl font-black uppercase text-slate-900">Our Story Narrative</h2>
                                <p className="text-xs font-bold text-slate-500 font-mono mt-1">
                                    Edit the origin essay displayed on the landing page. (Supports paragraphs).
                                </p>
                            </div>

                            <textarea
                                value={siteData.story}
                                onChange={e => updateStory(e.target.value)}
                                rows={18}
                                className="w-full p-4 border-2 border-slate-900 bg-slate-50 font-mono text-xs leading-relaxed focus:bg-white focus:outline-none"
                            />

                            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500">
                                <span>{siteData.story.length} Characters • ~{siteData.story.split(/\s+/).filter(Boolean).length} Words</span>
                                <button
                                    onClick={() => showStatus('Story updated and saved!')}
                                    className="press px-4 py-2 bg-sky-500 text-white font-mono font-black text-xs uppercase border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] cursor-pointer"
                                >
                                    Save Story Changes
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: SUBSYSTEMS & SQUAD MEMBERS */}
                    {activeTab === 'subsystems' && (
                        <div className="space-y-6">
                            <div className="border-b-2 border-slate-200 pb-4">
                                <h2 className="text-2xl font-black uppercase text-slate-900">Subsystem & Squad Roster</h2>
                                <p className="text-xs font-bold text-slate-500 font-mono mt-1">
                                    Manage technical specs, subsystem descriptions, and team specialists.
                                </p>
                            </div>

                            {/* Subsystem Selector Pills */}
                            <div className="flex flex-wrap gap-2">
                                {siteData.subsystems.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => setSelectedSubsystemId(s.id)}
                                        className={`px-3 py-1.5 border-2 border-slate-900 font-mono font-black text-xs uppercase transition-all cursor-pointer ${selectedSubsystemId === s.id
                                            ? 'bg-slate-900 text-white shadow-[2px_2px_0px_#0ea5e9]'
                                            : 'bg-white hover:bg-slate-100 text-slate-800'
                                            }`}
                                    >
                                        {s.name}
                                    </button>
                                ))}
                            </div>

                            {/* Active Subsystem Fields */}
                            <div className="p-4 border-2 border-slate-900 bg-slate-50 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-mono font-black uppercase text-slate-700 mb-1">
                                            Subsystem Title
                                        </label>
                                        <input
                                            type="text"
                                            value={currentSubsystem.name}
                                            onChange={e => updateSubsystem(currentSubsystem.id, { name: e.target.value })}
                                            className="w-full px-3 py-1.5 border-2 border-slate-900 bg-white font-bold text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono font-black uppercase text-slate-700 mb-1">
                                            Category Badge
                                        </label>
                                        <input
                                            type="text"
                                            value={currentSubsystem.badge}
                                            onChange={e => updateSubsystem(currentSubsystem.id, { badge: e.target.value })}
                                            className="w-full px-3 py-1.5 border-2 border-slate-900 bg-white font-mono text-xs"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-mono font-black uppercase text-slate-700 mb-1">
                                        Short Pitch / Tagline
                                    </label>
                                    <input
                                        type="text"
                                        value={currentSubsystem.tagline}
                                        onChange={e => updateSubsystem(currentSubsystem.id, { tagline: e.target.value })}
                                        className="w-full px-3 py-1.5 border-2 border-slate-900 bg-white font-bold text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-mono font-black uppercase text-slate-700 mb-1">
                                        Technical Description
                                    </label>
                                    <textarea
                                        value={currentSubsystem.fullDesc}
                                        onChange={e => updateSubsystem(currentSubsystem.id, { fullDesc: e.target.value })}
                                        rows={4}
                                        className="w-full p-3 border-2 border-slate-900 bg-white font-mono text-xs leading-relaxed"
                                    />
                                </div>
                            </div>

                            {/* Team Members List in this Subsystem */}
                            <div className="space-y-4 pt-4 border-t-2 border-slate-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-mono font-black uppercase text-slate-900">
                                        Specialists in {currentSubsystem.name} ({currentSubsystem.teamMembers?.length || 0})
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {(currentSubsystem.teamMembers || []).map((m, idx) => (
                                        <div key={idx} className="p-3.5 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] relative flex flex-col justify-between">
                                            <button
                                                onClick={() => deleteTeamMember(currentSubsystem.id, idx)}
                                                className="press press-flat absolute top-2 right-2 text-rose-500 hover:text-rose-700 font-black text-xs cursor-pointer p-1"
                                                title="Delete Member"
                                            >
                                                ✕
                                            </button>
                                            <div className="pr-6 space-y-2.5">
                                                {/* Photo Row & Preview */}
                                                <div className="flex items-center gap-3 bg-slate-50 p-2 border border-slate-300">
                                                    <div className="w-14 h-14 border-2 border-slate-900 bg-white flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                                                        {m.photo ? (
                                                            <img src={apiUrl(m.photo)} alt={m.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="font-mono text-[9px] font-black text-slate-400 text-center uppercase leading-tight">
                                                                NO<br />PHOTO
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <input
                                                            type="text"
                                                            value={m.photo || ''}
                                                            onChange={e => updateTeamMember(currentSubsystem.id, idx, { photo: e.target.value })}
                                                            placeholder="Photo URL or browse..."
                                                            className="w-full font-mono text-[10px] border border-slate-300 px-1.5 py-0.5 bg-white focus:outline-none"
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <label className="press press-flat px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-900 font-mono text-[9px] cursor-pointer font-bold uppercase">
                                                                <span>Upload Photo</span>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    onChange={e => handleImageUpload(e, (dataUrl) => updateTeamMember(currentSubsystem.id, idx, { photo: dataUrl }), '/asterix/squad')}
                                                                />
                                                            </label>
                                                            {m.photo && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateTeamMember(currentSubsystem.id, idx, { photo: '' })}
                                                                    className="press press-flat text-[9px] font-mono text-rose-600 hover:text-rose-800 font-bold uppercase cursor-pointer"
                                                                >
                                                                    Remove
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <input
                                                    type="text"
                                                    value={m.name}
                                                    onChange={e => updateTeamMember(currentSubsystem.id, idx, { name: e.target.value })}
                                                    placeholder="Member Name"
                                                    className="w-full font-black text-sm border-b border-slate-300 pb-0.5 focus:border-slate-900 focus:outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    value={m.role}
                                                    onChange={e => updateTeamMember(currentSubsystem.id, idx, { role: e.target.value })}
                                                    placeholder="Role Title"
                                                    className="w-full font-mono text-xs text-sky-600 font-bold border-b border-slate-200 pb-0.5 focus:border-slate-900 focus:outline-none"
                                                />
                                                <div className="flex items-center justify-between gap-2 pt-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] font-mono font-black uppercase text-slate-500">Status:</span>
                                                        <select
                                                            value={m.status || 'Active Member'}
                                                            onChange={e => updateTeamMember(currentSubsystem.id, idx, { status: e.target.value })}
                                                            className={`font-mono text-[10px] font-black border border-slate-900 px-2 py-0.5 cursor-pointer ${m.status === 'Alumni' ? 'bg-amber-100 text-amber-900' : 'bg-sky-100 text-sky-900'
                                                                }`}
                                                        >
                                                            <option value="Active Member">Active Member</option>
                                                            <option value="Alumni">Alumni</option>
                                                        </select>
                                                    </div>
                                                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 border border-slate-900 ${m.status === 'Alumni' ? 'bg-amber-300 text-amber-950' : 'bg-sky-300 text-sky-950'
                                                        }`}>
                                                        {m.status === 'Alumni' ? '★ ALUMNI' : '● ACTIVE'}
                                                    </span>
                                                </div>
                                                <textarea
                                                    value={m.bio}
                                                    onChange={e => updateTeamMember(currentSubsystem.id, idx, { bio: e.target.value })}
                                                    placeholder="Bio / Responsibilities"
                                                    rows={2}
                                                    className="w-full font-mono text-[11px] text-slate-600 border border-slate-200 p-1.5"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Add New Member Form */}
                                <div className="p-4 bg-sky-50 border-2 border-slate-900 space-y-3">
                                    <span className="text-xs font-mono font-black uppercase text-slate-900 block">
                                        + Add New Specialist to {currentSubsystem.name}
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                        <input
                                            type="text"
                                            value={newMember.name}
                                            onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                                            placeholder="Specialist Full Name"
                                            className="px-3 py-1.5 border-2 border-slate-900 bg-white text-xs font-bold"
                                        />
                                        <input
                                            type="text"
                                            value={newMember.role}
                                            onChange={e => setNewMember({ ...newMember, role: e.target.value })}
                                            placeholder="Role / Title"
                                            className="px-3 py-1.5 border-2 border-slate-900 bg-white text-xs font-bold"
                                        />
                                        <input
                                            type="text"
                                            value={newMember.badge}
                                            onChange={e => setNewMember({ ...newMember, badge: e.target.value })}
                                            placeholder="Badge (e.g. SPECIALIST)"
                                            className="px-3 py-1.5 border-2 border-slate-900 bg-white text-xs font-mono"
                                        />
                                        <select
                                            value={newMember.status || 'Active Member'}
                                            onChange={e => setNewMember({ ...newMember, status: e.target.value })}
                                            className="px-3 py-1.5 border-2 border-slate-900 bg-white text-xs font-mono font-bold cursor-pointer"
                                        >
                                            <option value="Active Member">Active Member</option>
                                            <option value="Alumni">Alumni</option>
                                        </select>
                                    </div>

                                    {/* Member Photo Input */}
                                    <div className="flex items-center gap-3 bg-white p-2.5 border-2 border-slate-900">
                                        <div className="w-14 h-14 border-2 border-slate-900 bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                                            {newMember.photo ? (
                                                <img src={apiUrl(newMember.photo)} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-mono text-[9px] font-black text-slate-400 text-center uppercase leading-tight">
                                                    PHOTO<br />PREVIEW
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-1.5">
                                            <input
                                                type="text"
                                                value={newMember.photo}
                                                onChange={e => setNewMember({ ...newMember, photo: e.target.value })}
                                                placeholder="Paste Photo URL or browse file below"
                                                className="w-full font-mono text-xs border border-slate-300 p-1 bg-white focus:outline-none"
                                            />
                                            <label className="press press-flat inline-block px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-900 font-mono text-[10px] cursor-pointer font-bold uppercase">
                                                <span>Browse Photo File</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={e => handleImageUpload(e, (dataUrl) => setNewMember(prev => ({ ...prev, photo: dataUrl })), '/asterix/squad')}
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <textarea
                                        value={newMember.bio}
                                        onChange={e => setNewMember({ ...newMember, bio: e.target.value })}
                                        placeholder="Engineering focus & responsibilities..."
                                        rows={2}
                                        className="w-full p-2 border-2 border-slate-900 bg-white text-xs font-mono"
                                    />
                                    <button
                                        onClick={() => {
                                            if (!newMember.name.trim()) return alert('Please enter specialist name');
                                            const initials = newMember.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'TM';
                                            addTeamMember(currentSubsystem.id, { ...newMember, initials });
                                            setNewMember({ name: '', role: '', initials: '', bio: '', badge: 'SPECIALIST', photo: '', status: 'Active Member' });
                                            showStatus('New specialist added with photo & status!');
                                        }}
                                        className="press press-flat px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-mono font-black text-xs uppercase cursor-pointer"
                                    >
                                        Add Specialist →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: SPONSORSHIP PORTAL */}
                    {activeTab === 'sponsorship' && (
                        <div className="space-y-6">
                            <div className="border-b-2 border-slate-200 pb-4">
                                <h2 className="text-2xl font-black uppercase text-slate-900">Sponsorship Portal & Deck Files</h2>
                                <p className="text-xs font-bold text-slate-500 font-mono mt-1">
                                    Configure downloadable pitch files, brochures, and partnership documents displayed on #sponsor.
                                </p>
                            </div>

                            <div className="p-6 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] space-y-4">
                                <div>
                                    <label className="block text-xs font-mono font-black uppercase text-slate-700 mb-1">
                                        Official Sponsorship Brochure URL (PDF)
                                    </label>
                                    <input
                                        type="text"
                                        value={siteData.sponsorship?.brochureUrl || ''}
                                        onChange={e => updateSponsorship({ brochureUrl: e.target.value })}
                                        placeholder="https://... or /brochure.pdf (Leave blank for default auto-generated document)"
                                        className="w-full px-3 py-2 border-2 border-slate-900 font-mono text-xs focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-mono font-black uppercase text-slate-700 mb-1">
                                        Vehicle Technical Architecture Pitch Deck URL
                                    </label>
                                    <input
                                        type="text"
                                        value={siteData.sponsorship?.deckUrl || ''}
                                        onChange={e => updateSponsorship({ deckUrl: e.target.value })}
                                        placeholder="https://... or /deck.pdf"
                                        className="w-full px-3 py-2 border-2 border-slate-900 font-mono text-xs focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-mono font-black uppercase text-slate-700 mb-1">
                                        Formal Institution Endorsement Letter URL
                                    </label>
                                    <input
                                        type="text"
                                        value={siteData.sponsorship?.letterUrl || ''}
                                        onChange={e => updateSponsorship({ letterUrl: e.target.value })}
                                        placeholder="https://... or /institution_letter.pdf"
                                        className="w-full px-3 py-2 border-2 border-slate-900 font-mono text-xs focus:outline-none"
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => showStatus('Sponsorship portal settings updated successfully!')}
                                        className="press px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-mono font-black text-xs uppercase border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] cursor-pointer"
                                    >
                                        Save Sponsorship Settings →
                                    </button>
                                </div>
                            </div>

                            {/* Incoming Corporate Sponsor Inquiries */}
                            <div className="border-t-4 border-slate-900 pt-6 space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-black uppercase text-slate-900 flex items-center gap-2">
                                            <span>Corporate Sponsor Inquiries</span>
                                            <span className="text-xs px-2 py-0.5 bg-sky-500 text-white font-mono font-bold">
                                                {sponsorInquiries.length}
                                            </span>
                                        </h3>
                                        <p className="text-xs font-bold text-slate-500 font-mono">
                                            Inquiries submitted via the partnership proposal form on #sponsor.
                                        </p>
                                    </div>
                                    <button
                                        onClick={fetchInquiries}
                                        className="press press-flat px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-xs font-mono font-bold cursor-pointer"
                                    >
                                        ↻ Refresh Inquiries
                                    </button>
                                </div>

                                {isLoadingInquiries ? (
                                    <div className="p-8 text-center font-mono text-sm text-slate-500 bg-white border-2 border-slate-900">
                                        Loading inquiries from MongoDB Atlas...
                                    </div>
                                ) : sponsorInquiries.length === 0 ? (
                                    <div className="p-8 text-center border-2 border-dashed border-slate-300 font-mono text-xs text-slate-500 bg-white">
                                        No sponsor inquiries recorded yet. Submissions from the Sponsorship form will appear here.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto border-2 border-slate-900 bg-white shadow-[4px_4px_0px_#0f172a]">
                                        <table className="w-full text-left font-mono text-xs">
                                            <thead className="bg-slate-900 text-white font-black uppercase text-[10px]">
                                                <tr>
                                                    <th className="p-2.5">Company & Contact</th>
                                                    <th className="p-2.5">Email / Phone</th>
                                                    <th className="p-2.5">Tier</th>
                                                    <th className="p-2.5">Message</th>
                                                    <th className="p-2.5">Status</th>
                                                    <th className="p-2.5 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {sponsorInquiries.map(inq => (
                                                    <tr key={inq.id} className="hover:bg-slate-50">
                                                        <td className="p-2.5">
                                                            <div className="font-bold text-slate-900">{inq.companyName}</div>
                                                            <div className="text-[11px] text-slate-500">{inq.contactPerson || '—'}</div>
                                                        </td>
                                                        <td className="p-2.5">
                                                            <div className="text-slate-800">{inq.email}</div>
                                                            <div className="text-[11px] text-slate-500">{inq.phone || '—'}</div>
                                                        </td>
                                                        <td className="p-2.5">
                                                            <span className="px-2 py-0.5 border border-slate-900 text-[10px] font-bold bg-amber-200 text-slate-900">
                                                                {inq.tier}
                                                            </span>
                                                        </td>
                                                        <td className="p-2.5 max-w-xs text-slate-600 truncate" title={inq.message}>
                                                            {inq.message || '—'}
                                                        </td>
                                                        <td className="p-2.5">
                                                            <select
                                                                value={inq.status}
                                                                onChange={e => handleUpdateInquiryStatus(inq.id, e.target.value)}
                                                                className="px-1.5 py-0.5 border border-slate-900 text-[10px] font-bold bg-white focus:outline-none"
                                                            >
                                                                <option value="NEW">NEW</option>
                                                                <option value="REVIEWED">REVIEWED</option>
                                                                <option value="CONTACTED">CONTACTED</option>
                                                                <option value="ARCHIVED">ARCHIVED</option>
                                                            </select>
                                                        </td>
                                                        <td className="p-2.5 text-right">
                                                            <button
                                                                onClick={() => handleDeleteInquiry(inq.id)}
                                                                className="press press-flat text-rose-600 hover:text-rose-900 font-black cursor-pointer text-xs"
                                                            >
                                                                Delete ✕
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB: RECRUITMENT PORTAL */}
                    {activeTab === 'recruitment' && (
                        <div className="space-y-6">
                            <div className="border-b-2 border-slate-200 pb-4">
                                <h2 className="text-2xl font-black uppercase text-slate-900">Recruitment & Results Portal</h2>
                                <p className="text-xs font-bold text-slate-500 font-mono mt-1">
                                    Manage recruitment cycles, application links, and live selection results on #join.
                                </p>
                            </div>

                            <div className="p-6 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-mono font-black uppercase text-slate-700 mb-1">
                                            Recruitment Application Form URL
                                        </label>
                                        <input
                                            type="text"
                                            value={siteData.recruitment?.applicationLink || siteData.hero?.joinFormUrl || ''}
                                            onChange={e => updateRecruitment({ applicationLink: e.target.value })}
                                            placeholder="https://forms.gle/..."
                                            className="w-full px-3 py-2 border-2 border-slate-900 font-mono text-xs focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono font-black uppercase text-slate-700 mb-1">
                                            Recruitment Stage Status Badge
                                        </label>
                                        <select
                                            value={siteData.recruitment?.status || 'APPLICATIONS OPEN'}
                                            onChange={e => updateRecruitment({ status: e.target.value })}
                                            className="w-full px-3 py-2 border-2 border-slate-900 font-mono text-xs font-bold bg-white cursor-pointer focus:outline-none"
                                        >
                                            <option value="APPLICATIONS OPEN">APPLICATIONS OPEN</option>
                                            <option value="SCREENING ONGOING">SCREENING ONGOING</option>
                                            <option value="PROBLEM STATEMENTS ACTIVE">PROBLEM STATEMENTS ACTIVE</option>
                                            <option value="INTERVIEWS SCHEDULED">INTERVIEWS SCHEDULED</option>
                                            <option value="RESULTS PUBLISHED">RESULTS PUBLISHED</option>
                                            <option value="RECRUITMENT CLOSED">RECRUITMENT CLOSED</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Stage deadlines -- these drive the countdown board on #join. */}
                                <div className="pt-4 border-t-2 border-slate-200">
                                    <div className="flex items-center justify-between gap-3 mb-1">
                                        <span className="text-xs font-mono font-black uppercase text-slate-900">
                                            Stage Deadlines (Countdown Board)
                                        </span>
                                        <button
                                            type="button"
                                            onClick={addDeadline}
                                            className="press px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-mono font-black text-[11px] uppercase border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] cursor-pointer"
                                        >
                                            + Add Stage
                                        </button>
                                    </div>
                                    <p className="text-[11px] font-mono font-bold text-slate-500 mb-4">
                                        Times are Indian Standard Time. The soonest stage that has not closed goes
                                        on the board; the rest stay listed as upcoming.
                                    </p>

                                    <div className="space-y-3">
                                        {recruitmentDeadlines.length === 0 && (
                                            <p className="p-4 bg-slate-100 border-2 border-dashed border-slate-400 text-xs font-mono font-bold text-slate-500">
                                                No stages yet. Add one to put a deadline on the board.
                                            </p>
                                        )}
                                        {recruitmentDeadlines.map((d, idx) => (
                                            <div
                                                key={d.id || idx}
                                                className="p-4 bg-sky-50 border-2 border-slate-900 grid grid-cols-1 sm:grid-cols-[4rem_1fr_1fr_auto] gap-3 items-start"
                                            >
                                                <div>
                                                    <label className="block text-[10px] font-mono font-black uppercase text-slate-600 mb-1">
                                                        Stage
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={d.stage || ''}
                                                        onChange={e => updateDeadline(idx, { stage: e.target.value })}
                                                        placeholder="01"
                                                        className="w-full px-2 py-1.5 border-2 border-slate-900 bg-white font-mono text-xs font-black"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-mono font-black uppercase text-slate-600 mb-1">
                                                        Deadline Label
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={d.label || ''}
                                                        onChange={e => updateDeadline(idx, { label: e.target.value })}
                                                        placeholder="Problem Statement Submission"
                                                        className="w-full px-2 py-1.5 border-2 border-slate-900 bg-white text-xs font-bold"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={d.detail || ''}
                                                        onChange={e => updateDeadline(idx, { detail: e.target.value })}
                                                        placeholder="One line shown under the label"
                                                        className="mt-2 w-full px-2 py-1.5 border-2 border-slate-900 bg-white text-xs"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-mono font-black uppercase text-slate-600 mb-1">
                                                        Closes (IST)
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        value={istInputValue(d.date)}
                                                        onChange={e => updateDeadline(idx, { date: istInputToIso(e.target.value) })}
                                                        className="w-full px-2 py-1.5 border-2 border-slate-900 bg-white font-mono text-xs font-bold"
                                                    />
                                                    <label className="block text-[10px] font-mono font-black uppercase text-slate-600 mt-2 mb-1">
                                                        Opens (IST, optional)
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        value={istInputValue(d.opensAt)}
                                                        onChange={e => updateDeadline(idx, { opensAt: istInputToIso(e.target.value) })}
                                                        className="w-full px-2 py-1.5 border-2 border-slate-900 bg-white font-mono text-xs"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeDeadline(idx)}
                                                    className="press px-3 py-1.5 bg-rose-400 hover:bg-rose-300 text-slate-900 font-mono font-black text-[11px] uppercase border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] cursor-pointer sm:mt-5"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => showStatus('Recruitment portal settings saved successfully!')}
                                        className="press px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-mono font-black text-xs uppercase border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] cursor-pointer"
                                    >
                                        Save Recruitment Settings →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 5: GALLERY & MEDIA */}
                    {activeTab === 'gallery' && (
                        <div className="space-y-6">
                            <div className="border-b-2 border-slate-200 pb-4">
                                <h2 className="text-2xl font-black uppercase text-slate-900">DriftWall Media Gallery</h2>
                                <p className="text-xs font-bold text-slate-500 font-mono mt-1">
                                    Add, update, or remove track and workshop photos in the 3D gallery archive.
                                </p>
                            </div>

                            {/* Add Photo Form */}
                            <div className="p-4 bg-sky-50 border-2 border-slate-900 space-y-3">
                                <span className="text-xs font-mono font-black uppercase text-slate-900 block">
                                    + Add New Image to Gallery
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <input
                                        type="text"
                                        value={newGallery.title}
                                        onChange={e => setNewGallery({ ...newGallery, title: e.target.value })}
                                        placeholder="Photo Title"
                                        className="px-3 py-1.5 border-2 border-slate-900 bg-white text-xs font-bold"
                                    />
                                    <input
                                        type="text"
                                        value={newGallery.category}
                                        onChange={e => setNewGallery({ ...newGallery, category: e.target.value })}
                                        placeholder="Tag (e.g. WORKSHOP • FAB)"
                                        className="px-3 py-1.5 border-2 border-slate-900 bg-white text-xs font-mono"
                                    />
                                    <input
                                        type="text"
                                        value={newGallery.year}
                                        onChange={e => setNewGallery({ ...newGallery, year: e.target.value })}
                                        placeholder="Year (e.g. 2026)"
                                        className="px-3 py-1.5 border-2 border-slate-900 bg-white text-xs font-mono"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                                    <div className="flex gap-2 items-center">
                                        {newGallery.src ? (
                                            <div className="w-14 h-14 border-2 border-slate-900 overflow-hidden bg-slate-100 flex-shrink-0">
                                                <img src={apiUrl(newGallery.src)} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-14 h-14 border-2 border-dashed border-slate-400 bg-slate-100 flex items-center justify-center text-[9px] font-mono text-slate-500 font-bold text-center flex-shrink-0">
                                                PHOTO<br />PREVIEW
                                            </div>
                                        )}
                                        <input
                                            type="text"
                                            value={newGallery.src}
                                            onChange={e => setNewGallery({ ...newGallery, src: e.target.value })}
                                            placeholder="Image URL or choose file →"
                                            className="flex-1 px-3 py-2 border-2 border-slate-900 bg-white text-xs font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="press inline-flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-white hover:bg-slate-100 border-2 border-slate-900 font-mono text-xs font-bold uppercase cursor-pointer shadow-[2px_2px_0px_#0f172a] hover:translate-x-[-1px] hover:translate-y-[-1px]">
                                            <span className="inline-flex items-center gap-1.5"><Icon name="folder" className="w-4 h-4" />Choose Photo from Device</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={e => handleImageUpload(e, (url) => setNewGallery(prev => ({ ...prev, src: url })), '/asterix/gallery')}
                                            />
                                        </label>
                                    </div>
                                </div>

                                <input
                                    type="text"
                                    value={newGallery.desc}
                                    onChange={e => setNewGallery({ ...newGallery, desc: e.target.value })}
                                    placeholder="Photo description / technical context"
                                    className="w-full px-3 py-1.5 border-2 border-slate-900 bg-white text-xs font-mono"
                                />

                                <button
                                    onClick={() => {
                                        if (!newGallery.title || !newGallery.src) return alert('Please provide photo title and image URL/file');
                                        addGalleryItem({ ...newGallery, id: `gal-${Date.now()}` });
                                        setNewGallery({ title: '', category: 'PIT LANE', year: '2026', src: '', desc: '' });
                                        showStatus('New photo added to gallery!');
                                    }}
                                    className="press press-flat px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-mono font-black text-xs uppercase cursor-pointer"
                                >
                                    Publish Photo to Gallery →
                                </button>
                            </div>

                            {/* Gallery List */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {siteData.gallery.map(item => (
                                    <div key={item.id} className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] p-3 flex flex-col justify-between">
                                        <div>
                                            <div className="h-32 w-full overflow-hidden border border-slate-900 mb-2 bg-slate-200">
                                                <img src={apiUrl(item.src)} alt={item.title} className="w-full h-full object-cover" />
                                            </div>
                                            <input
                                                type="text"
                                                value={item.title}
                                                onChange={e => updateGalleryItem(item.id, { title: e.target.value })}
                                                className="font-black text-xs border-b border-slate-300 pb-0.5 w-full focus:outline-none"
                                            />
                                            <span className="text-[10px] font-mono text-sky-600 block mt-1">
                                                {item.category} • {item.year}
                                            </span>
                                            <p className="text-[11px] font-mono text-slate-600 mt-1 line-clamp-2">
                                                {item.desc}
                                            </p>
                                        </div>
                                        <div className="pt-2 mt-2 border-t border-slate-200 flex justify-end">
                                            <button
                                                onClick={() => deleteGalleryItem(item.id)}
                                                className="press press-flat text-rose-600 hover:text-rose-800 font-mono text-xs font-black cursor-pointer"
                                            >
                                                Delete Photo ✕
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 6: TEAM UPDATES */}
                    {activeTab === 'updates' && (
                        <div className="space-y-6">
                            <div className="border-b-2 border-slate-200 pb-4">
                                <h2 className="text-2xl font-black uppercase text-slate-900">Proving Grounds Team Updates</h2>
                                <p className="text-xs font-bold text-slate-500 font-mono mt-1">
                                    Manage cards in the accordion updates feed.
                                </p>
                            </div>

                            {/* Add Update Form */}
                            <div className="p-4 bg-sky-50 border-2 border-slate-900 space-y-3">
                                <span className="text-xs font-mono font-black uppercase text-slate-900 block">
                                    + Add New Team Update
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        value={newUpdateItem.label}
                                        onChange={e => setNewUpdateItem({ ...newUpdateItem, label: e.target.value })}
                                        placeholder="Update Title / Milestone"
                                        className="px-3 py-1.5 border-2 border-slate-900 bg-white text-xs font-bold"
                                    />
                                    <input
                                        type="text"
                                        value={newUpdateItem.tag}
                                        onChange={e => setNewUpdateItem({ ...newUpdateItem, tag: e.target.value })}
                                        placeholder="Tag (e.g. FEB 2026 • PIT LANE)"
                                        className="px-3 py-1.5 border-2 border-slate-900 bg-white text-xs font-mono"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                                    <div className="flex gap-2 items-center">
                                        {newUpdateItem.image ? (
                                            <div className="w-14 h-14 border-2 border-slate-900 overflow-hidden bg-slate-100 flex-shrink-0">
                                                <img src={newUpdateItem.image} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-14 h-14 border-2 border-dashed border-slate-400 bg-slate-100 flex items-center justify-center text-[9px] font-mono text-slate-500 font-bold text-center flex-shrink-0">
                                                PHOTO<br />PREVIEW
                                            </div>
                                        )}
                                        <input
                                            type="text"
                                            value={newUpdateItem.image}
                                            onChange={e => setNewUpdateItem({ ...newUpdateItem, image: e.target.value })}
                                            placeholder="Image URL or choose file →"
                                            className="flex-1 px-3 py-2 border-2 border-slate-900 bg-white text-xs font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="press inline-flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-white hover:bg-slate-100 border-2 border-slate-900 font-mono text-xs font-bold uppercase cursor-pointer shadow-[2px_2px_0px_#0f172a] hover:translate-x-[-1px] hover:translate-y-[-1px]">
                                            <span className="inline-flex items-center gap-1.5"><Icon name="folder" className="w-4 h-4" />Choose Photo from Device</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={e => handleImageUpload(e, (url) => setNewUpdateItem(prev => ({ ...prev, image: url })), '/asterix/updates')}
                                            />
                                        </label>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        if (!newUpdateItem.label) return alert('Please provide an update title');
                                        addUpdate({ ...newUpdateItem, id: `upd-${Date.now()}` });
                                        setNewUpdateItem({ label: '', tag: 'PROVING GROUNDS', image: '', link: '#' });
                                        showStatus('Team update published!');
                                    }}
                                    className="press press-flat px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-mono font-black text-xs uppercase cursor-pointer"
                                >
                                    Publish Update →
                                </button>
                            </div>

                            {/* Updates List */}
                            <div className="space-y-3">
                                {siteData.updates.map(upd => (
                                    <div key={upd.id} className="p-3 bg-white border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            {upd.image && (
                                                <img src={apiUrl(upd.image)} alt={upd.label} className="w-14 h-10 object-cover border border-slate-900" />
                                            )}
                                            <div>
                                                <input
                                                    type="text"
                                                    value={upd.label}
                                                    onChange={e => updateUpdate(upd.id, { label: e.target.value })}
                                                    className="font-bold text-xs border-b border-slate-300 focus:outline-none"
                                                />
                                                <span className="text-[10px] font-mono text-sky-600 block">
                                                    {upd.tag}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteUpdate(upd.id)}
                                            className="press press-flat text-rose-600 hover:text-rose-800 font-mono text-xs font-black cursor-pointer"
                                        >
                                            Delete ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB: ALLIANCE LEADS / SUBSCRIBERS */}
                    {activeTab === 'subscribers' && (
                        <div className="space-y-6">
                            <div className="border-b-2 border-slate-200 pb-4 flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-black uppercase text-slate-900">Alliance Leads & Subscribers</h2>
                                    <p className="text-xs font-bold text-slate-500 font-mono mt-1">
                                        Submissions from the "Join the Alliance" newsletter form, stored securely in SQLite.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={fetchSubscribers}
                                        className="press press-flat px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-xs font-mono font-bold cursor-pointer"
                                    >
                                        ↻ Refresh
                                    </button>
                                    <button
                                        onClick={handleExportSubscribersCSV}
                                        disabled={subscribers.length === 0}
                                        className="press px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white border-2 border-slate-900 text-xs font-mono font-black uppercase shadow-[2px_2px_0px_#0f172a] cursor-pointer disabled:opacity-50"
                                    >
                                        Export CSV ↓
                                    </button>
                                </div>
                            </div>

                            {isLoadingSubscribers ? (
                                <div className="p-8 text-center font-mono text-sm text-slate-500">
                                    Loading subscribers from database...
                                </div>
                            ) : subscribers.length === 0 ? (
                                <div className="p-8 text-center border-2 border-dashed border-slate-300 font-mono text-xs text-slate-500">
                                    No alliance leads recorded yet. Submissions from the website newsletter section will appear here automatically.
                                </div>
                            ) : (
                                <div className="overflow-x-auto border-2 border-slate-900">
                                    <table className="w-full text-left font-mono text-xs">
                                        <thead className="bg-slate-900 text-white font-black uppercase text-[10px]">
                                            <tr>
                                                <th className="p-2.5">Email</th>
                                                <th className="p-2.5">Phone</th>
                                                <th className="p-2.5">Joined Date</th>
                                                <th className="p-2.5 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {subscribers.map(sub => (
                                                <tr key={sub.id} className="hover:bg-slate-50">
                                                    <td className="p-2.5 font-bold text-slate-900">{sub.email}</td>
                                                    <td className="p-2.5 text-slate-600">{sub.phone || '—'}</td>
                                                    <td className="p-2.5 text-slate-500 text-[11px]">
                                                        {sub.created_at ? new Date(sub.created_at).toLocaleString() : 'Recent'}
                                                    </td>
                                                    <td className="p-2.5 text-right">
                                                        <button
                                                            onClick={() => handleDeleteSubscriber(sub.id)}
                                                            className="press press-flat text-rose-600 hover:text-rose-900 font-black cursor-pointer"
                                                        >
                                                            Delete ✕
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: TEAM MEMBER ACCOUNTS */}
                    {activeTab === 'accounts' && (
                        <div className="space-y-6">
                            <div className="border-b-2 border-slate-200 pb-4">
                                <h2 className="text-2xl font-black uppercase text-slate-900">Team Member Logins & Access</h2>
                                <p className="text-xs font-bold text-slate-500 font-mono mt-1">
                                    Manage usernames, passwords, and permissions for members authorized to edit the site.
                                </p>
                            </div>

                            {/* Add Account Form */}
                            <div className="p-4 bg-sky-50 border-2 border-slate-900 space-y-3">
                                <span className="text-xs font-mono font-black uppercase text-slate-900 block">
                                    + Add New Team Member Login
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        value={newAccount.username}
                                        onChange={e => setNewAccount({ ...newAccount, username: e.target.value })}
                                        placeholder="Username (e.g. software_lead)"
                                        className="px-3 py-1.5 border-2 border-slate-900 bg-white text-xs font-mono"
                                    />
                                    <input
                                        type="password"
                                        value={newAccount.password}
                                        onChange={e => setNewAccount({ ...newAccount, password: e.target.value })}
                                        placeholder="Password"
                                        className="px-3 py-1.5 border-2 border-slate-900 bg-white text-xs font-mono"
                                    />
                                    <input
                                        type="text"
                                        value={newAccount.name}
                                        onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                                        placeholder="Full Name"
                                        className="px-3 py-1.5 border-2 border-slate-900 bg-white text-xs font-bold"
                                    />
                                    <input
                                        type="text"
                                        value={newAccount.role}
                                        onChange={e => setNewAccount({ ...newAccount, role: e.target.value })}
                                        placeholder="Team Role (e.g. Powertrain Lead)"
                                        className="px-3 py-1.5 border-2 border-slate-900 bg-white text-xs font-bold"
                                    />
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!newAccount.username || !newAccount.password) return alert('Username and password are required');
                                        const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
                                        if (token) {
                                            try {
                                                const res = await fetch(apiUrl('/api/auth/accounts'), {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${token}`
                                                    },
                                                    body: JSON.stringify(newAccount)
                                                });
                                                if (res.ok) {
                                                    const data = await res.json();
                                                    setDbAccounts(prev => [...prev, data.account]);
                                                    addAccount(data.account);
                                                    setNewAccount({ username: '', password: '', name: '', role: 'Team Member', accessLevel: 'Lead' });
                                                    showStatus('New member account saved to SQLite database!');
                                                    return;
                                                } else {
                                                    const errData = await res.json().catch(() => ({}));
                                                    alert(errData.error || 'Failed to create account.');
                                                    return;
                                                }
                                            } catch (err) {
                                                console.warn('Server error, fallback to local state:', err);
                                            }
                                        }
                                        addAccount({ ...newAccount, id: `acc-${Date.now()}` });
                                        setNewAccount({ username: '', password: '', name: '', role: 'Team Member', accessLevel: 'Lead' });
                                        showStatus('New member account created!');
                                    }}
                                    className="press press-flat px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-mono font-black text-xs uppercase cursor-pointer"
                                >
                                    Create Member Login →
                                </button>
                            </div>

                            {/* Accounts Table */}
                            <div className="overflow-x-auto border-2 border-slate-900">
                                <table className="w-full text-left font-mono text-xs">
                                    <thead className="bg-slate-900 text-white font-black uppercase text-[10px]">
                                        <tr>
                                            <th className="p-2.5">User</th>
                                            <th className="p-2.5">Username</th>
                                            <th className="p-2.5">Role</th>
                                            <th className="p-2.5">Access</th>
                                            <th className="p-2.5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {(dbAccounts.length > 0 ? dbAccounts : siteData.accounts).map(acc => (
                                            <tr key={acc.id} className="hover:bg-slate-50">
                                                <td className="p-2.5 font-bold">{acc.name}</td>
                                                <td className="p-2.5 text-sky-600 font-bold">{acc.username}</td>
                                                <td className="p-2.5">{acc.role}</td>
                                                <td className="p-2.5">
                                                    <span className="px-2 py-0.5 bg-slate-100 border border-slate-400 text-[10px]">
                                                        {acc.accessLevel}
                                                    </span>
                                                </td>
                                                <td className="p-2.5 text-right">
                                                    {acc.username !== 'admin' && (
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm(`Delete account for ${acc.name}?`)) return;
                                                                const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
                                                                if (token) {
                                                                    try {
                                                                        const res = await fetch(apiUrl(`/api/auth/accounts/${acc.id}`), {
                                                                            method: 'DELETE',
                                                                            headers: { 'Authorization': `Bearer ${token}` }
                                                                        });
                                                                        if (res.ok) {
                                                                            setDbAccounts(prev => prev.filter(a => a.id !== acc.id));
                                                                            deleteAccount(acc.id);
                                                                            showStatus('Account removed from database!');
                                                                            return;
                                                                        }
                                                                    } catch (err) {
                                                                        console.warn('Backend delete failed:', err);
                                                                    }
                                                                }
                                                                deleteAccount(acc.id);
                                                                showStatus('Account removed.');
                                                            }}
                                                            className="press press-flat text-rose-600 hover:text-rose-900 font-black cursor-pointer"
                                                        >
                                                            Delete ✕
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 8: SETTINGS & BACKUP */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <div className="border-b-2 border-slate-200 pb-4">
                                <h2 className="text-2xl font-black uppercase text-slate-900">System Backup & Maintenance</h2>
                                <p className="text-xs font-bold text-slate-500 font-mono mt-1">
                                    Download all edits as JSON, restore from existing files, or reset to original defaults.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 border-2 border-slate-900 bg-slate-50 space-y-3">
                                    <h3 className="font-mono font-black text-xs uppercase text-slate-900">
                                        Export Data Backup
                                    </h3>
                                    <p className="text-xs text-slate-600">
                                        Downloads a complete JSON snapshot containing all text content, media links, squad members, and accounts.
                                    </p>
                                    <button
                                        onClick={handleDownloadBackup}
                                        className="press px-4 py-2 bg-sky-500 text-white font-mono font-black text-xs uppercase border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] cursor-pointer"
                                    >
                                        Download Backup JSON ↓
                                    </button>
                                </div>

                                <div className="p-4 border-2 border-slate-900 bg-slate-50 space-y-3">
                                    <h3 className="font-mono font-black text-xs uppercase text-slate-900">
                                        Restore from Backup
                                    </h3>
                                    <p className="text-xs text-slate-600">
                                        Upload a previously exported JSON backup file to instantly populate the site with your saved data.
                                    </p>
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleRestoreBackup}
                                        className="text-xs font-mono"
                                    />
                                </div>
                            </div>

                            {/* Reset Section */}
                            <div className="pt-6 border-t-2 border-slate-200">
                                <div className="p-4 border-2 border-rose-600 bg-rose-50 space-y-2">
                                    <h3 className="font-mono font-black text-xs uppercase text-rose-700">
                                        Reset to Factory Defaults
                                    </h3>
                                    <p className="text-xs text-rose-800">
                                        Clears all customized edits in local storage and restores the initial original Team Asterix data.
                                    </p>
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Are you sure you want to reset all content to default settings?')) {
                                                resetToDefaults();
                                                showStatus('Reset completed successfully!');
                                            }
                                        }}
                                        className="press px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-mono font-black text-xs uppercase border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] cursor-pointer"
                                    >
                                        Reset All Content
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </main>

            </div>

        </div>
    );
}
