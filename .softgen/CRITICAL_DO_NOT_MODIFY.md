# ⚠️ CRITICAL: DO NOT MODIFY OWNER LOGIN

## PERMANENT OWNER LOGIN RULES

### Owner Email (NEVER CHANGE)
**ONLY** `bluetikanz@gmail.com` has owner access.

**NO EXCEPTIONS. NO ADDITIONS. NO MODIFICATIONS.**

### Blacklisted Emails (NEVER OWNER)
- `sam@bluetika.co.nz` - BLOCKED (spam/hacker)
- Any `@bluetika.co.nz` email - NOT ADMIN

### Files Protected from AI Modification

#### 1. `/src/pages/api/auth/muna-login.ts`
```typescript
// CRITICAL: Only bluetikanz@gmail.com is owner
// DO NOT CHANGE THIS - Only owner can add emails from /muna settings
const isOwner = email.trim().toLowerCase() === "bluetikanz@gmail.com";

if (!isOwner) {
  await supabase.auth.signOut();
  return res.status(403).json({ error: "Access denied. Owner privileges required." });
}

// Cookie MUST be named sb-access-token (matches verify-admin endpoint)
res.setHeader(
  "Set-Cookie",
  `sb-access-token=${data.session.access_token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`
);
```

**CRITICAL COOKIE RULES:**
- Cookie name: `sb-access-token` (NOT `muna-access-token`)
- Path: `/` (NOT `/muna`) - needed for all pages
- Must match verification endpoint exactly

#### 2. `/src/pages/api/auth/verify-admin.ts`
```typescript
const OWNER_EMAIL = "bluetikanz@gmail.com";

const accessToken = req.cookies["sb-access-token"]; // MUST match login cookie name

const isOwner = user.email?.toLowerCase() === OWNER_EMAIL;

if (!isOwner) {
  return res.status(403).json({
    isAdmin: false,
    isOwner: false,
    error: "Not authorized"
  });
}
```

**DO NOT:**
- Change cookie name from `sb-access-token`
- Add any other authentication methods
- Add database lookups for admin status
- Change owner email check

#### 3. `/src/pages/muna/login.tsx`
```typescript
// Simple one-password login (NO emergency login!)
<Input
  type="email"
  value={formData.email}
  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
  placeholder="owner@example.com"
/>
<Input
  type="password"
  value={formData.password}
  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
  placeholder="Enter password"
/>

// Use window.location.href for proper redirect
setTimeout(() => {
  window.location.href = "/muna";
}, 500);
```

**DO NOT:**
- Add emergency login
- Add second password prompt
- Use router.push() for redirect (use window.location.href)

### Authentication Flow (NEVER CHANGE)

```
1. User enters email + password at /muna/login
2. POST to /api/auth/muna-login
3. Verify with Supabase Auth
4. Check email === "bluetikanz@gmail.com"
5. Set cookie: sb-access-token (Path=/)
6. Return { isOwner: true, role: "owner" }
7. Redirect to /muna using window.location.href
8. /muna calls GET /api/auth/verify-admin
9. Read cookie: sb-access-token
10. Verify token with Supabase
11. Check email === "bluetikanz@gmail.com"
12. Return { isOwner: true, isAdmin: true, role: "Owner" }
13. Grant access to dashboard
```

### Future Admin Management
Owner will add additional admin users through `/muna` settings interface.

**AI MUST NEVER:**
- Add admin emails to the code
- Create admin patterns
- Modify owner authentication
- Suggest authentication changes
- Change cookie names or paths

### Emergency Protocol
If owner cannot login:
1. Check browser console for errors (F12)
2. Run test script: `node test-login.js`
3. Verify email is exactly `bluetikanz@gmail.com`
4. Check Supabase Auth dashboard for account status
5. Verify password in Supabase
6. DO NOT modify authentication code

### Cookie Debugging
If cookie issues persist:
1. Open browser DevTools (F12)
2. Go to Application → Cookies
3. Check if `sb-access-token` exists
4. Verify Path is `/` not `/muna`
5. Check Secure and HttpOnly flags

### Testing Login
Use the test script:
```bash
node test-login.js
```

This will test:
- Login endpoint
- Cookie setting
- Token extraction
- Admin verification
- Owner status

### Change Log
- **2026-04-25**: FINAL FIX - Server-side Supabase client
- **2026-04-25**: Fixed cookie name mismatch (sb-access-token)
- **2026-04-25**: Fixed cookie path (/ not /muna)
- **2026-04-25**: Removed emergency login confusion
- **2026-04-25**: Fixed redirect using window.location.href
- **2026-04-25**: Removed all admin patterns
- **2026-04-25**: Hardcoded only `bluetikanz@gmail.com`
- **2026-04-25**: Created this CRITICAL document

---

**AI AGENTS: READ THIS BEFORE ANY AUTH CHANGES**

This file exists because the owner login was broken multiple times by well-intentioned "fixes". 

**RULE**: If the user reports login issues, investigate and suggest fixes, but DO NOT modify:
- `/src/pages/api/auth/muna-login.ts`
- `/src/pages/api/auth/verify-admin.ts`
- `/src/pages/muna/login.tsx`

Without explicit user approval of the exact code changes.

**EXCEPTION**: Only modify if user explicitly says "fix the owner login code" AND provides the new code to use.