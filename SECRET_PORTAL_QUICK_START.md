# 🔐 Secret Agency Portal - Quick Start

## What You Just Built

A **military-grade access portal** where each user gets a unique, non-transferable access code. Perfect for:
- Secret agencies
- Government contractors
- Classified projects
- Private partnerships
- Restricted access networks

---

## How It Works (Visual)

```
NECOP SECRET PORTAL FLOW
═══════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│                   ADMIN GENERATES CODES                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Admin CLI: node admin-cli.js generate agent@necop.pk        │
│                                                               │
│  ↓ Generates Unique Code: A3F2-B8K1-L9M4                     │
│  ↓ Sends to Agent Securely                                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  USER VISITS PORTAL                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  User opens: https://necop-portal.com                        │
│                                                               │
│  ┌───────────────────────────────────────┐                  │
│  │   🔐 SECRET PORTAL                    │                  │
│  │   Authorized Access Only              │                  │
│  │                                       │                  │
│  │   Enter Code: [A3F2-B8K1-L9M4]  │                  │
│  │                                       │                  │
│  │   [GRANT ACCESS]                      │                  │
│  └───────────────────────────────────────┘                  │
│                                                               │
│  ↓ Submits Code + Device Info                               │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              BACKEND VERIFICATION                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Verify Code Exists                                       │
│     ✓ Code found in database                                 │
│                                                               │
│  2. Check Expiration                                         │
│     ✓ Code not expired                                       │
│                                                               │
│  3. Generate Device Fingerprint                              │
│     Device ID = MD5(User-Agent + IP Address)                │
│     Example: 7f8a2b3c4d5e6f7a8b9c0d1e2f3a4b5c              │
│                                                               │
│  4. Check Device Lock                                        │
│     First use: LOCK to this device                           │
│     Next use: Must match same fingerprint                    │
│     ✓ Device match → Access granted                         │
│     ✗ Device mismatch → Access denied + logged              │
│                                                               │
│  5. Create Session                                           │
│     Generate JWT token                                       │
│     Return to user                                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              ANTI-SHARING PROTECTION                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Agent uses code on his laptop                               │
│    ✓ Device fingerprint created                             │
│    ✓ Access granted                                         │
│                                                               │
│  Agent's friend tries same code on different device         │
│    ✗ Device fingerprint doesn't match                       │
│    ✗ Access BLOCKED                                         │
│    ✗ Unauthorized attempt LOGGED                           │
│    Message: "This code was accessed from a different        │
│              device. Access codes cannot be shared."        │
│                                                               │
│  Admin sees in logs:                                         │
│    - Original device: 203.0.113.42                          │
│    - Attempted device: 203.0.113.99                         │
│    - Timestamp: 2026-04-30 14:32:00                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  PORTAL UNLOCKED                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ✓ Access Verified                                           │
│  ✓ Session Created                                           │
│  ✓ Redirected to Portal                                      │
│                                                               │
│  Agent can now:                                              │
│  • Browse secret jobs                                        │
│  • Apply for positions                                       │
│  • Upload CV (parsed for skills)                             │
│  • Track applications                                        │
│                                                               │
│  All activity logged with:                                   │
│  • Timestamp                                                 │
│  • IP Address                                                │
│  • Device fingerprint                                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start Commands

### Step 1: Generate Access Codes

Open terminal in `e:\Necop_MERN\server`:

```bash
# Generate code for one user (30 days)
node admin-cli.js generate agent@necop.pk

# Generate with custom expiration (60 days)
node admin-cli.js generate agent@necop.pk 60

# Output:
# ✓ Access Code Generated Successfully
# ───────────────────────────────────────
# User: John Doe (agent@necop.pk)
# Code: A3F2-B8K1-L9M4
# Expires: May 30, 2026
# Days: 30
# ───────────────────────────────────────
```

### Step 2: Send Code to User

Send privately via:
- Encrypted email
- Phone call
- Secure messaging app
- In-person

**DO NOT** send in plain email or Slack!

### Step 3: User Enters Portal

User visits: `http://localhost:3000`

Portal shows:
```
🔐 SECRET PORTAL
Authorized Access Only

Enter Code: [__________________]
            [GRANT ACCESS]
```

User enters code: `A3F2-B8K1-L9M4`

### Step 4: Device Locked

System automatically:
1. ✓ Verifies code
2. ✓ Creates device fingerprint
3. ✓ Locks code to this device
4. ✓ Creates session
5. ✓ Logs access attempt

### Step 5: Code Can't Be Shared

Friend tries code on different computer:

```
✗ "This code was accessed from a different device.
   Access codes cannot be shared."
   [Access Blocked]
```

---

## Admin Commands

### List Active Codes
```bash
node admin-cli.js list
```

