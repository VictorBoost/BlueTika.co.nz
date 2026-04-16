import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { DirectorySearchBar } from "@/components/DirectorySearchBar";
import { DirectoryListingCard } from "@/components/DirectoryListingCard";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import Link from "next/link";
import {
  getDirectoryListings,
  type ListingWithCategory,
} from "@/services/directoryService";
import { getDirectoryCategories } from "@/services/directoryCategoryService";
import type { DirectoryCategory } from "@/services/directoryCategoryService";
import { supabase } from "@/integrations/supabase/client";

export default function DirectoryPage() {
  const [listings, setListings] = useState<ListingWithCategory[]>([]);
  const [categories, setCategories] = useState<DirectoryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchParams, setSearchParams] = useState({
    keyword: "",
    categoryId: "",
    city: "",
  });

  useEffect(() => {
    checkAuth();
    loadCategories();
    loadListings();
  }, []);

  const checkAuth = async () => {
    const { data: session } = await supabase.auth.getSession();
    setIsAuthenticated(!!session.session);
  };

  const loadCategories = async () => {
    const { data } = await getDirectoryCategories();
    if (data) {
      setCategories(data);
    }
  };

  const loadListings = async (params = searchParams) => {
    setLoading(true);
    const { data } = await getDirectoryListings(params);
    if (data) {
      setListings(data);
    }
    setLoading(false);
  };

  const handleSearch = (params: { keyword: string; categoryId: string; city: string }) => {
    setSearchParams(params);
    loadListings(params);
  };

  const featuredListings = listings.filter((l) => l.featured);
  const regularListings = listings.filter((l) => !l.featured);

  return (
    <>
      <SEO
        title="Business Directory - Find Local NZ Services | BlueTika"
        description="Browse trusted New Zealand businesses. Find local service providers across all categories. Free directory listings for NZ businesses."
        url="https://bluetika.co.nz/directory"
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-primary text-primary-foreground py-12">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">Business Directory</h1>
                <p className="text-lg text-primary-foreground/90">
                  Find Local Help. Get it Done.
                </p>
              </div>
              {isAuthenticated && (
                <Link href="/directory/claim">
                  <Button
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your Business
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="container mx-auto px-4 max-w-6xl -mt-8">
          <DirectorySearchBar categories={categories} onSearch={handleSearch} />
        </div>

        {/* Featured Listings */}
        {featuredListings.length > 0 && (
          <div className="container mx-auto px-4 max-w-6xl mt-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              ⭐ Featured Businesses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredListings.map((listing) => (
                <DirectoryListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        )}

        {/* All Listings */}
        <div className="container mx-auto px-4 max-w-6xl mt-12 pb-12">
          <h2 className="text-2xl font-bold mb-6">
            {searchParams.keyword || searchParams.categoryId || searchParams.city
              ? "Search Results"
              : "All Businesses"}
          </h2>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : regularListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularListings.map((listing) => (
                <DirectoryListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg">No businesses found matching your criteria.</p>
              <p className="text-sm mt-2">Try adjusting your search filters.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}