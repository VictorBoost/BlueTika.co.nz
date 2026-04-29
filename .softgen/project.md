# BlueTika - New Zealand Reverse Marketplace

## Vision
A trusted platform connecting New Zealand residents with local service providers. "Find Local Help. Get it Done." — empowering Kiwis to hire with confidence and service providers to build their reputation.

## Design
**Color Palette:**
- `--primary: 221 85% 47%` (deep blue #1B4FD8) — trust, professionalism
- `--accent: 188 94% 43%` (teal #06B6D4) — energy, action
- `--success: 158 64% 52%` (green #10B981) — completion, positive feedback
- `--background: 228 44% 7%` (dark #0A0E1A) — premium, modern
- `--foreground: 210 40% 98%` (light text on dark)
- `--muted: 217 33% 17%` (cards, sections)
- `--border: 217 33% 20%` (subtle dividers)

**Typography:**
- Headings: Outfit (600, 700)
- Body: Work Sans (400, 500, 600)

**Style Direction:**
Clean, professional SaaS aesthetic with NZ cultural elements (koru spiral, kiwi bird). Deep blue + dark backgrounds convey trust and premium quality. Teal accents energize CTAs. Black footer with bold national identity.

## Features
- **Dual User Types:** Client (posts projects) + Service Provider (submits bids). One account can be both.
- **Project Marketplace:** Browse, filter, post projects. All prices in NZD.
- **Bidding System:** Service providers bid on projects. Clients review and accept.
- **Contract Management:** Accepted bid becomes a contract. Track status, communicate.
- **Staff Management:** Service providers add staff members ($2/month each) with roles and access control.
- **Accounting Ledger:** Income/expense tracking with GST toggle, invoice generation from contracts (Silver+ tier only).
- **Subscriptions:** Remove logo ($5), email hosting ($5), custom URL ($5), additional staff ($2/month). Owner-configurable pricing.
- **GST Toggle:** Ready for future implementation (currently disabled).
- **NZ Identity:** Footer displays "100% NZ Owned · Kiwis Helping Kiwis · bluetika.co.nz" on black background.
- **About Page:** Brand story (Blue = trust, Tika = te reo Māori for right/fair), founder's builder story, koru + kiwi illustrations.

## Development Rules
- **CRITICAL SECURITY RULE:** NEVER modify, overwrite, or update the `.env.local` file under any circumstances. Environment variables, API keys, and database URLs (like Supabase) are strictly managed manually by the project owner. Do not attempt to fetch or sync new keys into `.env.local`.