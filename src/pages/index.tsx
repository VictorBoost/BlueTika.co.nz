import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
export default function Home() {
  return (
    <>
      <SEO
        title="BlueTika - Find Local Tradies & Services in New Zealand"
        description="New Zealand's marketplace for hiring trusted tradies and service providers. Post your project or find work today!"
        image="/og-image.png"
      />
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