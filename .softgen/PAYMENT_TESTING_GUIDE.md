# Payment System Testing Guide

## 🔧 Setup Requirements

### 1. Environment Variables (.env.local)
```env
# Stripe Test Mode Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here

# AWS SES for Receipt Emails
AWS_SES_REGION=ap-southeast-2
AWS_SES_ACCESS_KEY_ID=your_access_key_here
AWS_SES_SECRET_ACCESS_KEY=your_secret_access_key_here
```

### 2. Get Stripe Test Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Toggle to "Test Mode" (top right)
3. Copy your publishable key (starts with `pk_test_`)
4. Copy your secret key (starts with `sk_test_`)

### 3. Configure AWS SES (Optional for testing)
- Skip if you just want to test payment flow
- Required for actual receipt emails
- Set up in AWS Console > SES > Verified Identities

---

## 🧪 Complete Payment Flow Test

### Step 1: Create Test Accounts

**Client Account:**
```
Email: client@test.com
Password: Test123!
```

**Service Provider Account:**
```
Email: provider@test.com
Password: Test123!
```

**Admin Account:**
```
Email: admin@bluetika.co.nz (or your admin email)
```

### Step 2: Provider Setup

1. **Login as provider** (`provider@test.com`)
2. Go to **Account** page (`/account`)
3. Click **"Become a Service Provider"**
4. Complete verification (skip ID upload in test mode)
5. **Connect Stripe Account:**
   - Click **"Connect Stripe Account"**
   - Redirected to Stripe onboarding
   - Use Stripe test data:
     ```
     Business name: Test Provider
     Phone: (555) 123-4567
     Any test data for forms
     ```
   - Complete setup
   - Verify you're redirected back to `/account?stripe_setup=success`
6. **Verify Stripe Status:**
   - Should show "Active" badge
   - Charges: ✓ Enabled
   - Payouts: ✓ Enabled
   - Details: ✓ Submitted

### Step 3: Client Posts Project

1. **Login as client** (`client@test.com`)
2. Click **"Post a Project"**
3. Fill in project details:
   ```
   Title: Test Garden Cleanup
   Category: Gardening
   Location: Auckland
   Budget: $500
   Description: Need garden cleaned before winter
   Specific Date: [Choose tomorrow]
   ```
4. Submit project
5. Verify project appears on `/projects`

### Step 4: Provider Submits Bid

1. **Login as provider** (`provider@test.com`)
2. Go to **Browse Projects** (`/projects`)
3. Find "Test Garden Cleanup"
4. Click project to view details
5. Submit bid:
   ```
   Bid Amount: $450
   Message: I have 5 years experience in garden maintenance...
   ```
6. Verify bid appears on project page

### Step 5: Client Accepts Bid

1. **Login as client** (`client@test.com`)
2. Go to project page
3. Click **"Accept Bid"** on provider's bid
4. Confirm in modal
5. **Verify redirect to checkout page** (`/checkout/[contractId]`)

### Step 6: Payment Checkout - CRITICAL TEST

**Expected Page Elements:**

1. **7-Step Progress Bar:**
   - Posted ✓
   - Bid Accepted ✓
   - **Payment** ← (highlighted/active - step 3)
   - Work (upcoming)
   - Evidence (upcoming)
   - Review (upcoming)
   - Release (upcoming)

2. **Fee Breakdown:**
   ```
   Agreed price:                        NZD $450.00
   Platform fee (2%):                   NZD $9.00
   Payment processing contribution ❓:  NZD $12.23
   GST:                                 Not applicable (grey)
   ───────────────────────────────────────────────
   Total:                               NZD $471.23
   ```

3. **❓ Tooltip Test:**
   - Hover over ❓ icon
   - Should show: "BlueTika uses Stripe for secure payments. Domestic cards: 2.65% + $0.30. International cards: 3.7% + $0.30. This small contribution keeps your payment protected."

4. **Escrow Notice:**
   - Should display before payment form
   - Blue shield icon
   - Text: "Your payment will be held securely until the project is complete and both parties have reviewed each other."

### Step 7: Complete Test Payment

1. **Use Stripe Test Card:**
   ```
   Card Number: 4242 4242 4242 4242
   Expiry: Any future date (e.g., 12/25)
   CVC: Any 3 digits (e.g., 123)
   ZIP: Any 5 digits (e.g., 12345)
   ```

2. **Click "Pay NZD $471.23"**

3. **Verify Success Screen:**
   - Green checkmark icon
   - "Payment Successful!"
   - "Receipts sent to both parties" (if SES configured)
   - Escrow protection notice appears
   - Auto-redirect to `/contracts` after 3 seconds

### Step 8: Verify Payment Recorded

**Client Side:**
1. Go to **My Contracts** (`/contracts`)
2. Find "Test Garden Cleanup"
3. Verify:
   - Status: "Active" or "Payment Confirmed"
   - Payment badge: "Paid"
   - Total amount: $471.23
   - Platform fee: $9.00
   - Processing fee: $12.23

**Provider Side:**
1. **Login as provider**
2. Go to **My Contracts**
3. Verify notification: "Payment received for Test Garden Cleanup"
4. Contract shows payment received

**Database Check:**
```sql
SELECT 
  id,
  payment_status,
  stripe_payment_intent_id,
  final_amount,
  platform_fee,
  payment_processing_fee,
  total_amount
FROM contracts
WHERE project_id = '[your_project_id]';
```

