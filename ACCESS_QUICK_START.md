# Intern Portal - Quick Start (Access Codes)

## Generate a code

```bash
cd server
node admin-cli.js generate intern@example.com
```

## Verify it works

1. Start backend and frontend
2. Open the app → enter the code
3. Register or log in

## Common commands

```bash
node admin-cli.js list
node admin-cli.js check-user intern@example.com
node admin-cli.js revoke XXXX-XXXX-XXXX
```

See `ACCESS_GUIDE.md` for more detail.
