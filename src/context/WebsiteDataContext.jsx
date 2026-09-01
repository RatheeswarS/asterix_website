import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { subsystems as initialSubsystems } from '../data/subsystemsData';
import { apiUrl } from '../lib/api';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

import imgPaddock from '../assets/gallery/01_team_paddock.jpg';
import imgWelding from '../assets/gallery/02_workshop_welding.jpg';
import imgLidar from '../assets/gallery/03_lidar_sensor_tuning.jpg';
import imgTrack from '../assets/gallery/04_track_dirt_action.jpg';
import imgMechanics from '../assets/gallery/05_pitlane_mechanics.jpg';
import imgCelebration from '../assets/gallery/06_team_celebration.jpg';

export { apiUrl } from '../lib/api';

const LOCAL_STORAGE_KEY = 'asterix_website_data_v1';
export const AUTH_SESSION_KEY = 'asterix_admin_session_v1';
export const AUTH_TOKEN_KEY = 'asterix_admin_token_v1';

// Initial default story narrative
const initialStoryText = `It started as a training program.

In the first year, there was no Team Asterix, no competition vehicle, and no clear idea where the journey would lead. It was simply a group of students learning how vehicles worked. Months were spent understanding vehicle dynamics, control systems, electronics, and autonomous technologies.

About a year later, the group decided to take the program seriously and registered for SAE BAJA 2026. Somewhere along that journey, the name Asterix came into existence, and the training program evolved into a team with a much bigger ambition.

That was where the real learning began.

The project was divided into four major subsystems: Software & Perception, Powertrain, Mechanical, and Leads. Each had its own challenges, but the vehicle could only work when all four came together.

The team started with planning. Budgets were prepared, timelines were drawn, documents were written, and everything looked organized on paper. But this was the first BAJA vehicle ever built by this group. When work moved from paper to the workshop, reality hit hard.

Parts did not arrive on time. Some components were missing. Others arrived damaged or did not fit the way they were supposed to. Fabrication work was delayed, and testing schedules had to be rewritten again and again. Every week brought a new obstacle, and progress felt painfully slow.

Then came the physical assembly.

Mounting the systems was far more complicated than expected. Wires had to be rerouted, brackets had to be redesigned, and mechanical adjustments had to be made directly on the vehicle frame. Days were spent troubleshooting electrical noise, sensor communication drops, and mechanical alignment issues. The workshop slowly became a place of long hours, frustration, and continuous trial and error.

Testing brought another layer of difficulty.

Systems that worked in isolation failed when connected together. Sensors gave unexpected readings when the vehicle moved. The steering actuator responded with slight delays that had to be corrected through control tuning. The brake actuator required precise pressure calibration to ensure safe stopping distances. Each test run revealed a new flaw, and each flaw meant going back to the design, changing parameters, and testing again.

There were moments when things seemed stalled. The competition deadline was approaching, the vehicle was still not performing reliably, and fatigue was beginning to set in. The team had to make difficult decisions: simplify certain mechanisms, rebuild faulty connections, and work through nights to keep the project alive.

What kept the team moving forward was simple: the vehicle had to drive.

Bit by bit, the problems were solved. The software pipeline stabilized. The drive-by-wire systems began responding accurately to commands. The mechanical assembly became solid. The vehicle that once existed only as sketches and CAD files slowly became an actual running machine.

Team Asterix was not built with experience or endless resources. It was built through mistakes, delays, redesigns, and the stubborn refusal to leave the workshop until the car worked.

SAE BAJA was never just a competition for this team.

It was the reason a training program turned into a family of engineers who learned how to build something real from nothing.`;

// Initial default hero data
const initialHeroData = {
    teamTitle: "TEAM",
    teamName: "ASTERIX",
    tagline: "Got the passion? We got the track.",
    badges: [
        { label: "AIR 13", class: "rotate-[-3deg] bg-amber-300 text-slate-900" },
        { label: "SAEINDIA a-BAJA 2026", class: "bg-white text-slate-900" },
        { label: "★ TN RANK 1", class: "rotate-[3deg] bg-sky-400 text-white" }
    ],
    ctaText: "EXPLORE THE SQUAD →",
    ctaLink: "#squad",
    joinFormUrl: "https://forms.gle/6hHG6aXqrunnfj7V6"
};

