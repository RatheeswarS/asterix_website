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

const LOCAL_STORAGE_KEY = 'asterix_website_data_v1';
export const AUTH_SESSION_KEY = 'asterix_admin_session_v1';
export const AUTH_TOKEN_KEY = 'asterix_admin_token_v1';

// Initial default story narrative
const initialStoryText = `It started as a training program.

In the first year, there was no Team Asterix, no competition vehicle, and no clear idea where the journey would lead. It was simply a group of students learning how vehicles worked. Months were spent understanding vehicle dynamics, control systems, electronics, and autonomous technologies.

About a year later, the group decided to take the program seriously and registered for SAE BAJA 2026. Somewhere along that journey, the name Asterix came into existence, and the training program evolved into a team with a much bigger ambition.

That was where the real learning began.

The project was divided into five major subsystems: Software, Sensors, Powertrain, Steer-by-Wire, and Brake & Throttle-by-Wire. Each had its own challenges, but the vehicle could only work when all five came together.

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

// Initial default team member accounts
const initialAccounts = [
    {
        id: "acc-1",
        username: "admin",
        password: "asterix2026",
        name: "Ratheeswar",
        role: "System Administrator & Software Lead",
        accessLevel: "SuperAdmin"
    },
    {
        id: "acc-2",
        username: "powertrain_lead",
        password: "baja2026powertrain",
        name: "Powertrain Lead",
        role: "Subsystem Lead",
        accessLevel: "Lead"
    },
    {
        id: "acc-3",
        username: "chassis_lead",
        password: "baja2026chassis",
        name: "Chassis Lead",
        role: "Subsystem Lead",
        accessLevel: "Lead"
    }
];

const WebsiteDataContext = createContext(null);

export function WebsiteDataProvider({ children }) {
    const [isServerConnected, setIsServerConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Initial state from localStorage or defaults
    const [siteData, setSiteData] = useState(() => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    hero: parsed.hero || initialHeroData,
                    story: parsed.story || initialStoryText,
                    subsystems: parsed.subsystems || initialSubsystems,
                    gallery: parsed.gallery || initialGalleryItems,
                    updates: parsed.updates || initialUpdates,
                    contact: parsed.contact || initialContactInfo,
                    accounts: parsed.accounts || initialAccounts,
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
            lastModified: new Date().toISOString()
        };
    });

    const isInitialMount = useRef(true);

    // Listen in real-time from Cloud Firestore if configured
    useEffect(() => {
        if (!isFirebaseConfigured || !db) return;

        const docRef = doc(db, 'site_data', 'main');
        const unsubscribe = onSnapshot(docRef, async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setSiteData(prev => {
                    const merged = {
                        ...prev,
                        hero: data.hero || prev.hero,
                        story: data.story || prev.story,
                        subsystems: (data.subsystems && data.subsystems.length > 0) ? data.subsystems : prev.subsystems,
                        gallery: (data.gallery && data.gallery.length > 0) ? data.gallery : prev.gallery,
                        updates: (data.updates && data.updates.length > 0) ? data.updates : prev.updates,
                        contact: data.contact || prev.contact,
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

    // Fetch live website data from database API on load (fallback if Firebase is not configured)
    const fetchFromDatabase = useCallback(async () => {
        if (isFirebaseConfigured) return;
        try {
            const res = await fetch(apiUrl('/api/site-data'));
            if (res.ok) {
                const data = await res.json();
                setSiteData(prev => {
                    const merged = {
                        ...prev,
                        hero: data.hero || prev.hero,
                        story: data.story || prev.story,
                        subsystems: (data.subsystems && data.subsystems.length > 0) ? data.subsystems : prev.subsystems,
                        gallery: (data.gallery && data.gallery.length > 0) ? data.gallery : prev.gallery,
                        updates: (data.updates && data.updates.length > 0) ? data.updates : prev.updates,
                        contact: data.contact || prev.contact,
                        lastModified: data.lastModified || prev.lastModified
                    };
                    try {
                        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
                    } catch { /* ignore */ }
                    return merged;
                });
                setIsServerConnected(true);
            } else {
                setIsServerConnected(false);
            }
        } catch (err) {
            console.warn("Backend database API not reachable, running on local cache:", err.message);
            setIsServerConnected(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isFirebaseConfigured) {
            fetchFromDatabase();
        }
    }, [fetchFromDatabase]);

    // Save to database (Firestore if configured, otherwise Express API)
    const syncToServer = useCallback(async (dataToSync) => {
        // 1. Firebase Cloud Firestore
        if (isFirebaseConfigured && db) {
            try {
                const docRef = doc(db, 'site_data', 'main');
                await setDoc(docRef, {
                    hero: dataToSync.hero,
                    story: dataToSync.story,
                    subsystems: dataToSync.subsystems,
                    gallery: dataToSync.gallery,
                    updates: dataToSync.updates,
                    contact: dataToSync.contact,
                    lastModified: new Date().toISOString()
                }, { merge: true });
                setIsServerConnected(true);
                return;
            } catch (err) {
                console.warn('Failed to sync changes to Firestore:', err);
                setIsServerConnected(false);
            }
        }

        // 2. Express Server API fallback
        const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) return;

        try {
            const res = await fetch(apiUrl('/api/site-data'), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    hero: dataToSync.hero,
                    story: dataToSync.story,
                    subsystems: dataToSync.subsystems,
                    gallery: dataToSync.gallery,
                    updates: dataToSync.updates,
                    contact: dataToSync.contact
                })
            });

            if (res.ok) {
                setIsServerConnected(true);
            }
        } catch (err) {
            console.warn('Failed to sync changes to database server:', err);
            setIsServerConnected(false);
        }
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

        // Sync to server database if authenticated
        const timer = setTimeout(() => {
            syncToServer(siteData);
        }, 500);

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

    const resetToDefaults = () => {
        const defaults = {
            hero: initialHeroData,
            story: initialStoryText,
            subsystems: initialSubsystems,
            gallery: initialGalleryItems,
            updates: initialUpdates,
            contact: initialContactInfo,
            accounts: initialAccounts,
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
