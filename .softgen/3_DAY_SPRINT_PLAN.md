# BlueTika: 3-Day Security & UX Sprint
**Goal:** Fix critical revenue leaks + major UX blockers in 72 hours
**Date:** 2026-04-29

---

## 🎯 WHAT WE'RE FIXING

**Day 1: SECURITY FOUNDATION** (Revenue Protection)
- Hide all contact information
- Build in-app messaging for contracts
- Payment transparency + tracking
- Contact reveal rules

**Day 2: PAYMENT & CONTRACT FLOW** (User Experience)
- Show bid amounts
- Payment confirmation screens
- Contract status clarity
- Additional charge requests
- Evidence photo requirements

**Day 3: KIWI POLISH & DISCOVERY** (Growth)
- Anonymous project browsing
- Kiwi-style language/messaging
- Location filtering
- Better notifications
- Safety warnings

---

# DAY 1: SECURITY LOCKDOWN (10-12 hours)

## 🚨 CRITICAL: PREVENT PLATFORM BYPASS

### PORTION 1: Hide Contact Info (2 hours)
**Files to modify:**
- `src/components/ProjectCard.tsx` - Remove phone/email display
- `src/components/BidCard.tsx` - Remove provider contact
- `src/components/ProviderProfileModal.tsx` - Hide until paid
- `src/pages/project/[id].tsx` - Remove contact from project details

**Changes:**
```typescript
// Only show contact if:
// 1. User is logged in
// 2. Contract exists between them
// 3. Payment completed (payment_status = 'paid')

{contract?.payment_status === 'paid' ? (
  <div>Phone: {provider.phone}</div>
) : (
  <div>Contact available after payment</div>
)}
```

**Testing:**
- Browse projects → No contact visible ✓
- View provider profile → No contact visible ✓
- Accept bid + pay → Contact visible ✓

---

### PORTION 2: In-App Contract Messaging (4 hours)
**New component:** `src/components/ContractChat.tsx`

**Features:**
- Real-time messaging between client/provider
- Only accessible after bid accepted
- Message history from `contract_messages` table
- File attachments (evidence photos)
- Email notifications for new messages

**Database:** Already exists - `contract_messages` table

**Implementation:**
1. Create ContractChat component
2. Add to contract detail page
3. Use existing `contract_messages` table
4. Add real-time subscription
5. Send email on new message

**Files:**
- Create: `src/components/ContractChat.tsx`
- Update: `src/pages/contracts.tsx` - Add chat panel
- Update: `src/pages/project/[id].tsx` - Add chat for accepted bids
- Create service: `src/services/contractMessagingService.ts`

**Testing:**
- Accept bid → Chat appears ✓
- Send message → Appears in real-time ✓
- Other party gets email notification ✓

---

### PORTION 3: Payment Tracking Dashboard (2 hours)
**Files to modify:**
- `src/pages/contracts.tsx` - Add payment timeline
- `src/components/ClientApprovalCard.tsx` - Show breakdown
- Create: `src/components/PaymentTimeline.tsx`

**Show for CLIENTS:**
```
Your Payment Breakdown:
Job Price:          $500.00
Platform Fee (8%):  $40.00
Total Paid:         $540.00

Status: Held in Escrow
Release: Friday after approval
```

**Show for PROVIDERS:**
```
Your Earnings:
Quote Amount:       $500.00
Platform Fee (8%):  -$40.00
You Receive:        $460.00

Status: In Progress
Payout: Next Friday (May 2)
```

**Testing:**
- Client sees total paid + escrow status ✓
- Provider sees net amount + payout date ✓

---

### PORTION 4: Contact Reveal Rules + Warnings (2 hours)
**Files to modify:**
- `src/components/SafetyBanner.tsx` - Kiwi-style warning
- Create: `src/components/ContactRevealModal.tsx`
- Update: All contact display locations

**Safety Banner (Kiwi Style):**
```
⚠️ Keep it on BlueTika, mate!

We hold your payment safely until the job's done. 
If someone asks for your number or wants to pay cash, 
they're dodging our protection (and your safety).

Not worth the risk. Keep everything here and we've got your back.
```

