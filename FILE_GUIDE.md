# 📦 Intern Portal - Complete File Structure

## Quick Navigation Guide

### 📄 Documentation Files (Read These First!)

| File | Purpose |
|------|---------|
| `SECRET_PORTAL_IMPLEMENTATION.md` | **START HERE** - Complete system overview with examples |
| `SECRET_PORTAL_QUICK_START.md` | Quick reference for admins using the CLI |
| `ARCHITECTURE_DIAGRAM.md` | Visual flow diagrams of how system works |
| `SECRET_ACCESS_GUIDE.md` | Comprehensive admin manual (400+ lines) |

### 💻 Backend Code

| File | Purpose | Key Features |
|------|---------|--------------|
| `server/routes/access.js` | Core API endpoints | Device fingerprinting, code verification, anti-sharing |
| `server/models/AccessCode.js` | MongoDB schema | Access history, unauthorized attempts, TTL expiration |
| `server/admin-cli.js` | Admin CLI tool | Generate, list, check, revoke, audit codes |
| `server/server.js` | Main server (modified) | Added `/api/access` route mounting |

### 🎨 Frontend Code

| File | Purpose | Key Features |
|------|---------|--------------|
| `client/src/components/AccessGate.js` | Login screen | Code input, animations, error display |
| `client/src/components/AccessGate.css` | Styling | Dark theme, glassmorphism, responsive |
| `client/src/services/accessCodeAPI.js` | API client | Wrapper for all access code endpoints |
| `client/src/App.js` | Main app (modified) | Access gate check, session validation |

---

## 🚀 Getting Started

### Step 1: Read the Overview
```
→ Open: SECRET_PORTAL_IMPLEMENTATION.md
  Read: What was added, how it works, use examples
```

### Step 2: Start the System
```bash
# Terminal 1: Backend
cd server
npm install
npm start

# Terminal 2: Frontend
cd client
npm install
npm start

# Terminal 3: Python Service (if using CV parsing)
cd python-service
python app.py
```

### Step 3: Generate First Code
```bash
# In server directory
node admin-cli.js generate intern@example.com
# Output: A3F2-B8K1-L9M4 (share this with user)
```

### Step 4: Test Access
1. Open http://localhost:3000
2. You'll see access gate (can't access portal yet)
3. Enter code: `A3F2-B8K1-L9M4`
4. Click "GRANT ACCESS"
5. Portal unlocks ✓

---

## 📖 Documentation Deep Dive

### For Admins
- **Quick Start:** `SECRET_PORTAL_QUICK_START.md`
  - Command reference
  - Security features
  - Troubleshooting
  
- **Full Guide:** `SECRET_ACCESS_GUIDE.md`
  - 400+ lines of detailed documentation
  - API examples with curl
  - Database schema details
  - Bulk generation scripts
  - Best practices
  - Monitoring tips

### For Developers
- **Architecture:** `ARCHITECTURE_DIAGRAM.md`
  - Complete flow diagrams
  - Step-by-step verification process
  - Component relationships
  - Security flow

- **Implementation:** `SECRET_PORTAL_IMPLEMENTATION.md`
  - Overview of all features
  - Database schema
  - API endpoints
  - Security architecture
  - Testing guide
  - Deployment checklist

---

## 🔧 Key Commands

```bash
# Generate codes
node admin-cli.js generate user@email.com
node admin-cli.js generate user@email.com 60    # 60 days

# List codes
node admin-cli.js list                          # All active codes

# Check specific code
node admin-cli.js status A3F2-B8K1-L9M4
  Shows:
  - User info
  - Usage count
  - Access history
  - Unauthorized attempts

# Revoke code (emergency block)
node admin-cli.js revoke A3F2-B8K1-L9M4

# Find user
node admin-cli.js check-user user@email.com
  Shows:
  - User info
  - All assigned codes
  - Status of each code

# Help
node admin-cli.js help
```

---

## 🔐 Security Features Explained

### Device Fingerprinting
**What:** Each device gets unique SHA-256 hash based on User-Agent + IP
**When:** Created on first code use
**How:** Compared on every subsequent use
**Result:** Code locked to original device forever

