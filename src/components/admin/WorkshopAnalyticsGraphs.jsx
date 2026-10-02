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
    { bg: 'bg-indigo-500', bar: '#6366f1', text: 'text-indigo-700', badge: 'bg-indigo-100 border-indigo-400' },
    { bg: 'bg-violet-500', bar: '#8b5cf6', text: 'text-violet-700', badge: 'bg-violet-100 border-violet-400' },
    { bg: 'bg-teal-500', bar: '#14b8a6', text: 'text-teal-700', badge: 'bg-teal-100 border-teal-400' },
    { bg: 'bg-rose-500', bar: '#f43f5e', text: 'text-rose-700', badge: 'bg-rose-100 border-rose-400' },
    { bg: 'bg-amber-500', bar: '#f59e0b', text: 'text-amber-700', badge: 'bg-amber-100 border-amber-400' },
    { bg: 'bg-emerald-500', bar: '#10b981', text: 'text-emerald-700', badge: 'bg-emerald-100 border-emerald-400' },
    { bg: 'bg-orange-500', bar: '#f97316', text: 'text-orange-700', badge: 'bg-orange-100 border-orange-400' },
];

const COURSE_CONFIG = {
    software: { id: 'software', label: 'Software', fullLabel: 'Software & Perception', color: '#0284c7', bg: 'bg-sky-500', light: 'bg-sky-100 border-sky-400 text-sky-800' },
    powertrain: { id: 'powertrain', label: 'Powertrain', fullLabel: 'Electronics & Powertrain', color: '#d97706', bg: 'bg-amber-500', light: 'bg-amber-100 border-amber-400 text-amber-800' },
    combo: { id: 'combo', label: 'Combo', fullLabel: 'All-Access Combo', color: '#059669', bg: 'bg-emerald-500', light: 'bg-emerald-100 border-emerald-400 text-emerald-800' }
};

// Helper to compute SVG donut arc path between startAngle and endAngle
function describeDonutArc(cx, cy, rInner, rOuter, startAngle, endAngle) {
    const angleDiff = endAngle - startAngle;
    if (angleDiff >= 2 * Math.PI - 0.0001) {
        // Full circle fallback: split into two half arcs
        const midAngle = startAngle + Math.PI;
        return `${describeDonutArc(cx, cy, rInner, rOuter, startAngle, midAngle)} ${describeDonutArc(cx, cy, rInner, rOuter, midAngle, endAngle)}`;
    }

    const x1_out = cx + rOuter * Math.cos(startAngle);
    const y1_out = cy + rOuter * Math.sin(startAngle);
    const x2_out = cx + rOuter * Math.cos(endAngle);
    const y2_out = cy + rOuter * Math.sin(endAngle);

    const x2_in = cx + rInner * Math.cos(endAngle);
    const y2_in = cy + rInner * Math.sin(endAngle);
    const x1_in = cx + rInner * Math.cos(startAngle);
    const y1_in = cy + rInner * Math.sin(startAngle);

    const largeArc = angleDiff > Math.PI ? 1 : 0;

    return `M ${x1_out} ${y1_out} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2_out} ${y2_out} L ${x2_in} ${y2_in} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x1_in} ${y1_in} Z`;
}

