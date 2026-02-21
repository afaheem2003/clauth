# Debug Session: Admin Authentication Issue on Vercel
**Date:** January 20, 2026  
**Status:** IN PROGRESS - Infinite Loop Issue

---

## 🎯 Original Problem

**Admin account works locally but NOT on Vercel deployment**
- Email: `afaheem2003@gmail.com`
- Database confirms: `role: ADMIN`, `waitlistStatus: APPROVED`
- Local environment: ✅ Works perfectly - redirects from `/waitlist` to `/`
- Vercel environment: ❌ Stuck on `/waitlist` page after Google OAuth sign-in

---

## 🔍 Investigation Steps

### Step 1: Initial Hypothesis Testing
We suspected the issue was related to the waitlist redirect logic not properly detecting admin status.

**Initial Fix Attempt:**
```javascript
// Changed from combined check to separate checks
// OLD:
if (waitlistEnabled && (isAdmin || isApproved)) { redirect }

// NEW:
if (isAdmin) { redirect immediately }
if (waitlistEnabled && isApproved) { redirect }
```

**Result:** ❌ Did not fix the issue

---

### Step 2: Debug Instrumentation

Added comprehensive logging to track the flow:

**Files Instrumented:**
1. `app/waitlist/page.js` - Client-side component (browser console logs)
2. `middleware.ts` - Server middleware (Vercel server logs)
3. `app/page.js` - Home page server component (Vercel server logs)

**Debug Logs Added:**
- `[DEBUG_WAITLIST]` - Client-side waitlist page events
- `[DEBUG_MIDDLEWARE]` - Server middleware checks and redirects
- `[DEBUG_HOME_PAGE]` - Server home page session checks

---

### Step 3: Critical Discovery from Logs

#### Browser Console Logs (Client-Side):
```javascript
[DEBUG_WAITLIST] Component mounted/rendered
  status: "authenticated"
  userRole: "ADMIN"
  hasSession: true
  
[DEBUG_WAITLIST] 🚨 ADMIN REDIRECT TRIGGERED
  role: "ADMIN"
  email: "afaheem2003@gmail.com"
  
[DEBUG_WAITLIST] router.push("/") called
```

#### Vercel Server Logs (Middleware):
```javascript
[DEBUG_MIDDLEWARE] { 
  path: '/', 
  hasToken: false,           // ⚠️ CRITICAL: No token seen!
  role: undefined, 
  waitlistStatus: undefined,
  isAdmin: false 
}
[DEBUG_MIDDLEWARE] Redirecting unauthenticated user to /waitlist
```

### 🎯 ROOT CAUSE IDENTIFIED:

**SESSION SYNC ISSUE**
- **Client-side:** `useSession()` returns `authenticated` + `ADMIN` role ✅
- **Server-side:** Middleware sees `hasToken: false` ❌

The JWT cookie is not being sent with navigation requests from the client!

---

## 💡 Fix Attempts

### Attempt 1: Use `window.location.href` instead of `router.push()`

**Reasoning:** Force a full page reload to ensure JWT cookie is sent with the request

**Code Change:**
```javascript
// OLD:
router.push('/')

// NEW:
window.location.href = '/'
```

**Result:** ❌ **INFINITE LOOP**
- Page redirects to `/`
- Middleware still sees `hasToken: false`
- User gets redirected back to `/waitlist`
- Component mounts again, sees ADMIN, redirects to `/` again
- Loop continues infinitely

---

### Attempt 2: Add Redirect Guard (Current State)

**Code Change:**
```javascript
const isRedirecting = useRef(false)

// In redirect useEffect:
if (isRedirecting.current) {
  console.log('Already redirecting, skipping to prevent loop')
  return;
}

if (session?.user?.role === 'ADMIN') {
  isRedirecting.current = true;
  router.push('/')
  return
}
```

**Status:** 🚧 Changes made but NOT YET DEPLOYED (user stopped deployment)

---

## 🔴 Current Issues

### Issue 1: JWT Token Not Visible to Middleware

The core problem remains unsolved:
- After Google OAuth sign-in completes, the JWT cookie should be set
- Client-side `useSession()` hook sees the session correctly
- But server-side middleware does NOT see the JWT token in requests

**Possible Causes:**
1. JWT callback is failing to create/sign the token
2. Cookie domain/path settings are incorrect for Vercel
3. Cookie SameSite/Secure settings preventing cookie transmission
4. Timing issue - token not yet set when navigation occurs
5. NextAuth configuration issue specific to Vercel environment

