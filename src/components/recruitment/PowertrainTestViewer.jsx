import { useState } from 'react';
import { POWERTRAIN_TEST_DATA } from '../../data/recruitmentProblemStatements';

export default function PowertrainTestViewer() {
    const data = POWERTRAIN_TEST_DATA;
    const [checkedItems, setCheckedItems] = useState({});

    const toggleCheck = (id) => {
        setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="space-y-8">
            {/* Header / Banner Card */}
            <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-5 sm:p-7 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-3 py-1 bg-amber-300 text-slate-900 border-2 border-slate-900 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#0f172a]">
                        ⚡ {data.headline}
                    </span>
                    <span className="font-mono text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 border border-rose-300">
                        Date: {data.testOverview.date} • {data.testOverview.time}
                    </span>
                </div>

                <div>
                    <h2 className="text-2xl sm:text-4xl font-black uppercase text-slate-900 tracking-tight">
                        {data.testOverview.title}
                    </h2>
                    <p className="text-sm font-bold text-slate-600 mt-1">
                        {data.testOverview.subtitle}
                    </p>
                </div>

                <div className="p-4 bg-sky-50 border-2 border-slate-900 flex items-start gap-2">
                    <span className="font-mono font-black text-sky-700">🎯</span>
                    <p className="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed">
                        <strong>Target Audience:</strong> {data.testOverview.eligibility}
                    </p>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
                    {[
                        { label: 'Date', val: '11 Sept 2026', icon: '📅' },
                        { label: 'Time Window', val: '5:30 – 6:30 PM', icon: '⏱️' },
                        { label: 'Duration', val: '60 Minutes', icon: '⏳' },
                        { label: 'Questions', val: '45 Questions', icon: '📝' },
                        { label: 'Test Mode', val: 'Offline Written', icon: '🏫' },
                        { label: 'Calculator', val: 'Permitted', icon: '🧮' },
                    ].map((item, idx) => (
                        <div
                            key={idx}
                            className="p-3 bg-slate-50 border-2 border-slate-900 text-center flex flex-col items-center justify-center shadow-[2px_2px_0px_#0f172a]"
                        >
                            <span className="text-lg mb-1">{item.icon}</span>
                            <span className="font-mono text-[10px] font-black uppercase text-slate-500 block">
                                {item.label}
                            </span>
                            <span className="font-black text-xs uppercase text-slate-900 mt-0.5">
                                {item.val}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Syllabus & Structure Section */}
            <div className="bg-sky-50 border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-5 sm:p-7 space-y-6">
                <div>
                    <span className="font-mono text-xs font-black uppercase tracking-widest text-sky-700 block mb-1">
                        EXAMINATION SYLLABUS &amp; DISTRIBUTION
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black uppercase text-slate-900 tracking-tight">
                        TEST STRUCTURE (45 QUESTIONS • 60 MINS)
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-slate-600 mt-1 max-w-3xl">
                        The test evaluates logical thinking, foundational electrical &amp; electronics theory, circuit analysis, and core concepts essential for the Powertrain subsystem.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {data.sections.map((sec, idx) => (
                        <div
                            key={idx}
                            className="bg-white border-3 border-slate-900 shadow-[4px_4px_0px_#0f172a] p-4 flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="font-mono text-[11px] font-black uppercase text-slate-500">
                                        Section 0{idx + 1}
                                    </span>
                                    <span className="font-mono text-xs font-black px-2 py-0.5 bg-slate-900 text-white">
                                        {sec.percentage}
                                    </span>
                                </div>
                                <h4 className="font-black text-lg uppercase text-slate-900 leading-snug">
                                    {sec.name}
                                </h4>
                                <div className="font-mono text-xs font-black text-sky-600 mt-1">
                                    {sec.questions} Questions
                                </div>
                                <p className="text-xs font-bold text-slate-600 mt-2 leading-relaxed">
                                    {sec.description}
                                </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-200">
                                <div className="w-full bg-slate-200 h-2 border border-slate-900 overflow-hidden">
                                    <div
                                        className={`h-full ${sec.color}`}
                                        style={{ width: sec.percentage }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Cheat Sheet & Materials Rule Card */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t-2 border-slate-300">
                    {/* Handwritten Cheat Sheet Rules */}
                    <div className="bg-white border-3 border-slate-900 p-5 space-y-4 shadow-[4px_4px_0px_#0f172a]">
                        <div className="flex items-center justify-between gap-2">
                            <h4 className="font-black text-base uppercase text-slate-900 font-mono">
                                📝 {data.cheatSheetRules.title}
                            </h4>
                            <span className="font-mono text-[10px] font-black uppercase px-2 py-1 bg-amber-300 border-2 border-slate-900">
                                {data.cheatSheetRules.badge}
                            </span>
                        </div>

                        <p className="text-xs font-bold text-slate-600">
                            Each candidate is permitted to bring <strong>ONE handwritten cheat sheet</strong> for reference during the 60-minute examination.
                        </p>

                        <div className="space-y-2">
                            {data.cheatSheetRules.rules.map((rule, idx) => (
                                <div
                                    key={idx}
                                    className={`p-2.5 border-2 text-xs font-bold flex items-start gap-2 ${
                                        rule.allowed
                                            ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                                            : 'bg-rose-50 border-rose-600 text-rose-900'
                                    }`}
                                >
                                    <span className="font-mono font-black text-sm shrink-0">
                                        {rule.allowed ? '✓' : '✕'}
                                    </span>
                                    <span>{rule.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Electronic Devices & Calculators */}
                    <div className="space-y-4">
                        {/* Calculator policy */}
                        <div className="bg-white border-3 border-slate-900 p-5 shadow-[4px_4px_0px_#0f172a]">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">🧮</span>
                                <h4 className="font-black text-sm uppercase text-slate-900 font-mono">
                                    {data.devicesAndCalculators.calculators.title}
                                </h4>
                            </div>
                            <p className="text-xs font-bold text-slate-700 leading-relaxed">
                                {data.devicesAndCalculators.calculators.desc}
                            </p>
                        </div>

                        {/* Prohibited Devices policy */}
                        <div className="bg-rose-50 border-3 border-rose-600 p-5 shadow-[4px_4px_0px_#0f172a]">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">📱</span>
                                <h4 className="font-black text-sm uppercase text-rose-900 font-mono">
                                    {data.devicesAndCalculators.electronicDevices.title}
                                </h4>
                            </div>
                            <p className="text-xs font-bold text-rose-800 mb-2">
                                Candidates must NOT bring or access any of the following during the examination:
                            </p>
                            <ul className="space-y-1">
                                {data.devicesAndCalculators.electronicDevices.prohibitedList.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-xs font-bold text-rose-900">
                                        <span className="font-mono font-black text-rose-600">✕</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-[11px] font-bold text-rose-700 mt-3 pt-2 border-t border-rose-300">
                                ⚠️ {data.devicesAndCalculators.electronicDevices.advice}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Test Conduct & Integrity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t-2 border-slate-300">
                    {/* Hall Instructions */}
                    <div className="bg-white border-3 border-slate-900 p-5 shadow-[4px_4px_0px_#0f172a] space-y-3">
                        <h4 className="font-black text-base uppercase text-slate-900 font-mono">
                            ⏱️ Examination Hall Instructions
                        </h4>
                        <ul className="space-y-2">
                            {data.hallInstructions.map((instruction, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-xs font-bold text-slate-700">
                                    <span className="text-sky-600 font-black font-mono">▸</span>
                                    <span>{instruction}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Academic Integrity */}
                    <div className="bg-amber-100 border-3 border-slate-900 p-5 shadow-[4px_4px_0px_#0f172a] flex flex-col justify-between space-y-3">
                        <div>
                            <span className="font-mono font-black text-xs uppercase text-amber-900 block mb-1">
                                ⚠️ {data.academicIntegrity.title}
                            </span>
                            <p className="text-xs font-bold text-slate-800 leading-relaxed">
                                {data.academicIntegrity.desc}
                            </p>
                        </div>

                        <div className="p-3 bg-white border-2 border-slate-900 text-xs font-bold text-slate-700">
                            <strong>Note:</strong> Sharing of calculators, cheat sheets, or stationery between candidates is strictly forbidden.
                        </div>
                    </div>
                </div>

                {/* Candidate Readiness Checklist */}
                <div className="bg-white border-3 border-slate-900 p-5 sm:p-6 shadow-[4px_4px_0px_#0f172a] space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-black text-base uppercase text-slate-900 font-mono">
                            ✅ Candidate Readiness Checklist (What to Bring)
                        </h4>
                        <span className="font-mono text-xs font-bold text-slate-500">
                            Check off items as you prepare
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {data.candidateChecklist.map((chk) => {
                            const isDone = !!checkedItems[chk.id];
                            return (
                                <button
                                    key={chk.id}
                                    type="button"
                                    onClick={() => toggleCheck(chk.id)}
                                    className={`p-3 border-2 border-slate-900 text-left cursor-pointer transition-all flex items-center gap-3 ${
                                        isDone
                                            ? 'bg-emerald-100 border-emerald-700 text-emerald-950 line-through opacity-80'
                                            : 'bg-slate-50 hover:bg-slate-100 text-slate-900'
                                    }`}
                                >
                                    <span
                                        className={`w-5 h-5 border-2 border-slate-900 flex items-center justify-center font-mono text-xs font-black shrink-0 ${
                                            isDone ? 'bg-emerald-500 text-white' : 'bg-white'
                                        }`}
                                    >
                                        {isDone ? '✓' : ''}
                                    </span>
                                    <span className="text-xs font-bold">{chk.item}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Final Encouragement Note */}
                <div className="p-5 bg-slate-900 text-white border-3 border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                        <span className="font-mono text-xs font-black uppercase text-amber-400">
                            Good Luck!
                        </span>
                        <p className="text-xs font-bold text-slate-300 max-w-xl">
                            {data.finalNote}
                        </p>
                    </div>

                    <div className="font-mono text-xs font-bold text-sky-400 text-center sm:text-right shrink-0">
                        Test Date: 11 September 2026<br />5:30 PM – 6:30 PM IST
                    </div>
                </div>
            </div>
        </div>
    );
}
