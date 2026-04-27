import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useApi, apiRequest, getSocket } from '../../hooks/useApi';
import { useAuditLogger } from '../../hooks/useAuditLogger';
import { useAuth } from '../../context/AuthContext';
import { Trash2, Search, MapPin, Loader2, Calendar, User, AlertTriangle } from 'lucide-react';
import { exportToPDF, exportToCSV, exportToExcel } from '../../utils/export';

export function AttendanceRecords() {
  const { user } = useAuth();
  const { logActivity } = useAuditLogger();
  const { data: attendanceData, loading } = useApi<any[]>('/api/attendance');
  const [records, setRecords] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (attendanceData) {
      // API already returns sorted array
      const sorted = [...attendanceData].sort(
        (a, b) => (b.checkIn?.timestamp || 0) - (a.checkIn?.timestamp || 0)
      );
      setRecords(sorted);
    }
  }, [attendanceData]);

  // Real-time socket updates
  useEffect(() => {
    const socket = getSocket();
    socket.on('attendance_update', (updated: any) => {
      setRecords(prev => {
        const exists = prev.find(r => r._id === updated._id);
        if (exists) {
          return prev.map(r => r._id === updated._id ? updated : r);
        }
        return [updated, ...prev];
      });
    });
    return () => { socket.off('attendance_update'); };
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const staffName = record.staffName || "";
      const staffId = record.staffId || "";
      
      const matchesSearch =
        staffName.toLowerCase().includes(search.toLowerCase()) ||
        staffId.toLowerCase().includes(search.toLowerCase());

      const matchesDateFrom = !dateFrom || record.date >= dateFrom;
      const matchesDateTo = !dateTo || record.date <= dateTo;

      return matchesSearch && matchesDateFrom && matchesDateTo;
    });
  }, [records, search, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = useMemo(() => {
    return filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredRecords, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, dateFrom, dateTo]);

  const calculateDuration = (checkIn?: { timestamp?: number }, checkOut?: { timestamp?: number }) => {
    const inTime = checkIn?.timestamp;
    const outTime = checkOut?.timestamp;
    if (!inTime || !outTime) return null;
    const diff = outTime - inTime;
    if (diff < 0) return "0h 0m";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours >= 14) return "14h 0m (Max)";
    return `${hours}h ${minutes}m`;
  };

  const handleExport = (type: 'csv' | 'excel' | 'pdf') => {
    if (filteredRecords.length === 0) {
      toast.error("No records to export");
      return;
    }
    
    if (type === 'csv') exportToCSV(filteredRecords);
    else if (type === 'excel') exportToExcel(filteredRecords);
    else exportToPDF(filteredRecords);
    
    logActivity('ATTENDANCE_EXPORTED', `Exported ${filteredRecords.length} records as ${type.toUpperCase()}`, user?.email || 'System');
  };

  const handleDeleteRecord = async (id: string) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-in fade-in slide-in-from-top-4' : 'animate-out fade-out slide-out-to-top-4'
        } max-w-md w-full bg-white shadow-xl rounded-2xl pointer-events-auto flex flex-col border border-red-100 overflow-hidden`}
      >
        <div className="bg-red-50 p-4 border-b border-red-100 flex items-start gap-3">
          <AlertTriangle className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-bold">Delete Attendance Record</h3>
            <p className="text-red-600/80 text-sm mt-1">Are you sure you want to delete this record forever? This action cannot be reversed.</p>
          </div>
        </div>
        <div className="flex bg-gray-50/50 p-2 gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const loadingToast = toast.loading("Deleting record...");
              try {
                await apiRequest(`/api/attendance/${id}`, 'DELETE', undefined, user?.token);
                await logActivity('ATTENDANCE_DELETED', `Deleted attendance record ${id}`, user?.email || 'System');
                setRecords(prev => prev.filter(r => r._id !== id));
                toast.success("Record deleted", { id: loadingToast });
              } catch (err: any) {
                toast.error('Error deleting record: ' + err.message, { id: loadingToast });
              }
            }}
            className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm"
          >
            Delete Record
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handleDeleteAll = () => {
    if (filteredRecords.length === 0) return;
    
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-in fade-in slide-in-from-top-4' : 'animate-out fade-out slide-out-to-top-4'
        } max-w-md w-full bg-white dark:bg-slate-800 shadow-xl rounded-2xl pointer-events-auto flex flex-col border border-red-100 dark:border-red-900/50 overflow-hidden`}
      >
        <div className="bg-red-50 dark:bg-red-900/20 p-4 border-b border-red-100 dark:border-red-900/50 flex items-start gap-3">
          <AlertTriangle className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-800 dark:text-red-400 font-bold">Delete All Filtered Records</h3>
            <p className="text-red-600/80 dark:text-red-400/80 text-sm mt-1">Are you sure you want to delete {filteredRecords.length} record(s)? This action cannot be reversed.</p>
          </div>
        </div>
        <div className="flex bg-gray-50/50 dark:bg-slate-800/50 p-2 gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 text-sm font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const loadingToast = toast.loading(`Deleting ${filteredRecords.length} records...`);
              try {
                await Promise.all(filteredRecords.map(record => apiRequest(`/api/attendance/${record._id}`, 'DELETE', undefined, user?.token)));
                await logActivity('ATTENDANCE_DELETED', `Bulk deleted ${filteredRecords.length} attendance records`, user?.email || 'System');
                const deletedIds = new Set(filteredRecords.map(r => r._id));
                setRecords(prev => prev.filter(r => !deletedIds.has(r._id)));
                toast.success(`Successfully deleted ${filteredRecords.length} records`, { id: loadingToast });
              } catch (err: any) {
                toast.error('Error during bulk delete: ' + err.message, { id: loadingToast });
              }
            }}
            className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm"
          >
            Delete All
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  if (loading && records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        <p className="text-gray-500 dark:text-slate-400 font-medium">Loading attendance logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-slate-900/40 p-6 mt-14">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Attendance History</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">Track daily check-ins and work durations</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-xl border border-gray-200 dark:border-slate-600">
              <button 
                onClick={() => handleExport('csv')} 
                className="px-3 py-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-lg transition font-bold text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5"
              >
                CSV
              </button>
              <button 
                onClick={() => handleExport('excel')} 
                className="px-3 py-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-lg transition font-bold text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5"
              >
                Excel
              </button>
              <button 
                onClick={() => handleExport('pdf')} 
                className="px-3 py-1.5 bg-white dark:bg-slate-600 shadow-sm rounded-lg transition font-bold text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5"
              >
                PDF
              </button>
            </div>
            <button 
              onClick={handleDeleteAll} 
              disabled={filteredRecords.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition font-semibold text-sm border border-red-100 dark:border-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={18}/> Delete All
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full pl-9 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-lg text-sm" />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full pl-9 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-lg text-sm" />
          </div>
          <button 
            onClick={() => {setSearch(''); setDateFrom(''); setDateTo('');}} 
            className="bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-200 rounded-lg text-sm font-bold hover:bg-gray-300 dark:hover:bg-slate-500 transition h-10"
          >
            Clear All
          </button>
        </div>

        {/* Records Table (desktop) */}
        <div className="hidden md:block overflow-x-auto border border-gray-100 dark:border-slate-700 rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/60 text-gray-600 dark:text-slate-300 uppercase text-xs tracking-wider">
                <th className="text-left py-4 px-4 font-bold">Staff Member</th>
                <th className="text-left py-4 px-4 font-bold">Date</th>
                <th className="text-left py-4 px-4 font-bold">Check In</th>
                <th className="text-left py-4 px-4 font-bold">Check Out</th>
                <th className="text-left py-4 px-4 font-bold">Status/Duration</th>
                <th className="text-center py-4 px-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center text-gray-400">
                      <Search size={40} className="mb-2 opacity-20" />
                      <p>No attendance records found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-orange-50/30 dark:hover:bg-slate-700/40 transition-colors group">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                          <User size={16} />
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-slate-200">{record.staffName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600 dark:text-slate-400 font-medium">{record.date}</td>
                    <td className="py-4 px-4">
                      <div className="text-green-600 font-bold">{record.checkIn?.time || "--:--"}</div>
                      {record.checkIn?.location && (
                        <span className="flex items-center text-[10px] text-gray-400 mt-1">
                          <MapPin size={10} className="mr-1" /> GPS Verified
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {record.checkOut?.time === "Auto-Closed" ? (
                        <div className="text-orange-500 font-bold flex items-center gap-1 bg-orange-50 dark:bg-orange-900/20 w-fit px-2 py-1 rounded">
                          <AlertTriangle size={12} /> Auto-Closed
                        </div>
                      ) : (
                        <div className={record.checkOut?.time ? "text-red-600 font-bold" : "text-gray-400 dark:text-slate-500 italic"}>
                          {record.checkOut?.time || "Not Recorded"}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {record.checkOut?.time ? (
                        <div className="flex flex-col">
                           <span className="text-gray-900 dark:text-slate-200 font-bold">{calculateDuration(record.checkIn, record.checkOut)}</span>
                           <span className={`text-[10px] font-bold uppercase ${record.checkOut?.time === "Auto-Closed" ? "text-orange-500" : "text-green-500"}`}>
                             {record.checkOut?.time === "Auto-Closed" ? "System Auto" : "Completed"}
                           </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-blue-500">
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                          <span className="font-bold">On Duty</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button 
                        onClick={() => handleDeleteRecord(record._id)} 
                        className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile: condensed cards */}
        <div className="md:hidden space-y-3">
          {paginatedRecords.length === 0 ? (
            <div className="py-12 text-center">
              <div className="flex flex-col items-center text-gray-400">
                <Search size={40} className="mb-2 opacity-20" />
                <p>No attendance records found.</p>
              </div>
            </div>
          ) : (
            paginatedRecords.map((record) => (
              <div key={record.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-bold text-gray-800 dark:text-slate-200">{record.staffName}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">{record.staffId} • {record.date}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-black ${record.checkOutTime ? 'text-gray-900 dark:text-slate-200' : 'text-blue-500'}`}>{record.checkInTime || '--:--'}</div>
                    <div className="text-xs text-gray-400 mt-1">{record.checkOutTime || 'On Duty'}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-[11px] text-gray-500 dark:text-slate-400">{record.latitude ? <span className="inline-flex items-center gap-1"><MapPin size={12}/> GPS Verified</span> : <span>—</span>}</div>
                <div className="flex items-center gap-2">
                    <button onClick={() => handleDeleteRecord(record._id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
            <p className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-md transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}