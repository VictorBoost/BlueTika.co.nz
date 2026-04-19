import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Briefcase, Search } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted py-20 md:py-32">
      <div className="container">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            Find Local Help.
            <br />
            <span className="text-primary">Get it Done.</span>
          </h1>
          <p className="mb-8 text-lg text-muted-foreground md:text-xl">New Zealand's trusted marketplace connecting Kiwis with Verified Local Service Providers. Post your project or find work


          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild className="gap-2">
              <Link href="/post-project">
                <Briefcase className="h-5 w-5" />
                Post a Project
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="gap-2">
              <Link href="/projects">
                <Search className="h-5 w-5" />
                Find Work
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Decorative koru spiral pattern */}
      <div className="absolute -right-20 top-20 h-64 w-64 opacity-5">
        <svg viewBox="0 0 200 200" fill="currentColor" className="text-primary">
          <path d="M100,100 Q120,80 140,100 Q160,120 140,140 Q120,160 100,140 Q80,120 100,100 Z" />
        </svg>
      </div>
    </section>);

}