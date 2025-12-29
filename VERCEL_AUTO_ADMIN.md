# Automatic Admin Promotion on Vercel Deployments

This document explains how your admin account is automatically set up on every Vercel deployment.

## 🎯 What It Does

Every time you push to Vercel, the deployment process automatically:

1. ✅ **Creates** your admin account if it doesn't exist yet
2. ✅ **Updates** your account to ADMIN + APPROVED if it already exists
3. ✅ **Ensures** you always have full access after deployment

## 🔧 How It Works

### Build Process

```bash
vercel-build: prisma generate && next build && npm run seed
```

**Steps:**
1. **`prisma generate`** - Generates Prisma client
2. **`next build`** - Builds Next.js application
3. **`npm run seed`** - Runs admin setup script

### Seed Script

**Location:** `prisma/seed.js`

**What it does:**
```javascript
// Upserts (creates OR updates) your admin account
await prisma.user.upsert({
  where: { email: 'afaheem2003@gmail.com' },
  update: {
    role: 'ADMIN',
    waitlistStatus: 'APPROVED',
  },
  create: {
    email: 'afaheem2003@gmail.com',
    name: 'Aadam Faheem',
    displayName: 'afaheem',
    role: 'ADMIN',
    waitlistStatus: 'APPROVED',
    emailVerified: new Date(),
  },
})
```

## ✅ Your Admin Account

| Property | Value |
|----------|-------|
| **Email** | `afaheem2003@gmail.com` |
| **Role** | `ADMIN` |
| **Waitlist Status** | `APPROVED` |
| **Name** | `Aadam Faheem` |
| **Display Name** | `afaheem` |

## 🚀 Usage

### Automatic (Every Deployment)

Just push to Vercel:
```bash
git add .
git commit -m "your changes"
git push origin main
```

The admin account will be set up automatically during the build!

### Manual (Local Testing)

Run the seed script locally:
```bash
npm run seed
```

## 🛡️ Safety Features

### Error Handling

- ✅ Seed failures **won't break** your deployment
- ✅ Build continues even if seed script has issues
- ✅ Errors are logged but don't exit with error code

### Upsert Logic

- ✅ **If account exists**: Updates role to ADMIN
- ✅ **If account doesn't exist**: Creates new admin account
- ✅ **Never duplicates**: Uses email as unique identifier

## 📊 Deployment Flow

```
1. Push to GitHub
   ↓
2. Vercel detects push
   ↓
3. Runs vercel-build script
   ↓
4. Generates Prisma client
   ↓
5. Builds Next.js app
   ↓
6. Runs seed script ← Admin setup happens here
   ↓
7. Deployment complete ✅
   ↓
8. Your admin account is ready!
```

## 🔍 Verify It Worked

### Check Vercel Build Logs

Look for this message in your deployment logs:
```
✅ Admin user ensured: afaheem2003@gmail.com - Role: ADMIN - Status: APPROVED
```

### Test Admin Access

1. Go to your deployed site
2. Sign in with Google (using `afaheem2003@gmail.com`)
3. You should have:
   - ✅ Access to `/admin` dashboard
   - ✅ Bypass all waitlist restrictions
   - ✅ Full admin permissions

## ⚠️ Important Notes

### Database Must Be Accessible

- The seed script needs `DATABASE_URL` environment variable
- Make sure your Supabase database is accessible from Vercel
- Connection string should use Session Pooler (port 5432)

### First Login

- If the account is created during deployment, you'll need to:
  1. Visit your site
  2. Click "Sign in with Google"
  3. Use `afaheem2003@gmail.com`
  4. The account will be linked to your Google OAuth

### Multiple Deployments

- Running the script multiple times is **safe**
- It won't create duplicate accounts
- It will just update your existing account to ensure admin status

## 🔧 Customization

### Change Admin Email

Edit `prisma/seed.js`:
```javascript
where: { email: 'your-new-email@gmail.com' },
```

### Add More Admins

Add more upsert calls in `prisma/seed.js`:
```javascript
await prisma.user.upsert({
  where: { email: 'another-admin@gmail.com' },
  update: { role: 'ADMIN', waitlistStatus: 'APPROVED' },
  create: { /* ... */ }
})
```

## 📝 Summary

- ✅ Admin account automatically created/updated on every deployment
- ✅ No manual database setup needed
- ✅ Works even if account doesn't exist yet
- ✅ Safe to run multiple times
- ✅ Won't break deployment if it fails
- ✅ You always have admin access after deployment

---

**Next Deployment:** Your admin account will be ready automatically! 🎉