// Initial default gallery items
const initialGalleryItems = [
    {
        id: "gal-1",
        title: "Paddock Dawn Inspection",
        category: "PIT LANE • SCRUTINEERING",
        year: "2026",
        src: imgPaddock,
        desc: "Complete pre-race technical scrutineering and telemetry calibration under paddock sunrise."
    },
    {
        id: "gal-2",
        title: "Spaceframe Chassis TIG Welding",
        category: "WORKSHOP • CHASSIS FAB",
        year: "2025",
        src: imgWelding,
        desc: "Precision TIG welding of AISI 4130 chromoly roll cage joints with zero dimensional distortion."
    },
    {
        id: "gal-3",
        title: "LiDAR & Neural Vision Tuning",
        category: "AI LAB • PERCEPTION",
        year: "2026",
        src: imgLidar,
        desc: "Real-time point-cloud registration and stereo camera depth calibration on the test bench."
    },
    {
        id: "gal-4",
        title: "High-Speed Dirt Proving Grounds",
        category: "DYNAMIC TESTING • TERRAIN",
        year: "2026",
        src: imgTrack,
        desc: "Full-throttle endurance run across punishing washboard ruts and loose red dirt trails."
    },
    {
        id: "gal-5",
        title: "Suspension & Brake Tuning",
        category: "PIT BAY • QUICK SERVICE",
        year: "2026",
        src: imgMechanics,
        desc: "Trackside damper valving adjustments and hydraulic line bleeding between endurance heats."
    },
    {
        id: "gal-6",
        title: "Podium & National Victory",
        category: "FINALS • PODIUM",
        year: "2026",
        src: imgCelebration,
        desc: "Team Asterix celebrating AIR 13 and TN Rank 1 at the national SAE BAJA finals."
    }
];

// Initial default updates
const initialUpdates = [
    {
        id: "upd-1",
        label: "Paddock Lineup & Shakedown",
        tag: "FEB 2026 • PIT LANE",
        image: imgPaddock,
        link: "#"
    },
    {
        id: "upd-2",
        label: "Spaceframe TIG Welding",
        tag: "NOV 2025 • CHASSIS BAY",
        image: imgWelding,
        link: "#"
    },
    {
        id: "upd-3",
        label: "LiDAR & Neural Perception",
        tag: "JAN 2026 • AI LAB",
        image: imgLidar,
        link: "#"
    },
    {
        id: "upd-4",
        label: "High-Speed Dirt Testing",
        tag: "JAN 2026 • PROVING GROUNDS",
        image: imgTrack,
        link: "#"
    },
    {
        id: "upd-5",
        label: "Endurance Podium Victory",
        tag: "FEB 2026 • NATIONAL FINALS",
        image: imgCelebration,
        link: "#"
    }
];

// Initial default contact info
const initialContactInfo = {
    email: "asterix.psgitech@gmail.com",
    address: "PSG iTech, Neelambur, Coimbatore, Tamil Nadu",
    category: "Autonomous All-Terrain Vehicle Development",
    instagramUrl: "https://www.instagram.com/asterix_itech/",
    linkedinUrl: "https://www.linkedin.com/company/teamasterix/",
    githubUrl: "https://github.com/Team-Asterix264016/"
};

/* Roster of admin accounts, for display in the Team Accounts tab only.
   Passwords used to be listed here in plaintext, which shipped them inside the
   production JavaScript bundle for anyone to read. Authentication now happens
   solely against the server, which stores bcrypt hashes, so nothing here is a
   credential. */
const initialAccounts = [
    {
        id: "acc-1",
        username: "admin",
        name: "Ratheeswar",
        role: "System Administrator & Software Lead",
        accessLevel: "SuperAdmin"
    },
    {
        id: "acc-2",
        username: "powertrain_lead",
        name: "Powertrain Lead",
        role: "Subsystem Lead",
        accessLevel: "Lead"
    },
    {
        id: "acc-3",
        username: "chassis_lead",
        name: "Chassis Lead",
        role: "Subsystem Lead",
        accessLevel: "Lead"
    }
];

