import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Phone,
  Globe,
  Shield,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import {
  getDirectoryListingBySlug,
  type ListingWithCategory,
} from "@/services/directoryService";
import { trackDirectoryClick } from "@/services/directoryAnalyticsService";

export default function DirectoryListingPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [listing, setListing] = useState<ListingWithCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingId, setTrackingId] = useState<string | null>(null);

  useEffect(() => {
    if (slug && typeof slug === "string") {
      loadListing(slug);
    }
  }, [slug]);

  const loadListing = async (slug: string) => {
    setLoading(true);
    const { data } = await getDirectoryListingBySlug(slug);
    if (data) {
      setListing(data);
      // Track the click
      const { data: analytic } = await trackDirectoryClick(data.id);
      if (analytic) {
        setTrackingId(analytic.id);
      }
    }
    setLoading(false);
  };

  const handleGetQuote = () => {
    // Store tracking ID in localStorage so we can mark conversion later
    if (trackingId) {
      localStorage.setItem("directory_tracking_id", trackingId);
    }
    router.push("/post-project");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Business Not Found</h1>
          <Link href="/directory">
            <Button>Back to Directory</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isSilverPlus =
    listing.profiles?.verification_tier &&
    ["silver", "gold", "platinum"].includes(listing.profiles.verification_tier);

  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: listing.business_name,
    description: listing.description,
    address: {
      "@type": "PostalAddress",
      addressLocality: listing.city,
      addressCountry: "NZ",
    },
    telephone: listing.phone,
    ...(listing.website && { url: listing.website }),
    ...(listing.photos?.[0] && { image: listing.photos[0] }),
  };

  return (
    <>
      <SEO
        title={`${listing.business_name} - ${listing.city} | BlueTika Directory`}
        description={listing.description}
        url={`https://bluetika.co.nz/directory/${listing.slug}`}
        image={listing.photos?.[0]}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-muted py-8">
          <div className="container mx-auto px-4 max-w-4xl">
            <Link href="/directory" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
              ← Back to Directory
            </Link>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{listing.business_name}</h1>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline">
                    {listing.directory_categories?.name || "Uncategorized"}
                  </Badge>
                  {isSilverPlus && (
                    <Badge className="bg-success text-success-foreground flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Protected by BlueTika Escrow
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 max-w-4xl py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Photos */}
              {listing.photos && listing.photos.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {listing.photos.map((photo, idx) => (
                    <div
                      key={idx}
                      className="aspect-video rounded-lg overflow-hidden bg-muted"
                    >
                      <img
                        src={photo}
                        alt={`${listing.business_name} photo ${idx + 1}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Description */}
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold mb-3">About</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {listing.description}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* CTA Card */}
              <Card className="border-primary">
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-semibold text-lg">Get a Quote</h3>
                  <p className="text-sm text-muted-foreground">
                    Post your project on BlueTika and receive quotes from this business
                    {isSilverPlus && " with escrow protection"}.
                  </p>
                  <Button
                    onClick={handleGetQuote}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    Get a Quote via BlueTika
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-semibold">Contact Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium">Location</div>
                        <div className="text-muted-foreground">{listing.city}, New Zealand</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium">Phone</div>
                        <a
                          href={`tel:${listing.phone}`}
                          className="text-primary hover:underline"
                        >
                          {listing.phone}
                        </a>
                      </div>
                    </div>
                    {listing.website && (
                      <div className="flex items-start gap-3">
                        <Globe className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium">Website</div>
                          <a
                            href={listing.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline break-all"
                          >
                            {listing.website.replace(/^https?:\/\//, "")}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}