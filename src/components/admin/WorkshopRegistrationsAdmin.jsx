import { useState, useEffect, useMemo, useCallback } from 'react';
import { apiUrl } from '../../lib/api';
import { AUTH_TOKEN_KEY } from '../../context/WebsiteDataContext';

export default function WorkshopRegistrationsAdmin({ showStatus }) {
    const [registrations, setRegistrations] = useState([]);
    const [summary, setSummary] = useState({ total: 0, paid: 0, pending: 0, failed: 0, revenue: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [packageFilter, setPackageFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRegistration, setSelectedRegistration] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    const fetchRegistrations = useCallback(async (isSilent = false) => {
        if (!isSilent) setIsLoading(true);
        setError('');
        try {
            const token = sessionStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem('admin_token');
            if (!token) {
                setError('No admin authorization token found. Please sign in again.');
                setIsLoading(false);
                return;
            }

            const res = await fetch(apiUrl('/api/workshop/registrations'), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Server returned HTTP ${res.status}`);
            }

            const data = await res.json();
            setRegistrations(data.registrations || []);
            setSummary(data.summary || { total: 0, paid: 0, pending: 0, failed: 0, revenue: 0 });
        } catch (err) {
            console.error('Error fetching workshop registrations:', err);
            setError(err.message || 'Failed to fetch workshop registrations');
            if (!isSilent && showStatus) {
                showStatus(`⚠️ Failed to load registrations: ${err.message}`);
            }
        } finally {
            if (!isSilent) setIsLoading(false);
        }
    }, [showStatus]);

    useEffect(() => {
        let isMounted = true;
        fetchRegistrations(false);

        // Auto-refresh every 6 seconds for live tracking of payments
        const timer = setInterval(() => {
            if (isMounted) fetchRegistrations(true);
        }, 6000);

        return () => {
            isMounted = false;
            clearInterval(timer);
        };
    }, [fetchRegistrations]);

    // Handle CSV Export
    const handleExportCSV = async () => {
        setIsExporting(true);
        try {
            const token = sessionStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem('admin_token');
            const res = await fetch(apiUrl('/api/workshop/registrations?format=csv'), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                throw new Error('Failed to generate CSV export');
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            const stamp = new Date().toISOString().slice(0, 10);
            a.href = url;
            a.download = `asterix-workshop-registrations-${stamp}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            if (showStatus) showStatus('Workshop registrations CSV exported successfully! 📥');
        } catch (err) {
            console.error('CSV export failed:', err);
            alert('Failed to download CSV: ' + err.message);
        } finally {
            setIsExporting(false);
        }
    };

    // Filter registrations by status, package, and search query
    const filteredRegistrations = useMemo(() => {
        return registrations.filter((reg) => {
            if (statusFilter !== 'all' && reg.status !== statusFilter) return false;
            if (packageFilter !== 'all' && reg.package !== packageFilter) return false;

            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase().trim();
            const matchName = reg.name?.toLowerCase().includes(q);
            const matchEmail = reg.email?.toLowerCase().includes(q);
            const matchPhone = reg.phone?.includes(q);
            const matchRollNo = reg.rollNo?.toLowerCase().includes(q);
            const matchDept = reg.department?.toLowerCase().includes(q);
            const matchReceipt = reg.receiptNo?.toLowerCase().includes(q);
            const matchOrder = reg.razorpayOrderId?.toLowerCase().includes(q);
            const matchPayment = reg.razorpayPaymentId?.toLowerCase().includes(q);

            return matchName || matchEmail || matchPhone || matchRollNo || matchDept || matchReceipt || matchOrder || matchPayment;
        });
    }, [registrations, statusFilter, packageFilter, searchQuery]);

    const formatCurrency = (amt) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return String(dateStr);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-slate-200 pb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-black uppercase text-slate-900">
                            Workshop Registrations & Payments
                        </h2>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            LIVE SYNC (6s)
                        </span>
                    </div>
                    <p className="text-xs font-bold text-slate-500 font-mono mt-1">
                        Track candidates registered for Team Asterix workshops, confirmed payments, receipt numbers, and Razorpay transaction IDs.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => fetchRegistrations(false)}
                        disabled={isLoading}
                        className="press px-3.5 py-1.5 bg-white hover:bg-slate-100 border-2 border-slate-900 text-slate-900 font-mono font-black text-xs uppercase shadow-[2px_2px_0px_#0f172a] cursor-pointer disabled:opacity-50"
                    >
                        {isLoading ? '⟳ Loading...' : '⟳ Refresh Data'}
                    </button>
                    <button
                        type="button"
                        onClick={handleExportCSV}
                        disabled={isExporting || registrations.length === 0}
                        className="press px-3.5 py-1.5 bg-emerald-400 hover:bg-emerald-300 border-2 border-slate-900 text-slate-900 font-mono font-black text-xs uppercase shadow-[2px_2px_0px_#0f172a] cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                        <span>📥</span>
                        <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="p-4 bg-rose-50 border-2 border-rose-600 text-rose-800 font-mono text-xs font-bold space-y-1">
                    <div className="flex items-center justify-between">
                        <span>⚠️ {error}</span>
                        <button onClick={() => fetchRegistrations(false)} className="underline cursor-pointer">Retry</button>
                    </div>
                </div>
            )}

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-4 bg-sky-50 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                    <span className="text-[10px] font-mono font-black text-sky-600 uppercase block">Total Registered</span>
                    <span className="text-3xl font-black text-slate-900">{summary.total}</span>
                    <span className="text-[10px] font-mono text-slate-500 block mt-1">Candidates</span>
                </div>

                <div className="p-4 bg-emerald-50 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                    <span className="text-[10px] font-mono font-black text-emerald-700 uppercase block">Confirmed Paid</span>
                    <span className="text-3xl font-black text-emerald-700">{summary.paid}</span>
                    <span className="text-[10px] font-mono text-emerald-700 font-bold block mt-1">Receipts Generated</span>
                </div>

                <div className="p-4 bg-emerald-400 text-slate-950 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                    <span className="text-[10px] font-mono font-black uppercase block">Total Revenue</span>
                    <span className="text-2xl sm:text-3xl font-black">{formatCurrency(summary.revenue)}</span>
                    <span className="text-[10px] font-mono font-bold block mt-1">Collected in INR</span>
                </div>

                <div className="p-4 bg-amber-50 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                    <span className="text-[10px] font-mono font-black text-amber-700 uppercase block">Pending Checkout</span>
                    <span className="text-3xl font-black text-amber-700">{summary.pending}</span>
                    <span className="text-[10px] font-mono text-slate-500 block mt-1">Payment Unfinished</span>
                </div>

                <div className="p-4 bg-rose-50 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a]">
                    <span className="text-[10px] font-mono font-black text-rose-700 uppercase block">Failed Attempts</span>
                    <span className="text-3xl font-black text-rose-700">{summary.failed}</span>
                    <span className="text-[10px] font-mono text-slate-500 block mt-1">Transaction Failed</span>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-4 bg-slate-50 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {/* Status Filter */}
                    <div>
                        <label className="block text-[10px] font-mono font-black uppercase text-slate-700 mb-1">
                            Payment Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-900 bg-white font-mono text-xs font-bold focus:outline-none"
                        >
                            <option value="all">All Statuses ({registrations.length})</option>
                            <option value="paid">✓ Confirmed Paid ({summary.paid})</option>
                            <option value="pending">⏳ Pending Checkout ({summary.pending})</option>
                            <option value="failed">✕ Payment Failed ({summary.failed})</option>
                        </select>
                    </div>

                    {/* Package Filter */}
                    <div>
                        <label className="block text-[10px] font-mono font-black uppercase text-slate-700 mb-1">
                            Workshop Package
                        </label>
                        <select
                            value={packageFilter}
                            onChange={(e) => setPackageFilter(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-900 bg-white font-mono text-xs font-bold focus:outline-none"
                        >
                            <option value="all">All Packages</option>
                            <option value="software">Software Track</option>
                            <option value="powertrain">Powertrain Track</option>
                            <option value="combo">Combo Package</option>
                        </select>
                    </div>

                    {/* Search Input */}
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-mono font-black uppercase text-slate-700 mb-1">
                            Search Candidate / Receipt / Payment ID
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, email, phone, roll no, AST-WS-xxxx, order/pay ID..."
                                className="w-full px-3 py-1.5 border border-slate-900 bg-white font-mono text-xs focus:outline-none"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2 top-1.5 text-xs font-mono font-bold text-slate-400 hover:text-slate-900"
                                >
                                    ✕ Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-500 pt-1 border-t border-slate-200">
                    <span>Showing {filteredRegistrations.length} of {registrations.length} entries</span>
                    {(statusFilter !== 'all' || packageFilter !== 'all' || searchQuery) && (
                        <button
                            onClick={() => { setStatusFilter('all'); setPackageFilter('all'); setSearchQuery(''); }}
                            className="text-sky-600 hover:underline cursor-pointer"
                        >
                            Reset Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Registrations Data Table */}
            <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead>
                        <tr className="bg-slate-900 text-white font-black uppercase text-[11px] border-b-2 border-slate-900">
                            <th className="p-3"># Receipt</th>
                            <th className="p-3">Candidate</th>
                            <th className="p-3">Roll No & Dept</th>
                            <th className="p-3">Package / Tracks</th>
                            <th className="p-3">Amount</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Payment details</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y border-slate-200">
                        {isLoading && registrations.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-slate-500 font-bold">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="w-3 h-3 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></span>
                                        <span>Fetching workshop registrations from database...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredRegistrations.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-slate-500 font-bold">
                                    No registrations found matching your filter criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredRegistrations.map((reg) => {
                                const isPaid = reg.status === 'paid';
                                const isPending = reg.status === 'pending';
                                const isFailed = reg.status === 'failed';

                                return (
                                    <tr key={reg._id || reg.receiptNo} className="hover:bg-sky-50/50 transition-colors">
                                        {/* Receipt No */}
                                        <td className="p-3 font-black whitespace-nowrap">
                                            {reg.receiptNo ? (
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-500 font-mono text-[11px]">
                                                    {reg.receiptNo}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 font-normal">—</span>
                                            )}
                                        </td>

                                        {/* Candidate Details */}
                                        <td className="p-3">
                                            <div className="font-bold text-slate-900">{reg.name}</div>
                                            <div className="text-[11px] text-slate-600">{reg.email}</div>
                                            <div className="text-[10px] text-sky-700 font-bold">{reg.phone}</div>
                                        </td>

                                        {/* Roll No & Dept */}
                                        <td className="p-3">
                                            <div className="font-bold text-slate-900">{reg.rollNo}</div>
                                            <div className="text-[11px] text-slate-600">{reg.department}</div>
                                            <div className="text-[10px] text-slate-500">Year {reg.year}</div>
                                        </td>

                                        {/* Package / Tracks */}
                                        <td className="p-3">
                                            <span className={`inline-block px-2 py-0.5 border text-[10px] font-black uppercase ${
                                                reg.package === 'combo'
                                                    ? 'bg-purple-100 text-purple-900 border-purple-400'
                                                    : reg.package === 'software'
                                                        ? 'bg-sky-100 text-sky-900 border-sky-400'
                                                        : 'bg-amber-100 text-amber-900 border-amber-400'
                                            }`}>
                                                {reg.package}
                                            </span>
                                            <div className="text-[10px] text-slate-500 mt-0.5">
                                                {Array.isArray(reg.tracksEnrolled) ? reg.tracksEnrolled.join(' + ') : reg.tracksEnrolled}
                                            </div>
                                        </td>

                                        {/* Amount */}
                                        <td className="p-3 font-black text-slate-900 whitespace-nowrap">
                                            ₹{reg.amount}
                                        </td>

                                        {/* Status */}
                                        <td className="p-3 whitespace-nowrap">
                                            {isPaid && (
                                                <span className="px-2 py-1 bg-emerald-500 text-white font-black border border-slate-900 shadow-[1px_1px_0px_#0f172a] text-[10px] uppercase flex items-center gap-1 w-fit">
                                                    <span>✓ PAID</span>
                                                </span>
                                            )}
                                            {isPending && (
                                                <span className="px-2 py-1 bg-amber-300 text-slate-950 font-black border border-slate-900 shadow-[1px_1px_0px_#0f172a] text-[10px] uppercase flex items-center gap-1 w-fit">
                                                    <span>⏳ PENDING</span>
                                                </span>
                                            )}
                                            {isFailed && (
                                                <span className="px-2 py-1 bg-rose-500 text-white font-black border border-slate-900 shadow-[1px_1px_0px_#0f172a] text-[10px] uppercase flex items-center gap-1 w-fit">
                                                    <span>✕ FAILED</span>
                                                </span>
                                            )}
                                            {reg.paidAt && (
                                                <div className="text-[9px] text-slate-500 mt-1">
                                                    {formatDate(reg.paidAt)}
                                                </div>
                                            )}
                                        </td>

                                        {/* Payment IDs */}
                                        <td className="p-3 text-[10px]">
                                            {reg.razorpayPaymentId ? (
                                                <div>
                                                    <span className="text-slate-400">Pay ID: </span>
                                                    <span className="font-bold text-slate-800">{reg.razorpayPaymentId}</span>
                                                </div>
                                            ) : null}
                                            {reg.razorpayOrderId ? (
                                                <div>
                                                    <span className="text-slate-400">Order ID: </span>
                                                    <span className="text-slate-600">{reg.razorpayOrderId}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="p-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedRegistration(reg)}
                                                className="press px-2.5 py-1 bg-slate-100 hover:bg-sky-100 border border-slate-900 text-slate-900 font-mono text-[10px] font-black uppercase cursor-pointer"
                                            >
                                                Details &rarr;
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal for Candidate Details */}
            {selectedRegistration && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white border-4 border-slate-900 shadow-[10px_10px_0px_#0f172a] max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                            <div>
                                <span className="text-[10px] font-mono font-black text-sky-600 uppercase block">
                                    REGISTRATION RECORD
                                </span>
                                <h3 className="text-xl font-black uppercase text-slate-900">
                                    {selectedRegistration.name}
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedRegistration(null)}
                                className="press px-2.5 py-1 bg-slate-100 hover:bg-rose-100 border border-slate-900 text-slate-900 font-mono font-black text-xs uppercase cursor-pointer"
                            >
                                ✕ Close
                            </button>
                        </div>

                        <div className="space-y-3 font-mono text-xs">
                            <div className="p-3 bg-sky-50 border border-slate-900 flex justify-between items-center">
                                <div>
                                    <span className="text-[10px] text-slate-500 uppercase block">Receipt Number</span>
                                    <span className="text-base font-black text-slate-900">
                                        {selectedRegistration.receiptNo || 'Pending Payment'}
                                    </span>
                                </div>
                                <span className={`px-2 py-1 text-xs font-black uppercase border border-slate-900 ${
                                    selectedRegistration.status === 'paid' ? 'bg-emerald-400 text-slate-950' : 'bg-amber-300 text-slate-950'
                                }`}>
                                    {selectedRegistration.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200">
                                <div>
                                    <span className="text-[10px] text-slate-500 block">Email Address</span>
                                    <span className="font-bold text-slate-900 break-all">{selectedRegistration.email}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 block">Phone Number</span>
                                    <span className="font-bold text-slate-900">{selectedRegistration.phone}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 block">Roll Number</span>
                                    <span className="font-bold text-slate-900">{selectedRegistration.rollNo}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 block">Year & Dept</span>
                                    <span className="font-bold text-slate-900">Year {selectedRegistration.year} - {selectedRegistration.department}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 block">College</span>
                                    <span className="font-bold text-slate-900">{selectedRegistration.college || 'PSG iTech'}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 block">Package Enrolled</span>
                                    <span className="font-bold text-slate-900 uppercase">{selectedRegistration.package} (₹{selectedRegistration.amount})</span>
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 border border-slate-200 space-y-1">
                                <div className="text-[10px] text-slate-500 uppercase font-black">Razorpay Transaction Details</div>
                                <div>
                                    <span className="text-slate-500">Order ID: </span>
                                    <span className="font-bold text-slate-900">{selectedRegistration.razorpayOrderId || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Payment ID: </span>
                                    <span className="font-bold text-slate-900">{selectedRegistration.razorpayPaymentId || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Paid At: </span>
                                    <span className="font-bold text-slate-900">{formatDate(selectedRegistration.paidAt)}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Registered At: </span>
                                    <span className="font-bold text-slate-900">{formatDate(selectedRegistration.createdAt)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                onClick={() => setSelectedRegistration(null)}
                                className="press px-4 py-2 bg-slate-900 text-white font-mono font-black text-xs uppercase cursor-pointer"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
