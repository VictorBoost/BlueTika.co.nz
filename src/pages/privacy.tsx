import { SEO } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <>
      <SEO 
        title="Privacy Policy - BlueTika" 
        description="BlueTika's privacy policy. Learn how we protect your personal information on our New Zealand marketplace." 
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
          <h1 className="text-4xl font-bold mb-4 text-primary">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: April 22, 2026</p>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
              <p>
                BlueTika Limited ("we", "our", "us") operates bluetika.co.nz (the "Platform"). This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our services.
              </p>
              <p>
                We are committed to protecting your privacy and complying with the New Zealand Privacy Act 2020.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-semibold mb-3">2.1 Information You Provide</h3>
              <ul>
                <li><strong>Account Information:</strong> Name, email address, phone number, password</li>
                <li><strong>Profile Information:</strong> Business name, bio, location, profile photo</li>
                <li><strong>Verification Documents:</strong> ID, licenses, certifications, proof of address</li>
                <li><strong>Project Information:</strong> Project descriptions, budgets, locations, photos</li>
                <li><strong>Payment Information:</strong> Stripe processes payment details (we do not store card numbers)</li>
                <li><strong>Communications:</strong> Messages, reviews, dispute information</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Information We Collect Automatically</h3>
              <ul>
                <li><strong>Usage Data:</strong> Pages visited, actions taken, time spent on platform</li>
                <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
                <li><strong>Location Data:</strong> Approximate location based on IP address (with consent)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul>
                <li>Provide and improve our marketplace services</li>
                <li>Process transactions and hold funds securely</li>
                <li>Verify service provider credentials and build trust</li>
                <li>Facilitate communication between clients and providers</li>
                <li>Send transactional emails (project updates, payment confirmations)</li>
                <li>Prevent fraud and ensure platform safety</li>
                <li>Comply with legal obligations</li>
                <li>Analyze usage to improve user experience</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">4. Information Sharing</h2>
              <p>We share your information only in these circumstances:</p>
              <ul>
                <li><strong>With Other Users:</strong> Providers see client project details; clients see provider profiles and bids</li>
                <li><strong>Service Providers:</strong> Stripe (payments), Amazon SES (emails), Supabase (database hosting)</li>
                <li><strong>Legal Compliance:</strong> When required by New Zealand law or court order</li>
                <li><strong>Business Transfers:</strong> In case of merger, acquisition, or asset sale</li>
              </ul>
              <p className="font-semibold mt-4">We never sell your personal information to third parties.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your information:
              </p>
              <ul>
                <li>HTTPS encryption for all data transmission</li>
                <li>Secure httpOnly cookies for authentication</li>
                <li>Regular security audits and updates</li>
                <li>Restricted access to personal data (authorized personnel only)</li>
                <li>Stripe PCI-DSS compliance for payment processing</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                While we take reasonable precautions, no method of transmission over the internet is 100% secure. You are responsible for maintaining the confidentiality of your account password.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">6. Your Rights</h2>
              <p>Under the New Zealand Privacy Act 2020, you have the right to:</p>
              <ul>
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data (subject to legal retention requirements)</li>
                <li><strong>Object:</strong> Object to certain types of processing</li>
                <li><strong>Portability:</strong> Request your data in a portable format</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, contact us at <a href="mailto:privacy@bluetika.co.nz" className="text-primary underline">privacy@bluetika.co.nz</a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">7. Data Retention</h2>
              <p>We retain your information for as long as necessary to:</p>
              <ul>
                <li>Provide our services to you</li>
                <li>Comply with legal and tax obligations (minimum 7 years for financial records)</li>
                <li>Resolve disputes and enforce agreements</li>
              </ul>
              <p className="mt-4">
                Deleted account data is anonymized or permanently removed within 30 days, except where legal retention is required.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">7.1 Project and Contract Data</h3>
              <ul>
                <li><strong>Draft Projects:</strong> Retained indefinitely until published or manually deleted by you</li>
                <li><strong>Active Projects:</strong> Visible in the public feed until deadline + 7 days, then automatically expired (data retained in your account)</li>
                <li><strong>Archived Contracts:</strong> Completed and cancelled contracts are moved to your archive and retained for 7 years for legal/tax compliance</li>
                <li><strong>Cancellation Requests:</strong> Stored with contract records for dispute resolution purposes</li>
              </ul>
              <p className="mt-4 text-sm text-muted-foreground">
                While expired and cancelled contracts are removed from public view, they remain accessible in your account dashboard for record-keeping and tax purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">8. Cookies</h2>
              <p>
                We use essential cookies to maintain your login session (httpOnly, secure). We do not use advertising or tracking cookies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">9. Third-Party Links</h2>
              <p>
                Our Platform may contain links to third-party websites (e.g., Stripe). We are not responsible for the privacy practices of external sites. Please review their privacy policies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">10. Children's Privacy</h2>
              <p>
                BlueTika is not intended for users under 18. We do not knowingly collect information from children. If we discover a child's account, we will delete it immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">11. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. Changes will be posted on this page with the "Last updated" date revised. Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">12. Contact Us</h2>
              <p>For privacy-related questions or concerns, contact us:</p>
              <ul className="list-none pl-0">
                <li><strong>Email:</strong> <a href="mailto:privacy@bluetika.co.nz" className="text-primary underline">privacy@bluetika.co.nz</a></li>
                <li><strong>Company:</strong> BlueTika Limited</li>
                <li><strong>Location:</strong> Auckland, New Zealand</li>
              </ul>
            </section>

            <div className="bg-muted p-6 rounded-lg mt-12">
              <p className="text-sm text-muted-foreground mb-0">
                <strong>Office of the Privacy Commissioner:</strong> If you believe we have not handled your personal information properly, you may lodge a complaint with the New Zealand Privacy Commissioner at <a href="https://www.privacy.org.nz" className="text-primary underline" target="_blank" rel="noopener noreferrer">privacy.org.nz</a>
              </p>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
}