# Intern Portal - Access Code Guide

The portal is protected by one-time access codes. Each code is tied to a user and cannot be shared.

## Admin CLI

From `server/`:

```bash
node admin-cli.js generate user@example.com
node admin-cli.js generate user@example.com 60
node admin-cli.js list
node admin-cli.js check-user user@example.com
node admin-cli.js revoke CODE-HERE
```

## User flow

1. Open the portal
2. Enter the access code on the Intern Portal gate
3. Sign in / register
4. Use jobs, applications, and CV upload

## Backend env

See `server/.env.example` for `JWT_KEY`, `SESSION_KEY`, and `MONGODB_URI`.
