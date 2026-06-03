# Optional Firebase Cloud Save Integration

The shipped game already works fully with local `localStorage` saves. Firebase should remain optional.

## Goal

Abstract the save layer so:

- offline local saves always work
- cloud save can be enabled later
- no secret keys are hardcoded in the repository

## Recommended approach

1. Keep `SaveManager` as the primary interface.
2. Add a new module, for example `src/managers/CloudSaveAdapter.js`.
3. On game boot:
   - load local save immediately
   - if Firebase is configured and user signs in, sync latest timestamped save
4. Resolve conflicts with:
   - local modified time
   - cloud modified time
   - explicit “keep local / keep cloud” prompt if needed

## Firebase setup outline

### 1. Create a Firebase project
Enable:
- Authentication (anonymous or Google sign-in)
- Firestore or Realtime Database

### 2. Add a config file that is not hardcoded in source control
Example strategy:
- commit `firebase.example.js`
- keep real `firebase.config.js` out of public repos if desired

### 3. Proposed save document shape

```json
{
  "updatedAt": 1711111111111,
  "version": 1,
  "state": { "...": "game save json" }
}
```

### 4. Keep local fallback
If Firebase fails:
- show a toast
- continue using local save
- never block gameplay

## Important note

Firebase client config is not a secret in the traditional sense, but rules matter. Use proper Firestore/Realtime Database rules so users only access their own save documents.