export default function WorkshopAnalyticsGraphs({ registrations = [] }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [datasetScope, setDatasetScope] = useState('paid'); // 'paid' | 'all'
    const [chartMode, setChartMode] = useState('sunburst'); // 'sunburst' | 'stackedBar'
    const [hoveredSlice, setHoveredSlice] = useState(null);
    const [highlightDept, setHighlightDept] = useState(null);
    const [activeHoverBar, setActiveHoverBar] = useState(null);

    // Filter registrations based on scope
    const scopedList = useMemo(() => {
        if (datasetScope === 'paid') {
            return registrations.filter(r => r.status === 'paid');
        }
        return registrations;
    }, [registrations, datasetScope]);

    // 1. COMBINED DEPARTMENT × COURSE BREAKDOWN DATA
    const deptCourseStats = useMemo(() => {
        const deptMap = {};

        scopedList.forEach(r => {
            const dept = (r.department || 'Not Specified').trim();
            const pkg = String(r.package || 'software').toLowerCase().trim();
            const validPkg = ['software', 'powertrain', 'combo'].includes(pkg) ? pkg : 'software';

            if (!deptMap[dept]) {
                deptMap[dept] = {
                    name: dept,
                    shortCode: DEPT_SHORT_CODES[dept] || dept.slice(0, 5).toUpperCase(),
                    total: 0,
                    courses: {
                        software: 0,
                        powertrain: 0,
                        combo: 0
                    }
                };
            }
            deptMap[dept].total += 1;
            deptMap[dept].courses[validPkg] += 1;
        });

        const sorted = Object.values(deptMap)
            .sort((a, b) => b.total - a.total)
            .map((dept, index) => {
                const total = dept.total;
                return {
                    ...dept,
                    color: DEPT_COLORS[index % DEPT_COLORS.length],
                    pct: scopedList.length > 0 ? ((total / scopedList.length) * 100).toFixed(1) : 0,
                    courses: {
                        software: {
                            count: dept.courses.software,
                            pct: total > 0 ? ((dept.courses.software / total) * 100).toFixed(1) : 0,
                            config: COURSE_CONFIG.software
                        },
                        powertrain: {
                            count: dept.courses.powertrain,
                            pct: total > 0 ? ((dept.courses.powertrain / total) * 100).toFixed(1) : 0,
                            config: COURSE_CONFIG.powertrain
                        },
                        combo: {
                            count: dept.courses.combo,
                            pct: total > 0 ? ((dept.courses.combo / total) * 100).toFixed(1) : 0,
                            config: COURSE_CONFIG.combo
                        }
                    }
                };
            });

        return {
            list: sorted,
            total: scopedList.length
        };
    }, [scopedList]);

    // GEOMETRY FOR SUNBURST (CONCENTRIC STACKED PIE)
    const sunburstArcs = useMemo(() => {
        if (!deptCourseStats.total || deptCourseStats.list.length === 0) {
            return { inner: [], outer: [] };
        }

        const inner = [];
        const outer = [];
        let currentAngle = -Math.PI / 2; // Start at 12 o'clock
        const total = deptCourseStats.total;
        const cx = 160;
        const cy = 160;

        deptCourseStats.list.forEach((dept) => {
            const deptAngleSpan = (dept.total / total) * (2 * Math.PI);
            const startA = currentAngle;
            const endA = currentAngle + deptAngleSpan;

            // Inner Ring: Department (rInner: 56, rOuter: 98)
            inner.push({
                dept,
                startAngle: startA,
                endAngle: endA,
                path: describeDonutArc(cx, cy, 56, 98, startA, endA),
                midAngle: (startA + endA) / 2,
                span: deptAngleSpan
            });

            // Outer Ring: Courses in this Department (rInner: 104, rOuter: 146)
            let courseAngle = startA;
            ['software', 'powertrain', 'combo'].forEach((key) => {
                const c = dept.courses[key];
                if (c.count > 0) {
                    const courseAngleSpan = (c.count / dept.total) * deptAngleSpan;
                    const cStart = courseAngle;
                    const cEnd = courseAngle + courseAngleSpan;
                    outer.push({
                        dept,
                        courseKey: key,
                        course: c,
                        startAngle: cStart,
                        endAngle: cEnd,
                        path: describeDonutArc(cx, cy, 104, 146, cStart, cEnd),
                        midAngle: (cStart + cEnd) / 2,
                        span: courseAngleSpan
                    });
                    courseAngle = cEnd;
                }
            });

            currentAngle = endA;
        });

        return { inner, outer };
    }, [deptCourseStats]);

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
                            Stacked pie breakdown for departments × courses, package split, and registration velocity.
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
                            {/* GRAPH 1: STACKED DEPARTMENT × COURSE PIE / SUNBURST CHART */}
                            <div className="bg-slate-50 border-2 border-slate-900 p-4 shadow-[3px_3px_0px_#0f172a] space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-300 pb-2.5">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 bg-sky-500 border border-slate-900"></span>
                                        <h4 className="text-xs sm:text-sm font-black uppercase text-slate-900">
                                            1. Department × Registered Course (Stacked Pie / Sunburst)
                                        </h4>
                                    </div>

                                    {/* Chart Mode Switcher + Legend */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="inline-flex border-2 border-slate-900 bg-white p-0.5 text-[10px] font-black uppercase">
                                            <button
                                                type="button"
                                                onClick={() => setChartMode('sunburst')}
                                                className={`px-2 py-0.5 cursor-pointer ${
                                                    chartMode === 'sunburst' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                            >
                                                Stacked Pie ◐
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setChartMode('stackedBar')}
                                                className={`px-2 py-0.5 cursor-pointer ${
                                                    chartMode === 'stackedBar' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                            >
                                                Stacked Bars ▤
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Ring Legend Explainer */}
                                <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-slate-900 p-2 text-[10px]">
                                    <div className="flex items-center gap-3">
                                        <span className="font-black text-slate-900 uppercase">Ring Structure:</span>
                                        <span className="flex items-center gap-1 font-bold text-slate-700">
                                            <span className="w-2.5 h-2.5 rounded-full border border-slate-900 bg-indigo-500 inline-block"></span>
                                            Inner Ring: Department
                                        </span>
                                        <span className="flex items-center gap-1 font-bold text-slate-700">
                                            <span className="w-2.5 h-2.5 rounded-full border border-slate-900 bg-sky-400 inline-block"></span>
                                            Outer Ring: Enrolled Course
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 font-bold">
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 border border-slate-900 bg-[#0284c7]"></span>
                                            <span>Software</span>
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 border border-slate-900 bg-[#d97706]"></span>
                                            <span>Powertrain</span>
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 border border-slate-900 bg-[#059669]"></span>
                                            <span>Combo</span>
                                        </span>
                                    </div>
                                </div>

                                {/* SUNBURST OR STACKED BAR VIEW */}
                                {chartMode === 'sunburst' ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                                        {/* SVG Concentric Donut / Sunburst Chart */}
                                        <div className="lg:col-span-5 flex flex-col items-center justify-center p-2">
                                            <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px]">
                                                <svg viewBox="0 0 320 320" className="w-full h-full select-none">
                                                    {/* Outer Ring: Courses */}
                                                    <g>
                                                        {sunburstArcs.outer.map((arc, i) => {
                                                            const isHovered = hoveredSlice?.type === 'outer' && hoveredSlice?.key === `${arc.dept.name}-${arc.courseKey}`;
                                                            const isDeptDimmed = highlightDept && highlightDept !== arc.dept.name;

                                                            return (
                                                                <path
                                                                    key={`outer-${i}`}
                                                                    d={arc.path}
                                                                    fill={arc.course.config.color}
                                                                    stroke="#0f172a"
                                                                    strokeWidth="1.5"
                                                                    opacity={isDeptDimmed ? 0.25 : isHovered ? 1 : 0.9}
                                                                    className="cursor-pointer transition-all duration-200 hover:brightness-110"
                                                                    onMouseEnter={() => setHoveredSlice({
                                                                        type: 'outer',
                                                                        key: `${arc.dept.name}-${arc.courseKey}`,
                                                                        dept: arc.dept,
                                                                        courseKey: arc.courseKey,
                                                                        course: arc.course
                                                                    })}
                                                                    onMouseLeave={() => setHoveredSlice(null)}
                                                                />
                                                            );
                                                        })}
                                                    </g>

                                                    {/* Inner Ring: Departments */}
                                                    <g>
                                                        {sunburstArcs.inner.map((arc, i) => {
                                                            const isHovered = hoveredSlice?.type === 'inner' && hoveredSlice?.dept.name === arc.dept.name;
                                                            const isHighlighted = highlightDept === arc.dept.name;
                                                            const isDimmed = highlightDept && !isHighlighted;

                                                            // Department label position
                                                            const rMid = 77;
                                                            const lx = 160 + rMid * Math.cos(arc.midAngle);
                                                            const ly = 160 + rMid * Math.sin(arc.midAngle);

                                                            return (
                                                                <g key={`inner-${i}`}>
                                                                    <path
                                                                        d={arc.path}
                                                                        fill={arc.dept.color.bar}
                                                                        stroke="#0f172a"
                                                                        strokeWidth="2"
                                                                        opacity={isDimmed ? 0.25 : (isHovered || isHighlighted) ? 1 : 0.9}
                                                                        className="cursor-pointer transition-all duration-200 hover:brightness-115"
                                                                        onMouseEnter={() => {
                                                                            setHoveredSlice({
                                                                                type: 'inner',
                                                                                dept: arc.dept
                                                                            });
                                                                        }}
                                                                        onMouseLeave={() => setHoveredSlice(null)}
                                                                    />
                                                                    {/* Department label on arc if large enough */}
                                                                    {arc.span > 0.25 && (
                                                                        <text
                                                                            x={lx}
                                                                            y={ly}
                                                                            textAnchor="middle"
                                                                            dominantBaseline="middle"
                                                                            className="text-[9px] font-black fill-white pointer-events-none select-none drop-shadow"
                                                                        >
                                                                            {arc.dept.shortCode}
                                                                        </text>
                                                                    )}
                                                                </g>
                                                            );
                                                        })}
                                                    </g>

                                                    {/* Center Core Display (Interactive Inspector) */}
                                                    <circle
                                                        cx="160"
                                                        cy="160"
                                                        r="52"
                                                        fill="#ffffff"
                                                        stroke="#0f172a"
                                                        strokeWidth="2.5"
                                                        className="shadow-inner"
                                                    />

                                                    {hoveredSlice ? (
                                                        hoveredSlice.type === 'inner' ? (
                                                            <g className="pointer-events-none select-none">
                                                                <text x="160" y="142" textAnchor="middle" className="text-[12px] font-black fill-slate-900 uppercase">
                                                                    {hoveredSlice.dept.shortCode}
                                                                </text>
                                                                <text x="160" y="158" textAnchor="middle" className="text-[14px] font-black fill-indigo-600">
                                                                    {hoveredSlice.dept.total} Seats
                                                                </text>
                                                                <text x="160" y="174" textAnchor="middle" className="text-[9px] font-bold fill-slate-500">
                                                                    {hoveredSlice.dept.pct}% Cohort
                                                                </text>
                                                            </g>
                                                        ) : (
                                                            <g className="pointer-events-none select-none">
                                                                <text x="160" y="138" textAnchor="middle" className="text-[10px] font-black fill-slate-900 uppercase truncate">
                                                                    {hoveredSlice.dept.shortCode}
                                                                </text>
                                                                <text x="160" y="152" textAnchor="middle" className="text-[10px] font-black" fill={hoveredSlice.course.config.color}>
                                                                    {hoveredSlice.course.config.label}
                                                                </text>
                                                                <text x="160" y="166" textAnchor="middle" className="text-[13px] font-black fill-slate-900">
                                                                    {hoveredSlice.course.count} ({hoveredSlice.course.pct}%)
                                                                </text>
                                                                <text x="160" y="179" textAnchor="middle" className="text-[8px] font-bold fill-slate-400">
                                                                    of department
                                                                </text>
                                                            </g>
                                                        )
                                                    ) : (
                                                        <g className="pointer-events-none select-none">
                                                            <text x="160" y="148" textAnchor="middle" className="text-[17px] font-black fill-slate-900">
                                                                {deptCourseStats.total}
                                                            </text>
                                                            <text x="160" y="164" textAnchor="middle" className="text-[9px] font-black fill-slate-600 uppercase tracking-widest">
                                                                STUDENTS
                                                            </text>
                                                            <text x="160" y="178" textAnchor="middle" className="text-[8px] font-bold fill-sky-600">
                                                                Hover to inspect
                                                            </text>
                                                        </g>
                                                    )}
                                                </svg>
                                            </div>
                                        </div>

                                        {/* Right Side: Detailed Department & Course Breakdown Table */}
                                        <div className="lg:col-span-7 space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                                            {deptCourseStats.list.map((dept) => {
                                                const isHighlighted = highlightDept === dept.name;

                                                return (
                                                    <div
                                                        key={dept.name}
                                                        className={`p-2.5 bg-white border-2 border-slate-900 transition-all ${
                                                            isHighlighted
                                                                ? 'shadow-[4px_4px_0px_#0f172a] bg-amber-50/50'
                                                                : 'shadow-[2px_2px_0px_#0f172a] hover:bg-slate-50'
                                                        }`}
                                                        onMouseEnter={() => setHighlightDept(dept.name)}
                                                        onMouseLeave={() => setHighlightDept(null)}
                                                    >
                                                        <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                                                            <div className="flex items-center gap-2 truncate pr-2">
                                                                <span className={`px-1.5 py-0.2 border text-[9px] font-black shrink-0 ${dept.color.badge} text-slate-900`}>
                                                                    {dept.shortCode}
                                                                </span>
                                                                <span className="truncate text-slate-900 text-[11px]" title={dept.name}>
                                                                    {dept.name}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className="font-black text-slate-900">{dept.total}</span>
                                                                <span className="text-[10px] text-slate-500 font-bold">({dept.pct}%)</span>
                                                            </div>
                                                        </div>

                                                        {/* Stacked Mini Bar for this Department */}
                                                        <div className="w-full h-3 border border-slate-900 flex overflow-hidden bg-slate-200 mb-1.5">
                                                            {dept.courses.software.count > 0 && (
                                                                <div
                                                                    className="h-full bg-[#0284c7]"
                                                                    style={{ width: `${dept.courses.software.pct}%` }}
                                                                    title={`Software: ${dept.courses.software.count} (${dept.courses.software.pct}%)`}
                                                                />
                                                            )}
                                                            {dept.courses.powertrain.count > 0 && (
                                                                <div
                                                                    className="h-full bg-[#d97706]"
                                                                    style={{ width: `${dept.courses.powertrain.pct}%` }}
                                                                    title={`Powertrain: ${dept.courses.powertrain.count} (${dept.courses.powertrain.pct}%)`}
                                                                />
                                                            )}
                                                            {dept.courses.combo.count > 0 && (
                                                                <div
                                                                    className="h-full bg-[#059669]"
                                                                    style={{ width: `${dept.courses.combo.pct}%` }}
                                                                    title={`Combo: ${dept.courses.combo.count} (${dept.courses.combo.pct}%)`}
                                                                />
                                                            )}
                                                        </div>

                                                        {/* Exact Course Count Badges */}
                                                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sky-700">SW: <strong className="text-slate-900">{dept.courses.software.count}</strong></span>
                                                                <span>·</span>
                                                                <span className="text-amber-700">PT: <strong className="text-slate-900">{dept.courses.powertrain.count}</strong></span>
                                                                <span>·</span>
                                                                <span className="text-emerald-700">Combo: <strong className="text-slate-900">{dept.courses.combo.count}</strong></span>
                                                            </div>
                                                            <span className="text-[9px] text-slate-400">
                                                                Top: {dept.courses.combo.count >= dept.courses.software.count && dept.courses.combo.count >= dept.courses.powertrain.count ? 'Combo' : dept.courses.software.count >= dept.courses.powertrain.count ? 'Software' : 'Powertrain'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    /* STACKED HORIZONTAL BARS VIEW */
                                    <div className="space-y-3 pt-1">
                                        {deptCourseStats.list.map((dept) => {
                                            const fillWidth = Math.max(10, (dept.total / deptCourseStats.list[0].total) * 100);

                                            return (
                                                <div key={dept.name} className="space-y-1 bg-white p-3 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
                                                    <div className="flex items-center justify-between text-xs font-bold">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-1.5 py-0.2 border text-[9px] font-black ${dept.color.badge} text-slate-900`}>
                                                                {dept.shortCode}
                                                            </span>
                                                            <span className="text-slate-900">{dept.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-slate-900">{dept.total} candidates</span>
                                                            <span className="text-[10px] text-slate-500">({dept.pct}%)</span>
                                                        </div>
                                                    </div>

                                                    {/* Full Stacked Bar */}
                                                    <div
                                                        className="h-5 border-2 border-slate-900 flex overflow-hidden bg-slate-100 relative"
                                                        style={{ width: `${fillWidth}%` }}
                                                    >
                                                        {dept.courses.software.count > 0 && (
                                                            <div
                                                                className="h-full bg-[#0284c7] flex items-center justify-center text-[9px] font-black text-white px-1 border-r border-slate-900"
                                                                style={{ width: `${dept.courses.software.pct}%` }}
                                                                title={`Software: ${dept.courses.software.count}`}
                                                            >
                                                                {dept.courses.software.count > 1 ? `SW:${dept.courses.software.count}` : dept.courses.software.count}
                                                            </div>
                                                        )}
                                                        {dept.courses.powertrain.count > 0 && (
                                                            <div
                                                                className="h-full bg-[#d97706] flex items-center justify-center text-[9px] font-black text-white px-1 border-r border-slate-900"
                                                                style={{ width: `${dept.courses.powertrain.pct}%` }}
                                                                title={`Powertrain: ${dept.courses.powertrain.count}`}
                                                            >
                                                                {dept.courses.powertrain.count > 1 ? `PT:${dept.courses.powertrain.count}` : dept.courses.powertrain.count}
                                                            </div>
                                                        )}
                                                        {dept.courses.combo.count > 0 && (
                                                            <div
                                                                className="h-full bg-[#059669] flex items-center justify-center text-[9px] font-black text-white px-1"
                                                                style={{ width: `${dept.courses.combo.pct}%` }}
                                                                title={`Combo: ${dept.courses.combo.count}`}
                                                            >
                                                                {dept.courses.combo.count > 1 ? `Combo:${dept.courses.combo.count}` : dept.courses.combo.count}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 pt-0.5">
                                                        <span>Software: <strong className="text-sky-700">{dept.courses.software.count}</strong></span>
                                                        <span>Powertrain: <strong className="text-amber-700">{dept.courses.powertrain.count}</strong></span>
                                                        <span>Combo: <strong className="text-emerald-700">{dept.courses.combo.count}</strong></span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* ROW 2: GRAPH 2 (PACKAGES) & GRAPH 4 (VELOCITY) */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
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
                                                Overall Student Enrollment Share
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
                                                    className="p-2.5 border-2 border-slate-900 bg-white shadow-[2px_2px_0px_#0f172a] flex items-center justify-between"
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

                                {/* GRAPH 4: REGISTRATION & PAYMENT VELOCITY TIMELINE (7 cols) */}
                                <div className="lg:col-span-7 bg-slate-50 border-2 border-slate-900 p-4 shadow-[2px_2px_0px_#0f172a] flex flex-col justify-between">
                                    <div>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-300 pb-2 mb-4">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2.5 h-2.5 bg-amber-500 border border-slate-900"></span>
                                                <h4 className="text-xs font-black uppercase text-slate-900">
                                                    4. Registration Velocity & Momentum
                                                </h4>
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] text-slate-600 font-bold">
                                                {velocityStats.peakDay && (
                                                    <span>
                                                        🔥 Peak: <strong className="text-slate-900 font-black">{velocityStats.peakDay.label}</strong> ({velocityStats.peakDay.count})
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
                                                    <div className="min-w-[420px] h-32 flex items-end gap-2 sm:gap-3 border-b-2 border-slate-900 px-2">
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
                                                                    <div className={`text-[10px] font-black mb-1 transition-all ${
                                                                        isHovered || isPeak
                                                                            ? 'text-slate-900 scale-110'
                                                                            : 'text-slate-600'
                                                                    }`}>
                                                                        {day.count}
                                                                    </div>

                                                                    <div
                                                                        className={`w-full max-w-[40px] border-2 border-slate-900 transition-all duration-300 relative ${
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

                                                                    <span className="text-[10px] font-bold text-slate-600 mt-2 truncate max-w-[50px] text-center">
                                                                        {day.label}
                                                                    </span>

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
                                                            <span>Peak Day</span>
                                                        </span>
                                                    </div>
                                                    <span>
                                                        Span: {velocityStats.timeline[0]?.label} → {velocityStats.timeline[velocityStats.timeline.length - 1]?.label}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 pt-2.5 border-t border-slate-300 text-[10px] text-slate-500">
                                        Updated in real time based on database registrations.
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </section>
    );
}
