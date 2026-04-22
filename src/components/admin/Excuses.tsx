import React, { useState, useEffect } from 'react';
import { useApi, apiRequest } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  Trash2,
  Search,
  Calendar,
  User,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Excuse {
  _id: string;
  staffId: string;
  staffName: string;
  date: string;
  reason: string;
  timestamp: string;
}

const Excuses: React.FC = () => {
  const { user } = useAuth();
  const { data: excusesData, loading, error, refresh } = useApi<Excuse[]>('/api/excuses');
  const [searchTerm, setSearchTerm] = useState('');
  const [excuses, setExcuses] = useState<Excuse[]>([]);

  useEffect(() => {
    if (excusesData) {
      setExcuses(excusesData);
    }
  }, [excusesData]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this excuse report?')) return;

    try {
      await apiRequest(`/api/excuses/${id}`, 'DELETE', null, user?.token);
      setExcuses(prev => prev.filter(e => e._id !== id));
      toast.success('Excuse report deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const filteredExcuses = excuses.filter(e =>
    e.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.staffId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredExcuses.length / itemsPerPage);
  const paginatedExcuses = filteredExcuses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading && excuses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <FileText className="text-orange-600" size={32} />
            ABSENCE EXCUSES
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1 uppercase text-[10px] tracking-widest font-black">Review staff absence reports and reasons.</p>
        </div>

        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-600 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search staff or reason..."
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all dark:text-white font-bold"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-4 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-400">
          <AlertCircle size={20} />
          <p className="font-bold">Error loading excuses: {error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-[0.5rem] border border-gray-100 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
                <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Staff Member</th>
                <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Date</th>
                <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reason / Excuse</th>
                <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {paginatedExcuses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <div className="flex flex-col items-center text-gray-400">
                      <Search size={40} className="mb-2 opacity-20" />
                      <p className="font-black uppercase tracking-widest text-[10px]">No excuse reports found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedExcuses.map((excuse) => (
                  <tr key={excuse._id} className="hover:bg-orange-50/30 dark:hover:bg-slate-700/40 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 dark:text-slate-200 uppercase text-sm">{excuse.staffName}</p>
                          <p className="text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-tighter">{excuse.staffId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-black text-gray-800 dark:text-slate-200 text-sm">{excuse.date}</span>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                          {new Date(excuse.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 max-w-md">
                      <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-xl border border-gray-100 dark:border-slate-700">
                        <p className="text-xs text-gray-700 dark:text-gray-300 font-medium italic leading-relaxed">
                          "{excuse.reason}"
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDelete(excuse._id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="Delete record"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden p-4 space-y-4">
          {paginatedExcuses.length === 0 ? (
            <div className="py-12 text-center text-gray-400 uppercase text-[10px] font-black tracking-widest">
              No excuse reports found.
            </div>
          ) : (
            paginatedExcuses.map((excuse) => (
              <div key={excuse._id} className="bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-4 border border-gray-100 dark:border-slate-600 space-y-3 relative">
                <button
                  onClick={() => handleDelete(excuse._id)}
                  className="absolute top-4 right-4 p-2 text-red-500"
                >
                  <Trash2 size={16} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 dark:text-slate-200 uppercase text-sm">{excuse.staffName}</p>
                    <p className="text-[10px] font-black text-gray-500 uppercase">{excuse.staffId} • {excuse.date}</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-600">
                  <p className="text-xs text-gray-700 dark:text-gray-300 font-medium italic italic">"{excuse.reason}"</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-6 border-t border-gray-100 dark:border-slate-700 bg-gray-50/30 dark:bg-slate-700/30">
            <p className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
};

export default Excuses;
