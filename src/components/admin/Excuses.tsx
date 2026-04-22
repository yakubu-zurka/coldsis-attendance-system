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

  if (loading && excuses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <FileText className="text-blue-600" size={32} />
            ABSENCE EXCUSES
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Review staff absence reports and reasons.</p>
        </div>

        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search staff or reason..."
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-4 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-400">
          <AlertCircle size={20} />
          <p className="font-bold">Error loading excuses: {error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExcuses.length > 0 ? (
          filteredExcuses.map((excuse) => (
            <div 
              key={excuse._id}
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleDelete(excuse._id)}
                  className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{excuse.staffName}</h3>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{excuse.staffId}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 min-h-[80px]">
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed italic">
                    "{excuse.reason}"
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{excuse.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{new Date(excuse.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto text-gray-400">
              <FileText size={40} />
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 font-black uppercase tracking-[0.2em]">No excuses found</p>
              <p className="text-sm text-gray-400 mt-1">Staff reports will appear here once submitted.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Excuses;
