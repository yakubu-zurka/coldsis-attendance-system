# Software Requirements Specification (SRS)

## COLDSiS GH Attendance Management System

---

**Version:** 1.0  
**Date:** January 2025  
**Project:** Staff Attendance Web Application  
**Organization:** COLDSiS GH  

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Functional Requirements](#3-functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [User Interface Requirements](#5-user-interface-requirements)
6. [Data Model](#6-data-model)
7. [Security Requirements](#7-security-requirements)
8. [Technical Stack](#8-technical-stack)
9. [Appendices](#9-appendices)

---

## 1. Introduction

### 1.1 Purpose

The purpose of this document is to provide a comprehensive specification for the **COLDSiS GH Attendance Management System**. This web-based application enables organizations to track staff attendance through a digital check-in system with geolocation verification, while providing administrators with tools to manage staff records, view attendance history, and analyze attendance patterns.

### 1.2 Scope

The system comprises:

- **Staff Check-In Portal**: A public-facing interface where employees can check in using their unique PIN and name
- **Admin Dashboard**: A protected administrative interface for managing staff, viewing records, and analyzing data
- **Backend Services**: Firebase Authentication and Realtime Database for secure data management

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|------------|
| **Admin** | Authorized personnel with access to the administrative dashboard |
| **Staff** | Employees who use the check-in system |
| **PIN** | Personal Identification Number (4-6 digits) used for staff authentication |
| **Check-In** | The process of recording attendance with timestamp and location |
| **Firebase** | Google Firebase platform providing authentication and database services |
| **Geolocation** | GPS coordinates captured during check-in |

---

## 2. System Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        COLDSiS Attendance System                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐           ┌──────────────────────────────────┐ │
│  │   Staff Users    │           │       Admin Users               │ │
│  │                  │           │                                  │ │
│  │  • Check-In UI   │           │  • Login Portal                 │ │
│  │  • PIN Entry     │           │  • Dashboard                    │ │
│  │  • Location      │           │  • Staff Management            │ │
│  │  • Search        │           │  • Attendance Records          │ │
│  │                  │           │  • Analytics                   │ │
│  └────────┬─────────┘           └───────────────┬──────────────────┘ │
│           │                                       │                   │
│           ▼                                       ▼                   │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Firebase Services                          │  │
│  │                                                               │  │
│  │  ┌─────────────────────┐    ┌─────────────────────────────┐  │  │
│  │  │  Firebase Auth      │    │  Firebase Realtime Database │  │  │
│  │  │  (Admin Login)      │    │  • staff/                    │  │  │
│  │  │                     │    │  • attendance/               │  │  │
│  │  └─────────────────────┘    └─────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 User Roles

| Role | Access Level | Description |
|------|--------------|-------------|
| **Staff Member** | Public | Can search name, enter PIN, and check in |
| **Administrator** | Protected | Full access to dashboard, staff management, analytics |
| **Anonymous** | Public (Limited) | Can only access check-in page |

### 2.3 Application Flow

#### Staff Check-In Flow
```
1. Staff opens check-in page
2. Staff searches for their name
3. Staff selects their name from dropdown
4. Staff enters 4-6 digit PIN
5. System captures device geolocation
6. System records attendance with timestamp and location
7. Success confirmation displayed
```

#### Admin Workflow
```
1. Admin navigates to admin login page
2. Admin enters credentials (email/password)
3. System validates via Firebase Authentication
4. Admin accesses dashboard with sidebar navigation
5. Admin can: manage staff, view records, export data, view analytics
```

---

## 3. Functional Requirements

### 3.1 Public Check-In Module (FR-01)

#### 3.1.1 Staff Search (FR-01-01)
- **Description**: Allow staff to search for their name from the staff directory
- **Requirements**:
  - Search input accepts partial name or staff ID
  - Results display in a scrollable dropdown list
  - Filtering is case-insensitive
  - Selecting a name populates the selection field

#### 3.1.2 PIN Authentication (FR-01-02)
- **Description**: Verify staff identity using a 4-6 digit PIN
- **Requirements**:
  - PIN input field masks characters for privacy
  - Minimum PIN length: 4 digits
  - Maximum PIN length: 6 digits
  - PIN is validated against stored hash in Firebase
  - Error message displayed for invalid PIN

#### 3.1.3 Geolocation Capture (FR-01-03)
- **Description**: Capture GPS coordinates during check-in
- **Requirements**:
  - Request location permission from browser
  - Capture latitude, longitude, and accuracy
  - Display loading state during location acquisition
  - Handle location errors gracefully
  - Record accuracy in meters

#### 3.1.4 Check-In Submission (FR-01-04)
- **Description**: Record attendance in the database
- **Requirements**:
  - Create attendance record with: staffId, staffName, timestamp, date, time, latitude, longitude, accuracy
  - Use device time for timestamp
  - Display success message after submission
  - Clear form after successful check-in

### 3.2 Admin Authentication Module (FR-02)

#### 2.2.1 Admin Login (FR-02-01)
- **Description**: Authenticate admin users
- **Requirements**:
  - Email and password authentication via Firebase Auth
  - Display error messages for invalid credentials
  - Loading state during authentication
  - Redirect to dashboard upon success

#### 2.2.2 Session Management (FR-02-02)
- **Description**: Manage admin session timeout
- **Requirements**:
  - Auto-logout after 5 minutes of inactivity
  - Warning notification at 4 minutes
  - Session timer resets on user activity (mouse move, keypress)

#### 2.2.3 Protected Routes (FR-02-03)
- **Description**: Restrict access to admin pages
- **Requirements**:
  - Unauthenticated users redirected to login
  - Authentication state persisted across page refreshes

### 3.3 Staff Management Module (FR-03)

#### 3.3.1 View Staff List (FR-03-01)
- **Description**: Display all registered staff members
- **Requirements**:
  - Table view with columns: Name, Email, Role, Phone
  - Responsive design (hide columns on smaller screens)
  - Search/filter functionality
  - Sortable by name (optional enhancement)

#### 3.3.2 Add New Staff (FR-03-02)
- **Description**: Register new staff members
- **Requirements**:
  - Form fields: Full Name, Email, Telephone, Role
  - Auto-generate 4-digit PIN
  - PIN hashed before storage (SHA-256)
  - Store PIN length (for future validation)
  - Display generated PIN once (not stored in plain text)
  - Validation: All fields required except PIN (pre-generated)

#### 3.3.3 Edit Staff (FR-03-03)
- **Description**: Modify existing staff information
- **Requirements**:
  - Pre-populate form with existing data
  - Update fields: Name, Email, Telephone, Role
  - PIN cannot be modified during edit
  - Update timestamp recorded

#### 3.3.4 Delete Staff (FR-03-04)
- **Description**: Remove staff from system
- **Requirements**:
  - Confirmation dialog before deletion
  - Permanent removal from database
  - Associated attendance records remain intact

### 3.4 Attendance Records Module (FR-04)

#### 3.4.1 View Attendance Records (FR-04-01)
- **Description**: Display historical attendance data
- **Requirements**:
  - Table with columns: Staff Name, Date, Time, Location, Accuracy
  - Most recent records displayed first
  - Pagination or virtual scrolling for large datasets

#### 3.4.2 Filter Records (FR-04-02)
- **Description**: Search and filter attendance data
- **Requirements**:
  - Text search by staff name or ID
  - Date range filter (From/To)
  - Clear filters button
  - Real-time filtering

#### 3.4.3 Export Data (FR-04-03)
- **Description**: Export attendance records to external formats
- **Requirements**:
  - CSV export
  - Excel export (.xlsx)
  - PDF export
  - Export filtered results only

#### 3.4.4 Delete Records (FR-04-04)
- **Description**: Remove individual or all attendance records
- **Requirements**:
  - Delete single record with confirmation
  - Bulk delete all records with strong confirmation

#### 3.4.5 View Location Details (FR-04-05)
- **Description**: Display check-in location information
- **Requirements**:
  - Toggle location details per record
  - Display latitude, longitude, accuracy
  - Link to Google Maps for visualization

### 3.5 Analytics Module (FR-05)

#### 3.5.1 Summary Statistics (FR-05-01)
- **Description**: Display key attendance metrics
- **Requirements**:
  - Total check-ins count
  - Total registered staff
  - Unique staff present
  - Average check-ins per staff

#### 3.5.2 Visual Charts (FR-05-02)
- **Description**: Graphical representation of attendance data
- **Requirements**:
  - Line chart: Check-ins by day (last 7 days)
  - Bar chart: Top 10 most present staff
  - Responsive chart sizing
  - Empty state handling

---

## 4. Non-Functional Requirements

### 4.1 Performance Requirements

| Metric | Requirement |
|--------|-------------|
| Page Load Time | < 3 seconds |
| Check-In Response | < 2 seconds |
| Database Read | < 500ms |
| Export Generation | < 5 seconds for 1000 records |

### 4.2 Availability Requirements

- System should be available 24/7
- Scheduled maintenance windows should be communicated
- Firebase provides 99.9% uptime SLA

### 4.3 Scalability Requirements

- Support at least 500 registered staff members
- Handle concurrent check-ins (up to 50 simultaneous)
- Database should handle 100,000+ attendance records

### 4.4 Compatibility Requirements

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

- Mobile-responsive design for check-in page
- Support for desktop and tablet admin usage

---

## 5. User Interface Requirements

### 5.1 Check-In Page UI

| Element | Specification |
|---------|---------------|
| Layout | Centered card on blue gradient background |
| Logo | RHEMA/COLDSiS logo centered at top |
| Title | "Staff Attendance" heading |
| Search Input | Full-width with search icon |
| Dropdown | Max-height 160px, scrollable |
| PIN Input | Password-masked, full-width |
| Button | "Check In" with MapPin icon |
| Success State | Green checkmark, staff name, date/time |
| Color Scheme | Blue (#1e3a8a) primary, white card |

### 5.2 Admin Dashboard UI

| Element | Specification |
|---------|---------------|
| Header | Fixed top, logo left, logout right |
| Sidebar | Fixed left, 256px width, collapsible on mobile |
| Navigation Tabs | Attendance Records, Staff Management, Analytics |
| Active Tab | Orange (#f97316) background |
| Content Area | White background, padding 24px |
| Tables | Striped rows, hover effect |
| Forms | Slide-in panel from right |

### 5.3 Admin Login UI

| Element | Specification |
|---------|---------------|
| Background | Animated orange gradient |
| Card | Centered, rounded corners, shadow |
| Logo | Centered within card |
| Inputs | Full-width with focus states |
| Button | Full-width, bold text |
| Error Display | Red border, error message below input |

### 5.4 Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | < 640px | Sidebar hidden, hamburger menu |
| Tablet | 640px - 1024px | Sidebar collapsible |
| Desktop | > 1024px | Sidebar always visible |

---

## 6. Data Model

### 6.1 Staff Collection

```
staff/
  {staffId}/
    name: string (required)
    email: string (required, unique)
    telephone: string (required)
    role: string (required)
    pinHash: string (required, SHA-256)
    pinLength: number (required)
    createdAt: number (timestamp)
    updatedAt: number (timestamp, optional)
```

### 6.2 Attendance Collection

```
attendance/
  {recordId}/
    staffId: string (required)
    staffName: string (required)
    checkInDate: string (required, YYYY-MM-DD format)
    checkInTime: number (timestamp)
    latitude: number (required)
    longitude: number (required)
    accuracy: number (required, in meters)
    timestamp: number (required, Unix timestamp)
```

### 6.3 Data Types

```typescript
interface StaffMember {
  id: string;
  name: string;
  email: string;
  telephone: string;
  role: string;
  pinHash?: string;
  pinLength?: number;
  createdAt?: number;
  updatedAt?: number;
}

interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  checkInDate: string;
  checkInTime: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}
```

---

## 7. Security Requirements

### 7.1 Authentication

| Requirement | Implementation |
|-------------|----------------|
| Admin Authentication | Firebase Auth with email/password |
| Session Timeout | 5 minutes inactivity auto-logout |
| Protected Routes | React Router with authentication guard |

### 7.2 Data Security

| Requirement | Implementation |
|-------------|----------------|
| PIN Storage | SHA-256 hashed before storage |
| Database Rules | Firebase Realtime Database rules |
| HTTPS | Enforced by hosting platform |

### 7.3 Input Validation

- All form fields validated client-side
- Email format validation
- PIN length validation (4-6 digits)
- Required field enforcement

### 7.4 Firebase Security Rules (Recommended)

```json
{
  "rules": {
    "staff": {
      ".read": "auth !== null",
      ".write": "auth !== null"
    },
    "attendance": {
      ".read": "auth !== null",
      ".write": "auth !== null",
      ".indexOn": ["staffId", "checkInDate"]
    }
  }
}
```

---

## 8. Technical Stack

### 8.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI Framework |
| TypeScript | 5.x | Type Safety |
| Vite | 5.x | Build Tool |
| Tailwind CSS | 3.x | Styling |
| React Router | 7.x | Routing |
| Recharts | 3.x | Charts |
| Lucide React | 0.46.x | Icons |

### 8.2 Backend Services

| Service | Provider | Purpose |
|---------|----------|---------|
| Firebase Auth | Google | Admin Authentication |
| Firebase Realtime Database | Google | Data Storage |

### 8.3 Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code Linting |
| TypeScript | Type Checking |
| PostCSS | CSS Processing |

---

## 9. Appendices

### 9.1 Project Structure

```
src/
├── components/
│   ├── AdminDashboard.tsx       # Main dashboard container
│   ├── AdminLogin.tsx           # Admin login page
│   ├── CheckIn.tsx              # Staff check-in page
│   ├── ProtectedRoute.tsx      # Auth guard component
│   └── admin/
│       ├── Analytics.tsx        # Analytics dashboard
│       ├── AttendanceRecords.tsx # Records management
│       ├── SessionTimeout.tsx  # Session warning modal
│       └── StaffManagement.tsx # Staff CRUD operations
├── context/
│   └── AuthContext.tsx         # Authentication context
├── hooks/
│   ├── useDeviceDateTime.ts   # Device time hook
│   ├── useFirebaseSync.ts     # Firebase operations
│   └── useGeolocation.ts      # Location hook
├── lib/
│   └── firebase.ts             # Firebase configuration
├── types/
│   └── index.ts                # TypeScript interfaces
├── utils/
│   ├── export.ts               # Export utilities
│   └── pin.ts                  # PIN generation/hashing
├── App.tsx                     # Main app component
├── main.tsx                    # Entry point
└── index.css                   # Global styles
```

### 9.2 API Endpoints (Firebase)

| Path | Operation | Description |
|------|-----------|-------------|
| /staff | GET | List all staff |
| /staff | POST | Create staff member |
| /staff/{id} | PUT | Update staff member |
| /staff/{id} | DELETE | Remove staff member |
| /attendance | GET | List all attendance records |
| /attendance | POST | Create attendance record |
| /attendance/{id} | DELETE | Delete attendance record |

### 9.3 Environment Variables

| Variable | Description |
|----------|-------------|
| VITE_FIREBASE_API_KEY | Firebase API Key |
| VITE_FIREBASE_AUTH_DOMAIN | Firebase Auth Domain |
| VITE_FIREBASE_PROJECT_ID | Firebase Project ID |
| VITE_FIREBASE_STORAGE_BUCKET | Firebase Storage Bucket |
| VITE_FIREBASE_MESSAGING_SENDER_ID | Firebase Messaging Sender ID |
| VITE_FIREBASE_APP_ID | Firebase App ID |

### 9.4 Browser Permissions Required

| Permission | Purpose |
|------------|---------|
| Geolocation | Capture GPS coordinates during check-in |
| Notification | Session timeout warnings (optional) |

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 2025 | Development Team | Initial SRS Document |

---

*End of Software Requirements Specification*

