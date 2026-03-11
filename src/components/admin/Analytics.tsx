import { useMemo } from 'react';
import { useFirebaseRead } from '../../hooks/useFirebaseSync';
import { useDeviceDateTime } from '../../hooks/useDeviceDateTime';
import { AttendanceRecord } from '../../types';
import {
  Loader2, UserCheck, UserX, Users, Briefcase, GraduationCap, BadgeCheck,
  TrendingUp, CalendarDays
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

// Determine staff category from ID prefix
function getCategory(id: string): 'Staff' | 'Intern' | 'NSS' | 'Unknown' {
  const prefix = id?.toUpperCase() || '';
  if (prefix.startsWith('COLD')) return 'Staff';
  if (prefix.startsWith('INT')) return 'Intern';
  if (prefix.startsWith('NSS')) return 'NSS';
  return 'Unknown';
}

const CATEGORY_COLORS: Record<string, string> = {
  Staff: '#ea580c',
  Intern: '#7c3aed',
  NSS: '#0891b2',
  Unknown: '#94a3b8',
};

const CATEGORY_ICONS: Record<string, any> = {
  Staff: Briefcase,
  Intern: GraduationCap,
  NSS: BadgeCheck,
};

export function Analytics() {
  const { getDateTime } = useDeviceDateTime();
  const { data: attendanceData, loading: attendanceLoading } = useFirebaseRead<Record<string, AttendanceRecord>>('attendance');
  const { data: staffData, loading: staffLoading } = useFirebaseRead<Record<string, any>>('staff');

  const today = getDateTime().date;

  const analytics = useMemo(() => {
    if (!attendanceData || !staffData) {
      return null;
    }

    const allStaff = Object.entries(staffData).map(([id, member]) => ({
      ...member,
      id,
      category: getCategory(id),
    }));

    // Today's check-ins
    const todaysRecords = Object.values(attendanceData).filter(
      (r: any) => r.date === today
    );
    const todaysPresentIds = new Set(todaysRecords.map((r: any) => r.staffId));

    // Break down by category
    const categories = ['Staff', 'Intern', 'NSS'];
    const breakdown = categories.map(cat => {
      const members = allStaff.filter(s => s.category === cat);
      const present = members.filter(s => todaysPresentIds.has(s.id));
      const absent = members.filter(s => !todaysPresentIds.has(s.id));
      return {
        category: cat,
        total: members.length,
        present: present.length,
        absent: absent.length,
        presentMembers: present,
        absentMembers: absent,
      };
    });

    const totalPresent = breakdown.reduce((s, b) => s + b.present, 0);
    const totalAbsent = breakdown.reduce((s, b) => s + b.absent, 0);
    const totalStaff = allStaff.length;

    // Last 7 days trend
    const last7Days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayRecords = Object.values(attendanceData).filter((r: any) => r.date === dateStr);
      const uniqueOnDay = new Set(dayRecords.map((r: any) => r.staffId)).size;
      last7Days.push({ date: dateStr.slice(5), count: uniqueOnDay }); // MM-DD
    }

    // Top 7 most-present staff (all-time)
    const allTimeByStaff: Record<string, { name: string; count: number; category: string }> = {};
    Object.values(attendanceData).forEach((r: any) => {
      if (!allTimeByStaff[r.staffId]) {
        allTimeByStaff[r.staffId] = { name: r.staffName || r.staffId, count: 0, category: getCategory(r.staffId) };
      }
      allTimeByStaff[r.staffId].count++;
    });
    const topStaff = Object.values(allTimeByStaff).sort((a, b) => b.count - a.count).slice(0, 7);

    return { breakdown, totalPresent, totalAbsent, totalStaff, last7Days, topStaff };
  }, [attendanceData, staffData, today]);

  if (attendanceLoading || staffLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm font-bold uppercase tracking-widest">
        No data available yet
      </div>
    );
  }

  const { breakdown, totalPresent, totalAbsent, totalStaff, last7Days, topStaff } = analytics;
  const attendanceRate = totalStaff > 0 ? Math.round((totalPresent / totalStaff) * 100) : 0;

  return (
    <div className="space-y-6 mt-14">

      {/* — TODAY'S HEADER — */}
      <div className="flex items-center gap-3 mb-1">
        <CalendarDays className="w-5 h-5 text-orange-600" />
        <div>
          <h2 className="font-black text-xl text-slate-800 dark:text-white uppercase tracking-tight">Today's Overview</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{today}</p>
        </div>
      </div>

      {/* — TOP SUMMARY CARDS — */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Personnel</p>
          <p className="text-4xl font-black text-slate-800 dark:text-white mt-1">{totalStaff}</p>
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 absolute right-3 top-3" />
        </div>
        <div className="bg-green-100 dark:bg-green-900/30 rounded-2xl p-5 relative overflow-hidden">
          <p className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">Present Today</p>
          <p className="text-4xl font-black text-green-700 dark:text-green-400 mt-1">{totalPresent}</p>
          <UserCheck className="w-12 h-12 text-green-200 dark:text-green-900 absolute right-3 top-3" />
        </div>
        <div className="bg-red-100 dark:bg-red-900/30 rounded-2xl p-5 relative overflow-hidden">
          <p className="text-[10px] font-black text-red-500 dark:text-red-400 uppercase tracking-widest">Absent Today</p>
          <p className="text-4xl font-black text-red-600 dark:text-red-400 mt-1">{totalAbsent}</p>
          <UserX className="w-12 h-12 text-red-200 dark:text-red-900 absolute right-3 top-3" />
        </div>
        <div className="bg-orange-100 dark:bg-orange-900/30 rounded-2xl p-5 relative overflow-hidden">
          <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">Attendance Rate</p>
          <p className="text-4xl font-black text-orange-700 dark:text-orange-400 mt-1">{attendanceRate}%</p>
          <TrendingUp className="w-12 h-12 text-orange-200 dark:text-orange-900 absolute right-3 top-3" />
        </div>
      </div>

      {/* — CATEGORY BREAKDOWN (Staff / Intern / NSS) — */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {breakdown.map(({ category, total, present, absent }) => {
          const Icon = CATEGORY_ICONS[category] || Users;
          const color = CATEGORY_COLORS[category];
          const rate = total > 0 ? Math.round((present / total) * 100) : 0;
          return (
            <div
              key={category}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-5"
              style={{ borderLeft: `4px solid ${color}` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-xl" style={{ background: `${color}15` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <span className="font-black text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">{category}</span>
                <span className="ml-auto text-[10px] font-black uppercase tracking-widest" style={{ color }}>{rate}%</span>
              </div>

              <div className="flex justify-between mb-3">
                <div>
                  <p className="text-[9px] font-black text-green-500 uppercase tracking-widest">Present</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white">{present}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">Absent</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white">{absent}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white">{total}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ width: `${rate}%`, background: color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* — CHARTS — */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7-Day Trend */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h3 className="font-black text-sm uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">Attendance Trend (7 Days)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, fontSize: 12, fontWeight: 700, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              />
              <Line type="monotone" dataKey="count" stroke="#ea580c" strokeWidth={3} dot={{ r: 4, fill: '#ea580c' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Most Present Staff */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h3 className="font-black text-sm uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">Most Present (All-Time)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topStaff} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fontWeight: 700 }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, fontSize: 12, fontWeight: 700, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {topStaff.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category] || '#ea580c'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-end mt-3">
            {['Staff', 'Intern', 'NSS'].map(cat => (
              <div key={cat} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: CATEGORY_COLORS[cat] }} />
                <span className="text-[10px] font-black text-slate-400 uppercase">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}