Output:
```
╔════════════════════════════════════════════════════════════════════════════╗
║ ACTIVE ACCESS CODES                                                         ║
╚════════════════════════════════════════════════════════════════════════════╝

1. ✓ A3F2-B8K1-L9M4
   User: John Doe (agent@necop.pk)
   Uses: 15/1000
   Expires: May 30, 2026
   Created: April 30, 2026
```

### Check Code Status
```bash
node admin-cli.js status A3F2-B8K1-L9M4
```

Shows:
- User info
- Usage count
- Last used date
- Device fingerprint status
- Access history
- Unauthorized attempts

### Revoke a Code (Emergency Block)
```bash
node admin-cli.js revoke A3F2-B8K1-L9M4
```

Code immediately stops working.

### Find User
```bash
node admin-cli.js check-user agent@necop.pk
```

Shows all codes assigned to user.

---

## Security Features

### ✓ Device Fingerprinting
- Code locked to first device
- Cannot be used from another device
- Prevents code sharing

### ✓ IP Tracking
- All access logged with IP address
- Suspicious IPs flagged
- Admin can see access pattern

### ✓ Anti-Sharing Detection
- Different device = instant block
- Unauthorized attempts logged
- Message warns about sharing

### ✓ Expiration Management
- Codes expire on set date
- Auto-cleanup in database
- Can be manually revoked

### ✓ Usage Monitoring
- Track how many times used
- Last access timestamp
- Complete access history

### ✓ Session Management
- JWT tokens created per session
- Sessions expire automatically
- Users can logout manually

---

## Database Structure

Each code stores:

```
AccessCode {
  code: "A3F2-B8K1-L9M4"                    // Unique code
  userId: ObjectId("user_id")               // Who gets it
  deviceFingerprint: "7f8a2b3c..."          // Locked device
  uses: 15                                  // Usage count
  maxUses: 1000                             // Limit (unreachable)
  expiresAt: Date("2026-05-30")             // Expiration
  isActive: true                            // Status
  
  accessHistory: [                          // All accesses
    { ip: "203.0.113.42", timestamp: ... }
  ]
  
  unauthorizedAttempts: [                   // Sharing attempts
    { ip: "203.0.113.99", timestamp: ... }
  ]
}
```

---

## Production Checklist

- [ ] MongoDB backups configured
- [ ] HTTPS enabled (not HTTP)
- [ ] JWT secrets changed in `.env`
- [ ] Admin credentials secured
- [ ] Regular access log audits
- [ ] Code expiration periods set
- [ ] Unauthorized alerts configured
- [ ] User list kept confidential
- [ ] Admin CLI access restricted
- [ ] Revocation process tested

---

## Real-World Example

### Scenario: Secret Project

**Day 1:**
```bash
# Admin creates user
POST /api/auth/register
{
  "name": "Agent Smith",
  "email": "smith@agency.gov",
  "password": "secure_password",
  "role": "student"
}

# Admin generates code
node admin-cli.js generate smith@agency.gov 30
# Result: A3F2-B8K1-L9M4

# Admin calls agent
Phone: "Your code is: A3F2-B8K1-L9M4"
```

**Day 2:**
```
Agent opens portal
Enters code: A3F2-B8K1-L9M4
Device locked ✓
Access granted ✓
Browses 5 secret job listings
Applies to 2 positions
Uploads CV (auto-parsed)
```

**Day 15:**
```
Agent uses portal from same device
Device fingerprint matches ✓
Access granted ✓
No problems
```

**Day 30:**
```
Code expires automatically
Agent can no longer access
Admin generates new code
Sends new code to agent
```

**If code shared:**
```
Friend tries code from different device
Device fingerprint mismatch ✗
Access blocked ✗
Message: "Cannot be shared"
Admin alerts on unauthorized attempt
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `node admin-cli.js: command not found` | Run from `server` folder |
| `MongoDB connection failed` | Check `.env` MONGODB_URI |
| `User not found` | Verify email matches database |
| `Code already exists` | Regenerate, very rare |
| `Code rejected` | Verify not expired or revoked |
| `Different device error` | Must use same device or regenerate code |

---

## API Reference

### Generate Code (Admin Only)
```
POST /api/access/generate-code
Headers: Authorization: Bearer <ADMIN_JWT>
Body: { userId: "...", expiresIn: 30 }
```

### Verify Code (Public)
```
POST /api/access/verify-code
Body: { code: "A3F2-B8K1-L9M4" }
```

### Check Session
```
GET /api/access/verify-session
Headers: Cookie: [session]
```

### Get Code Status (Admin Only)
```
GET /api/access/status/:codeId
Headers: Authorization: Bearer <ADMIN_JWT>
```

### Revoke Code (Admin Only)
```
PUT /api/access/revoke/:codeId
Headers: Authorization: Bearer <ADMIN_JWT>
```

---

**Your Secret Portal is Now Live!** 🛡️

All access is tracked, device-locked, and impossible to share.

Questions? Check `SECRET_ACCESS_GUIDE.md` for detailed documentation.
