## Multer v2 Migration Checklist

- [ ] Create a backup branch before migration.
- [ ] Update dependency: `npm install multer@^2`.
- [ ] Search backend for `multer(` usage and list all upload endpoints.
- [ ] Verify all storage config blocks (`diskStorage`, destination, filename callbacks).
- [ ] Keep strict file type and file size limits configured in multer options.
- [ ] Ensure each upload route handles `MulterError` and returns clear 4xx responses.
- [ ] Confirm request field names used by frontend match multer middleware (`single`, `array`, `fields`).
- [ ] Re-test all upload routes with valid, oversized, and invalid-type files.
- [ ] Check temporary file cleanup behavior for failures/timeouts.
- [ ] Run full backend tests and smoke test the CV/job application upload flow.
- [ ] Re-run `npm audit` and document remaining vulnerabilities.
- [ ] Deploy to staging first and monitor upload errors before production rollout.
