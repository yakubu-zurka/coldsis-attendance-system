import { User } from 'firebase/auth';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  telephone: string;
  role: string;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  checkInTime: number;
  checkInDate: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}
