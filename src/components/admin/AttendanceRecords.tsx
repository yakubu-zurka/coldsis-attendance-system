import { useState, useEffect, useMemo } from 'react';
import { useFirebaseRead, firebaseDelete } from '../../hooks/useFirebaseSync';
import { Trash2, Search, MapPin, Download, Loader2, Calendar, User } from 'lucide-react';
import { exportToPDF } from '../../utils/export';

export function AttendanceRecords() {
  const { data: attendanceData, loading } = useFirebaseRead<Record<string, any>>('attendance');
  const [records, setRecords] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (attendanceData) {
      const recordsArray = Object.entries(attendanceData)
        .map(([id, record]) => ({ ...record, id }))
        .sort((a, b) => (b.checkInTimestamp || 0) - (a.checkInTimestamp || 0));
      setRecords(recordsArray);
    }
  }, [attendanceData]);

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

  const calculateDuration = (inTime?: number, outTime?: number) => {
    if (!inTime || !outTime) return null;
    const diff = outTime - inTime;
    if (diff < 0) return "0h 0m";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this attendance record?')) return;
    try {
      await firebaseDelete(`attendance/${id}`);
    } catch (err: any) {
      alert('Error deleting record: ' + err.message);
    }
  };

  if (loading && records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-500 font-medium">Loading attendance logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6 mt-14">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Attendance History</h2>
            <p className="text-sm text-gray-500">Track daily check-ins and work durations</p>
          </div>
          <button 
            onClick={() => exportToPDF(filteredRecords)} 
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-semibold text-sm border border-blue-100"
          >
            <Download size={18}/> PDF Report
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full pl-9 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full pl-9 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <button 
            onClick={() => {setSearch(''); setDateFrom(''); setDateTo('');}} 
            className="bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300 transition h-10"
          >
            Clear All
          </button>
        </div>

        {/* Records Table */}
        <div className="overflow-x-auto border border-gray-100 rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
                <th className="text-left py-4 px-4 font-bold">Staff Member</th>
                <th className="text-left py-4 px-4 font-bold">Date</th>
                <th className="text-left py-4 px-4 font-bold">Check In</th>
                <th className="text-left py-4 px-4 font-bold">Check Out</th>
                <th className="text-left py-4 px-4 font-bold">Status/Duration</th>
                <th className="text-center py-4 px-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center text-gray-400">
                      <Search size={40} className="mb-2 opacity-20" />
                      <p>No attendance records found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-blue-50/40 transition-colors group">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <User size={16} />
                        </div>
                        <span className="font-semibold text-gray-800">{record.staffName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600 font-medium">{record.date}</td>
                    <td className="py-4 px-4">
                      <div className="text-green-600 font-bold">{record.checkInTime || "--:--"}</div>
                      {record.latitude && (
                        <span className="flex items-center text-[10px] text-gray-400 mt-1">
                          <MapPin size={10} className="mr-1" /> GPS Verified
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className={record.checkOutTime ? "text-red-600 font-bold" : "text-gray-400 italic"}>
                        {record.checkOutTime || "Not Recorded"}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {record.checkOutTime ? (
                        <div className="flex flex-col">
                           <span className="text-gray-900 font-bold">{calculateDuration(record.checkInTimestamp, record.checkOutTimestamp)}</span>
                           <span className="text-[10px] text-green-500 font-bold uppercase">Completed</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-orange-500">
                          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                          <span className="font-bold">On Duty</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button 
                        onClick={() => handleDeleteRecord(record.id)} 
                        className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
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
      </div>
    </div>
  );
}