### Issue 2: Infinite Redirect Loop

When using `window.location.href = '/'`:
- Full page reload triggers
- Middleware sees no token → redirects to `/waitlist`
- Component mounts → sees ADMIN → redirects to `/` again
- Infinite loop

**Temporary Fix Applied:** Added `isRedirecting` ref guard (not yet deployed)

---

## 🔧 Files Modified (with instrumentation still active)

### Instrumentation Files:
1. **`app/waitlist/page.js`**
   - Client-side debug logs for component lifecycle
   - Redirect logic with guard
   - Track session state and redirects

2. **`middleware.ts`**
   - Server-side logs for every request
   - Shows token state, role, waitlist status
   - Logs all redirect decisions

3. **`app/page.js`**
   - Home page server component logs
   - Shows session state when home page renders
   - Logs redirect conditions

### Current State:
- ✅ All debug logs are still active (DO NOT REMOVE until issue is fixed)
- ⚠️ Latest changes NOT deployed (infinite loop fix pending)
- ⚠️ User stopped deployment to document state

---

## 📋 Next Steps (When Resuming)

### Immediate Actions:

1. **Deploy the Redirect Guard Fix**
   ```bash
   cd /Users/aadamfaheem/clauth
   git add app/waitlist/page.js
   git commit -m "Fix: Add redirect guard to prevent infinite loop"
   git push
   ```
   This will at least stop the infinite loop.

2. **Investigate JWT Token Creation**
   
   Add debug logging to `lib/authOptions.js` JWT callback:
   ```javascript
   async jwt({ token, user, trigger, session }) {
     console.log('[DEBUG_JWT] JWT callback triggered', {
       hasTrigger: !!trigger,
       trigger,
       hasUser: !!user,
       hasToken: !!token,
       tokenEmail: token?.email,
       tokenRole: token?.role
     })
     
     // ... existing code ...
     
     console.log('[DEBUG_JWT] Returning token', {
       tokenId: token.sub,
       tokenRole: token.role,
       tokenStatus: token.waitlistStatus
     })
     
     return token
   }
   ```

3. **Check Environment Variables on Vercel**
   
   Verify these are set correctly:
   - `NEXTAUTH_SECRET` - Must be set and match local
   - `NEXTAUTH_URL` - Should be `https://your-app.vercel.app`
   - `GOOGLE_CLIENT_ID` - OAuth credentials
   - `GOOGLE_CLIENT_SECRET` - OAuth credentials
   - `DATABASE_URL` - Connection string (already working)

4. **Check Cookie Settings**
   
   Add explicit cookie configuration to `lib/authOptions.js`:
   ```javascript
   export const authOptions = {
     // ... existing config ...
     cookies: {
       sessionToken: {
         name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
         options: {
           httpOnly: true,
           sameSite: 'lax',
           path: '/',
           secure: process.env.NODE_ENV === 'production'
         }
       }
     }
   }
   ```

5. **Test JWT Token Presence**
   
   Create a test API endpoint to check if cookies are being sent:
   ```javascript
   // app/api/debug/check-cookies/route.js
   import { getToken } from 'next-auth/jwt'
   import { NextResponse } from 'next/server'
   
   export async function GET(req) {
     const token = await getToken({ req })
     const cookies = req.headers.get('cookie')
     
     return NextResponse.json({
       hasToken: !!token,
       token: token,
       cookiesReceived: !!cookies,
       cookieCount: cookies?.split(';').length || 0
     })
   }
   ```
   
   Then call from browser: `https://your-app.vercel.app/api/debug/check-cookies`

### Alternative Solutions to Consider:

#### Option A: Force Session Refresh Before Redirect
```javascript
// In waitlist page, before redirecting:
if (session?.user?.role === 'ADMIN') {
  // Force session refresh
  await update()
  // Then redirect
  router.push('/')
}
```

#### Option B: Use Server-Side Redirect
Instead of client-side redirect, use middleware to handle the redirect:
```typescript
// In middleware.ts, after checking token:
if (isAdmin && path === '/waitlist') {
  return NextResponse.redirect(new URL('/', req.url))
}
```

#### Option C: Disable Waitlist Redirect for Admins
```typescript
// In middleware.ts:
if (waitlistEnabled) {
  // Admins bypass ALL waitlist logic
  if (isAdmin) {
    return NextResponse.next()
  }
  // ... rest of waitlist logic ...
}
```

---

