import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Briefcase, Shield, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Head from "next/head";
import Link from "next/link";

interface Review {
  id: string;
  rating: number;
  review_text: string;
  client_name: string;
  created_at: string;
  contract: {
    project: {
      title: string;
      category: {
        name: string;
      };
    };
    provider_profile: {
      id: string;
      business_name: string;
      bio: string;
      location: string;
      avatar_url: string;
      is_verified: boolean;
      verification_badges: string[];
      profiles: {
        email: string;
      };
    };
  };
}

export default function TestimonialsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopReviews();
  }, []);

  const loadTopReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        id,
        rating,
        review_text,
        client_name,
        created_at,
        contract:contracts!inner(
          project:projects!inner(
            title,
            category:categories!inner(name)
          ),
          provider_profile:provider_profiles!inner(
            id,
            business_name,
            bio,
            location,
            avatar_url,
            is_verified,
            verification_badges,
            profiles!inner(email)
          )
        )
      `)
      .gte("rating", 4)
      .order("created_at", { ascending: false })
      .limit(30);

    if (data) {
      setReviews(data as any);
    }
    setLoading(false);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted"
        }`}
      />
    ));
  };

  const getBadgeColor = (badge: string) => {
    const colors: Record<string, string> = {
      "Police Check": "bg-blue-500/10 text-blue-400",
      "ID Verified": "bg-green-500/10 text-green-400",
      "Top Rated": "bg-accent/10 text-accent",
      "Elite": "bg-purple-500/10 text-purple-400"
    };
    return colors[badge] || "bg-muted/50 text-muted-foreground";
  };

  // Generate aggregate schema for all reviews
  const generateAggregateSchema = () => {
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    return {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "BlueTika - New Zealand Service Marketplace",
      "description": "Trusted platform connecting New Zealanders with verified local service providers",
      "provider": {
        "@type": "Organization",
        "name": "BlueTika",
        "url": "https://bluetika.co.nz"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": avgRating.toFixed(1),
        "reviewCount": reviews.length,
        "bestRating": 5,
        "worstRating": 1
      }
    };
  };

  return (
    <>
      <Head>
        {reviews.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(generateAggregateSchema()) }}
          />
        )}
      </Head>
      <SEO
        title="Testimonials - Verified Service Provider Reviews | BlueTika"
        description="Read authentic reviews from New Zealanders who hired trusted local service providers through BlueTika. 4-5 star ratings from real projects across NZ."
      />
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />

        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
              <Shield className="h-3 w-3 mr-1" />
              Verified Reviews
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              What Kiwis Say About Our Service Providers
            </h1>
            <p className="text-xl text-muted-foreground">
              Real reviews from real projects. Every service provider is verified and rated by New Zealanders like you.
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="pb-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-muted/50 border-border">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-accent mb-2">
                    {reviews.length}+
                  </div>
                  <div className="text-muted-foreground">Top-Rated Reviews</div>
                </CardContent>
              </Card>
              <Card className="bg-muted/50 border-border">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-success mb-2">
                    {reviews.length > 0 
                      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                      : "0.0"}
                  </div>
                  <div className="text-muted-foreground">Average Rating</div>
                </CardContent>
              </Card>
              <Card className="bg-muted/50 border-border">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {new Set(reviews.map(r => r.contract.provider_profile.id)).size}+
                  </div>
                  <div className="text-muted-foreground">Trusted Providers</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Reviews Grid */}
        <section className="pb-20 px-4">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground">Loading testimonials...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map((review) => {
                  const provider = review.contract.provider_profile;
                  const initials = provider.business_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <Card key={review.id} className="bg-muted border-border hover:border-accent/50 transition-colors">
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          <Avatar className="h-16 w-16 border-2 border-accent/20">
                            <AvatarImage src={provider.avatar_url} />
                            <AvatarFallback className="bg-accent/10 text-accent font-semibold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">
                                {provider.business_name}
                              </h3>
                              {provider.is_verified && (
                                <CheckCircle2 className="h-5 w-5 text-accent" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <MapPin className="h-3 w-3" />
                              {provider.location}
                              <span>•</span>
                              <Briefcase className="h-3 w-3" />
                              {review.contract.project.category.name}
                            </div>
                            <div className="flex items-center gap-1 mb-2">
                              {renderStars(review.rating)}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {provider.verification_badges?.map((badge) => (
                                <Badge
                                  key={badge}
                                  variant="outline"
                                  className={`text-xs ${getBadgeColor(badge)}`}
                                >
                                  {badge}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-3">
                          <div className="font-medium text-sm mb-1">
                            Project: {review.contract.project.title}
                          </div>
                        </div>
                        <blockquote className="text-muted-foreground italic border-l-2 border-accent/30 pl-4">
                          "{review.review_text}"
                        </blockquote>
                        <div className="mt-4 text-sm text-muted-foreground">
                          — {review.client_name}
                          <span className="mx-2">•</span>
                          {new Date(review.created_at).toLocaleDateString("en-NZ", {
                            year: "numeric",
                            month: "long"
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Hire a Trusted Provider?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of Kiwis who've found reliable local help through BlueTika
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/projects">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90 h-11 px-8">
                  Browse Projects
                </Button>
              </Link>
              <Link href="/post-project">
                <Button variant="outline" className="h-11 px-8">
                  Post Your Project
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}