const initialSponsorshipData = {
    brochureUrl: '',
    deckUrl: '',
    contactPerson: 'Ratheeswar & Team Leads',
    contactEmail: 'asterix.psgitech@gmail.com',
    contactPhone: '+91 98765 43210'
};

const initialRecruitmentData = {
    status: 'Open',
    title: 'SAEINDIA BAJA 2026-27 CREW RECRUITMENT',
    description: 'Join Team Asterix and build next-generation off-road and autonomous racing machines. Open for 1st, 2nd, and 3rd year engineering students.',
    applicationLink: 'https://forms.gle/6hHG6aXqrunnfj7V6',
    // Stage deadlines drive the countdown board on #join. Dates carry an
    // explicit +05:30 offset so a visitor's own timezone cannot shift them.
    deadlines: [
        {
            id: 'stage-01',
            stage: '01',
            label: 'Applications Close',
            detail: 'Submit the crew application form with your subsystem preference.',
            date: '2026-09-07T23:59:00+05:30',
            opensAt: '2026-08-24T09:00:00+05:30'
        },
        {
            id: 'stage-02',
            stage: '02',
            label: 'Problem Statement Submission',
            detail: 'Upload code, CAD, FEA or deck for your chosen subsystem brief.',
            date: '2026-09-21T23:59:00+05:30'
        },
        {
            id: 'stage-03',
            stage: '03',
            label: 'Technical Review Slots',
            detail: 'In-person design defence with the subsystem leads.',
            date: '2026-10-05T18:00:00+05:30'
        },
        {
            id: 'stage-04',
            stage: '04',
            label: 'Workshop Trial & Induction',
            detail: 'Tool safety briefing and hands-on fabrication induction.',
            date: '2026-10-19T18:00:00+05:30'
        }
    ],
    problemStatements: [
        {
            id: 'ps-software',
            subsystem: 'Software & Perception',
            title: 'OpenCV Lane Extraction & Stanley Lateral Controller',
            description: 'Design a high-speed vision pipeline to crop and warp camera feeds into Bird\'s-Eye View and calculate real-time steering error using the Stanley algorithm.',
            fileUrl: ''
        },
        {
            id: 'ps-powertrain',
            subsystem: 'Powertrain',
            title: 'CVT Shift Curve Optimization & Dynamic Reduction',
            description: 'Calculate secondary spring preload and flyweight profiles for a 305cc Vanguard engine to sustain instant rock crawl torque and 45 km/h top speed.',
            fileUrl: ''
        },
        {
            id: 'ps-mechanical',
            subsystem: 'Mechanical',
            title: 'Roll Cage Torsional Rigidity & Suspension Kinematics',
            description: 'Design a double wishbone suspension with minimal bump steer and conduct FEA crash simulations on an AISI 4130 tubular spaceframe.',
            fileUrl: ''
        },
        {
            id: 'ps-leads',
            subsystem: 'Leads & Management',
            title: 'Corporate Sponsorship Pitch Deck & Paddock Budgeting',
            description: 'Develop a 5-page corporate sponsorship pitch deck and create a risk-mitigated procurement and logistics plan for BAJA national endurance.',
            fileUrl: ''
        }
    ],
    results: [
        {
            title: 'Round 1 Shortlist (Written & CAD Tasks)',
            date: 'Ongoing Evaluation',
            status: 'Screening in Progress',
            announcement: 'Submissions are currently under review by subsystem leads. Shortlisted candidates will be listed here in real time.'
        }
    ]
};

// Helper to ensure 4 subsystems are active without discarding user edits
const normalizeSubsystems = (subs) => {
    if (!subs || !Array.isArray(subs) || subs.length === 0) {
        return initialSubsystems;
    }
    const filtered = subs.filter(s => s.id !== 'drive-by-wire' && s.id !== 'brake-by-wire');

    if (!filtered.some(s => s.id === 'mechanical')) {
        const defaultMechanical = initialSubsystems.find(s => s.id === 'mechanical');
        if (defaultMechanical) filtered.splice(2, 0, defaultMechanical);
    }

    const requiredIds = ['software-perception', 'powertrain', 'mechanical', 'leads'];
    const result = requiredIds.map(id => {
        const existing = filtered.find(s => s.id === id);
        if (existing) {
            const teamMembers = (existing.teamMembers || []).map(m => ({
                ...m,
                status: m.status || 'Active Member'
            }));
            return { ...existing, teamMembers };
        }
        return initialSubsystems.find(s => s.id === id);
    }).filter(Boolean);

    return result.length === 4 ? result : initialSubsystems;
};