## 🧪 Testing Checklist (When Fixed)

- [ ] Deploy fix to Vercel
- [ ] Clear browser cookies completely
- [ ] Open fresh incognito window
- [ ] Navigate to `https://your-app.vercel.app/waitlist`
- [ ] Sign in with Google (`afaheem2003@gmail.com`)
- [ ] Check browser console for `[DEBUG_WAITLIST]` logs
- [ ] Check Vercel deployment logs for `[DEBUG_MIDDLEWARE]` logs
- [ ] Verify `hasToken: true` in middleware logs
- [ ] Confirm redirect to home page succeeds
- [ ] Verify no infinite loop
- [ ] Test accessing `/admin/waitlist` page
- [ ] Test accessing `/admin/clothing` page

---

## 📝 Important Notes

1. **DO NOT REMOVE DEBUG LOGS** until issue is completely resolved and verified
2. **Database is correct** - Admin role is properly set in Supabase
3. **Seed script works** - We confirmed it runs on Vercel during build
4. **Local environment works perfectly** - Issue is Vercel-specific
5. **Session hook works on client** - It correctly shows ADMIN role
6. **Middleware is the blocker** - It doesn't see the JWT token

---

## 🔗 Related Files

### Key Files:
- `lib/authOptions.js` - NextAuth configuration (JWT callbacks)
- `middleware.ts` - Request interceptor (token validation)
- `app/waitlist/page.js` - Client redirect logic
- `app/page.js` - Home page with redirect checks
- `prisma/seed.js` - Admin user creation

### Environment Variables (Vercel):
- `WAITLIST_ENABLED=true`
- `ENABLE_AI_GENERATION=false`
- `NEXTAUTH_SECRET=<set>`
- `NEXTAUTH_URL=<needs verification>`
- `GOOGLE_CLIENT_ID=<set>`
- `GOOGLE_CLIENT_SECRET=<set>`
- `DATABASE_URL=<set, working>`

---

## 💭 Additional Context

### Why Local Works but Vercel Doesn't:

Possible reasons for the environment-specific behavior:
1. **Different cookie handling** - Localhost vs production domain
2. **HTTPS vs HTTP** - Cookie secure flag differences
3. **Timing differences** - Serverless cold starts on Vercel
4. **Environment variable values** - Possible mismatch in `NEXTAUTH_URL`
5. **Session strategy** - JWT token signing/verification differences

### Previous Working Solutions:

Before this session, we successfully:
- ✅ Fixed waitlist application bugs (AI vs uploaded designs)
- ✅ Added server-side image validation
- ✅ Implemented rate limiting
- ✅ Updated JWT callback to always fetch fresh user data
- ✅ Created debug endpoint that confirmed DB has correct admin data
- ✅ Simplified waitlist UI when AI generation is disabled
- ✅ Added design type indicators (AI vs Upload) to admin pages

---

## 🎓 Lessons Learned

1. **Client vs Server State** - Client-side hooks can show different data than server-side middleware
2. **Cookie Transmission** - Cookies may not be sent with all types of navigation
3. **Debug Logging Strategy** - Need both client-side (browser console) AND server-side (Vercel logs) to see full picture
4. **Infinite Loops** - `window.location.href` in a component can cause loops if server keeps redirecting back
5. **JWT Token Inspection** - Must check middleware's `getToken()` result, not just client session

---

## ⏰ Session Timeline

1. **Start**: User reports admin not working on Vercel
2. **Investigation**: Added instrumentation to track flow
3. **Discovery**: Found middleware sees `hasToken: false`
4. **Attempt 1**: Tried `window.location.href` → Infinite loop
5. **Attempt 2**: Added redirect guard (not deployed)
6. **End**: User needs to sleep, created this document

---

## 🚀 Quick Resume Guide

When you come back to this:

1. Read the "Next Steps" section above
2. Deploy the redirect guard fix first (prevents infinite loop)
3. Focus on investigating why JWT token isn't visible to middleware
4. Check `NEXTAUTH_URL` environment variable on Vercel
5. Add JWT callback logging to see if token is being created
6. Consider the alternative solutions if JWT token investigation doesn't reveal issue

**Current Git Branch:** `main`  
**Last Commit:** "Fix: Add redirect guard to prevent infinite loop" (not pushed)  
**Pending Changes:** `app/waitlist/page.js` (redirect guard added)

---

Good luck! The issue is very close to being solved - we know exactly where the problem is (JWT token not visible to middleware), we just need to figure out why and fix it.
