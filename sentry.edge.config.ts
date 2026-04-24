import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://cd993319c2295bfcc30fd85fc4f47694@o4511209453191168.ingest.us.sentry.io/4511209458892800",
  
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
  
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === "production",
});