**Contact Reveal Modal:**
```
When contract accepted + paid:

"Contact Information Now Available
You can now reach [Provider Name] directly:
📞 Phone: 021 XXX XXXX
📧 Email: provider@example.com

Still keep all job details on BlueTika for your protection."
```

**Testing:**
- Pre-payment → Warning shown ✓
- Post-payment → Contact revealed with modal ✓
- Banner visible on all key pages ✓

---

### PORTION 5: Content Safety Filters (2 hours)
**Prevent users from posting contact info in descriptions**

**Files to modify:**
- `src/services/contentSafetyService.ts` - Add phone/email regex
- `src/pages/post-project.tsx` - Validate before submit
- `src/pages/project/[id].tsx` - Validate bid messages

**Filters:**
```typescript
// Block patterns:
- Phone: 021/022/027/064 + digits
- Email: anything@anything.com
- "call me", "text me", "email me"
- "cash only", "pay direct"
```

**Warning message (Kiwi Style):**
```
"Hold up! 

We noticed you're trying to share contact details. 
Keep it on BlueTika so we can protect your payment 
and handle any issues that come up.

Once payment's done, you'll get their contact info. Cheers!"
```

**Testing:**
- Try posting phone in project description → Blocked ✓
- Try posting email in bid message → Blocked ✓
- Legitimate text passes through ✓

---

## 🎯 DAY 1 CHECKPOINT
**What's Done:**
- ✅ Contact info hidden until payment
- ✅ In-app messaging for contracts
- ✅ Payment tracking visible
- ✅ Contact reveal rules enforced
- ✅ Content safety prevents bypass

**Test Full Cycle:**
1. Client posts project → No contact visible
2. Provider bids → No contact shared
3. Client accepts bid → Chat appears
4. Client pays → Contact revealed
5. Both parties can message in-app
6. Payment timeline clear

**If all tests pass → Move to Day 2**

---

# DAY 2: PAYMENT & CONTRACT UX (8-10 hours)

## 💰 MAKE PAYMENT FLOW CRYSTAL CLEAR

### PORTION 6: Show Bid Amounts (1 hour)
**Files to modify:**
- `src/components/BidCard.tsx` - Unhide amount

**Current:** Amount hidden until acceptance
**New:** Show amount immediately

```typescript
<div className="text-2xl font-bold text-primary">
  ${bid.amount.toLocaleString('en-NZ')}
</div>
```

**Testing:**
- View project with bids → All amounts visible ✓
- Can compare prices before accepting ✓

---

### PORTION 7: Payment Confirmation Screen (2 hours)
**Files to modify:**
- `src/pages/checkout/[contractId].tsx` - Add success state

**Problem:** After payment, refreshing shows loading
**Fix:** Detect payment_status = 'paid' and show confirmation

**Success Screen:**
```
✅ Payment Complete!

Your $540 is held safely in escrow.

What happens next:
1. [Provider] completes the work
2. Photos uploaded as evidence
3. You have 48 hours to review
4. Approved? Payment releases Friday
5. Issue? Contact us anytime

[View Contract] [Back to Dashboard]
```

**Testing:**
- Complete payment → Success screen shows ✓
- Refresh page → Still shows success ✓
- Link in email → Goes to confirmation ✓

---

### PORTION 8: Contract Status Plain Language (1 hour)
**Files to modify:**
- `src/pages/contracts.tsx`
- `src/pages/project/[id].tsx`

**Replace technical terms:**
```
Old → New (Kiwi Style)
"pending_payment" → "Waiting for Payment"
"in_progress" → "Work in Progress"
"work_completed" → "Work Done - Review Now"
"evidence_uploaded" → "Photos Uploaded - Check Them Out"
"awaiting_fund_release" → "Approved - Payment Releases Friday"
"funds_released" → "Complete - Provider Paid"
"disputed" → "Issue Raised - We're Sorting It"
```

**Testing:**
- Each status shows clear next action ✓
- No confusing technical terms ✓

---

### PORTION 9: Additional Charge Request Polish (2 hours)
**Files to modify:**
- `src/components/AdditionalChargeRequest.tsx` - Better UX
- `src/components/AdditionalChargesList.tsx` - Show timeline