Expected:
```
payment_status: confirmed
stripe_payment_intent_id: pi_test_xxxxx
final_amount: 450.00
platform_fee: 9.00
payment_processing_fee: 12.23
total_amount: 471.23
```

### Step 9: Email Receipts (If SES Configured)

**Client Receipt:**
- Subject: "Payment Confirmation - BlueTika"
- From: noreply@bluetika.co.nz
- Contains:
  - Transaction ID
  - Payment date
  - Breakdown (agreed price, fees, total)
  - Project title
  - Provider name
  - Escrow notice

**Provider Receipt:**
- Subject: "Payment Received - BlueTika"
- From: noreply@bluetika.co.nz
- Contains:
  - Transaction ID
  - Payment date
  - Breakdown showing commission deduction
  - Estimated payout after release

### Step 10: Work Phase

1. **Provider completes work**
2. **Upload evidence photos:**
   - Go to contract in `/contracts`
   - Upload "before" and "after" photos
   - Mark work as complete

3. **Client confirms:**
   - Views evidence photos
   - Submits photos if required
   - Leaves review + star rating

4. **Provider leaves review:**
   - Reviews client
   - Star rating

### Step 11: Admin Fund Release

1. **Login as admin** (admin@bluetika.co.nz)
2. Go to **Admin Panel** → **Fund Releases** (`/muna/fund-releases`)
3. Find "Test Garden Cleanup" contract
4. Verify displays:
   - Contract ID
   - Client + Provider names
   - Amount: $450.00
   - Commission: [calculated based on tier]
   - Provider will receive: [after commission]
   - Waiting time: [X days]
   - Status: "Pending Release"

5. **Review contract:**
   - Photos submitted: ✓
   - Both reviews complete: ✓
   - No active disputes: ✓

6. **Click "Release Funds"**

7. **Verify:**
   - Status changes to "Released"
   - Provider notification: "Payment Released - arrive in 2-3 business days"
   - Fund release recorded in database
   - Stripe processes payout to provider's account

---

## 🎯 Expected Test Results

### ✅ Success Checklist

- [ ] Provider can connect Stripe account
- [ ] Client redirected to checkout after accepting bid
- [ ] 7-step progress bar shows step 3 active
- [ ] Fee breakdown displays correctly
- [ ] ❓ tooltip shows Stripe fee explanation
- [ ] Escrow notice displayed
- [ ] Test payment completes successfully
- [ ] Success screen shows with redirect
- [ ] Contract status updated to "payment_confirmed"
- [ ] Payment details saved (fees, total, Stripe ID)
- [ ] Both parties receive in-platform notifications
- [ ] Email receipts sent (if SES configured)
- [ ] Contract appears in both parties' contract lists
- [ ] Admin can see contract in fund releases
- [ ] Admin can release funds after work complete
- [ ] Provider receives payout to Stripe account

---

## 🚨 Common Issues & Solutions

### Issue: "Failed to create payment intent"
**Solution:** 
- Check Stripe secret key in `.env.local`
- Verify key starts with `sk_test_`
- Restart dev server after adding keys

### Issue: Stripe redirect not working
**Solution:**
- Check browser console for errors
- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- Clear browser cache

### Issue: Receipt emails not sending
**Solution:**
- This is optional for testing
- Verify AWS SES credentials
- Check SES verified identities
- Email functionality won't block payment

### Issue: Can't see contract in fund releases
**Solution:**
- Make sure both parties submitted photos
- Both parties must complete reviews
- Check `ready_for_release_at` timestamp in database

### Issue: Processing fee shows $0.00
**Solution:**
- Admin needs to set `payment_processing_percentage` in platform_settings
- Go to `/muna/settings`
- Set value (default should be 2.65)

---

## 💡 Additional Tests

### Test Different Card Scenarios

**Successful Payment:**
```
4242 4242 4242 4242
```

**Payment Requires Authentication (3D Secure):**
```
4000 0027 6000 3184
```

**Declined Card:**
```
4000 0000 0000 0002
```

### Test Edge Cases

1. **Client leaves during checkout** - payment not completed
2. **Multiple bids on same project** - only one can be accepted
3. **Provider without Stripe account** - should prompt to connect first
4. **Dispute raised** - fund release blocked until resolved

---

## 📊 Database Verification Queries

### Check payment details:
```sql
SELECT * FROM contracts WHERE id = '[contract_id]';
```

### Check notifications sent:
```sql
SELECT * FROM notifications WHERE related_id = '[contract_id]' ORDER BY created_at DESC;
```

### Check fund release status:
```sql
SELECT * FROM fund_releases WHERE contract_id = '[contract_id]';
```

### Check platform settings:
```sql
SELECT * FROM platform_settings WHERE setting_key = 'payment_processing_percentage';
```

---

## ✨ Testing Complete!

If all checklist items pass, your payment system is working correctly:

1. ✅ **Escrow System** - Funds held by BlueTika
2. ✅ **Secure Payment** - Stripe integration working
3. ✅ **Fee Transparency** - All fees displayed clearly
4. ✅ **Notifications** - Both parties notified
5. ✅ **Receipts** - Professional emails sent
6. ✅ **Manual Release** - Admin control over payouts
7. ✅ **Dispute Protection** - Funds held until cleared

**Next Steps:**
- Test with real Stripe account (live mode)
- Configure production AWS SES
- Set payment processing percentage in admin settings
- Add your bank account to Stripe for fund management