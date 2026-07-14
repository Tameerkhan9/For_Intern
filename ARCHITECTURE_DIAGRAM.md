# Intern Portal - System Architecture

## Complete System Overview

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                    │
│                            INTERN PORTAL FLOW                                      │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           ADMIN SIDE (Generate Codes)                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  Admin Terminal                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │ $ node admin-cli.js generate intern@example.com                               │  │
│  │                                                                               │  │
│  │ Generates:                                                                    │  │
│  │ • Random 16-character code: A3F2-B8K1-L9M4                                   │  │
│  │ • Expiration: 30 days from now                                               │  │
│  │ • Max uses: 1000 (effectively unlimited)                                     │  │
│  │                                                                               │  │
│  │ Saves to MongoDB:                                                             │  │
│  │ {                                                                              │  │
│  │   code: "A3F2-B8K1-L9M4",                                                    │  │
│  │   userId: ObjectId(...),                                                     │  │
│  │   expiresAt: Date(2026-05-30),                                               │  │
│  │   isActive: true                                                              │  │
│  │ }                                                                              │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                    ↓                                               │
│  Admin Sends Code Securely                                                         │
│  (Phone call, Encrypted email, Messenger, etc.)                                    │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              USER SIDE (Access)                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  Step 1: User Opens Portal                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │ User's Browser: http://localhost:3000                                        │  │
│  │                                                                               │  │
│  │ React App Loads                                                              │  │
│  │ └─ client/src/App.js                                                        │  │
│  │    └─ Checks: Is there an accessToken in localStorage?                      │  │
│  │       └─ NO → Show AccessGate component                                     │  │
│  │                                                                               │  │
│  │    ┌──────────────────────────────────────────────────────┐                │  │
│  │    │     🔐 SECRET PORTAL                                 │                │  │
│  │    │  Authorized Access Only                              │                │  │
│  │    │                                                      │                │  │
│  │    │  Enter Code: [A3F2-B8K1-L9M4________________]        │                │  │
│  │    │             Format: XXXX-XXXX-XXXX                  │                │  │
│  │    │                                                      │                │  │
│  │    │  [GRANT ACCESS]                                      │                │  │
│  │    │                                                      │                │  │
│  │    │  [? Info]                                            │                │  │
│  │    │                                                      │                │  │
│  │    └──────────────────────────────────────────────────────┘                │  │
│  │                                                                               │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                    ↓                                               │
│  Step 2: User Enters Code and Clicks "GRANT ACCESS"                               │
│                                                                                     │
│  JavaScript Code (client/src/components/AccessGate.js):                            │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │ axios.post('/api/access/verify-code', {                                    │  │
│  │   code: 'A3F2-B8K1-L9M4'                                                  │  │
│  │ })                                                                           │  │
│  │                                                                               │  │
│  │ Request Sent to Backend                                                     │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                    ↓ HTTP POST                                    │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND VERIFICATION (5 Steps)                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  Route: POST /api/access/verify-code                                              │
│  File: server/routes/access.js                                                     │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │ STEP 1: VERIFY CODE EXISTS                                                 │  │
│  │─────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                             │  │
│  │ AccessCode.findOne({ code: 'A3F2-B8K1-L9M4' })                           │  │
│  │                                                                             │  │
│  │ Result: Found ✓                                                             │  │
│  │ {                                                                           │  │
│  │   _id: ObjectId(...),                                                      │  │
│  │   code: 'A3F2-B8K1-L9M4',                                                 │  │
│  │   userId: ObjectId(...),                                                  │  │
│  │   expiresAt: Date(2026-05-30),                                             │  │
│  │   isActive: true,                                                          │  │
│  │   deviceFingerprint: null,  // First use                                   │  │
│  │   accessHistory: [],                                                       │  │
│  │   unauthorizedAttempts: []                                                 │  │
│  │ }                                                                           │  │
│  │                                                                             │  │
│  │ Continue ✓ (if NOT found → Reject ✗)                                       │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                    ↓                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │ STEP 2: CHECK IF EXPIRED                                                   │  │
│  │─────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                             │  │
│  │ if (accessCode.expiresAt < now) {                                          │  │
│  │   throw new Error('Code expired')                                          │  │
│  │ }                                                                           │  │
│  │                                                                             │  │
│  │ Check: 2026-05-30 < 2026-04-30 ? NO ✓                                     │  │
│  │                                                                             │  │
│  │ Continue ✓ (if expired → Reject ✗)                                         │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                    ↓                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │ STEP 3: GENERATE DEVICE FINGERPRINT                                        │  │
│  │─────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                             │  │
│  │ Get from Browser Request:                                                  │  │
│  │ • User-Agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."               │  │
│  │ • IP Address: 203.0.113.42                                                 │  │
│  │                                                                             │  │
│  │ Create Hash:                                                               │  │
│  │ fingerprint = SHA256(userAgent + ip)                                       │  │
│  │           = "7f8a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0"  │  │
│  │                                                                             │  │
│  │ Result: Unique identifier for this device                                  │  │
│  │                                                                             │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                    ↓                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │ STEP 4: COMPARE DEVICE FINGERPRINT (Device Lock Check)                     │  │
│  │─────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                             │  │
│  │ Current Fingerprint: 7f8a2b3c4d5e6f...                                     │  │
│  │ Stored Fingerprint:  null (First use)                                      │  │
│  │                                                                             │  │
│  │ BRANCH 1: First Use                                                         │  │
│  │ ┌──────────────────────────────────────────────────────────────────────┐   │  │
│  │ │ if (storedFingerprint === null) {                                   │   │  │
│  │ │   // LOCK THIS CODE TO THIS DEVICE                                  │   │  │
│  │ │   accessCode.deviceFingerprint = newFingerprint                     │   │  │
│  │ │   accessCode.save()                                                 │   │  │
│  │ │   continue ✓                                                        │   │  │
│  │ │ }                                                                   │   │  │
│  │ └──────────────────────────────────────────────────────────────────────┘   │  │
│  │                                                                             │  │
│  │ BRANCH 2: Subsequent Use                                                   │  │
│  │ ┌──────────────────────────────────────────────────────────────────────┐   │  │
│  │ │ if (storedFingerprint === newFingerprint) {                         │   │  │
│  │ │   // SAME DEVICE - ALLOW                                            │   │  │
│  │ │   continue ✓                                                        │   │  │
│  │ │ } else {                                                            │   │  │
│  │ │   // DIFFERENT DEVICE - BLOCK (Sharing Detected!)                  │   │  │
│  │ │   logUnauthorizedAttempt({                                          │   │  │
│  │ │     ip: req.ip,                                                     │   │  │
│  │ │     userAgent: req.headers['user-agent'],                           │   │  │
│  │ │     timestamp: now                                                  │   │  │
│  │ │   })                                                                │   │  │
│  │ │   throw new Error(                                                  │   │  │
│  │ │     'This code was accessed from a different device. ' +           │   │  │
│  │ │     'Access codes cannot be shared.'                               │   │  │
│  │ │   )                                                                 │   │  │
│  │ │ }                                                                   │   │  │
│  │ └──────────────────────────────────────────────────────────────────────┘   │  │
│  │                                                                             │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                    ↓                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │ STEP 5: CREATE SESSION & RETURN JWT TOKEN                                  │  │
│  │─────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                             │  │
│  │ if (all checks passed) {                                                   │  │
│  │   // Create JWT Token                                                      │  │
│  │   token = jwt.sign({                                                       │  │
│  │     codeId: accessCode._id,                                                │  │
│  │     userId: accessCode.userId,                                             │  │
│  │     fingerprint: fingerprint                                               │  │
│  │   }, JWT_SECRET, { expiresIn: '7d' })                                     │  │
│  │                                                                             │  │
│  │   // Increment usage                                                       │  │
│  │   accessCode.uses++                                                        │  │
│  │   accessCode.lastUsedAt = now                                              │  │
│  │                                                                             │  │
│  │   // Log access                                                            │  │
│  │   accessCode.accessHistory.push({                                          │  │
│  │     ip: req.ip,                                                            │  │
│  │     userAgent: req.headers['user-agent'],                                  │  │
│  │     timestamp: now                                                         │  │
│  │   })                                                                       │  │
│  │                                                                             │  │
│  │   accessCode.save()                                                        │  │
│  │                                                                             │  │
│  │   // Return to frontend                                                    │  │
│  │   return {                                                                 │  │
│  │     success: true,                                                        │  │
│  │     token: token,                                                         │  │
│  │     message: 'Access granted'                                             │  │
│  │   }                                                                        │  │
│  │ }                                                                           │  │
│  │                                                                             │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                    ↓ HTTP 200                                    │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND RECEIVES TOKEN                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  Response from Backend:                                                            │
│  {                                                                                  │
│    success: true,                                                                  │
│    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",                              │
│    message: "Access granted"                                                       │
│  }                                                                                  │
│                                                                                     │
│  React Code (client/src/components/AccessGate.js):                                 │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │ // Store token in browser storage                                           │  │
│  │ localStorage.setItem('accessToken', response.data.token)                    │  │
│  │                                                                               │  │
│  │ // Call callback                                                             │  │
│  │ props.onAccessGranted()                                                     │  │
│  │                                                                               │  │
│  │ // React re-renders App.js                                                  │  │
│  │ // AccessGate component hides ✓                                             │  │
│  │ // Full portal visible ✓                                                    │  │
│  │                                                                               │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                    ↓                                               │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                               │  │
│  │  ✓ PORTAL UNLOCKED                                                           │  │
│  │                                                                               │  │
│  │  User can now:                                                               │  │
│  │  • Browse secret jobs                                                        │  │
│  │  • Apply for positions                                                       │  │
│  │  • Upload CV                                                                 │  │
│  │  • Edit profile                                                              │  │
│  │  • View applications                                                         │  │
│  │  • Access dashboard                                                          │  │
│  │                                                                               │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│              SCENARIO: CODE SHARING PREVENTION (Anti-Sharing Detection)              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  Day 1: User A uses code on Device 1                                               │
│  ─────────────────────────────────────                                              │
│                                                                                     │
│  Device: Laptop                                                                    │
│  User-Agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"                           │
│  IP: 203.0.113.42                                                                  │
│  Fingerprint: 7f8a2b3c4d5e6f7a8b9c0d1e2f3a4b5c                                     │
│                                                                                     │
│  Backend:                                                                          │
│  • Verifies code ✓                                                                 │
│  • Checks not expired ✓                                                            │
│  • Creates fingerprint ✓                                                           │
│  • Database: deviceFingerprint = 7f8a2b3c... (LOCKED)                             │
│  • Creates JWT token ✓                                                             │
│  • Logs: accessHistory += { ip: 203.0.113.42, timestamp }                         │
│  • Returns: { success: true, token: "..." } ✓                                      │
│                                                                                     │
│  Result: Access granted ✓                                                          │
│                                                                                     │
│  ─────────────────────────────────────────────────────────────────────────────────│  │
│                                                                                     │
│  Day 2: User A's friend (User B) tries code on Device 2                            │
│  ─────────────────────────────────────────────────────────────                     │
│                                                                                     │
│  Device: Smartphone                                                                │
│  User-Agent: "Mozilla/5.0 (Linux; Android 13)"                                    │
│  IP: 203.0.113.99  ← DIFFERENT IP                                                 │
│  Fingerprint: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6  ← DIFFERENT                       │
│                                                                                     │
│  Backend:                                                                          │
│  • Verifies code ✓                                                                 │
│  • Checks not expired ✓                                                            │
│  • Creates fingerprint ✗                                                          │
│  • Compares:                                                                       │
│    - Stored: 7f8a2b3c... (Device 1)                                               │
│    - Current: a1b2c3d4... (Device 2)                                              │
│    - MISMATCH! ✗✗✗                                                                │
│  • Logs unauthorized attempt:                                                     │
│    unauthorizedAttempts += {                                                      │
│      ip: 203.0.113.99,                                                            │
│      userAgent: "Mozilla/5.0 (Linux; Android 13)",                                │
│      timestamp: 2026-05-01 14:32:00                                               │
│    }                                                                               │
│  • Returns: {                                                                      │
│    success: false,                                                                │
│    error: "This code was accessed from a different device.                        │
│             Access codes cannot be shared."                                       │
│  }  ✗                                                                              │
│                                                                                     │
│  Frontend:                                                                         │
│  • Shows error message to User B ✗                                                 │
│  • No token created ✗                                                              │
│  • No access granted ✗                                                             │
│                                                                                     │
│  Admin View (run: node admin-cli.js status A3F2-B8K1-L9M4):                       │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │ ACCESS CODE STATUS                                                           │  │
│  │ ──────────────────────────────────────────────────────────────────────────   │  │
│  │                                                                               │  │
│  │ Code: A3F2-B8K1-L9M4                                                         │  │
│  │ User: John Doe (intern@example.com)                                           │  │
│  │ Status: ✓ ACTIVE                                                             │  │
│  │ Uses: 1/1000                                                                 │  │
│  │                                                                               │  │
│  │ ⚠ UNAUTHORIZED ATTEMPTS: 1                                                   │  │
│  │    1. IP: 203.0.113.99                                                       │  │
│  │       Device: Android Smartphone                                             │  │
│  │       2026-05-01 14:32:00                                                    │  │
│  │       MESSAGE: Attempted access from different device                       │  │
│  │                                                                               │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                     │
│  Result: Code sharing PREVENTED ✓                                                  │
│          Violation LOGGED ✓                                                        │
│          Admin NOTIFIED ✓                                                          │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        DATABASE COLLECTION VIEW                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  After User A used code and User B tried to share it:                              │
│                                                                                     │
│  db.accesscodes.findOne({ code: 'A3F2-B8K1-L9M4' })                              │
│                                                                                     │
│  {                                                                                  │
│    "_id": ObjectId("66666666666666666666666"),                                     │
│    "code": "A3F2-B8K1-L9M4",                                                       │
│    "userId": ObjectId("user_123"),                                                 │
│    "deviceFingerprint": "7f8a2b3c4d5e6f7a8b9c0d1e2f3a4b5c",  ← LOCKED             │
│    "uses": 1,                                                                      │
│    "maxUses": 1000,                                                                │
│    "lastUsedAt": ISODate("2026-05-01T10:00:00Z"),                                 │
│    "expiresAt": ISODate("2026-05-30T00:00:00Z"),                                  │
│    "isActive": true,                                                               │
│    "createdAt": ISODate("2026-04-30T08:00:00Z"),                                  │
│    "updatedAt": ISODate("2026-05-01T14:32:00Z"),                                  │
│                                                                                     │
│    "accessHistory": [                                                              │
│      {                                                                             │
│        "_id": ObjectId("..."),                                                     │
│        "ip": "203.0.113.42",                                                       │
│        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",                  │
│        "timestamp": ISODate("2026-05-01T10:00:00Z")                               │
│      }                                                                             │
│    ],                                                                              │
│                                                                                     │
│    "unauthorizedAttempts": [  ← SHARING DETECTED!                                 │
│      {                                                                             │
│        "_id": ObjectId("..."),                                                     │
│        "ip": "203.0.113.99",  ← DIFFERENT IP                                      │
│        "userAgent": "Mozilla/5.0 (Linux; Android 13)",                            │
│        "timestamp": ISODate("2026-05-01T14:32:00Z"),                              │
│        "reason": "Device fingerprint mismatch"                                    │
│      }                                                                             │
│    ]                                                                               │
│  }                                                                                  │
│                                                                                     │
│  Admin Alerts:                                                                     │
│  ⚠️ Code sharing detected for A3F2-B8K1-L9M4                                       │
│  📍 Original device: 203.0.113.42                                                  │
│  📍 Attempted device: 203.0.113.99                                                 │
│  ⏰ Violation time: 2026-05-01 14:32:00                                            │
│  🔐 Recommend: Revoke code if non-authorized user                                  │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           ADMIN COMMANDS FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  Generate Code                                                                     │
│  $ node admin-cli.js generate user@email.com                                       │
│  → Creates new code in MongoDB                                                     │
│  → Displays to admin                                                               │
│  → Admin sends to user securely                                                    │
│                                                                                     │
│  List Codes                                                                        │
│  $ node admin-cli.js list                                                          │
│  → Queries all active codes                                                        │
│  → Shows usage stats for each                                                      │
│  → Admin reviews activity                                                          │
│                                                                                     │
│  Check Status                                                                      │
│  $ node admin-cli.js status A3F2-B8K1-L9M4                                        │
│  → Shows complete code info                                                        │
│  → Displays access history                                                         │
│  → Shows unauthorized attempts                                                     │
│  → Helps admin verify security                                                     │
│                                                                                     │
│  Revoke Code                                                                       │
│  $ node admin-cli.js revoke A3F2-B8K1-L9M4                                        │
│  → Sets isActive = false                                                           │
│  → Code no longer works                                                            │
│  → User must get new code                                                          │
│  → Prevents unauthorized access                                                    │
│                                                                                     │
│  Check User                                                                        │
│  $ node admin-cli.js check-user user@email.com                                     │
│  → Finds user in database                                                          │
│  → Shows all codes assigned                                                        │
│  → Shows code status for each                                                      │
│  → Admin audits user activity                                                      │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Component Relationships

