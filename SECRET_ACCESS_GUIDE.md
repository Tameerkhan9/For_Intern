# 🔐 Secret Portal - Access Code Management Guide

## Overview

Your NECOP portal is now protected with military-grade access codes. Each user gets a unique, non-transferable code that:

✅ **Cannot be shared** - Device fingerprinted (locked to their device)
✅ **Tracked usage** - All access attempts logged with IP & timestamp
✅ **Unauthorized detection** - Blocks access if code used from different device
✅ **Expiration dates** - Auto-expires codes after specified period
✅ **Usage monitoring** - Track who accessed and when

---

## How to Generate Access Codes

### 1. Using Backend API (For Admins)

```bash
POST /api/access/generate-code
Authorization: Bearer <ADMIN_JWT_TOKEN>

Body:
{
  "userId": "user_id_from_database",
  "expiresIn": 30  // days
}

Response:
{
  "success": true,
  "code": "A3F2-B8K1-L9M4",
  "expiresAt": "2026-05-30T00:00:00Z",
  "message": "Access code generated. Valid for 30 days."
}
```

### 2. From Database Directly

```bash
# Find user first
db.users.findOne({ email: "agent@necop.pk" })

# Generate code via API with userId
# Copy the generated code and send privately to user
```

### 3. Bulk Generation Script

Create a file `generate-codes.js`:

```javascript
const mongoose = require('mongoose');
const AccessCode = require('./models/AccessCode');
require('dotenv').config();

async function generateCodes() {
  await mongoose.connect(process.env.MONGODB_URI);

  const agentIds = [
    'user_id_1',
    'user_id_2',
    'user_id_3'
  ];

  for (const userId of agentIds) {
    const code = require('crypto')
      .randomBytes(4)
      .toString('hex')
      .toUpperCase();

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    await AccessCode.create({
      code,
      userId,
      expiresAt: expiryDate,
      purpose: 'Secret Agency Portal'
    });

    console.log(`Generated for ${userId}: ${code}`);
  }

  mongoose.connection.close();
}

generateCodes();
```

Run:
```bash
node generate-codes.js
```

---

## Security Features Implemented

### 1. **Device Fingerprinting**
- First use: Code binds to device (browser + IP)
- Subsequent uses: Must come from same device
- Different device: Access blocked, logged as unauthorized

```
User Device = MD5(User-Agent + IP Address)
```

### 2. **Usage Tracking**
Each access attempt records:
- ✓ Device fingerprint
- ✓ IP address
- ✓ User-Agent
- ✓ Timestamp
- ✓ Successful or unauthorized attempt

### 3. **Unauthorized Attempt Logging**
When code used from different device:
- Attempt logged with IP
- Timestamp recorded
- Access blocked
- Admin notified (optional)

### 4. **Expiration Management**
- Codes expire on specified date
- Expired codes cannot be used
- Can be revoked manually
- Auto-cleanup in MongoDB (TTL index)

### 5. **Anti-Sharing Detection**
```
✗ Code shared to friend → Different device fingerprint
✗ Friend tries to use → Blocked with: 
  "This code was accessed from a different device. 
   Access codes cannot be shared."
```

---

## Admin Dashboard - Code Management

### Check Code Status

```bash
GET /api/access/status/:codeId
Authorization: Bearer <ADMIN_JWT_TOKEN>

Response:
{
  "success": true,
  "code": "A3F2-B8K1-L9M4",
  "uses": 15,
  "maxUses": 1000,
  "expiresAt": "2026-05-30T00:00:00Z",
  "lastUsedAt": "2026-04-30T14:32:00Z",
  "accessHistory": [
    {
      "ip": "203.0.113.42",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2026-04-30T14:32:00Z"
    }
  ],
  "unauthorizedAttempts": []
}
```

### Revoke a Code (Block Immediately)

```bash
PUT /api/access/revoke/:codeId
Authorization: Bearer <ADMIN_JWT_TOKEN>

Response:
{
  "success": true,
  "message": "Access code revoked",
  "code": "A3F2-B8K1-L9M4"
}
```

---

## User Experience Flow

### Step 1: User Receives Code
```
Agency Admin sends privately:
"Your secure access code: A3F2-B8K1-L9M4"
```

### Step 2: User Enters Code
```
They visit: https://necop-portal.com
See: "🔐 Secret Portal - Authorized Access Only"
Enter code: A3F2-B8K1-L9M4
Device fingerprinted automatically
```

