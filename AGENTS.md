# Agent Guidelines & Deployment Protection

## Deployment & Repository Rule
Do NOT delete, overwrite, or modify the following files and directories during development, syncing, or exporting:
- `firebase.json`
- `.firebaserc`
- `.github/workflows/` (and all files inside it)

These files are essential for the user's Firebase Hosting auto-deploy setup and must remain untouched across commits and syncs.