const WebsiteDataContext = createContext(null);

export function WebsiteDataProvider({ children }) {
    const [isServerConnected, setIsServerConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [syncState, setSyncState] = useState('idle'); // 'idle' | 'saving' | 'synced' | 'error'
    const [syncError, setSyncError] = useState(null);
    const isRemoteUpdate = useRef(false);
    const isInitialMount = useRef(true);

    // Initial state from localStorage or defaults
    const [siteData, setSiteData] = useState(() => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    hero: parsed.hero || initialHeroData,
                    story: parsed.story || initialStoryText,
                    subsystems: normalizeSubsystems(parsed.subsystems),
                    gallery: parsed.gallery || initialGalleryItems,
                    updates: parsed.updates || initialUpdates,
                    contact: parsed.contact || initialContactInfo,
                    accounts: parsed.accounts || initialAccounts,
                    sponsorship: parsed.sponsorship || initialSponsorshipData,
                    recruitment: parsed.recruitment || initialRecruitmentData,
                    lastModified: parsed.lastModified || new Date().toISOString()
                };
            }
        } catch (e) {
            console.error("Failed to load website data from localStorage:", e);
        }
        return {
            hero: initialHeroData,
            story: initialStoryText,
            subsystems: initialSubsystems,
            gallery: initialGalleryItems,
            updates: initialUpdates,
            contact: initialContactInfo,
            accounts: initialAccounts,
            sponsorship: initialSponsorshipData,
            recruitment: initialRecruitmentData,
            lastModified: new Date().toISOString()
        };
    });

    // Listen in real-time from Cloud Firestore if configured
    useEffect(() => {
        if (!isFirebaseConfigured || !db) return;

        const docRef = doc(db, 'site_data', 'main');
        const unsubscribe = onSnapshot(docRef, async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setSiteData(prev => {
                    const remoteTime = new Date(data.lastModified || 0).getTime();
                    const localTime = new Date(prev.lastModified || 0).getTime();

                    // If local edits are NEWER than the remote document (e.g. cloud quota was hit),
                    // NEVER wipe out local edits!
                    if (localTime > remoteTime) {
                        console.log('Local modifications are newer than cloud snapshot; preserving local state.');
                        return prev;
                    }

                    // Mark that this update came from the server so we don't loop-sync it back
                    isRemoteUpdate.current = true;

                    const merged = {
                        ...prev,
                        hero: data.hero || prev.hero,
                        story: data.story || prev.story,
                        subsystems: normalizeSubsystems(data.subsystems || prev.subsystems),
                        gallery: (data.gallery && data.gallery.length > 0) ? data.gallery : prev.gallery,
                        updates: (data.updates && data.updates.length > 0) ? data.updates : prev.updates,
                        contact: data.contact || prev.contact,
                        sponsorship: data.sponsorship || prev.sponsorship || initialSponsorshipData,
                        recruitment: data.recruitment || prev.recruitment || initialRecruitmentData,
                        lastModified: data.lastModified || prev.lastModified
                    };
                    try {
                        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
                    } catch { /* ignore */ }
                    return merged;
                });
                setIsServerConnected(true);
                setIsLoading(false);
            } else {
                // Auto-seed Firestore on first project launch
                console.log('⚡ Initializing and seeding Firestore with default Asterix data...');
                try {
                    await setDoc(docRef, {
                        hero: initialHeroData,
                        story: initialStoryText,
                        subsystems: initialSubsystems,
                        gallery: initialGalleryItems,
                        updates: initialUpdates,
                        contact: initialContactInfo,
                        sponsorship: initialSponsorshipData,
                        recruitment: initialRecruitmentData,
                        lastModified: new Date().toISOString()
                    });
                    setIsServerConnected(true);
                } catch (seedErr) {
                    console.warn('Could not auto-seed Firestore:', seedErr);
                }
                setIsLoading(false);
            }
        }, (err) => {
            console.warn('Firestore subscription notice (running on cache):', err.message);
            setIsServerConnected(false);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const [lastRefreshedAt, setLastRefreshedAt] = useState(() => new Date());
    const [isLiveRefreshing, setIsLiveRefreshing] = useState(false);

    // Fetch live website data from database API (MongoDB Atlas on Render) with background auto-refresh
    const fetchFromDatabase = useCallback(async (isSilent = false) => {
        if (!isSilent) setIsLoading(true);
        setIsLiveRefreshing(true);
        try {
            const res = await fetch(apiUrl('/api/site-data'));
            if (res.ok) {
                const data = await res.json();
                if (data && (data.hero || data.subsystems?.length > 0)) {
                    setSiteData(prev => {
                        const remoteTime = new Date(data.lastModified || 0).getTime();
                        const localTime = new Date(prev.lastModified || 0).getTime();

                        // Preserve local edits if newer than server timestamp
                        if (localTime > remoteTime && remoteTime > 0) {
                            return prev;
                        }

                        const merged = {
                            ...prev,
                            hero: data.hero || prev.hero,
                            story: data.story || prev.story,
                            subsystems: (data.subsystems && data.subsystems.length > 0) ? normalizeSubsystems(data.subsystems) : prev.subsystems,
                            gallery: (data.gallery && data.gallery.length > 0) ? data.gallery : prev.gallery,
                            updates: (data.updates && data.updates.length > 0) ? data.updates : prev.updates,
                            contact: data.contact || prev.contact,
                            sponsorship: data.sponsorship || prev.sponsorship || initialSponsorshipData,
                            recruitment: data.recruitment || prev.recruitment || initialRecruitmentData,
                            lastModified: data.lastModified || prev.lastModified
                        };
                        try {
                            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
                        } catch { /* ignore */ }
                        return merged;
                    });
                    setIsServerConnected(true);
                    setLastRefreshedAt(new Date());
                    return true;
                }
            }
            return false;
        } catch (err) {
            console.warn("Backend database API notice:", err.message);
            return false;
        } finally {
            if (!isSilent) setIsLoading(false);
            setIsLiveRefreshing(false);
        }
    }, []);

    useEffect(() => {
        // Initial fetch
        fetchFromDatabase(false);

        // Live refresh polling (every 3.5 seconds)
        const pollInterval = setInterval(() => {
            fetchFromDatabase(true);
        }, 3500);

        // Immediate refresh on tab focus / visibility change
        const handleFocus = () => {
            fetchFromDatabase(true);
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleFocus);

        return () => {
            clearInterval(pollInterval);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleFocus);
        };
    }, [fetchFromDatabase]);

    // Save to database (Primary: Express API / MongoDB Atlas, Fallback: Firestore)
    const syncToServer = useCallback(async (dataToSync) => {
        if (!dataToSync) return false;

        setSyncState('saving');
        const payload = {
            hero: dataToSync.hero,
            story: dataToSync.story,
            subsystems: dataToSync.subsystems,
            gallery: dataToSync.gallery,
            updates: dataToSync.updates,
            contact: dataToSync.contact,
            sponsorship: dataToSync.sponsorship || initialSponsorshipData,
            recruitment: dataToSync.recruitment || initialRecruitmentData,
            lastModified: new Date().toISOString()
        };

        // 1. Primary: Express Server API (MongoDB Atlas on Render - 50MB payload support)
        //
        // If there is no token, there is no save. This used to silently log in
        // as `admin` with a password written a few lines below, which meant that
        // password shipped inside the production bundle -- anyone who opened
        // devtools could read it, mint a SuperAdmin token, and rewrite the site.
        // An unauthenticated visitor now simply keeps their local copy.
        const token = sessionStorage.getItem(AUTH_TOKEN_KEY);

        if (token) {
            try {
                const res = await fetch(apiUrl('/api/site-data'), {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    setIsServerConnected(true);
                    setSyncState('synced');
                    setSyncError(null);
                    return true;
                }
            } catch (err) {
                console.warn('Backend server save notice, checking fallback:', err.message);
            }
        }

        // 2. Fallback: Firebase Cloud Firestore (with 1MB document limit safety check)
        if (isFirebaseConfigured && db) {
            try {
                const payloadSize = new Blob([JSON.stringify(payload)]).size;
                if (payloadSize > 950000) {
                    throw new Error(`Data size (${(payloadSize / 1024 / 1024).toFixed(2)} MB) exceeds Firestore 1MB limit. Connect to Render backend to save unlimited data.`);
                }
                const docRef = doc(db, 'site_data', 'main');
                await setDoc(docRef, payload, { merge: true });
                setIsServerConnected(true);
                setSyncState('synced');
                setSyncError(null);
                return true;
            } catch (err) {
                console.warn('Failed to sync changes to Firestore:', err);
                const isQuota = err.message?.includes('RESOURCE_EXHAUSTED') || err.code === 'resource-exhausted' || err.code === 8;
                const errorMsg = isQuota
                    ? 'Firebase daily write quota reached. Edits are preserved safely in browser storage.'
                    : (err.message || 'Cloud sync failed.');
                setSyncState('error');
                setSyncError(errorMsg);
                setIsServerConnected(false);
                return false;
            }
        }

        if (token) {
            setSyncState('error');
            setSyncError('Backend server unreachable. Changes saved locally.');
            return false;
        }

        setSyncState('synced');
        return true;
    }, []);

    // Save changes to localStorage and automatically sync to backend database if admin is authenticated
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(siteData));
        } catch (e) {
            console.error("Failed to save website data to localStorage:", e);
        }

        // If this update was received from remote Firestore onSnapshot, NEVER echo it back!
        if (isRemoteUpdate.current) {
            isRemoteUpdate.current = false;
            return;
        }

        // ONLY sync to remote server if an admin is currently authenticated!
        const isAdminLoggedIn = Boolean(
            sessionStorage.getItem(AUTH_SESSION_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY)
        );
        if (!isAdminLoggedIn) {
            return;
        }

        // Debounce syncing manual admin edits to database
        const timer = setTimeout(() => {
            syncToServer(siteData);
        }, 1000);

        return () => clearTimeout(timer);
    }, [siteData, syncToServer]);


    // Update helpers
    const updateHero = (newHero) => {
        setSiteData(prev => ({
            ...prev,
            hero: { ...prev.hero, ...newHero },
            lastModified: new Date().toISOString()
        }));
    };

    const updateStory = (newStory) => {
        setSiteData(prev => ({
            ...prev,
            story: newStory,
            lastModified: new Date().toISOString()
        }));
    };

    const updateContact = (newContact) => {
        setSiteData(prev => ({
            ...prev,
            contact: { ...prev.contact, ...newContact },
            lastModified: new Date().toISOString()
        }));
    };

    const updateSubsystem = (subsystemId, updatedFields) => {
        setSiteData(prev => ({
            ...prev,
            subsystems: prev.subsystems.map(s => 
                s.id === subsystemId ? { ...s, ...updatedFields } : s
            ),
            lastModified: new Date().toISOString()
        }));
    };

    const addTeamMember = (subsystemId, newMember) => {
        setSiteData(prev => ({
            ...prev,
            subsystems: prev.subsystems.map(s => {
                if (s.id === subsystemId) {
                    return {
                        ...s,
                        teamMembers: [...(s.teamMembers || []), newMember]
                    };
                }
                return s;
            }),
            lastModified: new Date().toISOString()
        }));
    };

    const updateTeamMember = (subsystemId, memberIndex, updatedMember) => {
        setSiteData(prev => ({
            ...prev,
            subsystems: prev.subsystems.map(s => {
                if (s.id === subsystemId) {
                    const members = [...(s.teamMembers || [])];
                    members[memberIndex] = { ...members[memberIndex], ...updatedMember };
                    return { ...s, teamMembers: members };
                }
                return s;
            }),
            lastModified: new Date().toISOString()
        }));
    };

    const deleteTeamMember = (subsystemId, memberIndex) => {
        setSiteData(prev => ({
            ...prev,
            subsystems: prev.subsystems.map(s => {
                if (s.id === subsystemId) {
                    const members = (s.teamMembers || []).filter((_, idx) => idx !== memberIndex);
                    return { ...s, teamMembers: members };
                }
                return s;
            }),
            lastModified: new Date().toISOString()
        }));
    };

    const addGalleryItem = (newItem) => {
        setSiteData(prev => ({
            ...prev,
            gallery: [newItem, ...prev.gallery],
            lastModified: new Date().toISOString()
        }));
    };

    const updateGalleryItem = (id, updatedFields) => {
        setSiteData(prev => ({
            ...prev,
            gallery: prev.gallery.map(item => item.id === id ? { ...item, ...updatedFields } : item),
            lastModified: new Date().toISOString()
        }));
    };

    const deleteGalleryItem = (id) => {
        setSiteData(prev => ({
            ...prev,
            gallery: prev.gallery.filter(item => item.id !== id),
            lastModified: new Date().toISOString()
        }));
    };

    const addUpdate = (newUpdate) => {
        setSiteData(prev => ({
            ...prev,
            updates: [newUpdate, ...prev.updates],
            lastModified: new Date().toISOString()
        }));
    };

    const updateUpdate = (id, updatedFields) => {
        setSiteData(prev => ({
            ...prev,
            updates: prev.updates.map(item => item.id === id ? { ...item, ...updatedFields } : item),
            lastModified: new Date().toISOString()
        }));
    };

    const deleteUpdate = (id) => {
        setSiteData(prev => ({
            ...prev,
            updates: prev.updates.filter(item => item.id !== id),
            lastModified: new Date().toISOString()
        }));
    };

    const addAccount = (account) => {
        setSiteData(prev => ({
            ...prev,
            accounts: [...prev.accounts, account],
            lastModified: new Date().toISOString()
        }));
    };

    const updateAccount = (id, fields) => {
        setSiteData(prev => ({
            ...prev,
            accounts: prev.accounts.map(acc => acc.id === id ? { ...acc, ...fields } : acc),
            lastModified: new Date().toISOString()
        }));
    };

    const deleteAccount = (id) => {
        setSiteData(prev => ({
            ...prev,
            accounts: prev.accounts.filter(acc => acc.id !== id),
            lastModified: new Date().toISOString()
        }));
    };

    const updateSponsorship = (fields) => {
        setSiteData(prev => ({
            ...prev,
            sponsorship: { ...(prev.sponsorship || initialSponsorshipData), ...fields },
            lastModified: new Date().toISOString()
        }));
    };

    const updateRecruitment = (fields) => {
        setSiteData(prev => ({
            ...prev,
            recruitment: { ...(prev.recruitment || initialRecruitmentData), ...fields },
            lastModified: new Date().toISOString()
        }));
    };

    const resetToDefaults = () => {
        const defaults = {
            hero: initialHeroData,
            story: initialStoryText,
            subsystems: initialSubsystems,
            gallery: initialGalleryItems,
            updates: initialUpdates,
            contact: initialContactInfo,
            accounts: initialAccounts,
            sponsorship: initialSponsorshipData,
            recruitment: initialRecruitmentData,
            lastModified: new Date().toISOString()
        };
        setSiteData(defaults);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaults));
        syncToServer(defaults);
    };

    const loadFromBackup = (data) => {
        const updated = {
            ...data,
            lastModified: new Date().toISOString()
        };
        setSiteData(updated);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        syncToServer(updated);
    };

    return (
        <WebsiteDataContext.Provider value={{
            siteData,
            isServerConnected,
            isLoading,
            lastRefreshedAt,
            isLiveRefreshing,
            forceLiveRefresh: () => fetchFromDatabase(false),
            fetchFromDatabase,
            syncToServer,
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
            updateAccount,
            deleteAccount,
            updateSponsorship,
            updateRecruitment,
            syncState,
            syncError,
            resetToDefaults,
            loadFromBackup,
            AUTH_SESSION_KEY,
            AUTH_TOKEN_KEY
        }}>
            {children}
        </WebsiteDataContext.Provider>
    );
}

export function useWebsiteData() {
    const ctx = useContext(WebsiteDataContext);
    if (!ctx) {
        throw new Error("useWebsiteData must be used within a WebsiteDataProvider");
    }
    return ctx;
}