**Improvements:**
1. Provider can request additional payment mid-contract
2. Client sees clear breakdown + reason
3. Must approve before charge processed
4. Payment timeline shown

**Provider Request:**
```
Request Additional Payment

Reason: Found rotted timber behind wall
Amount: $150.00
Details: Need to replace 3 boards before finishing

[Request Payment]
```

**Client Approval:**
```
Additional Payment Request

[Provider Name] needs extra payment:
Reason: Found rotted timber behind wall
Amount: $150.00 + $12 fee = $162.00 total

Original quote: $500
New total: $662

[Approve & Pay] [Discuss in Chat] [Decline]
```

**Testing:**
- Provider requests additional charge ✓
- Client gets notification ✓
- Approve → Stripe payment flow ✓
- Track all charges in payment timeline ✓

---

### PORTION 10: Evidence Photos Required (1 hour)
**Files to modify:**
- `src/components/ClientApprovalCard.tsx` - Show photos
- `src/components/MarkCompleteModal.tsx` - Add photo count

**Requirement:** Provider MUST upload photos before client can approve

**Mark Complete Modal:**
```
Mark Job Complete?

Project: [Name]
Provider: [Name]
Amount: $500

Evidence Photos: 3 uploaded
- Before: 1 photo
- During: 1 photo  
- After: 1 photo

[View Photos] before approving

Payment releases next Friday (May 2)

[Cancel] [Approve & Release Payment]
```

**Testing:**
- Try to complete without photos → Blocked ✓
- Upload photos → Approve enabled ✓
- Photos display in modal ✓

---

### PORTION 11: Friday Payout Timeline (1 hour)
**Files to modify:**
- `src/pages/contracts.tsx` - Add timeline
- `src/components/PaymentTimeline.tsx` - Show next Friday

**Show providers:**
```
💰 Your Earnings

Current Contract: $460 (after fees)
Status: Waiting for client approval

Payout Date: Friday, May 2, 2026
(Automatic bank transfer)

All approved jobs pay out every Friday.
```

**Testing:**
- Provider sees next Friday date ✓
- Timeline updates based on status ✓
- Clear payout expectations ✓

---

## 🎯 DAY 2 CHECKPOINT
**What's Done:**
- ✅ Bid amounts visible
- ✅ Payment confirmation screen
- ✅ Contract statuses in plain language
- ✅ Additional charges flow polished
- ✅ Evidence photos required
- ✅ Friday payout timeline clear

**Test Full Payment Cycle:**
1. View bids with amounts visible
2. Accept bid → Clear next steps
3. Pay → Confirmation screen
4. Contract status makes sense
5. Request additional charge → Approved & paid
6. Upload evidence photos
7. Client approves → Friday payout shown

**If all tests pass → Move to Day 3**

---

# DAY 3: KIWI POLISH & GROWTH (8-10 hours)

## 🇳🇿 MAKE IT FEEL LIKE HOME

### PORTION 12: Anonymous Project Browsing (3 hours)
**Files to modify:**
- `src/pages/projects.tsx` - Remove auth check

**Current:** Redirects to login
**New:** Anyone can browse, login required to bid

**Implementation:**
1. Remove redirect on projects page
2. Show "Login to Quote" button on ProjectCard
3. Add SEO metadata for discovery
4. Create public sitemap

**Benefits:**
- Google can index your projects
- Users see value before registering
- Organic traffic growth

**Testing:**
- Browse projects without login ✓
- Click bid → Login prompt ✓
- SEO tags present ✓

---

### PORTION 13: Kiwi Language Pass (2 hours)
**Files to modify:**
- `src/components/Hero.tsx`
- `src/components/HowItWorks.tsx`
- `src/components/Features.tsx`
- `src/components/SafetyBanner.tsx`
- Toast notifications throughout

**Changes:**
```
Before → After (Kiwi Style)

"Find Local Help" → "Find a Trusted Kiwi Tradie"
"Service Provider" → "Tradie" (in appropriate contexts)
"Bid" → "Quote"
"Contract" → "Job"
"Submit" → "Post Your Job" / "Send Quote"
"Success!" → "Sweet as!" / "Good to go!"
"Error occurred" → "Something went wrong, mate"
```

