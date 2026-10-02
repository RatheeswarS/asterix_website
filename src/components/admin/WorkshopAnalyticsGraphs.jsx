import { useState, useMemo } from 'react';

// Department abbreviations for clean badge display
const DEPT_SHORT_CODES = {
    'Computer Science and Engineering': 'CSE',
    'Electrical and Electronics Engineering': 'EEE',
    'Electronics and Communication Engineering': 'ECE',
    'Mechanical Engineering': 'MECH',
    'Artificial Intelligence and Data Science': 'AI & DS',
    'Robotics and Artificial Intelligence': 'RAI',
    'Electronics Engineering (VLSI Design and Technology)': 'VLSI',
    'Instrumentation and Control Engineering': 'ICE'
};

const DEPT_COLORS = [
    { bg: 'bg-sky-500', bar: '#0284c7', text: 'text-sky-700', badge: 'bg-sky-100 border-sky-400' },
    { bg: 'bg-emerald-500', bar: '#10b981', text: 'text-emerald-700', badge: 'bg-emerald-100 border-emerald-400' },
    { bg: 'bg-amber-500', bar: '#f59e0b', text: 'text-amber-700', badge: 'bg-amber-100 border-amber-400' },
    { bg: 'bg-indigo-500', bar: '#6366f1', text: 'text-indigo-700', badge: 'bg-indigo-100 border-indigo-400' },
    { bg: 'bg-rose-500', bar: '#f43f5e', text: 'text-rose-700', badge: 'bg-rose-100 border-rose-400' },
    { bg: 'bg-violet-500', bar: '#8b5cf6', text: 'text-violet-700', badge: 'bg-violet-100 border-violet-400' },
    { bg: 'bg-teal-500', bar: '#14b8a6', text: 'text-teal-700', badge: 'bg-teal-100 border-teal-400' },
    { bg: 'bg-orange-500', bar: '#f97316', text: 'text-orange-700', badge: 'bg-orange-100 border-orange-400' },
];

