# Frontend Authentication Implementation Plan

**Project:** Gulgle - Settings Sync with GitHub OAuth
**Created:** October 29, 2025
**Status:** In Progress

## Overview

Implement frontend authentication against the backend server using GitHub OAuth to enable cross-device settings synchronization.

---

## Current State Analysis

### Backend (Already Implemented) ✅
- GitHub OAuth flow (`/api/auth/github` and `/api/auth/github/callback`)
- JWT token generation and authentication middleware
- Protected endpoints for settings sync (`/api/settings/v1.0`)
- User management with email-based identification
- Token expiration (1 day)

### Frontend (To Be Implemented) ❌
- No authentication state management
- No API client for authenticated requests
- No login/logout UI
- No token storage
- No auth callback handling
- No integration with settings sync backend

---

## Implementation Phases

### **Phase 1: Core Authentication Infrastructure** ✅ COMPLETED
Priority: HIGH

#### 1.1 Create Authentication Context & State Management ✅ COMPLETED
**File:** `apps/web/src/contexts/auth-context.tsx`

**Features:**
- Manage authentication state (user, token, loading, error)
- Store JWT token in localStorage
- Handle login/logout
- Provide auth status across the app
- Auto-initialize from stored token
- Token expiration handling

**State Shape:**
```typescript
{
  user: { email: string, id: string } | null,
  token: string | null,
  isAuthenticated: boolean,
  isLoading: boolean,
  error: string | null
}
```

**Status:** ✅ Completed

#### 1.2 Create API Client ✅ COMPLETED
**File:** `apps/web/src/lib/api-client.ts`

**Features:**
- Centralized fetch wrapper
- Automatic Bearer token injection
- Error handling (401 → logout, 409 → conflict)
- Base URL configuration via environment variable
- TypeScript interfaces for all endpoints

**Endpoints to support:**
- `GET /api/user/v1.0/current` - Get current user
- `GET /api/settings/v1.0` - Pull settings
- `PUT /api/settings/v1.0` - Push settings

**Status:** ✅ Completed

#### 1.3 Environment Configuration ✅ COMPLETED
**Files:**
- `apps/web/.env` (create)
- `apps/web/.env.example` (create)

**Environment Variables:**
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_FRONTEND_URL=http://localhost:5173
```

**Status:** ✅ Completed---

### **Phase 2: Authentication UI Components** 📋 TODO
Priority: HIGH

#### 2.1 Login Page
**File:** `apps/web/src/pages/login.tsx`

**Features:**
- GitHub OAuth login button
- Redirect to `/api/auth/github` endpoint
- Loading state
- Error display

**Status:** Not Started

#### 2.2 Auth Callback Handler
**File:** `apps/web/src/pages/auth-callback.tsx`

**Features:**
- Handle redirect from backend (`/auth/success#token=...`)
- Extract JWT from URL hash fragment
- Store token in context/localStorage
- Fetch user data
- Redirect to settings or previous page
- Error handling for failed auth

**Status:** Not Started

#### 2.3 Update Router Context
**File:** `apps/web/src/contexts/router-context.tsx`

**Changes:**
- Add `/login` and `/auth/success` routes
- Add route guards for protected pages

**Status:** Not Started

#### 2.4 Protected Route Wrapper
**File:** `apps/web/src/components/auth/protected-route.tsx`

**Features:**
- Check authentication status
- Redirect to login if not authenticated
- Show loading spinner during auth check

**Status:** Not Started

#### 2.5 User Menu Component
**File:** `apps/web/src/components/layout/user-menu.tsx`

**Features:**
- Display user email when logged in
- Login button when logged out
- Logout button
- Integrate into Header component

**Status:** Not Started

---

### **Phase 3: Settings Sync Integration** 📋 TODO
Priority: MEDIUM

#### 3.1 Extend Bang Manager for Cloud Sync
**File:** `apps/web/src/state/bang-manager.ts`

**New Methods:**
- `syncToCloud()` - Push local settings to server
- `syncFromCloud()` - Pull settings from server
- `enableAutoSync()` - Auto-sync on changes
- `resolveConflicts()` - Handle 409 conflicts

**Status:** Not Started

#### 3.2 Create Sync Hook
**File:** `apps/web/src/hooks/use-settings-sync.hook.ts`

**Features:**
- Trigger sync operations
- Handle sync status (syncing, synced, error)
- Conflict resolution UI triggers
- Last sync timestamp

**Status:** Not Started

#### 3.3 Update Settings Models
**Files:**
- `apps/server/src/models/settings.ts` (extend with actual settings fields)
- `apps/server/src/dtos/settings.ts` (add customBangs, defaultBang)
- `packages/shared/src/types/types.ts` (export SettingsDTO)

**New Schema:**
```typescript
{
  userId: string,
  customBangs: Array<CustomBang>,
  defaultBang: Bang | undefined,
  lastModified: Date
}
```

**Status:** Not Started

#### 3.4 Settings Page UI Updates
**File:** `apps/web/src/pages/settings.tsx`

