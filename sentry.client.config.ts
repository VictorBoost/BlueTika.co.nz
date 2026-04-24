import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://cd993319c2295bfcc30fd85fc4f47694@o4511209453191168.ingest.us.sentry.io/4511209458892800",
  
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Distributed tracing - adjust for your API endpoints
  tracePropagationTargets: [
    "localhost",
    /^https:\/\/.*\.bluetika\.co\.nz/,
    /^https:\/\/.*\.vercel\.app/
  ],
  
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === "production",
});