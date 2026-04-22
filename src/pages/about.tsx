import { SEO } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Heart, Users } from "lucide-react";

export default function About() {
  return (
    <>
      <SEO 
        title="About BlueTika - Our Story | 100% NZ Owned" 
        description="Learn how BlueTika was born from a costly lesson with a runaway painter. We're here to protect Kiwis from dodgy contractors and help honest tradies build their reputation." 
      />
      
      <div className="min-h-screen flex flex-col bg-background">
        {/* Navigation */}
        <div className="container py-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <main className="flex-1">
          {/* Hero Section with Koru */}
          <section className="py-16 md:py-24">
            <div className="container">
              <div className="mx-auto max-w-3xl text-center">
                {/* Large Koru Spiral - Symbol of new beginnings */}
                <div className="mb-8 flex justify-center">
                  <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent">
                    <path d="M50 10C27.9 10 10 27.9 10 50C10 72.1 27.9 90 50 90C66.6 90 80.8 80 86.8 65.6C88 62.7 85.8 59.5 82.6 59.5C80 59.5 77.8 61.3 77.1 63.8C73.4 74 62.6 81.5 50 81.5C32.6 81.5 18.5 67.4 18.5 50C18.5 32.6 32.6 18.5 50 18.5C64.6 18.5 76.8 28.5 80.5 42C81.2 44.6 79.1 47 76.4 47C73.8 47 71.6 45.2 71 42.6C68.4 34 60 27.5 50 27.5C37.6 27.5 27.5 37.6 27.5 50C27.5 62.4 37.6 72.5 50 72.5C59.6 72.5 67.8 66.5 71.1 58" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
                  </svg>
                </div>
                <h1 className="mb-6 text-4xl font-bold md:text-6xl text-primary">Why BlueTika Exists</h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Born from a hard lesson. Built to protect Kiwis.
                </p>
              </div>
            </div>
          </section>

          {/* The Founder's Story - The Painter Incident */}
          <section className="bg-muted py-16">
            <div className="container">
              <div className="max-w-4xl mx-auto">
                <div className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-xl">
                  <h2 className="text-3xl font-bold mb-8 text-center">The Day Everything Changed</h2>
                  
                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      It was supposed to be a simple job. Paint the exterior of our Auckland home. Three weeks, max.
                    </p>
                    
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      I found a painter through a local Facebook group. Great reviews. Professional-looking website. He showed up on time for the quote, talked confidently about the work, and his price seemed fair. I paid a 50% deposit upfront — $3,800 — to cover materials and secure the booking.
                    </p>

                    <div className="bg-destructive/10 border-l-4 border-destructive p-6 my-8 rounded-r-lg">
                      <p className="text-lg font-semibold text-destructive mb-2">Week 1: Red Flags Start Appearing</p>
                      <p className="text-muted-foreground mb-0">He showed up late. Made excuses. Left early. The paint he bought was cheap, streaky rubbish — not the premium exterior paint we'd agreed on.</p>
                    </div>

                    <p className="text-lg leading-relaxed text-muted-foreground">
                      By the end of Week 2, half the house was painted poorly, the other half untouched. I called him. No answer. Texted him. Read receipts on, no reply.
                    </p>

                    <div className="bg-destructive/20 border-l-4 border-destructive p-6 my-8 rounded-r-lg">
                      <p className="text-lg font-semibold text-destructive mb-2">Week 3: Ghost</p>
                      <p className="text-muted-foreground mb-0">He stopped answering entirely. Phone disconnected. Website taken down. $3,800 gone. House half-painted. No recourse.</p>
                    </div>

                    <p className="text-lg leading-relaxed text-muted-foreground">
                      I reported it to the police. They said it was a civil matter. I contacted Consumer Protection. They said I'd need to take him to the Disputes Tribunal — but good luck finding him. The Facebook group admin removed my warning post, saying "no negative reviews allowed."
                    </p>

                    <blockquote className="border-l-4 border-primary pl-6 italic my-8 text-foreground font-medium text-xl">
                      "I felt completely powerless. And I wasn't the only one — I later found out he'd done this to at least 4 other families in Auckland that year."
                    </blockquote>

                    <p className="text-lg leading-relaxed text-muted-foreground">
                      While scrambling to find a new painter to fix the mess, I realized the whole system was broken. You either:
                    </p>

                    <ul className="space-y-3 my-6">
                      <li className="text-lg text-muted-foreground">✗ Scroll through social media groups hoping for trustworthy recommendations (unreliable)</li>
                      <li className="text-lg text-muted-foreground">✗ Use lead generation sites that charge tradies $50-$150 per quote, driving up costs (expensive)</li>
                      <li className="text-lg text-muted-foreground">✗ Hire based on a slick website with fake reviews (risky)</li>
                    </ul>

                    <p className="text-lg leading-relaxed text-muted-foreground">
                      There was no platform that actually protected clients AND rewarded honest service providers.
                    </p>

                    <div className="bg-success/10 border-l-4 border-success p-6 my-8 rounded-r-lg">
                      <p className="text-lg font-semibold text-success mb-2">That's when BlueTika was born</p>
                      <p className="text-muted-foreground mb-0">A reverse marketplace where clients post projects, verified providers bid, and funds are held securely until the job is done right. No more runaway contractors. No more $3,800 lessons.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* What BlueTika Means */}
          <section className="py-16">
            <div className="container">
              <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-12">What Does BlueTika Mean?</h2>
                
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Blue Card */}
                  <div className="bg-primary/5 border-2 border-primary rounded-2xl p-8">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-6">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-primary mb-4">Blue</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      Represents <strong>trust, reliability, and security</strong>. When you hire through BlueTika, you should feel completely confident. Your money is held safely. The provider has been verified. Reviews are real.
                    </p>
                    <p className="text-lg text-muted-foreground leading-relaxed mt-4">
                      Blue is the color of calm certainty — the opposite of the stress I felt when that painter disappeared.
                    </p>
                  </div>

                  {/* Tika Card */}
                  <div className="bg-accent/5 border-2 border-accent rounded-2xl p-8">
                    <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-6">
                      <Heart className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-accent mb-4">Tika</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      Te reo Māori for <strong>"right, correct, true, fair, just"</strong>. It's the standard we hold every transaction to. Providers bid fairly. Clients pay fairly. Work is done properly. Disputes are resolved justly.
                    </p>
                    <p className="text-lg text-muted-foreground leading-relaxed mt-4">
                      Tika is our promise — this platform does things <em>the right way</em>, honoring both parties with fairness and respect.
                    </p>
                  </div>
                </div>

                <div className="mt-12 text-center">
                  <div className="inline-block bg-card border border-border rounded-2xl px-12 py-8 shadow-lg">
                    <p className="text-5xl font-bold text-foreground mb-2">
                      Blue<span className="text-primary">Tika</span>
                    </p>
                    <p className="text-accent font-medium tracking-widest uppercase text-sm">Trust · Truth · Fairness</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Our Mission - Kiwi Values */}
          <section className="bg-muted py-16">
            <div className="container">
              <div className="max-w-4xl mx-auto text-center">
                <div className="mb-8 flex justify-center">
                  {/* Kiwi Bird Icon */}
                  <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                    <path d="M80 50C80 66.5685 66.5685 80 50 80C33.4315 80 20 66.5685 20 50C20 38.3093 26.6806 28.1787 36.6508 23.3106" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
                    <path d="M50 20C66.5685 20 80 33.4315 80 50" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeDasharray="10 10"/>
                    <circle cx="65" cy="40" r="4" fill="currentColor"/>
                    <path d="M78 40C85 40 95 45 95 45" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                    <path d="M40 80V90" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
                    <path d="M60 80V90" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
                    <path d="M35 90H45" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
                    <path d="M55 90H65" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
                  </svg>
                </div>

                <h2 className="text-3xl font-bold mb-6">Built By Kiwis, For Kiwis</h2>
                
                <div className="prose prose-lg dark:prose-invert mx-auto">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    We're 100% New Zealand owned and operated. Every dollar you spend on this platform stays in New Zealand. Every provider you hire is local. Every dispute is resolved with Kiwi fairness.
                  </p>

                  <div className="grid md:grid-cols-3 gap-6 my-12 not-prose">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">Client Protection</h3>
                      <p className="text-sm text-muted-foreground">Funds held securely until job completion. No more runaway contractors.</p>
                    </div>

                    <div className="text-center">
                      <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-accent" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">Provider Reputation</h3>
                      <p className="text-sm text-muted-foreground">Build trust through verified reviews. No fake testimonials.</p>
                    </div>

                    <div className="text-center">
                      <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-8 h-8 text-success" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">Fair Fees</h3>
                      <p className="text-sm text-muted-foreground">Low commissions that don't gouge tradies or inflate prices.</p>
                    </div>
                  </div>

                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Today, BlueTika helps thousands of Kiwis find reliable local help — from painters who actually finish the job, to accountants who know NZ tax law, to cleaners who show up on time.
                  </p>

                  <p className="text-lg text-muted-foreground leading-relaxed">
                    We learned the hard way so you don't have to.
                  </p>
                </div>

                <div className="mt-12">
                  <Button size="lg" asChild className="px-10">
                    <Link href="/register">Join the Community</Link>
                  </Button>
                  <p className="text-sm text-muted-foreground mt-4">
                    Post your first project. Get verified bids. Hire with confidence.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
    </>
  );
}