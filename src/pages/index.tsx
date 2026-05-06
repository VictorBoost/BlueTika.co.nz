import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import Head from "next/head";

export default function Home() {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "BlueTika",
    "url": "https://bluetika.co.nz",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://bluetika.co.nz/projects?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "BlueTika",
    "url": "https://bluetika.co.nz",
    "logo": "https://bluetika.co.nz/og-image.png",
    "description": "New Zealand's trusted reverse marketplace for hiring tradies and local service providers",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "NZ"
    }
  };

  return (
    <>
      <SEO
        title="BlueTika - Find Local Tradies & Services in New Zealand"
        description="New Zealand's marketplace for hiring trusted tradies and service providers. Post your project or find work today!"
        image="/og-image.png"
      />
      <Head>
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </Head>
      <div className="min-h-screen">
        <Navigation />
        <Hero />
        <Features />
        <HowItWorks />
        <Footer />
      </div>
    </>
  );
}