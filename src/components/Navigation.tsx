import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Menu, X } from "lucide-react";

export function Navigation() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="bg-background border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="text-xl font-bold text-foreground">BlueTika</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/projects" className="text-foreground hover:text-primary transition-colors">
              Browse Projects
            </Link>
            

            
            
            {session ?
            <>
                <Link href="/post-project">
                  <Button className="bg-primary hover:bg-primary/90">
                    Post a Project
                  </Button>
                </Link>
                <Link href="/account" className="text-foreground hover:text-primary transition-colors">
                  Account
                </Link>
              </> :

            <>
                <Link href="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-primary hover:bg-primary/90">
                    Sign up
                  </Button>
                </Link>
              </>
            }
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen &&
        <div className="md:hidden py-4 space-y-4 border-t">
            <Link
            href="/projects"
            className="block text-foreground hover:text-primary transition-colors"
            onClick={() => setMobileMenuOpen(false)}>
            
              Browse Projects
            </Link>
            <Link
            href="/directory"
            className="block text-foreground hover:text-primary transition-colors"
            onClick={() => setMobileMenuOpen(false)}>
            
              Find Providers
            </Link>
            <Link
            href="/testimonials"
            className="block text-foreground hover:text-primary transition-colors"
            onClick={() => setMobileMenuOpen(false)}>
            
              Testimonials
            </Link>
            <Link
            href="/about"
            className="block text-foreground hover:text-primary transition-colors"
            onClick={() => setMobileMenuOpen(false)}>
            
              About
            </Link>
            
            {session ?
          <>
                <Link href="/post-project" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Post a Project
                  </Button>
                </Link>
                <Link
              href="/account"
              className="block text-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}>
              
                  Account
                </Link>
              </> :

          <div className="space-y-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Log in</Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Sign up
                  </Button>
                </Link>
              </div>
          }
          </div>
        }
      </div>
    </nav>);

}