export default function WorkshopAnalyticsGraphs({ registrations = [] }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [datasetScope, setDatasetScope] = useState('paid'); // 'paid' | 'all'
    const [activeHoverBar, setActiveHoverBar] = useState(null);

    // Filter registrations based on scope
    const scopedList = useMemo(() => {
        if (datasetScope === 'paid') {
            return registrations.filter(r => r.status === 'paid');
        }
        return registrations;
    }, [registrations, datasetScope]);

    // 1. DEPARTMENT DISTRIBUTION DATA
    const departmentStats = useMemo(() => {
        const counts = {};
        scopedList.forEach(r => {
            const dept = (r.department || 'Not Specified').trim();
            counts[dept] = (counts[dept] || 0) + 1;
        });

        const sorted = Object.entries(counts).map(([name, count], index) => {
            const shortCode = DEPT_SHORT_CODES[name] || name.slice(0, 5).toUpperCase();
            const color = DEPT_COLORS[index % DEPT_COLORS.length];
            const pct = scopedList.length > 0 ? ((count / scopedList.length) * 100).toFixed(1) : 0;
            return { name, shortCode, count, pct, color };
        }).sort((a, b) => b.count - a.count);

        const maxDeptCount = sorted.length > 0 ? sorted[0].count : 1;
        return { list: sorted, max: maxDeptCount, total: scopedList.length };
    }, [scopedList]);

    // 2. TRACK & PACKAGE BREAKDOWN DATA
    const packageStats = useMemo(() => {
        const pkgs = {
            software: { id: 'software', label: 'Software & Perception', count: 0, revenue: 0, color: '#0284c7', bg: 'bg-sky-50', border: 'border-sky-500', text: 'text-sky-700' },
            powertrain: { id: 'powertrain', label: 'Electronics & Powertrain', count: 0, revenue: 0, color: '#d97706', bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-700' },
            combo: { id: 'combo', label: 'All-Access Combo', count: 0, revenue: 0, color: '#059669', bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-700' }
        };

        scopedList.forEach(r => {
            const key = String(r.package || '').toLowerCase().trim();
            const target = pkgs[key] || pkgs.software;
            target.count += 1;
            target.revenue += Number(r.amount || 0);
        });

        const totalPkgCount = scopedList.length || 1;
        const totalPkgRev = Object.values(pkgs).reduce((sum, p) => sum + p.revenue, 0) || 1;

        return {
            items: Object.values(pkgs).map(p => ({
                ...p,
                countPct: ((p.count / totalPkgCount) * 100).toFixed(1),
                revPct: ((p.revenue / totalPkgRev) * 100).toFixed(1)
            })),
            totalCount: scopedList.length,
            totalRevenue: totalPkgRev
        };
    }, [scopedList]);

    // 4. DAILY REGISTRATION VELOCITY (TIMELINE)
    const velocityStats = useMemo(() => {
        const dayMap = {};

        scopedList.forEach(r => {
            const raw = datasetScope === 'paid' ? (r.paidAt || r.createdAt) : r.createdAt;
            if (!raw) return;
            const dateObj = new Date(raw);
            if (isNaN(dateObj.getTime())) return;

            // Format key as YYYY-MM-DD for stable chronological sorting
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            const key = `${yyyy}-${mm}-${dd}`;

            const label = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

            if (!dayMap[key]) {
                dayMap[key] = { key, label, count: 0, dateObj };
            }
            dayMap[key].count += 1;
        });

        const timeline = Object.values(dayMap).sort((a, b) => a.key.localeCompare(b.key));
        const maxDaily = timeline.length > 0 ? Math.max(...timeline.map(d => d.count)) : 1;
        const peakDay = timeline.length > 0 ? [...timeline].sort((a, b) => b.count - a.count)[0] : null;

        return { timeline, maxDaily, peakDay };
    }, [scopedList, datasetScope]);

    const formatCurrency = (amt) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

    return (
        <section className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] p-4 sm:p-5 font-mono">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-900 pb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">📊</span>
                    <div>
                        <h3 className="text-sm sm:text-base font-black uppercase text-slate-900 tracking-wide flex items-center gap-2">
                            <span>Workshop Analytics & Insights</span>
                            <span className="text-[10px] px-2 py-0.5 bg-slate-900 text-white font-bold">
                                {scopedList.length} {datasetScope === 'paid' ? 'Paid' : 'Total'}
                            </span>
                        </h3>
                        <p className="text-[11px] font-bold text-slate-500">
                            Real-time breakdowns for candidate departments, package distribution, and registration velocity.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    {/* Scope Switcher */}
                    <div className="inline-flex border-2 border-slate-900 bg-slate-100 p-0.5 text-[10px] font-black uppercase">
                        <button
                            type="button"
                            onClick={() => setDatasetScope('paid')}
                            className={`px-2.5 py-1 cursor-pointer transition-colors ${
                                datasetScope === 'paid'
                                    ? 'bg-emerald-400 text-slate-950 font-black shadow-[1px_1px_0px_#0f172a]'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            ✓ Confirmed Paid
                        </button>
                        <button
                            type="button"
                            onClick={() => setDatasetScope('all')}
                            className={`px-2.5 py-1 cursor-pointer transition-colors ${
                                datasetScope === 'all'
                                    ? 'bg-sky-400 text-slate-950 font-black shadow-[1px_1px_0px_#0f172a]'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            All ({registrations.length})
                        </button>
                    </div>

                    {/* Collapse / Expand Toggle */}
                    <button
                        type="button"
                        onClick={() => setIsCollapsed(prev => !prev)}
                        className="press px-2.5 py-1 bg-white hover:bg-slate-100 border-2 border-slate-900 text-slate-900 text-[10px] font-black uppercase shadow-[2px_2px_0px_#0f172a] cursor-pointer"
                        title={isCollapsed ? 'Expand graphs' : 'Collapse graphs'}
                    >
                        {isCollapsed ? 'Show Graphs ▼' : 'Hide Graphs ▲'}
                    </button>
                </div>
            </div>

            {/* Collapsible Content */}
            {!isCollapsed && (
                <div className="pt-4 space-y-6">
                    {scopedList.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-300 text-slate-500 text-xs font-bold">
                            No registration records found for scope: <strong className="uppercase">{datasetScope}</strong>.
                        </div>
                    ) : (
                        <>
                            {/* TOP ROW: GRAPH 1 (DEPARTMENTS) & GRAPH 2 (PACKAGES) */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                
                                {/* GRAPH 1: DEPARTMENT DISTRIBUTION (7 cols) */}
                                <div className="lg:col-span-7 bg-slate-50 border-2 border-slate-900 p-4 shadow-[2px_2px_0px_#0f172a] flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between border-b border-slate-300 pb-2 mb-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2.5 h-2.5 bg-sky-500 border border-slate-900"></span>
                                                <h4 className="text-xs font-black uppercase text-slate-900">
                                                    1. Department Breakdown
                                                </h4>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500">
                                                {departmentStats.list.length} Departments
                                            </span>
                                        </div>

                                        {/* Horizontal Bar Chart List */}
                                        <div className="space-y-2.5">
                                            {departmentStats.list.map((dept) => {
                                                const fillWidth = Math.max(8, (dept.count / departmentStats.max) * 100);
                                                return (
                                                    <div key={dept.name} className="space-y-1">
                                                        <div className="flex items-center justify-between text-[11px] font-bold">
                                                            <div className="flex items-center gap-2 truncate pr-2">
                                                                <span className={`px-1.5 py-0.2 border text-[9px] font-black shrink-0 ${dept.color.badge} text-slate-900`}>
                                                                    {dept.shortCode}
                                                                </span>
                                                                <span className="truncate text-slate-800 text-xs" title={dept.name}>
                                                                    {dept.name}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0 font-mono">
                                                                <span className="font-black text-slate-900">{dept.count}</span>
                                                                <span className="text-[10px] text-slate-500 w-11 text-right">({dept.pct}%)</span>
                                                            </div>
                                                        </div>

                                                        {/* Visual Progress Bar */}
                                                        <div className="w-full bg-slate-200 border border-slate-900 h-3 relative overflow-hidden">
                                                            <div
                                                                className="h-full transition-all duration-500 border-r border-slate-900"
                                                                style={{
                                                                    width: `${fillWidth}%`,
                                                                    backgroundColor: dept.color.bar
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Department Summary Footnote */}
                                    <div className="mt-4 pt-2.5 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500">
                                        <span>Highest share: <strong className="text-slate-900 font-bold">{departmentStats.list[0]?.shortCode} ({departmentStats.list[0]?.pct}%)</strong></span>
                                        <span>Total: <strong className="text-slate-900 font-bold">{departmentStats.total} students</strong></span>
                                    </div>
                                </div>

                                {/* GRAPH 2: TRACK & PACKAGE BREAKDOWN (5 cols) */}
                                <div className="lg:col-span-5 bg-slate-50 border-2 border-slate-900 p-4 shadow-[2px_2px_0px_#0f172a] flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between border-b border-slate-300 pb-2 mb-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2.5 h-2.5 bg-emerald-500 border border-slate-900"></span>
                                                <h4 className="text-xs font-black uppercase text-slate-900">
                                                    2. Track & Package Split
                                                </h4>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500">
                                                Seats & INR Revenue
                                            </span>
                                        </div>

                                        {/* Multi-Segment Stacked Visual Bar */}
                                        <div className="space-y-1 mb-4">
                                            <span className="text-[10px] font-bold text-slate-600 block uppercase">
                                                Student Enrollment Share
                                            </span>
                                            <div className="w-full h-4 border-2 border-slate-900 flex overflow-hidden bg-slate-200">
                                                {packageStats.items.map((pkg) => (
                                                    <div
                                                        key={pkg.id}
                                                        className="h-full transition-all duration-500 relative group"
                                                        style={{
                                                            width: `${pkg.countPct}%`,
                                                            backgroundColor: pkg.color
                                                        }}
                                                        title={`${pkg.label}: ${pkg.count} students (${pkg.countPct}%)`}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Detailed Package Cards */}
                                        <div className="space-y-2.5">
                                            {packageStats.items.map((pkg) => (
                                                <div
                                                    key={pkg.id}
                                                    className={`p-2.5 border-2 border-slate-900 bg-white shadow-[2px_2px_0px_#0f172a] flex items-center justify-between`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="w-3 h-3 border border-slate-900 shrink-0"
                                                            style={{ backgroundColor: pkg.color }}
                                                        />
                                                        <div>
                                                            <div className="text-xs font-black text-slate-900">
                                                                {pkg.label}
                                                            </div>
                                                            <div className="text-[10px] text-slate-500 font-bold">
                                                                {pkg.count} enrolled · {pkg.countPct}% of seats
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="text-right">
                                                        <div className="text-xs font-black text-slate-900">
                                                            {formatCurrency(pkg.revenue)}
                                                        </div>
                                                        <div className="text-[10px] font-bold text-emerald-700">
                                                            {pkg.revPct}% of revenue
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Package Summary Footnote */}
                                    <div className="mt-4 pt-2.5 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500">
                                        <span>Total Seats: <strong className="text-slate-900 font-bold">{packageStats.totalCount}</strong></span>
                                        <span>Total: <strong className="text-emerald-700 font-black">{formatCurrency(packageStats.totalRevenue)}</strong></span>
                                    </div>
                                </div>
                            </div>

                            {/* GRAPH 4: REGISTRATION & PAYMENT VELOCITY TIMELINE */}
                            <div className="bg-slate-50 border-2 border-slate-900 p-4 shadow-[2px_2px_0px_#0f172a]">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-300 pb-2 mb-4">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 bg-amber-500 border border-slate-900"></span>
                                        <h4 className="text-xs font-black uppercase text-slate-900">
                                            4. Daily Registration Velocity & Momentum
                                        </h4>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-slate-600 font-bold">
                                        {velocityStats.peakDay && (
                                            <span>
                                                🔥 Peak Day: <strong className="text-slate-900 font-black">{velocityStats.peakDay.label}</strong> ({velocityStats.peakDay.count} registrations)
                                            </span>
                                        )}
                                        <span>Active Days: <strong className="text-slate-900 font-black">{velocityStats.timeline.length}</strong></span>
                                    </div>
                                </div>

                                {velocityStats.timeline.length === 0 ? (
                                    <div className="py-6 text-center text-xs text-slate-400">
                                        No timeline dates recorded yet.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {/* Responsive SVG Bar Timeline */}
                                        <div className="relative pt-6 pb-2 overflow-x-auto">
                                            <div className="min-w-[480px] h-32 flex items-end gap-2 sm:gap-3 border-b-2 border-slate-900 px-2">
                                                {velocityStats.timeline.map((day) => {
                                                    const barHeightPct = Math.max(12, (day.count / velocityStats.maxDaily) * 100);
                                                    const isHovered = activeHoverBar === day.key;
                                                    const isPeak = day.count === velocityStats.maxDaily;

                                                    return (
                                                        <div
                                                            key={day.key}
                                                            className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                                                            onMouseEnter={() => setActiveHoverBar(day.key)}
                                                            onMouseLeave={() => setActiveHoverBar(null)}
                                                        >
                                                            {/* Count label / Tooltip above bar */}
                                                            <div className={`text-[10px] font-black mb-1 transition-all ${
                                                                isHovered || isPeak
                                                                    ? 'text-slate-900 scale-110'
                                                                    : 'text-slate-600'
                                                            }`}>
                                                                {day.count}
                                                            </div>

                                                            {/* Bar element */}
                                                            <div
                                                                className={`w-full max-w-[42px] border-2 border-slate-900 transition-all duration-300 relative ${
                                                                    isPeak
                                                                        ? 'bg-amber-400 shadow-[2px_2px_0px_#0f172a]'
                                                                        : 'bg-sky-400 hover:bg-sky-300 shadow-[1px_1px_0px_#0f172a]'
                                                                }`}
                                                                style={{ height: `${barHeightPct}%` }}
                                                            >
                                                                {isPeak && (
                                                                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase text-amber-800">
                                                                        ★
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Date label */}
                                                            <span className="text-[10px] font-bold text-slate-600 mt-2 truncate max-w-[50px] text-center">
                                                                {day.label}
                                                            </span>

                                                            {/* Tooltip on hover */}
                                                            {isHovered && (
                                                                <div className="absolute -top-12 z-20 bg-slate-900 text-white px-2 py-1 text-[10px] font-bold border border-slate-700 shadow-md whitespace-nowrap pointer-events-none">
                                                                    {day.label}: {day.count} candidate{day.count === 1 ? '' : 's'} ({datasetScope})
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-1">
                                                    <span className="w-2.5 h-2.5 bg-sky-400 border border-slate-900 inline-block"></span>
                                                    <span>Daily Count</span>
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="w-2.5 h-2.5 bg-amber-400 border border-slate-900 inline-block"></span>
                                                    <span>Peak Spike Day</span>
                                                </span>
                                            </div>
                                            <span>
                                                Date span: {velocityStats.timeline[0]?.label} → {velocityStats.timeline[velocityStats.timeline.length - 1]?.label}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </section>
    );
}
