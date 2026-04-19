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
              <Features />import {Search, ShieldCheck} from 'lucide-react';

export const Hero = () => {
  return (
              <div className="bg-[#1A2F1F] text-white py-32 px-12 text-center relative overflow-hidden">
                  <div className="relative z-10 max-w-4xl mx-auto">
                      <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6 border border-white/5">
                          <ShieldCheck size={14} className="text-[#FFD04D]" /> Kiwis helping Kiwis since 2026
                      </div>
                      <h1 className="text-7xl font-medium tracking-tight mb-8 leading-[1.1] font-serif">Mahi made simple. <br /><span className="italic text-[#FFD04D]">Whānau connected.</span></h1>
                      <p className="text-lg text-white/70 mb-12 max-w-xl mx-auto">From Kerikeri to Bluff, find trusted locals to help get the job done right. 100% NZ Owned & Operated.</p>

                      <div className="bg-white rounded-2xl p-2 flex flex-col md:flex-row gap-2 shadow-2xl max-w-2xl mx-auto">
                          <div className="flex-1 flex items-center gap-4 px-4 py-3 bg-slate-50 rounded-xl border border-black/5 text-slate-800">
                              <Search size={18} className="opacity-30" />
                              <input type="text" placeholder="What do you need a hand with?" className="bg-transparent border-none outline-none w-full text-sm font-medium" />
                          </div>
                          <button className="bg-[#FFD04D] text-[#1A2F1F] px-10 py-5 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-[#1A2F1F] hover:text-white transition-all">Search Mahi</button>
                      </div>
                  </div>
              </div>
              );
};
        <HowItWorks />
        <Footer />
      </div>
    </>
  );
}