**Add:**
- Sync status indicator
- Manual sync button
- Last synced timestamp
- Sync error messages
- Login prompt for non-authenticated users

**Status:** Not Started

#### 3.5 Sync Settings Component
**File:** `apps/web/src/components/settings/sync-settings.tsx`

**Features:**
- Visual sync status
- Manual sync triggers
- Conflict resolution UI
- Sync history/logs

**Status:** Not Started

---

### **Phase 4: Enhanced Features** 📋 TODO
Priority: LOW

#### 4.1 Token Refresh Flow
**File:** `apps/web/src/lib/token-manager.ts`

**Features:**
- Detect token expiration (parse JWT exp)
- Trigger re-authentication before expiry
- Silent refresh if backend supports it (future)

**Status:** Not Started

#### 4.2 Offline Support
**File:** `apps/web/src/lib/offline-queue.ts`

**Features:**
- Queue sync operations when offline
- Retry failed syncs
- Merge local changes with server on reconnect

**Status:** Not Started

#### 4.3 Multi-Device Conflict Resolution
**File:** `apps/web/src/components/settings/conflict-resolver.tsx`

**Features:**
- Show diff between local and server settings
- Let user choose which to keep
- Merge option
- Always prefer local/server option

**Status:** Not Started

#### 4.4 Auth Error Boundary
**File:** `apps/web/src/components/auth/auth-error-boundary.tsx`

**Features:**
- Catch authentication errors globally
- Show user-friendly error messages
- Retry mechanisms
- Logout option

**Status:** Not Started

---

### **Phase 5: Testing & Polish** 📋 TODO
Priority: MEDIUM

#### 5.1 Update Dependencies
Add to `apps/web/package.json`:
```json
{
  "dependencies": {
    "jwt-decode": "^4.0.0"
  }
}
```

**Status:** Not Started

#### 5.2 Create Tests
- Unit tests for API client
- Integration tests for auth flow
- E2E tests for login/logout
- Sync conflict scenarios

**Status:** Not Started

#### 5.3 Documentation
**File:** `apps/web/README.md`

- Environment setup instructions
- OAuth configuration steps
- Local development guide
- Deployment considerations

**Status:** Not Started

---

## Implementation Timeline

### Week 1: Core Auth (Phase 1 + 2.1-2.3)
- Auth context
- API client
- Login page
- Callback handler
- Router updates

### Week 2: UI Integration (Phase 2.4-2.5)
- Protected routes
- User menu
- Header integration
- Basic styling

### Week 3: Settings Sync (Phase 3)
- Backend schema updates
- Sync logic in bang-manager
- Settings UI updates
- Conflict handling

### Week 4: Polish (Phase 4 + 5)
- Token refresh
- Offline queue
- Error boundaries
- Testing
- Documentation

---

## Key Technical Decisions

1. **Token Storage:** `localStorage` (already used for bangs)
2. **State Management:** React Context (consistent with existing router-context)
3. **API Communication:** Native `fetch` with wrapper (no axios needed)
4. **Auth Flow:** OAuth redirect flow (backend already implemented)
5. **Sync Strategy:** Manual + optional auto-sync on changes

---

## Backend Adjustments Needed

1. **Settings Schema Enhancement:**
   - Add `customBangs` and `defaultBang` fields to Settings model
   - Update handlers to store/retrieve actual settings data

2. **CORS Configuration:**
   - Ensure backend allows requests from frontend URL
   - Support credentials for cookie-based sessions (if needed)

3. **Environment Variables:**
   - `BASE_FRONTEND_URL` already configured for OAuth redirect

---

## Security Considerations

- ✅ JWT stored in localStorage (XSS risk - consider httpOnly cookies for future)
- ✅ 1-day token expiration (reasonable)
- ⚠️ Add CSRF protection if using cookies
- ⚠️ Validate token on every request (backend already does this)
- ⚠️ Use HTTPS in production
- ⚠️ Add rate limiting for auth endpoints

---

## Progress Tracking

**Overall Progress:** 14% (3/21 tasks completed)

**Phase 1:** 100% (3/3 tasks) ✅ COMPLETED
**Phase 2:** 0% (0/5 tasks)
**Phase 3:** 0% (0/5 tasks)
**Phase 4:** 0% (0/4 tasks)
**Phase 5:** 0% (0/3 tasks)

---

## Notes & Decisions

### October 29, 2025
- ✅ Created `AuthContext` with full state management (login, logout, token handling)
- ✅ Implemented JWT token expiration checking (client-side validation)
- ✅ Created API client with typed endpoints and error handling
- ✅ Set up environment configuration (.env and .env.example)
- ✅ Integrated AuthProvider into App component
- Auth context uses localStorage for persistence (consistent with existing bang-manager)
- Token validation includes 5-minute buffer before expiration
- Custom error classes for API errors (UnauthorizedError, ConflictError)

**Next Steps:**
- Start Phase 2: Create login page and auth callback handler
- Update router to support new routes (/login, /auth/success)
