import { CheckCircle, Shield, Zap, Users, Star, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Shield,
    title: "Trusted Platform",
    description: "100% NZ owned. Every service provider is verified and reviewed by real Kiwis."
  },
  {
    icon: Zap,
    title: "Fast Connections",
    description: "Post your project and receive bids within hours. Get your work done quickly."
  },
  {
    icon: Users,
    title: "Local Experts",
    description: "Connect with skilled service providers in your area. Support local businesses."
  },
  {
    icon: CheckCircle,
    title: "Secure Payments",
    description: "All transactions in NZD. GST-ready system for compliant business operations."
  },
  {
    icon: Star,
    title: "Quality Work",
    description: "Review and rating system ensures you get the best service providers."
  },
  {
    icon: TrendingUp,
    title: "Grow Your Business",
    description: "Service providers can build their reputation and expand their client base."
  }
];

export function Features() {
  return (
    <section className="py-20 md:py-32">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-5xl">
            Why Choose BlueTika?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            The marketplace built by Kiwis, for Kiwis. Connecting local talent with local projects.
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="border-border bg-card">
              <CardContent className="p-6">
                <feature.icon className="mb-4 h-12 w-12 text-accent" />
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}