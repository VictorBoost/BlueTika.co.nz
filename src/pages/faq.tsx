import { SEO } from "@/components/SEO";
import Head from "next/head";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is BlueTika?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "BlueTika is New Zealand's reverse marketplace connecting residents with trusted local service providers. Instead of browsing provider listings, you post your project and providers bid on it. Blue represents trust, and Tika (te reo Māori) means 'right' or 'fair' — our commitment to fair, transparent transactions."
        }
      },
      {
        "@type": "Question",
        "name": "How does the escrow payment system work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "1. Upfront Payment: When you accept a bid, you pay 102% upfront (agreed price + 2% payment processing). BlueTika holds these funds securely until the job is complete. 2. Extra Charges: Either party can request additional payments during the project. 3. Job Completion: The service provider uploads 'Before & After' photos. 4. 24-Hour Review Window: You have exactly 24 hours to raise any disputes. 5. Weekly Fund Release: Payments are released every Friday."
        }
      },
      {
        "@type": "Question",
        "name": "How does the bidding system work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Post your project with details and budget. Verified service providers review and submit bids. You compare bids, check provider profiles and reviews, then accept the bid that best suits your needs."
        }
      },
      {
        "@type": "Question",
        "name": "What happens during the 24-hour dispute window?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "After the service provider uploads completion photos, you have exactly 24 hours to review the work and raise any concerns. During this window, you can open a dispute if the work doesn't match what was agreed."
        }
      },
      {
        "@type": "Question",
        "name": "Can additional charges be added during a project?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Either party can request additional payments during the project using the 'Add Payment' button. These must be approved by the client before the job ends."
        }
      }
    ]
  };

  return (
    <>
      <SEO 
        title="FAQ - BlueTika" 
        description="Frequently asked questions about BlueTika marketplace"
      />
      <Head>
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </Head>
      <Navigation />
      
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-muted-foreground mb-12">
            Everything you need to know about using BlueTika
          </p>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1">
              <AccordionTrigger>What is BlueTika?</AccordionTrigger>
              <AccordionContent>
                BlueTika is New Zealand&apos;s reverse marketplace connecting residents with trusted local service providers. Instead of browsing provider listings, you post your project and providers bid on it. Blue represents trust, and Tika (te reo Māori) means &quot;right&quot; or &quot;fair&quot; — our commitment to fair, transparent transactions.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="escrow-payment">
              <AccordionTrigger>How does the escrow payment system work?</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <p><strong>1. Upfront Payment:</strong> When you accept a bid, you pay 102% upfront (agreed price + 2% payment processing). BlueTika holds these funds securely until the job is complete.</p>
                  <p><strong>2. Extra Charges:</strong> Either party can request additional payments during the project using the &quot;Add Payment&quot; button. You must accept any additions before the job ends.</p>
                  <p><strong>3. Job Completion:</strong> The service provider uploads &quot;Before & After&quot; photos with an explanation to mark the project complete.</p>
                  <p><strong>4. 24-Hour Review Window:</strong> Once photos are uploaded, you have exactly 24 hours to raise any disputes. After 24 hours, the payment is considered &quot;earned&quot; by the provider.</p>
                  <p><strong>5. Weekly Fund Release:</strong> BlueTika reviews all &quot;earned&quot; jobs and releases payments (92% to provider after 8% commission) every Friday.</p>
                  <p className="text-sm text-muted-foreground mt-2">Important: All communication and payments must happen within BlueTika to maintain payment protection. Off-platform deals void all protections.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>How does the bidding system work?</AccordionTrigger>
              <AccordionContent>
                Post your project with details and budget. Verified service providers review and submit bids. You compare bids, check provider profiles and reviews, then accept the bid that best suits your needs. Once accepted, a contract is created and you proceed to payment.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="dispute-window">
              <AccordionTrigger>What happens during the 24-hour dispute window?</AccordionTrigger>
              <AccordionContent>
                After the service provider uploads completion photos, you have exactly 24 hours to review the work and raise any concerns. During this window, you can open a dispute if the work doesn&apos;t match what was agreed. After 24 hours pass, the funds are considered earned by the provider. Any workmanship guarantees or warranty claims after fund release are handled directly between you and the provider.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>How do payments work?</AccordionTrigger>
              <AccordionContent>
                BlueTika holds your payment securely until the job is complete. After the service provider uploads evidence photos and you submit a review, funds are released. This protects both parties and ensures quality work.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="extra-payments">
              <AccordionTrigger>Can additional charges be added during a project?</AccordionTrigger>
              <AccordionContent>
                Yes. Either party can request additional payments during the project using the &quot;Add Payment&quot; button in the contract. These must be approved by the client before the job ends. Common examples include extra materials needed, scope changes, or additional work requested. All additions must be processed through BlueTika to maintain payment protection.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>What are the fees?</AccordionTrigger>
              <AccordionContent>
                Posting projects is free for clients. Service providers pay a small commission on completed contracts. Additional services like logo removal, email hosting, and custom URL are available at $5/month each. Staff management is $2/month per staff member.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>How do I become a verified service provider?</AccordionTrigger>
              <AccordionContent>
                Register an account, then complete the service provider verification process. You&apos;ll need to provide business details, upload identification, and pass our verification checks. Domestic helpers have additional requirements including bio verification and police vetting.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>What categories of services are available?</AccordionTrigger>
              <AccordionContent>
                BlueTika covers 8 main categories: Home Services (maintenance, repairs, cleaning), Professional Services (legal, accounting, consulting), Events & Entertainment, Health & Wellness, Education & Tutoring, Technology & Digital, Transport & Logistics, and Creative Services (design, photography, writing).
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger>How do reviews work?</AccordionTrigger>
              <AccordionContent>
                After a contract is complete, both parties submit reviews. Clients rate the service provider&apos;s work quality, communication, and professionalism. Service providers can review clients on communication and payment. Reviews are visible on profiles and help build trust in the community.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8">
              <AccordionTrigger>What if there&apos;s a dispute?</AccordionTrigger>
              <AccordionContent>
                If issues arise, use our dispute resolution system. Both parties can submit evidence and explanations. BlueTika&apos;s moderation team reviews disputes and makes fair decisions about fund releases or refunds. We aim to resolve disputes within 5 business days.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9">
              <AccordionTrigger>Can I cancel a contract?</AccordionTrigger>
              <AccordionContent>
                Contracts can be cancelled before work begins with mutual agreement. Once work has started, cancellation requires both parties to agree or a dispute resolution process. Cancellation policies protect both clients and service providers from unfair cancellations.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10">
              <AccordionTrigger>Is BlueTika available throughout New Zealand?</AccordionTrigger>
              <AccordionContent>
                Yes! BlueTika operates nationwide across New Zealand. Service providers specify which regions they serve, and you can filter projects by location. Whether you&apos;re in Auckland, Wellington, Christchurch, or anywhere in between, you can find local help or offer your services.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-11">
              <AccordionTrigger>How does the tier system work for service providers?</AccordionTrigger>
              <AccordionContent>
                Service providers advance through 4 tiers based on completed contracts: Bronze (0-9 jobs), Silver (10-49), Gold (50-149), Platinum (150+). Higher tiers unlock features like invoice generation, accounting ledgers, and lower commission rates. Progress is tracked on your dashboard.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-12">
              <AccordionTrigger>How do I contact BlueTika support?</AccordionTrigger>
              <AccordionContent>
                For support, email us at support@bluetika.co.nz or use the contact form. We respond to all inquiries within 24 hours. For urgent issues related to active contracts or payments, mark your email as urgent and we&apos;ll prioritize it.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-12 p-6 bg-muted rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Still have questions?</h2>
            <p className="text-muted-foreground mb-4">
              Can&apos;t find what you&apos;re looking for? Get in touch with our support team.
            </p>
            <Link 
              href="/contact" 
              className="inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}