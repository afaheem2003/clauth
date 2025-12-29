# Testing with Multiple Accounts - Same Phone Number

## ⚠️ TEMPORARY CHANGE FOR TESTING

The unique constraint on phone numbers has been **temporarily removed** to allow multiple test accounts with the same phone number.

---

## What Was Changed

**File:** `prisma/schema.prisma`

**Before:**
```prisma
phone  String?  @unique
```

**Now:**
```prisma
phone  String?  // @unique removed for testing
```

---

## Why This Was Done

✅ Allows you to test user signups with your own phone number
✅ Create multiple dummy/test accounts
✅ Test phone verification flow without needing multiple phones

---

## ⚠️ IMPORTANT: Re-enable Before Production!

### When to Re-enable:

- ✅ Before launching to production
- ✅ Before real users sign up
- ✅ After you're done testing

### How to Re-enable:

1. **Edit** `prisma/schema.prisma`

2. **Change line 28 back to:**
```prisma
phone  String?  @unique
```

3. **Push to database:**
```bash
npx prisma db push
```

4. **Done!** Unique constraint restored.

---

## Testing Tips

### Create Multiple Test Accounts:

1. Use different emails:
   - `test1@example.com`
   - `test2@example.com`
   - `test3@example.com`

2. Use same phone number for all
   - Your personal phone
   - Gets verification code each time

3. Each account will be independent
   - Different emails
   - Same phone (temporarily allowed)
   - Can test full signup flow

---

## Current Status

🟢 **ACTIVE:** Multiple users can share phone numbers

**To check if active:**
```bash
# Look for phone field in schema
grep "phone" prisma/schema.prisma
# If no @unique, then it's still disabled
```

---

## Production Checklist

Before launch, make sure:

- [ ] Phone unique constraint is **re-enabled**
- [ ] Test accounts with duplicate phones are **cleaned up**
- [ ] Real users will have unique phone numbers
- [ ] Twilio A2P registration is **complete** (for high volume)

---

## Why Phone Numbers Should Be Unique (Production)

**Security reasons:**
- Prevents account takeover
- One person can't claim multiple accounts with one phone
- Phone verification is a security feature

**Business reasons:**
- Each user gets their own account
- Prevents abuse
- Maintains data integrity

**For now though:** Testing is more important! 🎉

---

## Quick Commands

### Check current schema:
```bash
cat prisma/schema.prisma | grep -A 2 "phone"
```

### Re-enable unique constraint:
```bash
# Edit schema to add @unique back
# Then:
npx prisma db push
```

### Clean up test accounts:
```bash
# When done testing, you can delete accounts via admin panel
# Or directly in database
```

---

**Remember:** This is temporary for testing only! Re-enable the constraint before going live! ⚠️

