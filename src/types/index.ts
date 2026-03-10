import { User } from 'firebase/auth';

export interface StaffMember {
  id: string;        // Now represents your manual ID (e.g., COLD-001)
  name: string;
  email: string;
  telephone: string;
  role: string;
  department: string; // Added to match form data
  pinHash: string;    // Added for security validation
  createdAt: number;  // Added for record tracking
  updatedAt?: number;
}

export interface AttendanceRecord {
  // Primary key usually formatted as "staffId_date"
  id: string; 
  staffId: string;
  staffName: string;
  department: string; // Added to capture dept at time of check-in
  
  // Check-In Data
  checkInTime: string;      // e.g., "08:30 AM"
  checkInTimestamp: number; // raw ms for sorting
  latitude: number;
  longitude: number;
  
  // Check-Out Data (Optional until they sign out)
  checkOutTime?: string;
  checkOutTimestamp?: number;
  checkOutLat?: number;
  checkOutLng?: number;
  
  // Metadata
  date: string;             // e.g., "2024-05-20"
  distanceFromOffice: number;
  accuracy: number;
  status: "active" | "completed"; // "active" = checked in, "completed" = checked out
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