### Anti-Sharing Detection
**Attempt:** User tries code from different device
**Detection:** Device fingerprint mismatch
**Action:** Access blocked, attempt logged
**Message:** "This code was accessed from a different device. Access codes cannot be shared."
**Result:** Code cannot be shared across devices

### Usage Tracking
**Logged:** IP address, timestamp, user agent
**Storage:** Stored in `accessHistory` array
**Admin:** Can view complete access timeline
**Purpose:** Audit trail for compliance

### Code Expiration
**Method:** MongoDB TTL index on `expiresAt` field
**Default:** 30 days from creation
**Cleanup:** Automatic deletion when expired
**Manual:** Can be revoked anytime via CLI

---

## 📊 Database Collections

### accesscodes
```javascript
{
  code: "A3F2-B8K1-L9M4",                    // Unique identifier
  userId: ObjectId(...),                     // Who owns it
  deviceFingerprint: "7f8a2b3c...",          // Device lock
  uses: 15,                                  // Usage count
  maxUses: 1000,                             // Hard limit (unreachable)
  lastUsedAt: Date,                          // Last access time
  accessHistory: [                           // All accesses
    { ip: "203.0.113.42", userAgent: "...", timestamp: Date }
  ],
  unauthorizedAttempts: [                    // Sharing attempts
    { ip: "203.0.113.99", timestamp: Date }
  ],
  expiresAt: Date,                           // Expiration date (TTL)
  isActive: Boolean,                         // Active/revoked status
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🌐 API Endpoints

### Public Endpoints
```
POST /api/access/verify-code
  • Input: { code: "XXXX-XXXX-XXXX" }
  • Output: { success: true, token: "JWT", message: "..." }
  • Error: { success: false, error: "..." }
  • Used by: Login screen

GET /api/access/verify-session
  • Input: None (checks JWT in header/cookie)
  • Output: { valid: true/false }
  • Used by: Frontend to verify session
```

### Admin Endpoints (Requires JWT)
```
POST /api/access/generate-code
  • Input: { email: "user@example.com", expiresIn: 30 }
  • Output: { success: true, code: "XXXX-XXXX-XXXX" }

GET /api/access/status/:codeId
  • Output: Complete code object with all history

PUT /api/access/revoke/:codeId
  • Output: { success: true, message: "Code revoked" }
```

---

## 🎯 Typical Workflow

### Day 1: Admin Setup
```
Admin runs:
  $ node admin-cli.js generate intern@example.com 30
  
Output:
  Code: A3F2-B8K1-L9M4
  Expires: May 30, 2026
  
Admin sends via secure channel:
  Phone, encrypted email, signal, etc.
```

### Day 2: User Access
```
User:
  1. Opens http://localhost:3000
  2. Sees access gate
  3. Enters code: A3F2-B8K1-L9M4
  4. Clicks GRANT ACCESS
  
System:
  1. Verifies code ✓
  2. Checks not expired ✓
  3. Creates device fingerprint
  4. Locks code to device
  5. Creates JWT token
  6. Logs access
  
Result:
  User can now use full portal ✓
```

### Day 15: User Returns
```
User:
  1. Opens http://localhost:3000
  2. Enters code: A3F2-B8K1-L9M4
  
System:
  1. Verifies code ✓
  2. Checks not expired ✓
  3. Creates device fingerprint
  4. Compares with stored: MATCH ✓
  5. Creates JWT token
  6. Logs access
  
Result:
  Access granted ✓ (same device)
```

### Day 15: Code Sharing Attempt
```
Friend of User:
  1. Opens http://localhost:3000
  2. Enters code: A3F2-B8K1-L9M4
  3. From different device
  
System:
  1. Verifies code ✓
  2. Checks not expired ✓
  3. Creates device fingerprint
  4. Compares with stored: MISMATCH ✗
  5. Logs unauthorized attempt
  6. Blocks access
  
Response:
  "This code was accessed from a different device.
   Access codes cannot be shared."
  
