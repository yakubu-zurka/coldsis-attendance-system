import { useEffect, useState } from 'react';
import { useFirebaseRead } from '../../hooks/useFirebaseSync';
import { AttendanceRecord } from '../../types';
import { Loader2, TrendingUp, Users, Clock } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

type Stats = {
  totalRecords: number;
  totalStaff: number;
  uniqueStaffPresent: number;
  averageCheckInPerStaff: number;
  attendanceByDate: Record<string, number>;
  attendanceByStaff: Record<string, number>;
};

export function Analytics() {
  const { data: attendanceData, loading: attendanceLoading } = useFirebaseRead<Record<string, AttendanceRecord>>('attendance');
  const { data: staffData, loading: staffLoading } = useFirebaseRead<Record<string, any>>('staff');

  const [stats, setStats] = useState<Stats>({
    totalRecords: 0,
    totalStaff: 0,
    uniqueStaffPresent: 0,
    averageCheckInPerStaff: 0,
    attendanceByDate: {},
    attendanceByStaff: {},
  });

  useEffect(() => {
    if (!attendanceData || !staffData) return;

    const records = Object.values(attendanceData);
    const staffCount = Object.keys(staffData).length;
    const uniqueStaff = new Set(records.map(r => r.staffId));

    const byDate: Record<string, number> = {};
    const byStaff: Record<string, number> = {};

    records.forEach(record => {
      const date = record.checkInDate || 'Unknown';
      const staffName = record.staffName || 'Unknown';
      byDate[date] = (byDate[date] || 0) + 1;
      byStaff[staffName] = (byStaff[staffName] || 0) + 1;
    });

    setStats({
      totalRecords: records.length,
      totalStaff: staffCount,
      uniqueStaffPresent: uniqueStaff.size,
      averageCheckInPerStaff: uniqueStaff.size > 0 ? Number((records.length / uniqueStaff.size).toFixed(1)) : 0,
      attendanceByDate: byDate,
      attendanceByStaff: byStaff,
    });
  }, [attendanceData, staffData]);

  const topStaff = Object.entries(stats.attendanceByStaff)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const recentDays = Object.entries(stats.attendanceByDate)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7)
    .map(([date, count]) => ({ date, count }));

  if (attendanceLoading || staffLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-14">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
        <div className="bg-gray-200 rounded-lg shadow-md p-6 text-black relative">
          <p className="text-sm font-semibold opacity-80">Total Check-ins</p>
          <p className="text-4xl font-bold mt-2">{stats.totalRecords}</p>
          <Clock className="w-12 h-12 opacity-30 absolute right-4 top-4" />
        </div>
        <div className="bg-purple-200 rounded-lg shadow-md p-6 text-black relative">
          <p className="text-sm font-semibold opacity-80">Total Staff</p>
          <p className="text-4xl font-bold mt-2">{stats.totalStaff}</p>
          <Users className="w-12 h-12 opacity-30 absolute right-4 top-4" />
        </div>
        <div className="bg-blue-200 rounded-lg shadow-md p-6 text-black relative">
          <p className="text-sm font-semibold opacity-80">Present (Unique)</p>
          <p className="text-4xl font-bold mt-2">{stats.uniqueStaffPresent}</p>
          <TrendingUp className="w-12 h-12 opacity-30 absolute right-4 top-4" />
        </div>
        <div className="bg-orange-200 rounded-lg shadow-md p-6 text-black relative">
          <p className="text-sm font-semibold opacity-80">Avg Check-ins per Staff</p>
          <p className="text-4xl font-bold mt-2">{stats.averageCheckInPerStaff}</p>
          <TrendingUp className="w-12 h-12 opacity-30 absolute right-4 top-4" />
        </div>
      </div>

      {/* Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart for Recent Days */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Check-ins by Day (Last 7 Days)</h3>
          {recentDays.length === 0 ? (
            <p className="text-gray-500 text-sm">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={recentDays}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart for Top Staff */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Top 10 Most Present Staff</h3>
          {topStaff.length === 0 ? (
            <p className="text-gray-500 text-sm">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topStaff}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#f1bb8e" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}