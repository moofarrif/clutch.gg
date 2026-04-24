# Plan: Add onError with Alert to all mutation calls

## Analysis Summary

After reading all 8 files, here is the status of each:

### Files needing changes (6 files):

1. **`apps/mobile/src/app/match/create.tsx`** (line 52-61)
   - `createMatch.mutate(...)` has `onSuccess` but NO `onError`
   - Need to add `Alert` import and `getErrorMessage` import (from `../../utils/api-error`)

2. **`apps/mobile/src/app/match/[id]/index.tsx`** (lines 222, 234)
   - `leaveMatch.mutate(id)` - called with NO options at all (line 222)
   - `joinMatch.mutate(id, { onSuccess: ... })` - has `onSuccess` but NO `onError` (line 234)
   - Already imports from `react-native` but uses destructured `Text, Pressable, Share, etc.` -- need to add `Alert`
   - Need `getErrorMessage` import (from `../../../utils/api-error`)

3. **`apps/mobile/src/app/match/[id]/vote.tsx`** (line 224)
   - `voteResult.mutate(...)` has `onSuccess` but NO `onError`
   - Need to add `Alert` to RN import and `getErrorMessage` import (from `../../../utils/api-error`)

4. **`apps/mobile/src/app/match/[id]/rate.tsx`** (line 202-207)
   - `rateConductMutation.mutate(...)` has `onSuccess` but NO `onError`
   - Need to add `Alert` to RN import and `getErrorMessage` import (from `../../../utils/api-error`)

5. **`apps/mobile/src/app/friends/index.tsx`** (lines 68, 77)
   - `acceptMutation.mutate(req.friendshipId)` - NO options at all (line 68)
   - `rejectMutation.mutate(req.friendshipId)` - NO options at all (line 77)
   - Need to add `Alert` to RN import and `getErrorMessage` import (from `../../utils/api-error`)

6. **`apps/mobile/src/app/settings/index.tsx`** (line 107)
   - `logout.mutate()` - called with NO options, inside Alert confirm callback
   - Already has `Alert` imported
   - Need `getErrorMessage` import (from `../../utils/api-error`)

### Files with NO mutation calls needing changes (2 files):

7. **`apps/mobile/src/app/squad/index.tsx`** - No mutation calls at all (no useLeaveSquad, no .mutate() calls). **SKIP.**

8. **`apps/mobile/src/app/squad/discover.tsx`** - `joinSquad` hook is initialized but never called (`.mutate()` is never invoked). The "SOLICITAR UNIRSE" button and "Crear Nueva Escuadra" button have no onPress handlers wired to mutations. **SKIP.**

## Changes to make

### File 1: `create.tsx`
- Add `Alert` to RN import (line 1-8)
- Add `import { getErrorMessage } from '../../utils/api-error';` after existing imports
- Add `onError` callback to `createMatch.mutate()` call (after `onSuccess` block, line 60)

### File 2: `[id]/index.tsx`
- Add `Alert` to RN import (line 1)
- Add `import { getErrorMessage } from '../../../utils/api-error';` after existing imports
- Add options object with `onError` to `leaveMatch.mutate(id)` call (line 222)
- Add `onError` to `joinMatch.mutate()` call (line 234)

### File 3: `[id]/vote.tsx`
- Add `Alert` to RN import (line 1)
- Add `import { getErrorMessage } from '../../../utils/api-error';` after existing imports
- Add `onError` to `voteResult.mutate()` call (line 224-226)

### File 4: `[id]/rate.tsx`
- Add `Alert` to RN import (line 1)
- Add `import { getErrorMessage } from '../../../utils/api-error';` after existing imports
- Add `onError` to `rateConductMutation.mutate()` call (line 202-207)

### File 5: `friends/index.tsx`
- Add `Alert` to RN import (line 1)
- Add `import { getErrorMessage } from '../../utils/api-error';` after existing imports
- Add options with `onError` to `acceptMutation.mutate(req.friendshipId)` (line 68)
- Add options with `onError` to `rejectMutation.mutate(req.friendshipId)` (line 77)

### File 6: `settings/index.tsx`
- Add `import { getErrorMessage } from '../../utils/api-error';` after existing imports
- Add onError to `logout.mutate()` call inside handleLogout (line 107)
