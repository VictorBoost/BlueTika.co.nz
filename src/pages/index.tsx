import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";

export default function Home() {
  return (
    <>
      <SEO
        title="BlueTika - Find Local Help. Get it Done."
        description="New Zealand's trusted marketplace connecting Kiwis with local service providers. Post your project or find work."
        image="/og-image.png"
      />
      <div className="min-h-screen">
        <Hero />
        <Features />
        <HowItWorks />
        <Footer />
      </div>
    </>
  );
}