---
title: "Day 1 Sprint: Security + Chat + Payment Requests"
status: todo
priority: urgent
type: feature
tags: [security, chat, payment, critical]
created_by: agent
created_at: 2026-04-29
position: 33
---

## Notes

**GOAL:** Make platform secure and functional for launch in ONE DAY (8 hours)

**What we're building:**
1. Hide all contact info until payment complete (revenue protection)
2. In-app chat for contracts (communication channel)
3. Additional payment requests through platform (expand contract value)

**Tech stack:**
- Existing: `contract_messages` table (chat storage)
- Existing: `additional_charges` table (extra payments)
- Existing: AdditionalChargeRequest component (needs integration)
- New: ContractChat component
- Updates: Hide contact logic in 3 components

**Business logic:**
- Contact info (phone/email) hidden from everyone UNTIL payment complete
- Chat available ONLY on active contracts (status: in_progress, work_completed, evidence_uploaded)
- Additional charges can be requested through chat interface
- Client approves/declines additional charges
- If approved → Stripe payment → funds added to escrow

**Database - NO CHANGES NEEDED** (tables already exist):
- `contract_messages` - chat storage
- `additional_charges` - payment requests
- `contracts` - payment status tracking

---

## Checklist

### **PORTION 1: Hide Contact Info** (2 hours) ⏱️

**File 1: src/components/ProjectCard.tsx**
- [ ] Wrap phone display in payment status check
- [ ] Show "Contact available after payment" placeholder
- [ ] Add tooltip explaining why hidden

**File 2: src/components/BidCard.tsx**
- [ ] Hide provider phone until bid accepted + paid
- [ ] Add same placeholder message
- [ ] Style consistently

**File 3: src/components/ProviderProfileModal.tsx**
- [ ] Check if viewer has paid contract with this provider
- [ ] Hide contact section if not paid
- [ ] Add "Connect via BlueTika" message with icon

**Test Cases:**
- [ ] Browse projects → No phone visible
- [ ] View provider profile → Contact hidden
- [ ] Accept bid + pay → Contact appears
- [ ] Different user views same provider → Still hidden

**STOP & TEST** - Verify no contact leaks anywhere

---

### **PORTION 2: Create Contract Chat Component** (3 hours) ⏱️

**File 1: Create src/components/ContractChat.tsx**
- [ ] Import contract_messages service
- [ ] Real-time message list (newest first or oldest first - decide)
- [ ] Text input with send button
- [ ] Show sender name + timestamp
- [ ] Auto-scroll to latest message
- [ ] Loading states
- [ ] Empty state: "Start conversation with [name]"
- [ ] Mark who is client vs provider with badges

**Features:**
- [ ] Send text message (200 char limit)
- [ ] Display all messages for this contract
- [ ] Show sender avatar/initials
- [ ] Timestamp formatting (e.g., "2 hours ago", "Yesterday 3:45pm")
- [ ] Prevent empty messages
- [ ] Realtime updates (poll every 10 seconds OR use Supabase realtime)

**File 2: Create src/services/contractMessageService.ts**
- [ ] sendMessage(contractId, senderId, message)
- [ ] getMessages(contractId) - ordered by created_at
- [ ] markAsRead(messageId) - for future read receipts

**Test Cases:**
- [ ] Send message as client → appears in provider's view
- [ ] Send message as provider → appears in client's view
- [ ] Refresh page → messages persist
- [ ] Empty contract → shows helpful empty state

**STOP & TEST** - Send messages back and forth

---

### **PORTION 3: Integrate Chat into Contracts Page** (1 hour) ⏱️

**File: src/pages/contracts.tsx**
- [ ] Add ContractChat component to contract detail view
- [ ] Position chat in right sidebar OR below contract details
- [ ] Show chat ONLY for contracts with payment_status: 'paid'
- [ ] Hide for pending/cancelled contracts
- [ ] Add "Messages" section header
- [ ] Responsive: stack on mobile

**Layout suggestion:**
```
[Contract Details Card]
[Evidence Photos Card]
[Additional Charges Card]
[Chat Card] ← NEW
[Mark Complete Button]
```

**Test Cases:**
- [ ] Contract with payment → Chat visible
- [ ] Contract without payment → Chat hidden
- [ ] Mobile view → Chat accessible
- [ ] Multiple contracts → Each has separate chat

**STOP & TEST** - Navigate to contract, see chat, send messages

---

### **PORTION 4: Email Notifications for Messages** (1 hour) ⏱️