Admin sees:
  - Original device: 203.0.113.42 (Laptop)
  - Attempted device: 203.0.113.99 (Mobile)
  - Time: 2026-05-15 14:32:00
```

### Day 30: Code Expires
```
System:
  - Database TTL index fires
  - Document automatically deleted
  - Code no longer works
  
User:
  - Tries to use code
  - Gets: "Invalid access code"
  - Admin generates new code
  
Admin:
  $ node admin-cli.js generate intern@example.com 30
  New code issued
```

---

## ⚙️ Configuration

### In `server/.env`
```
MONGODB_URI=mongodb://localhost:27017/intern_portal
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
PYTHON_SERVICE_URL=http://localhost:5001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
ACCESS_CODE_MAX_USES=1000
ACCESS_CODE_DEFAULT_EXPIRY_DAYS=30
```

### In `client/.env`
```
REACT_APP_API_BASE=http://localhost:5000
REACT_APP_ENV=development
```

---

## 🧪 Testing Checklist

- [ ] Generate code via CLI
- [ ] User enters valid code → access granted
- [ ] User enters invalid code → access denied
- [ ] User enters expired code → access denied
- [ ] User uses code twice from same device → both allowed
- [ ] Code shared to different device → access denied
- [ ] Admin checks code status → shows all history
- [ ] Admin revokes code → no longer works
- [ ] Check admin CLI help → all commands listed

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Code not generating | Check MongoDB running, user exists |
| Access gate not showing | Verify App.js modification applied |
| Different device blocked | Expected! Code locked to first device |
| Can't find code in DB | Check MongoDB, verify code format |
| Admin CLI not working | Ensure running from `server` directory |
| Backend errors | Check `.env` settings, MongoDB connection |

---

## 📋 File Dependencies

```
AccessGate.js (Frontend)
    ↓ Uses
AccessCodeAPI.js (API Client)
    ↓ Calls
/api/access/verify-code (Backend Route)
    ↓ Uses
AccessCode Model (MongoDB Query)
    ↓ Reads/Writes
MongoDB accesscodes Collection
    
App.js (Frontend)
    ↓ Mounts
AccessGate.js (if no access)
    ↓ Or shows
Full Portal Routes

admin-cli.js (CLI Tool)
    ↓ Uses
AccessCode Model (Direct queries)
    ↓ Reads/Writes
MongoDB accesscodes Collection
```

---

## 🎓 Learning Path

1. **Read:** `SECRET_PORTAL_IMPLEMENTATION.md` - Understand what was built
2. **Read:** `ARCHITECTURE_DIAGRAM.md` - Understand how it works
3. **Run:** `node admin-cli.js generate test@example.com` - Try it
4. **Test:** Open http://localhost:3000 - Use the portal
5. **Monitor:** `node admin-cli.js list` - See your codes
6. **Reference:** `SECRET_ACCESS_GUIDE.md` - Deep dive

---

## 🔒 Security Checklist for Production

- [ ] MongoDB in cloud (MongoDB Atlas)
- [ ] HTTPS/TLS enabled
- [ ] Strong JWT secret configured
- [ ] Rate limiting on API endpoints
- [ ] CORS properly configured
- [ ] Admin CLI restricted to admins only
- [ ] Backup strategy in place
- [ ] Monitoring/alerts configured
- [ ] Code review completed
- [ ] Security audit passed

---

## 📞 Support

**Questions about:**
- System overview → Read `SECRET_PORTAL_IMPLEMENTATION.md`
- Admin commands → Read `SECRET_PORTAL_QUICK_START.md`
- Architecture → Read `ARCHITECTURE_DIAGRAM.md`
- Detailed features → Read `SECRET_ACCESS_GUIDE.md`
- Code → Read inline comments in source files

**Error messages:**
- Check MongoDB connection in `.env`
- Verify User email matches exactly
- Ensure Node packages installed: `npm install`
- Check that backend running on port 5000
- Check that frontend running on port 3000

---

**Your Intern Portal System is Complete!** ✅

All files are in place. All documentation is comprehensive.

Start with `SECRET_PORTAL_IMPLEMENTATION.md` for the full overview! 🚀
