import { SEO } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <>
      <SEO 
        title="Terms of Service - BlueTika" 
        description="BlueTika's terms of service. Understand your rights and responsibilities when using our New Zealand marketplace." 
      />
      
      <div className="min-h-screen flex flex-col bg-background">
        <div className="container py-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <main className="flex-1 container max-w-4xl py-8">
          <h1 className="text-4xl font-bold mb-4 text-primary">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: April 22, 2026</p>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using BlueTika Limited's platform ("BlueTika", "we", "our", "the Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.
              </p>
              <p>
                These terms constitute a legally binding agreement between you and BlueTika Limited, a New Zealand company. The Platform is governed by New Zealand law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">2. Definitions</h2>
              <ul>
                <li><strong>Client:</strong> A user posting projects and hiring service providers</li>
                <li><strong>Provider:</strong> A verified user offering services and submitting bids</li>
                <li><strong>Project:</strong> A job posted by a client seeking service provider bids</li>
                <li><strong>Bid:</strong> A provider's offer to complete a project at a specified price</li>
                <li><strong>Contract:</strong> An accepted bid creating a binding agreement</li>
                <li><strong>Funds:</strong> Money held securely until contract completion</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">3. Eligibility</h2>
              <p>To use BlueTika, you must:</p>
              <ul>
                <li>Be at least 18 years old</li>
                <li>Be a New Zealand resident or authorized to conduct business in New Zealand</li>
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain the confidentiality of your account credentials</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">4. User Accounts</h2>
              <h3 className="text-xl font-semibold mb-3">4.1 Registration</h3>
              <p>
                Users may register as Clients, Providers, or both. You are responsible for all activity on your account.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Provider Verification</h3>
              <p>
                Service Providers must complete verification (ID, licenses, certifications as applicable). Verification does not guarantee work quality — it confirms identity and credentials.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">4.3 Account Suspension</h3>
              <p>
                We reserve the right to suspend or terminate accounts for:
              </p>
              <ul>
                <li>Violation of these Terms</li>
                <li>Fraudulent activity or misrepresentation</li>
                <li>Harassment or abusive behavior</li>
                <li>Repeated disputes or poor performance</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">5. Platform Services</h2>
              <h3 className="text-xl font-semibold mb-3">5.1 For Clients</h3>
              <ul>
                <li>Post projects with descriptions, budgets, and timelines</li>
                <li>Receive and review bids from verified providers</li>
                <li>Accept bids to create contracts</li>
                <li>Funds are held securely until job completion</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">5.2 For Providers</h3>
              <ul>
                <li>Browse open projects and submit competitive bids</li>
                <li>Build reputation through verified reviews</li>
                <li>Receive payment upon contract completion and mutual review</li>
                <li>Manage staff and subscriptions (Silver+ tier)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">5.3 Project Lifecycle</h3>
              <p className="mb-3">
                Projects follow a managed lifecycle to maintain platform quality:
              </p>
              <ul>
                <li><strong>Draft Projects:</strong> Saved projects remain in your account indefinitely until published or manually deleted</li>
                <li><strong>Unassigned Projects:</strong> Expire from the public feed 7 days after the set deadline if no bid is accepted</li>
                <li><strong>Overdue Projects:</strong> The system may auto-cancel inactive, overdue projects to keep the marketplace clean</li>
                <li><strong>Archive:</strong> Completed and cancelled contracts are moved to your "Archive" tab. They are not permanently deleted and remain accessible for your records</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">5.4 Cancellation Requests</h3>
              <p className="mb-3">
                Either party may request contract cancellation:
              </p>
              <ul>
                <li>The requesting party must provide a reason for cancellation</li>
                <li>The other party has <strong>48 hours</strong> to respond (approve or reject)</li>
                <li>If no response is received within 48 hours, the contract is automatically cancelled</li>
                <li>Approved cancellations will process refunds according to the stage of work completion</li>
                <li>Rejected cancellation requests require both parties to continue the contract or escalate to dispute resolution</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">6. Payments and Fees</h2>
              <h3 className="text-xl font-semibold mb-3">6.1 Platform Fees</h3>
              <ul>
                <li><strong>Commission:</strong> BlueTika charges Service Providers a commission of 8% on completed contracts and no Lead Fees</li>
                <li><strong>Payment Processing:</strong> BlueTika charges Clients a reduced Payment Processing fee of 2% only* (Stripe fees apply typically ~2.65%-3.65% + $0.30 NZD per transaction)</li>
                <li><strong>Subscriptions:</strong> Optional paid features (logo removal, email hosting, custom URL, additional staff)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">6.2 Payment Process</h3>
              <ul>
                <li>Clients pay the agreed price upfront via Stripe</li>
                <li>Funds are held securely until both parties submit reviews</li>
                <li>Providers receive payment (minus 8% commission) after reviews are completed</li>
                <li>All amounts are in New Zealand Dollars (NZD)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">6.3 Refunds</h3>
              <p>
                Refunds are handled case-by-case through our dispute resolution process. Platform fees are non-refundable.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">7. Contracts and Conduct</h2>
              <h3 className="text-xl font-semibold mb-3">7.1 Binding Agreements</h3>
              <p>
                When a client accepts a provider's bid, a legally binding contract is created between the two parties. BlueTika is a platform facilitator, not a party to the contract.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">7.2 User Conduct</h3>
              <p>You agree NOT to:</p>
              <ul>
                <li>Misrepresent your identity, qualifications, or services</li>
                <li>Post illegal, offensive, or fraudulent content</li>
                <li>Harass, threaten, or discriminate against other users</li>
                <li>Attempt to bypass the platform for payments ("off-platform transactions")</li>
                <li>Use automated tools (bots, scrapers) without permission</li>
                <li>Infringe intellectual property rights</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">7.3 Evidence Requirements</h3>
              <p>
                Providers must upload before/after photos for applicable projects. Failure to comply may delay fund release.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">8. Disputes</h2>
              <p>
                If a dispute arises, users should first attempt to resolve it directly. If unresolved:
              </p>
              <ul>
                <li>Either party may raise a formal dispute through the Platform</li>
                <li>BlueTika admin will review evidence and make a fair determination</li>
                <li>Admin decisions are final and binding</li>
                <li>Disputes may result in full/partial refunds, fund release to provider, or other resolutions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">9. Intellectual Property</h2>
              <p>
                All Platform content (design, code, trademarks, logos) is owned by BlueTika Limited. Users retain ownership of their submitted content (project descriptions, photos, reviews) but grant BlueTika a license to display it on the Platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">10. Disclaimers</h2>
              <ul>
                <li><strong>No Guarantee:</strong> BlueTika does not guarantee work quality, provider reliability, or project outcomes</li>
                <li><strong>Verification Limitations:</strong> Provider verification confirms identity but does not guarantee competence</li>
                <li><strong>Independent Contractors:</strong> Providers are independent contractors, not BlueTika employees</li>
                <li><strong>Platform Availability:</strong> We do not guarantee uninterrupted service and are not liable for downtime</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">11. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by New Zealand law:
              </p>
              <ul>
                <li>BlueTika's liability is limited to the fees paid to us in the 12 months preceding the claim</li>
                <li>We are not liable for indirect, incidental, or consequential damages</li>
                <li>You use the Platform at your own risk</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">12. Indemnification</h2>
              <p>
                You agree to indemnify and hold BlueTika harmless from claims, damages, or expenses arising from:
              </p>
              <ul>
                <li>Your use of the Platform</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of third-party rights</li>
                <li>Contracts formed through the Platform</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">13. Governing Law</h2>
              <p>
                These Terms are governed by the laws of New Zealand. Any disputes will be resolved in New Zealand courts.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">14. Changes to Terms</h2>
              <p>
                We may update these Terms from time to time. Changes will be posted with the "Last updated" date. Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">15. Contact</h2>
              <p>For questions about these Terms, contact us:</p>
              <ul className="list-none pl-0">
                <li><strong>Email:</strong> <a href="mailto:support@bluetika.co.nz" className="text-primary underline">support@bluetika.co.nz</a></li>
                <li><strong>Company:</strong> BlueTika Limited</li>
                <li><strong>Location:</strong> Auckland, New Zealand</li>
              </ul>
            </section>

            <div className="bg-muted p-6 rounded-lg mt-12">
              <p className="text-sm text-muted-foreground mb-0">
                By using BlueTika, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
}