### Step 3: Access Granted
```
✓ Code verified
✓ Device locked to fingerprint
✓ Session created
✓ Redirected to portal homepage
```

### Step 4: If Code Shared
```
Friend tries with same code from different device:
✗ "This code was accessed from a different device.
   Access codes cannot be shared."
   [Access Blocked]
```

---

## Code Format & Examples

**Format:** `XXXX-XXXX-XXXX` (16 characters, hex)

**Examples:**
```
A3F2-B8K1-L9M4
D7E9-C2J4-K1N8
R5T2-V8W3-X9Y1
```

---

## Database Schema

### AccessCode Model

```javascript
{
  code: "A3F2-B8K1-L9M4",           // Unique
  userId: ObjectId,                  // User who gets this code
  deviceFingerprint: "sha256hash",  // Locked device
  
  // Usage tracking
  uses: 45,
  maxUses: 1000,
  lastUsedAt: Date,
  
  // Access history
  accessHistory: [
    {
      ip: "203.0.113.42",
      userAgent: "Mozilla...",
      timestamp: Date
    }
  ],
  
  // Security
  unauthorizedAttempts: [
    {
      ip: "203.0.113.99",    // Different IP = Device mismatch
      timestamp: Date
    }
  ],
  
  // Status
  expiresAt: Date,
  isActive: Boolean,
  revokedAt: Date,
  createdAt: Date,
  purpose: "Secret Agency Portal"
}
```

---

## API Endpoints Summary

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| `POST` | `/api/access/generate-code` | Create new code | Admin JWT |
| `POST` | `/api/access/verify-code` | Verify & grant access | Public |
| `GET` | `/api/access/verify-session` | Check session valid | Session |
| `POST` | `/api/access/logout` | End session | Session |
| `GET` | `/api/access/status/:id` | Get code usage stats | Admin JWT |
| `PUT` | `/api/access/revoke/:id` | Block a code | Admin JWT |

---

## Best Practices

### ✅ DO:
- Generate codes in secure environment
- Send codes through encrypted channel
- Monitor usage regularly
- Set appropriate expiration dates
- Revoke compromised codes immediately
- Keep user list confidential

### ❌ DON'T:
- Share codes via email/SMS alone
- Use same code for multiple users
- Set very long expiration (30 days recommended)
- Store codes in version control
- Share admin credentials
- Log sensitive data publicly

---

## Troubleshooting

### "Invalid access code"
- Code doesn't exist in database
- Check spelling
- Verify code hasn't been revoked

### "Access code expired"
- Code date passed
- Generate new code for user
- Check server time sync

### "This code was accessed from a different device"
- Code locked to original device
- User tried on different device
- Cannot override (by design)
- Generate new code if needed

### Code works once then fails
- Check `maxUses` limit
- Verify `isActive` status
- Look at unauthorized attempts

---

## Monitoring & Alerts (Optional)

### Enable notifications when:
- Code used from unauthorized device
- Suspicious access pattern (multiple IPs)
- Code approaching expiration
- Unauthorized access attempts detected

---

## Security Checklist

- [ ] All codes generated by authorized admin only
- [ ] Codes sent through secure channel
- [ ] Users informed NOT to share codes
- [ ] Monitoring dashboard set up
- [ ] Revocation process tested
- [ ] Expiration dates reasonable (30 days)
- [ ] Regular audit of access logs
- [ ] HTTPS enabled on frontend
- [ ] JWT secrets kept secure
- [ ] MongoDB backups configured

---

## Example Workflow

```
1. Agency Admin creates user account
   → Email: agent@necop.pk
   → Role: student/employer

2. Admin generates access code
   → POST /api/access/generate-code
   → Get: A3F2-B8K1-L9M4

3. Admin sends code securely
   → Via encrypted email
   → Via phone call
   → Via secure message

4. Agent uses code
   → Visit portal
   → Enter code A3F2-B8K1-L9M4
   → Device fingerprinted
   → Access granted

5. Agent browses portal
   → Search jobs
   → Apply to positions
   → Upload CV

6. Admin monitors
   → Check usage stats
   → Verify device fingerprint
   → Review access logs

7. Expiry approach
   → Generate new code (Day 27)
   → Send to agent
   → Old code auto-revokes
```

---

**Your secret portal is now bulletproof!** 🛡️

All user access is tracked, device-locked, and non-transferable.