```
CLIENT (React Frontend)
├── App.js
│   ├── [Checks: hasAccess?]
│   ├── YES → Show full portal
│   └── NO → Show AccessGate component
│
├── AccessGate.js (Login screen)
│   ├── [Input field for code]
│   ├── [Submit button]
│   ├── [Error messages]
│   └── [Calls: POST /api/access/verify-code]
│
└── AccessGate.css
    └── [Styling for access gate UI]

────────────────────────────────────────────────────────

SERVER (Node/Express Backend)
├── server.js
│   └── [Mounts routes including access routes]
│
├── routes/access.js
│   ├── POST /verify-code
│   │   ├── Query AccessCode from MongoDB
│   │   ├── Check expiration
│   │   ├── Generate fingerprint
│   │   ├── Compare fingerprint (device lock)
│   │   ├── Log access or unauthorized attempt
│   │   └── Return JWT token or error
│   │
│   ├── GET /verify-session
│   │   └── Validate existing JWT token
│   │
│   ├── POST /generate-code (Admin)
│   │   ├── Verify admin permissions
│   │   ├── Generate random code
│   │   └── Save to MongoDB
│   │
│   ├── GET /status/:codeId (Admin)
│   │   ├── Fetch code details
│   │   └── Return full history
│   │
│   └── PUT /revoke/:codeId (Admin)
│       ├── Update isActive = false
│       └── Block all future uses
│
└── models/AccessCode.js
    └── [MongoDB schema with all fields]

────────────────────────────────────────────────────────

DATABASE (MongoDB)
└── accesscodes collection
    └── Documents:
        {
          code: String (unique)
          userId: ObjectId reference
          deviceFingerprint: String (SHA256 hash)
          uses: Number
          accessHistory: Array
          unauthorizedAttempts: Array
          expiresAt: Date (TTL index)
          isActive: Boolean
          ...more fields
        }

────────────────────────────────────────────────────────

ADMIN CLI
└── admin-cli.js
    ├── generate <email> [days]
    ├── list
    ├── status <code>
    ├── revoke <code>
    ├── check-user <email>
    └── help
```

## Security Flow Summary

```
┌──────────────────────────────────────────────────────────┐
│   THREAT: Code Sharing Attack                            │
│   "I'll share my code with my friend"                    │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│   DEFENSE 1: Device Fingerprinting                       │
│   Code locked to original device on first use            │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│   DEFENSE 2: Fingerprint Comparison                      │
│   Different device = fingerprint mismatch = BLOCK        │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│   DEFENSE 3: Unauthorized Logging                        │
│   Attempted sharing logged in database                   │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│   DEFENSE 4: Admin Visibility                            │
│   Admin sees all sharing attempts via CLI                │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│   RESULT: Code sharing is IMPOSSIBLE                     │
│   ✓ Code locked to device                               │
│   ✓ Sharing attempt blocked                              │
│   ✓ Violation logged                                     │
│   ✓ Admin can take action                                │
└──────────────────────────────────────────────────────────┘
```

This is your **military-grade access control system**! 🔐