**File: src/services/contractMessageService.ts**
- [ ] After sendMessage succeeds → trigger email
- [ ] Get recipient email (if sender is client → email provider, vice versa)
- [ ] Email template: "New message on your contract: [preview]"
- [ ] Link to contract page
- [ ] Subject: "💬 [Name] sent you a message on BlueTika"

**Email content:**
- Sender name
- First 100 chars of message
- Project title
- Direct link to contract page
- "Reply on BlueTika" CTA button

**Test Cases:**
- [ ] Send message → Recipient gets email within 60 seconds
- [ ] Email link → Opens correct contract
- [ ] Email preview shows message content

**STOP & TEST** - Send message, check email inbox

---

### **PORTION 5: Additional Payment Integration** (1 hour) ⏱️

**File: src/pages/contracts.tsx**
- [ ] Add AdditionalChargeRequest component ABOVE chat
- [ ] Show for provider when contract status is in_progress
- [ ] Client sees AdditionalChargesList with approve/decline buttons
- [ ] After approval → Stripe payment flow
- [ ] After payment → Funds added to contract total

**Flow:**
1. Provider clicks "Request Additional Payment"
2. Modal opens: Enter amount + reason
3. Submit → Creates additional_charges record (status: pending)
4. Client sees notification in contract view
5. Client approves → Redirects to /checkout-additional/[chargeId]
6. Payment succeeds → Charge status: approved, funds in escrow
7. Provider sees confirmation

**File: src/components/AdditionalChargeRequest.tsx** (already exists - verify)
- [ ] Check it's using correct service
- [ ] Verify modal styling matches platform
- [ ] Test amount validation (min $10, max reasonable)

**File: src/components/AdditionalChargesList.tsx** (already exists - verify)
- [ ] Shows pending charges to client with Approve button
- [ ] Shows approved charges with amount + status
- [ ] Declined charges grayed out

**Test Cases:**
- [ ] Provider requests $50 extra for materials
- [ ] Client approves → Payment screen
- [ ] Payment succeeds → Shows in contract total
- [ ] Client declines → Request marked declined
- [ ] Provider can't request on cancelled contract

**STOP & TEST** - Full additional payment cycle

---

### **PORTION 6: Final Polish & Safety** (30 mins) ⏱️

**Safety Warnings:**
- [ ] Add banner: "Keep all payments on BlueTika. Never pay outside the platform."
- [ ] In chat placeholder: "No phone numbers, email, or payment details in messages"
- [ ] On AdditionalChargeRequest: "All payments through BlueTika for your protection"

**Content Safety:**
- [ ] Check if chat messages get flagged for phone/email patterns
- [ ] Use existing contentSafetyService for message screening
- [ ] Warn user if message contains contact info

**UI Polish:**
- [ ] Chat scrollbar styling
- [ ] Message timestamps readable
- [ ] Loading states smooth
- [ ] Error messages helpful
- [ ] Empty states encouraging

**STOP & FINAL TEST**

---

## Acceptance

After completing all portions:

1. **Security Test:**
   - [ ] No phone/email visible anywhere before payment
   - [ ] Contact appears ONLY after payment complete
   - [ ] Chat doesn't leak contact info

2. **Communication Test:**
   - [ ] Client and provider can chat on active contracts
   - [ ] Messages save and persist
   - [ ] Email notifications work
   - [ ] Chat hidden on unpaid contracts

3. **Payment Test:**
   - [ ] Provider can request additional payment
   - [ ] Client can approve/decline
   - [ ] Approved charges go through Stripe
   - [ ] Funds added to contract escrow
   - [ ] Total contract value updates

4. **Full Cycle Test:**
   - [ ] Post project → Receive bid → Accept → Pay
   - [ ] Contact info appears
   - [ ] Chat with provider
   - [ ] Request additional $50
   - [ ] Client approves → Pays
   - [ ] Upload evidence → Request completion
   - [ ] Client approves → Friday payout

**If all 4 tests pass → READY TO LAUNCH** 🚀

---

## Implementation Order

**Morning (4 hours):**
- Portion 1: Hide contact (2h)
- Portion 2: Build chat component (2h)

**Afternoon (4 hours):**
- Portion 3: Integrate chat (1h)
- Portion 4: Email notifications (1h)
- Portion 5: Additional payments (1h)
- Portion 6: Polish + testing (1h)

**Evening:**
- Full regression test
- Deploy to production
- Monitor first users

---

**Ready to start Portion 1 (hiding contact info)?**