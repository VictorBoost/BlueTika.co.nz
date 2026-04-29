import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { authService } from "@/services/authService";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      // 60 minutes = 60 * 60 * 1000 = 3600000 ms
      timeoutId = setTimeout(async () => {
        const session = await authService.getCurrentSession();
        if (session?.user) {
          await authService.signOut();
          router.push("/login?message=Session expired due to inactivity");
        }
      }, 3600000);
    };

    // Events to track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    // Initialize timer
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [router]);

  return (
    <ThemeProvider>
      <Component {...pageProps} />
      <Toaster />
      <SpeedInsights />
    </ThemeProvider>
  );
}