import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Globe, Shield } from "lucide-react";
import type { ListingWithCategory } from "@/services/directoryService";

interface DirectoryListingCardProps {
  listing: ListingWithCategory;
}

export function DirectoryListingCard({ listing }: DirectoryListingCardProps) {
  const isSilverPlus = listing.profiles?.verification_tier && 
    ["silver", "gold", "platinum"].includes(listing.profiles.verification_tier);

  const primaryPhoto = listing.photos?.[0];

  return (
    <Link href={`/directory/${listing.slug}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer h-full">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {primaryPhoto ? (
            <img
              src={primaryPhoto}
              alt={listing.business_name}
              className="object-cover w-full h-full transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Globe className="w-12 h-12" />
            </div>
          )}
          {listing.featured && (
            <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground">
              Featured
            </Badge>
          )}
        </div>

        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
              {listing.business_name}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              {listing.directory_categories?.name || "Uncategorized"}
            </Badge>
            {isSilverPlus && (
              <Badge className="bg-success text-success-foreground flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Protected by BlueTika Escrow
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {listing.description}
          </p>

          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>{listing.city}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span>{listing.phone}</span>
            </div>
            {listing.website && (
              <div className="flex items-center gap-2 text-primary">
                <Globe className="w-4 h-4 flex-shrink-0" />
                <span className="truncate text-xs">{listing.website}</span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <div className="text-sm text-primary font-medium group-hover:underline">
            View Details →
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}