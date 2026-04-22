import { SEO } from "@/components/SEO";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

export default function Custom404() {
  return (
    <>
      <SEO 
        title="404 - Page Not Found | BlueTika" 
        description="Crikey! This page has gone walkabout. Head back to BlueTika's homepage." 
      />
      
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* Confused Kiwi Bird SVG */}
          <div className="mb-8">
            <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
              {/* Kiwi body */}
              <ellipse cx="100" cy="110" rx="60" ry="50" fill="#8B4513" stroke="#654321" strokeWidth="3"/>
              
              {/* Kiwi head */}
              <circle cx="85" cy="75" r="30" fill="#8B4513" stroke="#654321" strokeWidth="3"/>
              
              {/* Long confused beak pointing wrong way */}
              <path d="M60 75 Q40 72 25 75" stroke="#FFA500" strokeWidth="6" strokeLinecap="round"/>
              
              {/* Confused eye with question mark */}
              <circle cx="75" cy="70" r="5" fill="#000"/>
              <text x="90" y="55" fontSize="24" fill="#1B4FD8">?</text>
              
              {/* Wonky feathers */}
              <path d="M130 100 L145 85" stroke="#654321" strokeWidth="3" strokeLinecap="round"/>
              <path d="M135 110 L155 105" stroke="#654321" strokeWidth="3" strokeLinecap="round"/>
              <path d="M130 120 L150 125" stroke="#654321" strokeWidth="3" strokeLinecap="round"/>
              
              {/* Kiwi legs - one lifted (confused stance) */}
              <line x1="85" y1="160" x2="85" y2="180" stroke="#654321" strokeWidth="4" strokeLinecap="round"/>
              <line x1="115" y1="160" x2="125" y2="170" stroke="#654321" strokeWidth="4" strokeLinecap="round"/>
              
              {/* Feet */}
              <path d="M75 180 L85 180 L90 185" stroke="#654321" strokeWidth="3" strokeLinecap="round" fill="none"/>
              <path d="M120 170 L130 172" stroke="#654321" strokeWidth="3" strokeLinecap="round" fill="none"/>
              
              {/* Spiral confusion lines */}
              <path d="M50 50 Q45 45 50 40" stroke="#06B6D4" strokeWidth="2" fill="none" opacity="0.6"/>
              <path d="M55 35 Q50 30 55 25" stroke="#06B6D4" strokeWidth="2" fill="none" opacity="0.6"/>
            </svg>
          </div>

          {/* Error message */}
          <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
          <h2 className="text-3xl font-bold mb-4">Crikey! This page has gone walkabout</h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Even our trusty kiwi couldn't find this page. It might've been deleted, moved, or never existed in the first place.
          </p>

          {/* Fun Kiwi fact */}
          <div className="bg-muted border border-border rounded-lg p-6 mb-8 inline-block">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">🥝 Did you know?</p>
            <p className="text-sm text-muted-foreground">
              Kiwi birds can't fly, but they're excellent at finding grubs in the dark. Unlike this page, which we can't seem to find at all!
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" asChild className="min-w-[200px]">
              <Link href="/">
                <Home className="mr-2 h-5 w-5" />
                Go Home
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="min-w-[200px]">
              <Link href="/projects">
                <Search className="mr-2 h-5 w-5" />
                Browse Projects
              </Link>
            </Button>
          </div>

          {/* Footer tagline */}
          <p className="text-sm text-muted-foreground mt-12">
            100% NZ Owned · Kiwis Helping Kiwis · <Link href="/" className="text-primary underline">bluetika.co.nz</Link>
          </p>
        </div>
      </div>
    </>
  );
}