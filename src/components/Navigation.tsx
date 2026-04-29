import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Menu as MenuIcon, X, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

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
          <div className="hidden md:flex items-center gap-4">
            {session ? (
              <>
                <Button variant="ghost" onClick={handleSignOut}>
                  Sign Out
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      Menu <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/projects" className="cursor-pointer w-full">Browse Projects</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/contracts" className="cursor-pointer w-full">My Contracts</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/post-project" className="cursor-pointer w-full">Post a Project</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account" className="cursor-pointer w-full">Account</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline">Sign up</Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 gap-2">
                      Menu <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/projects" className="cursor-pointer w-full">Browse Projects</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/testimonials" className="cursor-pointer w-full">Testimonials</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/about" className="cursor-pointer w-full">About</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t">
            <Link
              href="/projects"
              className="block text-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}>
              Browse Projects
            </Link>
            
            {session ? (
              <>
                <Link
                  href="/contracts"
                  className="block text-foreground hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}>
                  My Contracts
                </Link>
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
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
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
                <div className="space-y-2 pt-4 border-t">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Log in</Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-primary hover:bg-primary/90">
                      Sign up
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}