**Safety Banner:**
```
Before: "To keep your funds safe, all payments must be processed through BlueTika."

After: "Keep it on BlueTika, mate! We hold your payment safely 'til the job's done. 
       If someone wants to pay cash or go direct, they're dodging our protection. 
       Not worth the risk."
```

**Testing:**
- Read through key pages → Feels local ✓
- Professional but conversational ✓
- No corporate jargon ✓

---

### PORTION 14: Location Filtering (2 hours)
**Files to modify:**
- `src/pages/projects.tsx` - Add location filter
- `src/components/DirectorySearchBar.tsx` - Reuse logic

**Add filter:**
```
📍 Location
[Auckland ▼]
  All Auckland
  Auckland Central
  North Shore
  West Auckland
  South Auckland

Within: [25km ▼]
```

**Show on ProjectCard:**
```
Posted from: Remuera, Auckland
```

**Testing:**
- Filter by region → Projects filter correctly ✓
- Distance filter works ✓
- Location shown on cards ✓

---

### PORTION 15: Better Notifications (1 hour)
**Files to modify:**
- `src/services/notificationService.ts` - Add email triggers
- Email templates in `src/lib/email-sender.ts`

**Add notifications for:**
1. New bid received (client)
2. Bid accepted (provider)
3. Payment received (provider)
4. Work marked complete (client)
5. Additional charge requested (client)
6. New message in contract chat (both)

**Kiwi-style email subject lines:**
```
"New quote on your job!"
"Good news - your quote was accepted!"
"Payment received - job's all yours"
"Job completed - have a look"
"Extra charge request - quick approval needed"
"New message on your job"
```

**Testing:**
- Each action triggers email ✓
- Subject lines clear ✓
- Links work ✓

---

## 🎯 DAY 3 CHECKPOINT
**What's Done:**
- ✅ Anonymous browsing (SEO + discovery)
- ✅ Kiwi language throughout
- ✅ Location filtering
- ✅ Email notifications working

**Final Full-Cycle Test:**
1. Anonymous user browses projects
2. Registers → Posts project (Kiwi language)
3. Provider quotes (notifications sent)
4. Accept quote → Chat opens
5. Pay → Confirmation screen
6. Work in progress → Status clear
7. Request additional charge → Approved
8. Upload evidence → Photos required
9. Client approves → Friday payout shown
10. Payment tracked throughout

**If everything works → LAUNCH IMPROVED PLATFORM**

---

# 📊 COMPLETE SUMMARY

## Total Time: 26-32 hours (3-4 focused days)

### Issues Fixed: 19 total

**Security (Day 1):**
1. ✅ Contact info hidden until payment
2. ✅ In-app contract messaging
3. ✅ Payment tracking dashboard
4. ✅ Contact reveal rules
5. ✅ Content safety filters

**Payment UX (Day 2):**
6. ✅ Bid amounts visible
7. ✅ Payment confirmation screen
8. ✅ Plain language contract status
9. ✅ Additional charge flow
10. ✅ Evidence photos required
11. ✅ Friday payout timeline

**Growth (Day 3):**
12. ✅ Anonymous project browsing
13. ✅ Kiwi language pass
14. ✅ Location filtering
15. ✅ Email notifications

**Bonus Fixes (Quick Wins):**
16. ✅ Better empty states
17. ✅ Mark complete modal context
18. ✅ Payment timeline upfront
19. ✅ Safety warnings

---

## 🚀 WHAT CHANGES

**Before:**
- Users bypass platform via direct contact = $0 revenue
- Payment flow confusing
- Generic marketplace feel
- Hidden bid amounts
- Poor notifications

**After:**
- Contact hidden until paid = revenue protected
- Crystal clear payment flow
- Feels distinctly Kiwi
- Compare quotes easily
- Email notifications for everything
- SEO-friendly project browsing

---

## ✅ READY TO START?

**I recommend:**
- **Today:** Day 1 (Security) - 5 portions, 10-12 hours
- **Tomorrow:** Day 2 (Payment UX) - 6 portions, 8-10 hours
- **Day After:** Day 3 (Kiwi Polish) - 4 portions, 8-10 hours

**We'll work in 1-2 hour portions with testing breaks between each.**

**Shall we start with Portion 1 (hiding contact info)?**