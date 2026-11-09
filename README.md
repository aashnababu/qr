# MediFlow Core: QR-Based Patient Assistance & Nurse Calling System

A full-stack healthcare assistance module for the **MediFlow Core** Hospital E-Office platform.

This system enables hospitalized patients to scan a bedside QR code using any smartphone or hospital tablet to immediately call nurses or request targeted assistance (drinking water, help out of bed, general assistance, or custom requests) without relying solely on traditional buzzers. Central nurse stations receive live visual, audio, and timestamped queue alerts with one-tap status updates.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, React Router v6
- **Backend**: Node.js, Express.js, CORS, Dotenv
- **Database & ORM**: PostgreSQL (hosted on [Neon](https://neon.tech)), Prisma ORM (v5.22.0)
- **Architecture**: Modular REST API with fallback in-memory data store for instant offline development and testing.

---

## 📁 Repository Structure

```text
├── prisma/
│   ├── schema.prisma       # Database schema: Bed & PatientAssistanceRequest models
│   └── seed.js             # Seeding script with sample hospital rooms, beds & QR tokens
├── routes/
│   └── assistance.js       # Express Router implementing all 4 API endpoints
├── frontend/               # React + Vite + TypeScript application
│   ├── src/
│   │   ├── components/     # Navbar, SafetyNoticeBanner
│   │   ├── pages/
│   │   │   ├── PatientRequestPage.tsx     # Screens 1 & 2: Patient QR Landing & Request Page (/bed/:qrToken)
│   │   │   ├── RequestConfirmationView.tsx# Screen 3: Request Confirmation & Live Polling Status (/request/:id)
│   │   │   ├── NurseDashboardPage.tsx     # Screen 4: Live Nurse Call Station Dashboard (/nurse/dashboard)
│   │   │   └── QrDirectoryPage.tsx        # Bed QR Directory & Scan Simulator (/ and /qr-directory)
│   │   ├── services/
│   │   │   └── api.ts      # Typed API client for MediFlow Core endpoints
│   │   ├── types/
│   │   │   └── assistance.ts # TypeScript interfaces & RequestType config
│   │   ├── App.tsx         # Route definitions
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── db.js                   # Prisma database connector with in-memory dev fallback
├── server.js               # Express application entry point (port 5000)
├── test-router.js          # Automated endpoint unit test suite
├── package.json            # Backend scripts & dependencies
└── .env.example            # Sample environment variables for Neon PostgreSQL
```

---

## 🗄️ Database Schema (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum RequestType {
  NURSE_CALL
  DRINKING_WATER
  HELP_OUT_OF_BED
  GENERAL_ASSISTANCE
  OTHER
}

enum RequestStatus {
  PENDING
  IN_PROGRESS
  RESOLVED
}

model Bed {
  id         String   @id @default(uuid())
  roomNumber String
  bedNumber  String
  qrToken    String   @unique
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  requests PatientAssistanceRequest[]

  @@unique([roomNumber, bedNumber])
  @@index([qrToken])
}

model PatientAssistanceRequest {
  id             String         @id @default(uuid())
  bedId          String
  requestType    RequestType
  customNote     String?
  status         RequestStatus  @default(PENDING)
  submittedAt    DateTime       @default(now())
  acknowledgedAt DateTime?
  resolvedAt     DateTime?

  bed Bed @relation(fields: [bedId], references: [id], onDelete: Cascade)

  @@index([bedId])
  @@index([status])
  @@index([submittedAt])
}
```

---

## 📡 Backend API Endpoints (`routes/assistance.js`)

All endpoints are mounted under `/api/assistance`:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/assistance/bed/:qrToken` | Fetches bed location details using its unique QR token. |
| `POST` | `/api/assistance/request` | Creates a new assistance request for a bed (returns request with bed info). |
| `GET` | `/api/assistance/active` | Fetches active requests (`PENDING` or `IN_PROGRESS`), sorted by latest submission time (`submittedAt desc`). |
| `PATCH` | `/api/assistance/request/:id/status` | Updates request status (`IN_PROGRESS` records `acknowledgedAt`, `RESOLVED` records `resolvedAt`). |
| `GET` | `/api/assistance/request/:id` | Returns single request details for real-time status polling on patient view. |
| `GET` | `/api/assistance/beds` | Returns all registered beds (for QR directory / card generation). |

---

## 🖥️ Frontend Screens

### 1 & 2: Patient QR Landing & Request Page (`/bed/:qrToken`)
- **Dynamic Bed Identification**: Automatically decodes the QR token to display Room and Bed numbers.
- **Clear Assistance Action Cards**:
  - 🚨 **Nurse Call** (Urgent bedside nurse call)
  - 💧 **Drinking Water** (Water or beverage refill)
  - 🦽 **Help Out of Bed** (Standing, washroom, wheelchair transfer)
  - 🛎️ **General Assistance** (Blanket, pillow, lighting, room comfort)
  - 💬 **Other Assistance** (Custom inquiry with optional note)
- **Prominent Emergency Warning**: Dedicated critical safety banner clarifying that this is an auxiliary comfort system and acute life-threatening emergencies must use physical alarms / emergency cords.
- **Single-Tap Submission**: Instantly transitions patient to the confirmation tracking screen.

### 3: Request Confirmation View (`/request/:id`)
- Displays bed location, assistance category badge, and submission time.
- **Live Status Badge**:
  - `Pending Nurse Pickup` (Amber pulse)
  - `Nurse In Progress / En Route` (Sky blue badge)
  - `Resolved & Completed` (Emerald green badge)
- **Lifecycle Timeline**: Tracks timestamps for submitted, acknowledged, and resolved milestones.
- **Real-Time Polling**: Auto-syncs with server every 3.5 seconds to reflect nurse actions immediately.

### 4: Live Central Nurse Dashboard (`/nurse/dashboard`)
- **Real-Time Dispatch Queue**: Card grid of all active pending and in-progress patient calls.
- **Elapsed Response Timer**: Real-time counter showing elapsed response times with color coding:
  - 🟢 Normal: `< 5 minutes`
  - 🟡 Moderate attention: `5 - 15 minutes`
  - 🔴 Critical overdue: `> 15 minutes` (pulsing alert)
- **One-Tap Actions**:
  - **Acknowledge**: Sets status to `IN_PROGRESS` and stamps `acknowledgedAt`.
  - **Resolve**: Sets status to `RESOLVED` and stamps `resolvedAt`.
- **Audio Chime & Visual Banners**: Web Audio synthesizer alert when urgent nurse calls arrive.
- **Filtering & Search**: Filter by status (All, Pending, In Progress) or search by room number, bed, or note.

### Bed Directory & QR Simulator (`/qr-directory`)
- Visual display of all hospital beds with mock QR placards and one-tap test links.
- Interactive QR scan simulator for testing arbitrary tokens.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- (Optional) PostgreSQL database hosted on [Neon](https://neon.tech)

### 2. Environment Setup
Configure `.env` in the project root:
```env
PORT=5000
DATABASE_URL="postgresql://neondb_owner:<password>@<endpoint>.neon.tech/neondb?sslmode=require"
```
*(If `DATABASE_URL` is omitted or left as a placeholder, the system automatically uses its built-in in-memory store pre-populated with demo beds and requests so you can test immediately without credentials!)*

### 3. Database Migration & Seeding (Neon)
When connected to Neon PostgreSQL:
```bash
# Push schema to Neon
npx prisma db push

# Seed initial rooms and beds
npm run prisma:seed
```

### 4. Running the Backend Server
```bash
# Start backend server on port 5000
npm run dev
```

### 5. Running the Frontend (Vite)
In another terminal:
```bash
cd frontend
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Automated Testing
Run the backend endpoint test suite:
```bash
npm test
```
Outputs:
```text
Testing Assistance API route handlers directly...

1. GET /bed/:qrToken -> status: 200 Room: 101
2. POST /request -> status: 201 Created ID: ... Type: HELP_OUT_OF_BED
3. GET /active -> status: 200 Active count: 3
4. PATCH /request/:id/status (IN_PROGRESS) -> status: 200 AcknowledgedAt: ...
5. PATCH /request/:id/status (RESOLVED) -> status: 200 ResolvedAt: ...

✅ All route handlers tested and verified successfully!
```

